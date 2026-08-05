const test = require('node:test');
const assert = require('node:assert/strict');
const { BillingServiceClass } = require('../../../src/core/modules/billing/billing.service');

test('billing reads are owner-scoped and never accept another user id', async () => {
    const calls = [];
    const repository = {
        findActiveSubscription: async userId => {
            calls.push(['subscription', userId]);
            return { current_period_end: null, plan_version: { included_credits: 20, plans: { code: 'FREE', name: 'Free' }, entitlements: [] } };
        },
        findWallet: async userId => {
            calls.push(['wallet', userId]);
            return { available_credits: 20, reserved_credits: 0 };
        },
    };
    const service = new BillingServiceClass(repository, {}, 'SHADOW');
    await service.getMyBilling('user-a');
    assert.deepEqual(calls, [['subscription', 'user-a'], ['wallet', 'user-a']]);
});

test('ledger query delegates only authenticated owner and bounds page size', async () => {
    let observed;
    const repository = { listLedger: async (userId, options) => { observed = { userId, options }; return []; } };
    const service = new BillingServiceClass(repository, {}, 'SHADOW');
    const result = await service.listMyLedger('user-a', { size: 10000 });
    assert.equal(observed.userId, 'user-a');
    assert.equal(observed.options.size, 101);
    assert.equal(result.data.nextCursor, null);
});
