import Joi from 'joi';
import { DefaultValidatorInterceptor } from 'core/infrastructure/interceptor';

export const CreateReportMessageInterceptor = new DefaultValidatorInterceptor(
    Joi.object({
        message: Joi.string().trim().min(1).max(5000).required(),
        attachments: Joi.array().items(Joi.object()).max(10).optional().allow(null),
    }),
);
