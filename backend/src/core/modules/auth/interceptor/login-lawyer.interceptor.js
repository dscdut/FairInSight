import { DefaultValidatorInterceptor } from 'core/infrastructure/interceptor';
import { JoiUtils } from 'core/utils';
import Joi from 'joi';

export const LoginLawyerInterceptor = new DefaultValidatorInterceptor(
    Joi.object({
        email: JoiUtils.email().required().pattern(/^.*@.*\.(com|net|org)$/).message({
            'string.pattern.base': 'Email must be a valid email address.'
        }),
        password: JoiUtils.password().required(),
        licenseNumber: JoiUtils.requiredString(),
    })
);
