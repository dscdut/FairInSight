import Joi from 'joi';
import { DefaultValidatorInterceptor } from 'core/infrastructure/interceptor';

export const UpdateUserRoleInterceptor = new DefaultValidatorInterceptor(
    Joi.object({
        role: Joi.string().valid('user', 'lawyer', 'admin').required(),
        licenseNumber: Joi.when('role', {
            is: 'lawyer',
            then: Joi.string().required(),
            otherwise: Joi.string().optional().allow(null),
        }),
        licenseIssuer: Joi.when('role', {
            is: 'lawyer',
            then: Joi.string().required(),
            otherwise: Joi.string().optional().allow(null),
        }),
    })
);
