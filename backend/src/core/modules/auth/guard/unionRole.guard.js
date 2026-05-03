import { getUserContext } from 'packages/authModel/module/user';

export class UnionRoleGuard {
    #unionRoles;

    constructor(...roles) {
        this.#unionRoles = roles;
    }

    canActive(req) {
        const user = getUserContext(req);
        return this.#unionRoles.includes(user.payload.role);
    }
}
