const test = require('node:test');
const assert = require('node:assert/strict');
const { ServiceHmac } = require('../../../src/core/modules/service-auth/hmac.service');

const makeService = () => new ServiceHmac({
    keyId: 'test-key',
    issuer: 'fairinsight-ai',
    audience: 'node-backend',
    secret: 'test-only-secret-that-is-at-least-32-bytes-long',
    now: () => 1_800_000_000,
});

test('HMAC verifies exact UTF-8 bytes and rejects body mutation', () => {
    const body = Buffer.from(JSON.stringify({ text: 'xin chào' }), 'utf8');
    const service = makeService();
    const headers = service.sign({ method: 'POST', path: '/api/v1/internal/billing/usage/settle', exactBodyBytes: body, nonce: '00000000-0000-4000-8000-000000000001' });
    assert.equal(service.verify({ method: 'POST', path: '/api/v1/internal/billing/usage/settle', exactBodyBytes: body, headers, expectedIssuer: 'fairinsight-ai', expectedAudience: 'node-backend' }), true);
    assert.throws(() => makeService().verify({ method: 'POST', path: '/api/v1/internal/billing/usage/settle', exactBodyBytes: Buffer.from('{}'), headers, expectedIssuer: 'fairinsight-ai', expectedAudience: 'node-backend' }));
});

test('HMAC nonce replay is rejected before workflow', () => {
    const body = Buffer.from('{}');
    const service = makeService();
    const headers = service.sign({ method: 'POST', path: '/api/v1/internal/billing/usage/settle', exactBodyBytes: body, nonce: '00000000-0000-4000-8000-000000000002' });
    service.verify({ method: 'POST', path: '/api/v1/internal/billing/usage/settle', exactBodyBytes: body, headers, expectedIssuer: 'fairinsight-ai', expectedAudience: 'node-backend' });
    assert.throws(() => service.verify({ method: 'POST', path: '/api/v1/internal/billing/usage/settle', exactBodyBytes: body, headers, expectedIssuer: 'fairinsight-ai', expectedAudience: 'node-backend' }));
});
