import { DefaultValidatorInterceptor } from 'core/infrastructure/interceptor';
import { JoiUtils } from 'core/utils';
import Joi from 'joi';

export const GetMyProfileInterceptor = new DefaultValidatorInterceptor(
    Joi.object({
        id: JoiUtils.uuid()
    }),
    'params'
);
