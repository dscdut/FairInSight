import { DefaultValidatorInterceptor } from 'core/infrastructure/interceptor';
import { JoiUtils } from 'core/utils';
import Joi from 'joi';

export const RegisterInterceptor = new DefaultValidatorInterceptor(
    Joi.object({
        role: JoiUtils.requiredString().valid('USER', 'LAWYER'),
        fullName: JoiUtils.requiredString(),
        email: JoiUtils.email().required().pattern(/^.*@.*\.(com|net|org)$/).message({
            'string.pattern.base': 'Email must be a valid email address.'
        }),
        password: JoiUtils.password().min(8).pattern(/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/).required().messages({
            'string.min': 'Password must be at least 8 characters',
            'string.pattern.base': 'Password must contain at least one letter and one number',
        }),
        confirmPassword: JoiUtils.password().valid(Joi.ref('password')).required().messages({
            'any.only': 'Passwords do not match.',
        }),
        referralCode: JoiUtils.optionalString().allow(''),
    })
);