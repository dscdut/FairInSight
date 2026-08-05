import prisma from 'core/database';
import { BillingService } from 'core/modules/billing';
import { BadRequestException } from 'packages/httpException';
import { ValidHttpResponse } from 'packages/handler/response/validHttp.response';

class Controller {
    settleUsage = async req => {
        const {
            reservationId,
            turnId,
            sessionId,
            workflowNode,
            taskClass,
            provider,
            model,
            status,
            inputTokens = 0,
            cachedInputTokens = 0,
            outputTokens = 0,
            reasoningTokens = 0,
            latencyMs = 0,
            retryOrdinal = 0,
            fallbackUsed = false,
            rateCardVersion,
            usageDigest,
            weightedUnits,
        } = req.body || {};
        const integers = [inputTokens, cachedInputTokens, outputTokens, reasoningTokens, latencyMs, retryOrdinal, weightedUnits];
        if (!reservationId || !turnId || !sessionId || !workflowNode || !taskClass
            || !provider || !model || !status || !rateCardVersion || !usageDigest
            || !integers.every(Number.isSafeInteger) || integers.some(value => value < 0)) {
            throw new BadRequestException('Invalid usage settlement envelope');
        }
        const boundReservation = await prisma.billing_credit_reservations.findUnique({
            where: { id: reservationId },
            select: {
                turn_id: true,
                task_class: true,
                rate_card_id: true,
                wallet: { select: { owner_type: true, owner_id: true } },
            },
        });
        if (!boundReservation || boundReservation.turn_id !== turnId
            || boundReservation.task_class !== taskClass) {
            throw new BadRequestException('Usage event does not match its reservation');
        }
        const rateItem = await prisma.billing_rate_card_items.findUnique({
            where: {
                rate_card_id_task_class: {
                    rate_card_id: boundReservation.rate_card_id,
                    task_class: boundReservation.task_class,
                },
            },
        });
        if (!rateItem) throw new BadRequestException('Reservation rate card item not found');
        await prisma.billing_ai_usage_events.upsert({
            where: {
                turn_id_workflow_node_retry_ordinal_usage_digest: {
                    turn_id: turnId,
                    workflow_node: workflowNode,
                    retry_ordinal: retryOrdinal,
                    usage_digest: usageDigest,
                },
            },
            update: {},
            create: {
                turn_id: turnId,
                session_id: sessionId,
                user_id: boundReservation.wallet.owner_type === 'USER'
                    ? boundReservation.wallet.owner_id
                    : null,
                workflow_node: workflowNode,
                task_class: taskClass,
                provider,
                model,
                status,
                input_tokens: inputTokens,
                cached_input_tokens: cachedInputTokens,
                output_tokens: outputTokens,
                reasoning_tokens: reasoningTokens,
                latency_ms: latencyMs,
                retry_ordinal: retryOrdinal,
                fallback_used: fallbackUsed,
                billable: status === 'COMPLETED',
                non_billable_reason: status === 'COMPLETED' ? null : status,
                rate_card_version: rateCardVersion,
                usage_digest: usageDigest,
            },
        });
        const reservation = await BillingService.settle({
            reservationId,
            weightedUnits,
            unitsPerCredit: rateItem.units_per_credit,
            usageDigest,
        });
        return ValidHttpResponse.toOkResponse({
            data: {
                reservationId: reservation.id,
                status: reservation.status,
                chargedCredits: reservation.charged_amount,
            },
        });
    };
}

export const InternalBillingController = new Controller();
