import crypto from 'crypto';
import { BadRequestException } from 'packages/httpException';

export const BILLING_MODES = Object.freeze(['OFF', 'SHADOW', 'ENFORCE']);

export const assertBillingMode = mode => {
    if (!BILLING_MODES.includes(mode)) {
        throw new BadRequestException('Invalid BILLING_MODE');
    }
    return mode;
};

export const digestPayload = payload => crypto
    .createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex');

export const calculateActualCredits = ({ weightedUnits, unitsPerCredit, estimateCap }) => {
    if (![weightedUnits, unitsPerCredit, estimateCap].every(Number.isSafeInteger)
        || weightedUnits < 0 || unitsPerCredit <= 0 || estimateCap < 0) {
        throw new BadRequestException('Credit calculation requires nonnegative integers');
    }
    return Math.min(Math.ceil(weightedUnits / unitsPerCredit), estimateCap);
};

export const entitlementDecision = ({ entitlements, action, estimatedCredits = 0 }) => {
    const map = Object.fromEntries(entitlements.map(item => [item.key, item.value_json]));
    const featureKeys = {
        export_pdf: 'can_export_pdf',
        lawyer_handoff: 'can_use_lawyer_handoff',
        dynamic_form: 'can_generate_dynamic_form',
    };
    const featureKey = featureKeys[action];
    if (featureKey && map[featureKey] !== true) {
        return { decision: 'DENY', reason: 'ENTITLEMENT_REQUIRED' };
    }
    const autoSpend = Number(map.max_auto_spend_per_turn ?? 0);
    if (estimatedCredits > autoSpend) {
        return { decision: 'CONFIRM', reason: 'CREDIT_CONFIRMATION_REQUIRED' };
    }
    return { decision: 'ALLOW', reason: null };
};
