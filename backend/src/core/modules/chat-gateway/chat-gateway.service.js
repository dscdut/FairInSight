import crypto from 'crypto';
import axios from 'axios';
import prisma from 'core/database';
import {
    AI_CHAT_TIMEOUT_MS,
    AI_SERVICE_BASE_URL,
    BILLING_MODE,
    CHAT_GATEWAY_ENABLED,
    FIS_SERVICE_KEY_ID,
    FIS_SERVICE_SECRET,
} from 'core/env';
import { BadRequestException, NotFoundException } from 'packages/httpException';
import {
    BillingException,
    BillingRepository,
    BillingService,
    EntitlementRequiredException,
    IdempotencyConflictException,
    InsufficientCreditsException,
    digestPayload,
} from 'core/modules/billing';
import { ServiceHmac } from 'core/modules/service-auth';

const PREFLIGHT_TTL_MS = 10 * 60 * 1000;
const REQUESTED_MODES = new Set(['auto', 'normal', 'deep', 'document']);

const TASK_DISPLAY = {
    LOOKUP: 'Tra cứu',
    GUIDED_ANALYSIS: 'Phân tích',
    DEEP_ANALYSIS: 'Phân tích chuyên sâu',
    DOCUMENT_ANALYSIS: 'Phân tích tài liệu',
};

export const classifyForEstimate = ({ message, requestedMode, attachments }) => {
    const normalized = message.trim().toLocaleLowerCase('vi');
    if (requestedMode === 'document' || attachments.length) return 'DOCUMENT_ANALYSIS';
    if (requestedMode === 'deep') return 'DEEP_ANALYSIS';
    if (/^(xin chào|chào bạn|hello|hi)[\s!.?]*$/u.test(normalized)) return 'LOOKUP';
    if (/(?:^|[\s([{])(?:điều|khoản|điểm)\s+\d+/u.test(normalized)
        && normalized.length < 500) return 'LOOKUP';
    if (normalized.length > 1200 || /\b(tài sản|con chung|tranh chấp|khởi kiện|bồi thường)\b/u.test(normalized)) {
        return 'DEEP_ANALYSIS';
    }
    return 'GUIDED_ANALYSIS';
};

const isGreeting = message => /^(xin chào|chào bạn|hello|hi)[\s!.?]*$/iu.test(message.trim());

const terminalIsBillable = response => {
    if (response.task_class === 'GREETING') return false;
    if (['clarification', 'insufficient_evidence', 'escalation'].includes(response.mode)) return false;
    const warnings = Array.isArray(response.warnings) ? response.warnings : [];
    if (warnings.some(item => ['turn_time_budget_exhausted', 'provider_unavailable'].includes(item))) return false;
    return response.status === 'completed' && ['lookup', 'analysis'].includes(response.mode);
};

export class ChatGatewayServiceClass {
    constructor({ db = prisma, billing = BillingService, billingRepository = BillingRepository, http = axios } = {}) {
        this.db = db;
        this.billing = billing;
        this.billingRepository = billingRepository;
        this.http = http;
        this.hmac = null;
    }

    #assertEnabled() {
        if (!CHAT_GATEWAY_ENABLED) {
            throw new BillingException('Chat gateway is disabled', 'CHAT_GATEWAY_DISABLED', 503);
        }
        if (!FIS_SERVICE_KEY_ID || !FIS_SERVICE_SECRET) {
            throw new BillingException('Chat gateway service identity is not configured', 'CHAT_GATEWAY_AUTH_UNAVAILABLE', 503);
        }
        if (!this.hmac) {
            this.hmac = new ServiceHmac({
                keyId: FIS_SERVICE_KEY_ID,
                issuer: 'fairinsight-backend',
                audience: 'fairinsight-ai',
                secret: FIS_SERVICE_SECRET,
            });
        }
    }

    async preflight({ userId, idempotencyKey, sessionId = null, message, attachments = [], requestedMode = 'auto' }) {
        this.#assertEnabled();
        if (!idempotencyKey || idempotencyKey.length > 255 || typeof message !== 'string'
            || message.trim().length === 0 || message.length > 20000
            || !Array.isArray(attachments) || attachments.length > 0
            || !REQUESTED_MODES.has(requestedMode) || requestedMode === 'document') {
            throw new BadRequestException('Invalid chat preflight request');
        }
        const payloadDigest = digestPayload({ sessionId, message, attachments, requestedMode });
        const existing = await this.db.billing_chat_preflights.findUnique({
            where: { user_id_idempotency_key: { user_id: userId, idempotency_key: idempotencyKey } },
        });
        if (existing) {
            if (existing.payload_digest !== payloadDigest) throw new IdempotencyConflictException();
            const replayWallet = await this.billingRepository.findWallet(userId);
            return this.#mapPreflight(existing, replayWallet?.available_credits ?? 0);
        }
        const taskClass = classifyForEstimate({ message, requestedMode, attachments });
        const now = new Date();
        const rateItem = await this.db.billing_rate_card_items.findFirst({
            where: {
                task_class: taskClass,
                rate_card: {
                    status: 'ACTIVE',
                    starts_at: { lte: now },
                    OR: [{ ends_at: null }, { ends_at: { gt: now } }],
                },
            },
            orderBy: [{ rate_card: { version: 'desc' } }],
            include: { rate_card: true },
        });
        if (!rateItem) throw new BillingException('Active rate card not found', 'RATE_CARD_UNAVAILABLE', 503);
        const [subscription, wallet] = await Promise.all([
            this.billingRepository.findActiveSubscription(userId, now),
            this.billingRepository.findWallet(userId),
        ]);
        if (!subscription?.plan_version) throw new EntitlementRequiredException();
        const zeroCostGreeting = isGreeting(message);
        const estimatedMin = zeroCostGreeting ? 0 : rateItem.estimated_min;
        const estimatedMax = zeroCostGreeting ? 0 : rateItem.estimated_max;
        const decision = this.billing.evaluateEntitlement(subscription, 'chat', estimatedMax);
        const balance = wallet?.available_credits ?? 0;
        const creditAllowed = BILLING_MODE !== 'ENFORCE' || balance >= estimatedMax;
        const allowed = decision.decision !== 'DENY' && creditAllowed;
        let {reason} = decision;
        if (decision.decision !== 'DENY' && !creditAllowed) {
            reason = 'INSUFFICIENT_CREDITS';
        }
        const item = await this.db.billing_chat_preflights.create({
            data: {
                user_id: userId,
                idempotency_key: idempotencyKey,
                payload_digest: payloadDigest,
                session_id: sessionId,
                task_class: taskClass,
                requested_mode: requestedMode,
                estimated_min: estimatedMin,
                estimated_max: estimatedMax,
                confirmation_required: decision.decision === 'CONFIRM',
                allowed,
                reason,
                rate_card_id: rateItem.rate_card_id,
                expires_at: new Date(Date.now() + PREFLIGHT_TTL_MS),
            },
        });
        return this.#mapPreflight(item, balance);
    }

    async runTurn({
        userId,
        authorization,
        idempotencyKey,
        preflightId,
        message,
        sessionId = null,
        sessionToken = null,
        confirmedMaxCredits = null,
    }) {
        this.#assertEnabled();
        if (!authorization?.startsWith('Bearer ') || !idempotencyKey || !preflightId || !message) {
            throw new BadRequestException('Invalid chat turn request');
        }
        const preflight = await this.db.billing_chat_preflights.findFirst({
            where: { id: preflightId, user_id: userId },
        });
        if (!preflight) throw new NotFoundException('Chat preflight not found');
        if (preflight.expires_at <= new Date()) throw new BillingException('Chat preflight expired', 'PREFLIGHT_EXPIRED', 409);
        if (!preflight.allowed) {
            if (preflight.reason === 'INSUFFICIENT_CREDITS') throw new InsufficientCreditsException();
            throw new EntitlementRequiredException();
        }
        if (preflight.session_id !== sessionId || preflight.payload_digest !== digestPayload({
            sessionId,
            message,
            attachments: [],
            requestedMode: preflight.requested_mode,
        })) {
            throw new IdempotencyConflictException();
        }
        if (preflight.confirmation_required
            && (!Number.isSafeInteger(confirmedMaxCredits) || confirmedMaxCredits < preflight.estimated_max)) {
            throw new BillingException('Credit confirmation required', 'CREDIT_CONFIRMATION_REQUIRED', 422);
        }
        const turnDigest = digestPayload({ preflightId, message, sessionId, confirmedMaxCredits });
        const replay = await this.db.billing_chat_turns.findUnique({
            where: { user_id_idempotency_key: { user_id: userId, idempotency_key: idempotencyKey } },
        });
        if (replay) {
            if (replay.payload_digest !== turnDigest) throw new IdempotencyConflictException();
            if (replay.response_json) return replay.response_json;
            throw new BillingException('Chat turn is already in progress', 'TURN_IN_PROGRESS', 409);
        }
        const turnId = crypto.randomUUID();
        const noReservation = preflight.estimated_max === 0;
        let reservation = null;
        if (!noReservation) {
            reservation = await this.billing.reserve({
                userId,
                turnId,
                taskClass: preflight.task_class,
                estimatedMin: preflight.estimated_min,
                reservedAmount: preflight.estimated_max,
                rateCardId: preflight.rate_card_id,
                idempotencyKey: `${idempotencyKey}:reservation`,
            });
            if (reservation.turn_id && reservation.turn_id !== turnId) {
                const concurrent = await this.db.billing_chat_turns.findUnique({
                    where: { user_id_idempotency_key: { user_id: userId, idempotency_key: idempotencyKey } },
                });
                if (concurrent?.payload_digest !== turnDigest && concurrent) {
                    throw new IdempotencyConflictException();
                }
                if (concurrent?.response_json) return concurrent.response_json;
                throw new BillingException('Chat turn is already in progress', 'TURN_IN_PROGRESS', 409);
            }
        }
        let turn;
        try {
            turn = await this.db.billing_chat_turns.create({
                data: {
                    id: turnId,
                    user_id: userId,
                    preflight_id: preflight.id,
                    idempotency_key: idempotencyKey,
                    payload_digest: turnDigest,
                    session_id: sessionId,
                    reservation_id: reservation?.id ?? null,
                    status: 'RUNNING',
                },
            });
            await this.db.billing_chat_preflights.updateMany({
                where: { id: preflight.id, user_id: userId, consumed_at: null },
                data: { consumed_at: new Date() },
            });
        } catch (error) {
            if (error.code === 'P2002') {
                const concurrent = await this.db.billing_chat_turns.findUnique({
                    where: { user_id_idempotency_key: { user_id: userId, idempotency_key: idempotencyKey } },
                });
                if (concurrent?.payload_digest !== turnDigest) throw new IdempotencyConflictException();
                if (concurrent?.response_json) return concurrent.response_json;
                throw new BillingException('Chat turn is already in progress', 'TURN_IN_PROGRESS', 409);
            }
            if (reservation?.id) await this.billing.release({ reservationId: reservation.id, reason: 'gateway_persist_failed' });
            throw error;
        }

        let effectiveSessionId = sessionId;
        try {
            const headers = { Authorization: authorization, 'Content-Type': 'application/json' };
            if (!effectiveSessionId) {
                const created = await this.http.post(
                    `${AI_SERVICE_BASE_URL}/api/v1/chat/sessions`,
                    {},
                    { headers, timeout: 30000 },
                );
                effectiveSessionId = created.data.session_id;
                await this.db.billing_chat_turns.update({ where: { id: turn.id }, data: { session_id: effectiveSessionId } });
            }
            let requestedMode = 'auto';
            if (preflight.task_class === 'DEEP_ANALYSIS') {
                requestedMode = 'deep';
            } else if (preflight.requested_mode === 'normal') {
                requestedMode = 'normal';
            }
            const aiRequestBody = JSON.stringify({
                message,
                session_id: effectiveSessionId,
                session_token: sessionToken,
                requested_mode: requestedMode,
            });
            const signedHeaders = this.hmac.sign({
                method: 'POST',
                path: '/api/v1/chat',
                exactBodyBytes: Buffer.from(aiRequestBody, 'utf8'),
            });
            const aiResponse = await this.http.post(
                `${AI_SERVICE_BASE_URL}/api/v1/chat`,
                aiRequestBody,
                { headers: { ...headers, ...signedHeaders }, timeout: AI_CHAT_TIMEOUT_MS },
            );
            const result = aiResponse.data;
            const actualTaskClass = result.task_class === 'GREETING' ? 'LOOKUP' : result.task_class;
            if (!['LOOKUP', 'GUIDED_ANALYSIS', 'DEEP_ANALYSIS', 'DOCUMENT_ANALYSIS'].includes(actualTaskClass)) {
                throw new BillingException('AI returned an unsupported task class', 'AI_CONTRACT_INVALID', 503);
            }
            const rateItem = await this.db.billing_rate_card_items.findUnique({
                where: { rate_card_id_task_class: { rate_card_id: preflight.rate_card_id, task_class: actualTaskClass } },
            });
            if (!rateItem) throw new BillingException('Actual task class is missing from the reserved rate card', 'RATE_CARD_UNAVAILABLE', 503);
            const usage = result.usage || {};
            const usageShapeValid = Number.isSafeInteger(usage.inputTokens) && usage.inputTokens >= 0
                && Number.isSafeInteger(usage.outputTokens) && usage.outputTokens >= 0
                && Number.isSafeInteger(usage.calls) && usage.calls >= 0;
            const usageValid = usageShapeValid && (result.task_class === 'GREETING' || usage.calls > 0);
            const billable = terminalIsBillable(result) && usageValid;
            const inputTokens = usageValid ? usage.inputTokens : 0;
            const outputTokens = usageValid ? usage.outputTokens : 0;
            const modelNames = usage.models && typeof usage.models === 'object'
                && !Array.isArray(usage.models)
                ? Object.keys(usage.models)
                : [];
            const weightedUnits = (inputTokens * rateItem.input_weight) + (outputTokens * rateItem.output_weight);
            const usageDigest = digestPayload({
                turnId,
                taskClass: result.task_class,
                mode: result.mode,
                usage,
                assistantMessageId: result.assistant_message_id,
            });
            if (reservation?.id) {
                if (billable) {
                    reservation = await this.billing.settle({
                        reservationId: reservation.id,
                        weightedUnits,
                        unitsPerCredit: rateItem.units_per_credit,
                        usageDigest,
                    });
                } else {
                    reservation = await this.billing.release({ reservationId: reservation.id, reason: result.mode || 'non_billable_terminal' });
                }
            }
            await this.db.billing_ai_usage_events.upsert({
                where: { turn_id_workflow_node_retry_ordinal_usage_digest: { turn_id: turnId, workflow_node: 'turn_total', retry_ordinal: 0, usage_digest: usageDigest } },
                update: {},
                create: {
                    turn_id: turnId,
                    session_id: effectiveSessionId,
                    user_id: userId,
                    workflow_node: 'turn_total',
                    task_class: actualTaskClass,
                    provider: modelNames.length ? 'ollama' : 'unknown',
                    model: modelNames.length ? modelNames.join(',').slice(0, 100) : 'unknown',
                    status: result.mode,
                    input_tokens: inputTokens,
                    output_tokens: outputTokens,
                    latency_ms: Number.isSafeInteger(result.latency_ms) ? result.latency_ms : 0,
                    fallback_used: usage.fallbackUsed === true || modelNames.length > 1,
                    billable,
                    non_billable_reason: this.#getNonBillableReason({ billable, usageValid, mode: result.mode }),
                    rate_card_version: String(rateItem.rate_card_id),
                    usage_digest: usageDigest,
                },
            });
            const [wallet, subscription] = await Promise.all([
                this.billingRepository.findWallet(userId),
                this.billingRepository.findActiveSubscription(userId),
            ]);
            const entitlementMap = Object.fromEntries(
                (subscription?.plan_version?.entitlements || []).map(item => [item.key, item.value_json]),
            );
            const actions = (result.available_actions || []).filter(action => (
                action !== 'export_pdf' || entitlementMap.can_export_pdf === true
            ) && (
                action !== 'suggest_lawyer' || entitlementMap.can_use_lawyer_handoff === true
            ));
            let chargedCredits = 0;
            if (BILLING_MODE === 'ENFORCE' && billable) {
                chargedCredits = reservation?.charged_amount ?? 0;
            }
            const publicResult = {
                ...result,
                session_id: effectiveSessionId,
                warnings: usageValid
                    ? (result.warnings || [])
                    : [...(result.warnings || []), 'billing_usage_unavailable_no_charge'],
                available_actions: actions,
                billing: {
                    taskClass: result.task_class,
                    estimatedCredits: preflight.estimated_max,
                    chargedCredits,
                    refundedCredits: 0,
                    remainingCredits: wallet?.available_credits ?? 0,
                    status: this.#getBillingStatus(reservation),
                },
            };
            const gatewayStatus = this.#getGatewayStatus(result.mode);
            await this.db.billing_chat_turns.update({
                where: { id: turn.id },
                data: { status: gatewayStatus, response_json: publicResult, session_id: effectiveSessionId },
            });
            return publicResult;
        } catch (error) {
            if (reservation?.id && reservation.status === 'ACTIVE') {
                await this.billing.release({ reservationId: reservation.id, reason: 'ai_provider_failure' });
            }
            await this.db.billing_chat_turns.update({
                where: { id: turn.id },
                data: { status: 'FAILED', error_code: error.response?.status ? `AI_HTTP_${error.response.status}` : 'AI_PROVIDER_UNAVAILABLE', session_id: effectiveSessionId },
            });
            if (error.response?.status === 404) throw new NotFoundException('Chat session not found');
            if (error.response?.status === 409) throw new BillingException('Chat turn is already in progress', 'TURN_IN_PROGRESS', 409);
            throw new BillingException('AI provider unavailable; credits were released', 'AI_PROVIDER_UNAVAILABLE', 503);
        }
    }

    #getNonBillableReason({ billable, usageValid, mode }) {
        if (billable) return null;
        if (usageValid) return mode || 'non_billable_terminal';
        return 'usage_missing_or_invalid';
    }

    #getBillingStatus(reservation) {
        if (BILLING_MODE === 'SHADOW') return 'SHADOW';
        return reservation?.status ?? 'NONE';
    }

    #getGatewayStatus(mode) {
        if (mode === 'clarification') return 'WAITING_USER';
        if (mode === 'insufficient_evidence') return 'INSUFFICIENT';
        return 'COMPLETED';
    }

    #mapPreflight(item, availableCredits = null) {
        return {
            preflightId: item.id,
            taskClass: item.task_class,
            displayName: TASK_DISPLAY[item.task_class],
            estimatedCredits: { min: item.estimated_min, max: item.estimated_max },
            availableCredits,
            confirmationRequired: item.confirmation_required,
            allowed: item.allowed,
            reason: item.reason,
            expiresAt: item.expires_at,
        };
    }
}

export const ChatGatewayService = new ChatGatewayServiceClass();
