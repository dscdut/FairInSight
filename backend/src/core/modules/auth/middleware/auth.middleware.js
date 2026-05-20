import { getUserContext } from 'packages/authModel/module/user';
import { UnAuthorizedException } from 'packages/httpException';

export const authMiddleware = (req) => {
    try {
        const user = getUserContext(req);
        
        if (!user) {
            throw new UnAuthorizedException("Unauthorized or insufficient permissions");
        }
        
        req.user = user;
        return true;
    } catch (error) {
        throw new UnAuthorizedException(error.message);
    }
};