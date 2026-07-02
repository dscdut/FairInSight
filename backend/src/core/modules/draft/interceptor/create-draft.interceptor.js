import Joi from 'joi';
import { DefaultValidatorInterceptor } from 'core/infrastructure/interceptor';

export const CreateDraftInterceptor = new DefaultValidatorInterceptor(
    Joi.object({
        templateId: Joi.string().uuid().required(),
        content: Joi.object().optional().allow(null),
    })
);
