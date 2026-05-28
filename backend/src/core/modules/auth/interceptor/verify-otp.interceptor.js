import { DefaultValidatorInterceptor } from 'core/infrastructure/interceptor';
import { JoiUtils } from 'core/utils';
import Joi from 'joi';

export const VerifyOtpInterceptor = new DefaultValidatorInterceptor(
    Joi.object({
        email: JoiUtils.email().required().pattern(/^.*@.*\.(com|net|org)$/).message({
            'string.pattern.base': 'Email must be a valid email address.'
        }),
        otp: JoiUtils.requiredString(),
        type: Joi.string().valid('email', 'password').optional(),
    })
);