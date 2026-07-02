import Joi from 'joi';
import { DefaultValidatorInterceptor } from 'core/infrastructure/interceptor';

export const UpdateDraftInterceptor = new DefaultValidatorInterceptor(
    Joi.object({
        content: Joi.object().optional().allow(null),
    })
);
