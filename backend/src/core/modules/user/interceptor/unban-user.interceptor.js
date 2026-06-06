import Joi from 'joi';
import { DefaultValidatorInterceptor } from 'core/infrastructure/interceptor';
import { JoiUtils } from '../../../utils';

export const UnbanUserInterceptor = new DefaultValidatorInterceptor(
    Joi.object({
        reason: Joi.string().max(500).optional().allow(null),
    })
);
