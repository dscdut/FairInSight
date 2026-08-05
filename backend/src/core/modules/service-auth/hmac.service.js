import crypto from 'crypto';
import { BadRequestException, UnAuthorizedException } from 'packages/httpException';

const toBase64Url = buffer => buffer.toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

export const sha256Hex = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

export const requestCanonicalBytes = ({ method, path, timestamp, expiresAt, nonce, keyId, issuer, audience, bodySha256 }) => {
    if (!path.startsWith('/api/v1/') || path.includes('?')) {
        throw new BadRequestException('FIS-HMAC-V1 requires an exact /api/v1 path without query');
    }
    return Buffer.from([
        'FIS-HMAC-V1',
        method.toUpperCase(),
        path,
        timestamp,
        expiresAt,
        nonce,
        keyId,
        issuer,
        audience,
        bodySha256,
    ].join('\n'), 'utf8');
};

export class ServiceHmac {
    constructor({ keyId, issuer, audience, secret, nonceStore = new Map(), now = () => Math.floor(Date.now() / 1000) }) {
        if (!keyId || !issuer || !audience || !secret || Buffer.byteLength(secret) < 32) {
            throw new Error('Service HMAC settings are missing or too short');
        }
        this.keyId = keyId;
        this.issuer = issuer;
        this.audience = audience;
        this.secret = secret;
        this.nonceStore = nonceStore;
        this.now = now;
    }

    sign({ method, path, exactBodyBytes, ttlSeconds = 30, nonce = crypto.randomUUID() }) {
        const timestamp = this.now();
        const expiresAt = timestamp + ttlSeconds;
        if (ttlSeconds < 1 || ttlSeconds > 60) throw new BadRequestException('Invalid service signature TTL');
        const bodySha256 = sha256Hex(exactBodyBytes);
        const canonical = requestCanonicalBytes({
            method,
            path,
            timestamp,
            expiresAt,
            nonce,
            keyId: this.keyId,
            issuer: this.issuer,
            audience: this.audience,
            bodySha256,
        });
        const signature = toBase64Url(crypto.createHmac('sha256', this.secret).update(canonical).digest());
        return {
            'X-FIS-Protocol-Version': '1',
            'X-FIS-Key-Id': this.keyId,
            'X-FIS-Issuer': this.issuer,
            'X-FIS-Audience': this.audience,
            'X-FIS-Timestamp': String(timestamp),
            'X-FIS-Expires-At': String(expiresAt),
            'X-FIS-Nonce': nonce,
            'X-FIS-Content-SHA256': bodySha256,
            'X-FIS-Signature': signature,
        };
    }

    verify({ method, path, exactBodyBytes, headers, expectedIssuer, expectedAudience }) {
        const get = key => headers[key] ?? headers[key.toLowerCase()];
        const protocol = get('X-FIS-Protocol-Version');
        const keyId = get('X-FIS-Key-Id');
        const issuer = get('X-FIS-Issuer');
        const audience = get('X-FIS-Audience');
        const timestamp = Number(get('X-FIS-Timestamp'));
        const expiresAt = Number(get('X-FIS-Expires-At'));
        const nonce = get('X-FIS-Nonce');
        const bodySha256 = get('X-FIS-Content-SHA256');
        const suppliedSignature = get('X-FIS-Signature');
        const now = this.now();
        if (protocol !== '1' || keyId !== this.keyId || issuer !== expectedIssuer
            || audience !== expectedAudience || !Number.isSafeInteger(timestamp)
            || !Number.isSafeInteger(expiresAt) || expiresAt - timestamp < 1
            || expiresAt - timestamp > 60 || timestamp > now + 30 || expiresAt < now - 30
            || !nonce || !suppliedSignature || bodySha256 !== sha256Hex(exactBodyBytes)) {
            throw new UnAuthorizedException('Invalid service signature');
        }
        const nonceKey = `${issuer}:${nonce}`;
        const usedUntil = this.nonceStore.get(nonceKey);
        if (usedUntil && usedUntil >= now) throw new UnAuthorizedException('Service request replayed');
        const canonical = requestCanonicalBytes({ method, path, timestamp, expiresAt, nonce, keyId, issuer, audience, bodySha256 });
        const expected = toBase64Url(crypto.createHmac('sha256', this.secret).update(canonical).digest());
        const suppliedBytes = Buffer.from(suppliedSignature);
        const expectedBytes = Buffer.from(expected);
        if (suppliedBytes.length !== expectedBytes.length || !crypto.timingSafeEqual(suppliedBytes, expectedBytes)) {
            throw new UnAuthorizedException('Invalid service signature');
        }
        this.nonceStore.set(nonceKey, now + 120);
        return true;
    }
}
