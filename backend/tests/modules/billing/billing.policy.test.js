const test = require('node:test');
const assert = require('node:assert/strict');
const {
    calculateActualCredits,
    entitlementDecision,
    digestPayload,
} = require('../../../src/core/modules/billing/billing.policy');
const { classifyForEstimate } = require('../../../src/core/modules/chat-gateway/chat-gateway.service');

test('credit calculation uses integer ceil and estimate cap', () => {
    assert.equal(calculateActualCredits({ weightedUnits: 1001, unitsPerCredit: 1000, estimateCap: 15 }), 2);
    assert.equal(calculateActualCredits({ weightedUnits: 50000, unitsPerCredit: 1000, estimateCap: 15 }), 15);
});

test('entitlement evaluator denies unavailable feature and confirms high spend', () => {
    const entitlements = [
        { key: 'can_export_pdf', value_json: false },
        { key: 'max_auto_spend_per_turn', value_json: 2 },
    ];
    assert.deepEqual(entitlementDecision({ entitlements, action: 'export_pdf' }), { decision: 'DENY', reason: 'ENTITLEMENT_REQUIRED' });
    assert.deepEqual(entitlementDecision({ entitlements, action: 'chat', estimatedCredits: 3 }), { decision: 'CONFIRM', reason: 'CREDIT_CONFIRMATION_REQUIRED' });
});

test('payload digest is deterministic and payload-sensitive', () => {
    assert.equal(digestPayload({ a: 1 }), digestPayload({ a: 1 }));
    assert.notEqual(digestPayload({ a: 1 }), digestPayload({ a: 2 }));
});

test('Vietnamese legal locator is estimated as lookup', () => {
    assert.equal(classifyForEstimate({
        message: 'Điều 1 Nghị định 299/2026/NĐ-CP quy định nội dung gì?',
        requestedMode: 'auto',
        attachments: [],
    }), 'LOOKUP');
});
