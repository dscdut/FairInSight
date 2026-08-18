import Joi from 'joi';
import { DefaultValidatorInterceptor } from 'core/infrastructure/interceptor';

export const UpdateReportStatusInterceptor = new DefaultValidatorInterceptor(
    Joi.object({
        status: Joi.string().valid('OPEN', 'IN_REVIEW', 'RESOLVED').required(),
        message: Joi.string().trim().max(5000).optional().allow(null, ''),
    }),
);
