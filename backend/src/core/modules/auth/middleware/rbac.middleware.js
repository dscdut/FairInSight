import { UnAuthorizedException } from "packages/httpException";

export const rbac = (guard) => {
    return (req) => {
        if (!guard.canActive(req)) {
            throw new UnAuthorizedException("Unauthorized or insufficient permissions");
        }
        return true;
    };
};