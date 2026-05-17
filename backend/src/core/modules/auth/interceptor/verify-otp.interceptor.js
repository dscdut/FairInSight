import { DefaultValidatorInterceptor } from 'core/infrastructure/interceptor';
import { JoiUtils } from 'core/utils';
import Joi from 'joi';

export const VerifyOtpInterceptor = new DefaultValidatorInterceptor(
    Joi.object({
<<<<<<< HEAD
        email: JoiUtils.email().required().pattern(/^.*@.*\.(com|net|org)$/).message({
            'string.pattern.base': 'Email must be a valid email address.'
        }),
=======
        email: JoiUtils.email().required(),
>>>>>>> f948f5c (feat[FI-12]: Added forgot password and verify OTP. Cleaned up code from login and register.)
        otp: JoiUtils.requiredString(),
    })
);