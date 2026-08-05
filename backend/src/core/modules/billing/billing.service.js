import prisma from 'core/database';
import { BILLING_MODE } from 'core/env';
import { BadRequestException, NotFoundException } from 'packages/httpException';
import { BillingRepository } from './billing.repository';
import {
    BillingException,
    InsufficientCreditsException,
    IdempotencyConflictException,
} from './billing.errors';
import {
    assertBillingMode,
    calculateActualCredits,
    digestPayload,
    entitlementDecision,
} from './billing.policy';

const RESERVATION_TTL_MS = 15 * 60 * 1000;

export class BillingServiceClass {
    constructor(repository = BillingRepository, db = prisma, mode = BILLING_MODE) {
        this.repository = repository;
        this.db = db;
        this.mode = assertBillingMode(mode);
    }

    async listPlans(now = new Date()) {
        const plans = await this.repository.listPublicPlans(now);
        return {
            data: plans.filter(plan => plan.versions.length).map(plan => {
                const version = plan.versions[0];
                return {
                    code: plan.code,
                    name: plan.name,
                    audience: plan.audience,
                    version: version.version,
                    priceVnd: version.price_vnd,
                    billingInterval: version.billing_interval,
                    includedCredits: version.included_credits,
                    entitlements: Object.fromEntries(
                        version.entitlements.map(item => [item.key, item.value_json]),
                    ),
                };
            }),
        };
    }

    async getMyBilling(userId, now = new Date()) {
        const [subscription, wallet] = await Promise.all([
            this.repository.findActiveSubscription(userId, now),
            this.repository.findWallet(userId),
        ]);
        if (!subscription?.plan_version) {
            throw new NotFoundException('Active subscription not found');
        }
        const { plan_version: version } = subscription;
        return {
            data: {
                plan: {
                    code: version.plans.code,
                    name: version.plans.name,
                    periodEnd: subscription.current_period_end,
                },
                wallet: {
                    availableCredits: wallet?.available_credits ?? 0,
                    reservedCredits: wallet?.reserved_credits ?? 0,
                    includedCredits: version.included_credits,
                },
                entitlements: Object.fromEntries(
                    version.entitlements.map(item => [item.key, item.value_json]),
                ),
                billingMode: this.mode,
                alerts: [],
            },
        };
    }

    async listMyLedger(userId, { cursor = null, size = 20 } = {}) {
        const safeSize = Math.min(Math.max(Number(size) || 20, 1), 100);
        const rows = await this.repository.listLedger(userId, { cursor, size: safeSize + 1 });
        const hasMore = rows.length > safeSize;
        const items = hasMore ? rows.slice(0, safeSize) : rows;
        return {
            data: {
                items: items.map(row => ({
                    id: row.id,
                    type: row.entry_type,
                    amount: row.amount,
                    availableAfter: row.available_after,
                    reservedAfter: row.reserved_after,
                    sourceRef: row.source_ref,
                    createdAt: row.created_at,
                })),
                nextCursor: hasMore ? items[items.length - 1].id : null,
            },
        };
    }

    async listMyUsage(userId, { cursor = null, size = 20 } = {}) {
        const safeSize = Math.min(Math.max(Number(size) || 20, 1), 100);
        const rows = await this.repository.listUsage(userId, { cursor, size: safeSize + 1 });
        const hasMore = rows.length > safeSize;
        const items = hasMore ? rows.slice(0, safeSize) : rows;
        return {
            data: {
                items: items.map(row => ({
                    id: row.id,
                    turnId: row.turn_id,
                    sessionId: row.session_id,
                    workflowNode: row.workflow_node,
                    taskClass: row.task_class,
                    status: row.status,
                    inputTokens: row.input_tokens,
                    cachedInputTokens: row.cached_input_tokens,
                    outputTokens: row.output_tokens,
                    latencyMs: row.latency_ms,
                    fallbackUsed: row.fallback_used,
                    billable: row.billable,
                    nonBillableReason: row.non_billable_reason,
                    createdAt: row.created_at,
                })),
                nextCursor: hasMore ? items[items.length - 1].id : null,
            },
        };
    }

    async cancelSubscription(userId) {
        const subscription = await this.repository.findActiveSubscription(userId);
        if (!subscription) throw new NotFoundException('Active subscription not found');
        if (subscription.cancel_at_period_end) return { data: { cancelAtPeriodEnd: true, periodEnd: subscription.current_period_end } };
        const updated = await this.db.subscriptions.updateMany({
            where: { id: subscription.id, user_id: userId, deleted_at: null },
            data: { cancel_at_period_end: true, updated_at: new Date() },
        });
        if (updated.count !== 1) throw new NotFoundException('Active subscription not found');
        return { data: { cancelAtPeriodEnd: true, periodEnd: subscription.current_period_end } };
    }

    async changeSubscription(userId, targetPlanCode, now = new Date()) {
        const subscription = await this.repository.findActiveSubscription(userId, now);
        if (!subscription?.plan_version) throw new NotFoundException('Active subscription not found');
        const target = await this.db.billing_plan_versions.findFirst({
            where: {
                is_active: true,
                starts_at: { lte: now },
                OR: [{ ends_at: null }, { ends_at: { gt: now } }],
                plans: { code: targetPlanCode, is_active: true },
            },
            orderBy: { version: 'desc' },
            include: { plans: true },
        });
        if (!target) throw new NotFoundException('Target plan not found');
        if (target.price_vnd > subscription.plan_version.price_vnd) {
            throw new BillingException('A verified payment is required before upgrading', 'PAYMENT_REQUIRED', 422);
        }
        const updated = await this.db.subscriptions.updateMany({
            where: { id: subscription.id, user_id: userId, deleted_at: null },
            data: {
                scheduled_plan_version_id: target.id,
                cancel_at_period_end: true,
                updated_at: new Date(),
            },
        });
        if (updated.count !== 1) throw new NotFoundException('Active subscription not found');
        return {
            data: {
                currentPlan: subscription.plan_version.plans.code,
                scheduledPlan: target.plans.code,
                effectiveAt: subscription.current_period_end,
            },
        };
    }

    evaluateEntitlement(subscription, action, estimatedCredits) {
        const entitlements = subscription?.plan_version?.entitlements ?? [];
        return entitlementDecision({ entitlements, action, estimatedCredits });
    }

    async reserve({ userId, turnId, taskClass, estimatedMin, reservedAmount, rateCardId, idempotencyKey }) {
        if (!idempotencyKey || !turnId || !Number.isSafeInteger(reservedAmount) || reservedAmount < 0) {
            throw new BadRequestException('Invalid reservation request');
        }
        const payloadDigest = digestPayload({ userId, turnId, taskClass, estimatedMin, reservedAmount, rateCardId });
        const existing = await this.db.billing_credit_reservations.findUnique({ where: { idempotency_key: idempotencyKey } });
        if (existing) {
            if (existing.payload_digest !== payloadDigest) throw new IdempotencyConflictException();
            return existing;
        }
        if (this.mode === 'OFF') {
            return { status: 'RELEASED', billing_mode: 'OFF', reserved_amount: 0, charged_amount: 0 };
        }
        try {
            return await this.db.$transaction(async tx => {
                const wallet = await tx.billing_credit_wallets.findUnique({
                    where: { owner_type_owner_id: { owner_type: 'USER', owner_id: userId } },
                });
                if (!wallet) throw new NotFoundException('Credit wallet not found');
                if (this.mode === 'ENFORCE' && wallet.available_credits < reservedAmount) {
                    throw new InsufficientCreditsException();
                }
                if (this.mode === 'ENFORCE') {
                    const updated = await tx.billing_credit_wallets.updateMany({
                        where: { id: wallet.id, version: wallet.version, available_credits: { gte: reservedAmount } },
                        data: {
                            available_credits: { decrement: reservedAmount },
                            reserved_credits: { increment: reservedAmount },
                            version: { increment: 1 },
                        },
                    });
                    if (updated.count !== 1) throw new InsufficientCreditsException();
                }
                const reservation = await tx.billing_credit_reservations.create({
                    data: {
                        wallet_id: wallet.id,
                        rate_card_id: rateCardId,
                        turn_id: turnId,
                        task_class: taskClass,
                        estimated_min: estimatedMin,
                        reserved_amount: reservedAmount,
                        billing_mode: this.mode,
                        idempotency_key: idempotencyKey,
                        payload_digest: payloadDigest,
                        expires_at: new Date(Date.now() + RESERVATION_TTL_MS),
                    },
                });
                if (this.mode === 'ENFORCE') {
                    await tx.billing_credit_ledger.create({
                        data: {
                            wallet_id: wallet.id,
                            reservation_id: reservation.id,
                            entry_type: 'RESERVE',
                            amount: reservedAmount,
                            available_after: wallet.available_credits - reservedAmount,
                            reserved_after: wallet.reserved_credits + reservedAmount,
                            idempotency_key: `${idempotencyKey}:reserve`,
                            source_ref: turnId,
                        },
                    });
                }
                return reservation;
            }, { isolationLevel: 'Serializable' });
        } catch (error) {
            if (error.code === 'P2002') {
                const replay = await this.db.billing_credit_reservations.findUnique({
                    where: { idempotency_key: idempotencyKey },
                });
                if (replay?.payload_digest === payloadDigest) return replay;
                throw new IdempotencyConflictException();
            }
            throw error;
        }
    }

    async settle({ reservationId, weightedUnits, unitsPerCredit, usageDigest }) {
        return this.#closeReservation({
            reservationId,
            operation: 'settle',
            usageDigest,
            calculateCharge: reservation => calculateActualCredits({
                weightedUnits,
                unitsPerCredit,
                estimateCap: reservation.reserved_amount,
            }),
        });
    }

    async release({ reservationId, reason = 'workflow_not_completed' }) {
        return this.#closeReservation({ reservationId, operation: 'release', usageDigest: reason, calculateCharge: () => 0 });
    }

    async refund({ reservationId, amount, reason }) {
        if (!Number.isSafeInteger(amount) || amount <= 0 || !reason) throw new BadRequestException('Invalid refund');
        return this.db.$transaction(async tx => {
            const reservation = await tx.billing_credit_reservations.findUnique({ where: { id: reservationId } });
            if (!reservation) throw new NotFoundException('Reservation not found');
            const existing = await tx.billing_credit_ledger.findUnique({ where: { idempotency_key: `${reservationId}:refund:${reason}` } });
            if (existing) {
                if (existing.amount !== amount) throw new IdempotencyConflictException();
                return existing;
            }
            if (reservation.billing_mode !== 'ENFORCE') return reservation;
            const refunded = await tx.billing_credit_ledger.aggregate({
                where: { reservation_id: reservation.id, entry_type: 'REFUND' },
                _sum: { amount: true },
            });
            if ((refunded._sum.amount ?? 0) + amount > reservation.charged_amount) {
                throw new BadRequestException('Refund exceeds charged credits');
            }
            const wallet = await tx.billing_credit_wallets.update({
                where: { id: reservation.wallet_id },
                data: { available_credits: { increment: amount }, version: { increment: 1 } },
            });
            await tx.billing_credit_lots.create({
                data: {
                    wallet_id: wallet.id,
                    source: 'REFUND',
                    granted_amount: amount,
                    remaining_amount: amount,
                    source_ref: `${reservationId}:refund:${reason}`,
                },
            });
            return tx.billing_credit_ledger.create({
                data: {
                    wallet_id: wallet.id,
                    reservation_id: reservation.id,
                    entry_type: 'REFUND',
                    amount,
                    available_after: wallet.available_credits,
                    reserved_after: wallet.reserved_credits,
                    idempotency_key: `${reservationId}:refund:${reason}`,
                    source_ref: reason,
                },
            });
        }, { isolationLevel: 'Serializable' });
    }

    async releaseExpiredReservations({ limit = 100, now = new Date() } = {}) {
        const expired = await this.db.billing_credit_reservations.findMany({
            where: { status: 'ACTIVE', expires_at: { lte: now } },
            orderBy: { expires_at: 'asc' },
            take: Math.min(Math.max(limit, 1), 500),
            select: { id: true },
        });
        const results = await Promise.all(
            expired.map(item => this.release({ reservationId: item.id, reason: 'reservation_ttl_expired' })),
        );
        return { released: results.length };
    }

    async findWalletMismatches() {
        const wallets = await this.db.billing_credit_wallets.findMany({
            select: {
                id: true,
                available_credits: true,
                reserved_credits: true,
                lots: { select: { remaining_amount: true } },
            },
        });
        return wallets
            .map(wallet => ({
                walletId: wallet.id,
                availableCredits: wallet.available_credits,
                reservedCredits: wallet.reserved_credits,
                remainingLots: wallet.lots.reduce((sum, lot) => sum + lot.remaining_amount, 0),
            }))
            .filter(item => item.availableCredits + item.reservedCredits !== item.remainingLots);
    }

    async #closeReservation({ reservationId, operation, usageDigest, calculateCharge }) {
        return this.db.$transaction(async tx => {
            const reservation = await tx.billing_credit_reservations.findUnique({ where: { id: reservationId } });
            if (!reservation) throw new NotFoundException('Reservation not found');
            if (reservation.status !== 'ACTIVE') return reservation;
            const charge = calculateCharge(reservation);
            const status = operation === 'settle' ? 'SETTLED' : 'RELEASED';
            const claimed = await tx.billing_credit_reservations.updateMany({
                where: { id: reservation.id, status: 'ACTIVE' },
                data: { status, charged_amount: charge },
            });
            if (claimed.count !== 1) {
                return tx.billing_credit_reservations.findUnique({ where: { id: reservation.id } });
            }
            if (reservation.billing_mode !== 'ENFORCE') {
                return tx.billing_credit_reservations.findUnique({ where: { id: reservation.id } });
            }
            const released = reservation.reserved_amount - charge;
            const wallet = await tx.billing_credit_wallets.update({
                where: { id: reservation.wallet_id },
                data: {
                    available_credits: { increment: released },
                    reserved_credits: { decrement: reservation.reserved_amount },
                    version: { increment: 1 },
                },
            });
            if (charge > 0) await this.#consumeLots(tx, wallet.id, charge);
            if (charge > 0) {
                await tx.billing_credit_ledger.create({
                    data: {
                        wallet_id: wallet.id,
                        reservation_id: reservation.id,
                        entry_type: 'CHARGE',
                        amount: -charge,
                        available_after: wallet.available_credits,
                        reserved_after: wallet.reserved_credits,
                        idempotency_key: `${reservation.id}:settle:${usageDigest}`,
                        source_ref: reservation.turn_id,
                    },
                });
            }
            if (released > 0) {
                await tx.billing_credit_ledger.create({
                    data: {
                        wallet_id: wallet.id,
                        reservation_id: reservation.id,
                        entry_type: 'RELEASE',
                        amount: released,
                        available_after: wallet.available_credits,
                        reserved_after: wallet.reserved_credits,
                        idempotency_key: `${reservation.id}:${operation}:release`,
                        source_ref: reservation.turn_id,
                    },
                });
            }
            return tx.billing_credit_reservations.findUnique({ where: { id: reservation.id } });
        }, { isolationLevel: 'Serializable' });
    }

    async #consumeLots(tx, walletId, amount) {
        let remaining = amount;
        const lots = await tx.billing_credit_lots.findMany({
            where: {
                wallet_id: walletId,
                remaining_amount: { gt: 0 },
                OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
            },
            orderBy: [{ expires_at: { sort: 'asc', nulls: 'last' } }, { created_at: 'asc' }, { id: 'asc' }],
        });
        remaining = await lots.reduce(async (remainingPromise, lot) => {
            const currentRemaining = await remainingPromise;
            if (currentRemaining === 0) return 0;
            const used = Math.min(lot.remaining_amount, currentRemaining);
            await tx.billing_credit_lots.update({
                where: { id: lot.id },
                data: { remaining_amount: { decrement: used } },
            });
            return currentRemaining - used;
        }, Promise.resolve(amount));
        if (remaining !== 0) throw new InsufficientCreditsException();
    }
}

export const BillingService = new BillingServiceClass();
