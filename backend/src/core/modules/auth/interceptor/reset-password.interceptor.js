import { DefaultValidatorInterceptor } from 'core/infrastructure/interceptor';
import { JoiUtils } from 'core/utils';
import Joi from 'joi';

export const ResetPasswordInterceptor = new DefaultValidatorInterceptor(
    Joi.object({
        token: JoiUtils.requiredString(),
        newPassword: JoiUtils.password().min(8).pattern(/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/).required().messages({
            'string.min': 'Password must be at least 8 characters',
            'string.pattern.base': 'Password must contain at least one letter and one number',
        }),
        confirmNewPassword: JoiUtils.password().valid(Joi.ref('newPassword')).required().messages({
            'any.only': 'Passwords do not match.',
        }),
    })
);