import { getUserContext } from 'packages/authModel/module/user';

export class UnionRoleGuard {
    #unionRoles;

    constructor(...roles) {
        this.#unionRoles = roles;
    }

    canActive(req) {
        const user = getUserContext(req);
        const roles = user?.payload?.roles ?? user?.payload?.role ?? [];
        const normalizedRoles = Array.isArray(roles) ? roles : [roles];
        return normalizedRoles.some(role => this.#unionRoles.includes(role)); // demo
    }
}
