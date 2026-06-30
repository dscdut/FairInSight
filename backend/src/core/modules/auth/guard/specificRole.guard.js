import { getUserContext } from 'packages/authModel/module/user';

export class SpecificRoleGuard {
    #role;

    constructor(role) {
        this.#role = role;
    }

    canActive(req) {
        const user = getUserContext(req);
        const roles = user?.payload?.roles ?? user?.payload?.role ?? [];
        return (Array.isArray(roles) ? roles : [roles]).includes(this.#role);
    }
}
