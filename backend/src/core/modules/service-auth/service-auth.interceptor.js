import { FIS_SERVICE_KEY_ID, FIS_SERVICE_SECRET } from 'core/env';
import { UnAuthorizedException } from 'packages/httpException';
import { ServiceHmac } from './hmac.service';

let verifier;

export class ServiceAuthInterceptor {
    static intercept(req, res, next) {
        try {
            if (!FIS_SERVICE_KEY_ID || !FIS_SERVICE_SECRET) {
                throw new UnAuthorizedException('Service authentication is not configured');
            }
            if (!verifier) {
                verifier = new ServiceHmac({
                    keyId: FIS_SERVICE_KEY_ID,
                    issuer: 'fairinsight-ai',
                    audience: 'node-backend',
                    secret: FIS_SERVICE_SECRET,
                });
            }
            verifier.verify({
                method: req.method,
                path: req.originalUrl,
                exactBodyBytes: req.rawBody || Buffer.alloc(0),
                headers: req.headers,
                expectedIssuer: 'fairinsight-ai',
                expectedAudience: 'node-backend',
            });
            return next();
        } catch (error) {
            return next(error);
        }
    }
}
