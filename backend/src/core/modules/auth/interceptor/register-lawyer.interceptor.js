import { DefaultValidatorInterceptor } from 'core/infrastructure/interceptor';
import { JoiUtils } from 'core/utils';
import Joi from 'joi';

export const RegisterLawyerInterceptor = new DefaultValidatorInterceptor(
    Joi.object({
        role: JoiUtils.requiredString(),
        email: JoiUtils.email().required(),
        password: JoiUtils.password().required(),
        confirmPassword: JoiUtils.password().required(),
        licenseNumber: JoiUtils.requiredString(),
        licenseIssuer: JoiUtils.requiredString(),
        licenseIssueDate: JoiUtils.requiredString().isoDate(), // e khong ro cai format date
        licenseFile: JoiUtils.requiredString(),
        referralCode: JoiUtils.optionalString().allow(''),
    })
);