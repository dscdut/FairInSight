/* eslint-disable max-classes-per-file */
import { HttpException } from 'packages/httpException/HttpException';

export class BillingException extends HttpException {}

export class InsufficientCreditsException extends BillingException {
    constructor() {
        super('Insufficient credits', 'INSUFFICIENT_CREDITS', 402);
    }
}

export class IdempotencyConflictException extends BillingException {
    constructor() {
        super('Idempotency key was already used with a different payload', 'IDEMPOTENCY_CONFLICT', 409);
    }
}

export class EntitlementRequiredException extends BillingException {
    constructor() {
        super('Your current plan does not include this feature', 'ENTITLEMENT_REQUIRED', 403);
    }
}
