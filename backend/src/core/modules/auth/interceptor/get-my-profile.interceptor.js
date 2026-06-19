import { DefaultValidatorInterceptor } from 'core/infrastructure/interceptor';
import Joi from 'joi';

export const GetMyProfileInterceptor = new DefaultValidatorInterceptor(
    Joi.object({}),
    'params'
);
