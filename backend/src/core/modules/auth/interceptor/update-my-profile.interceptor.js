import { DefaultValidatorInterceptor } from 'core/infrastructure/interceptor';
import { JoiUtils } from 'core/utils';
import Joi from 'joi';

export const UpdateMyProfileInterceptor = new DefaultValidatorInterceptor(
    Joi.object({
        avatarUrl: JoiUtils.optionalString().allow(''),
        fullName: JoiUtils.optionalString().allow(''),
        phone: JoiUtils.optionalString().allow(''),
        dateOfBirth: JoiUtils.optionalString().empty(''),
        location: JoiUtils.optionalString().allow(''),
    })
);