import Joi from 'joi';
import { DefaultValidatorInterceptor } from 'core/infrastructure/interceptor';
import { JoiUtils } from 'core/utils';

export const RecordIdInterceptor = new DefaultValidatorInterceptor(
    Joi.object({
        id: JoiUtils.uuid()
    }),
    'params'
);
