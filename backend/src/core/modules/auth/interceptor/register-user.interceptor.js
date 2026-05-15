import { DefaultValidatorInterceptor } from 'core/infrastructure/interceptor';
import { JoiUtils } from 'core/utils';
import Joi from 'joi';

export const RegisterUserInterceptor = new DefaultValidatorInterceptor(
    Joi.object({
        role: JoiUtils.requiredString(),
        fullName: JoiUtils.requiredString(),
        email: JoiUtils.email().required(),
        password: JoiUtils.password().required(),
        confirmPassword: JoiUtils.password().required(),
    })
);