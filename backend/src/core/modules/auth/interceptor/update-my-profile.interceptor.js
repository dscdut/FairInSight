import { DefaultValidatorInterceptor } from 'core/infrastructure/interceptor';
import { JoiUtils } from 'core/utils';
import Joi from 'joi';

export const UpdateMyProfileInterceptor = new DefaultValidatorInterceptor(
    Joi.object({
        avatar_url: JoiUtils.optionalString().allow(''),
        full_name: JoiUtils.optionalString().allow(''),
        phone: JoiUtils.optionalString().allow(''),
        date_of_birth: JoiUtils.optionalString().empty(''),
        location: JoiUtils.optionalString().allow(''),
    })
);