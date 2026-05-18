import { DefaultValidatorInterceptor } from 'core/infrastructure/interceptor';
import { JoiUtils } from 'core/utils';
import Joi from 'joi';

export const RegisterLawyerInterceptor = new DefaultValidatorInterceptor(
    Joi.object({
        role: JoiUtils.requiredString(),
        fullName: JoiUtils.requiredString(),
        email: JoiUtils.email().required(),
        password: JoiUtils.password().min(8).pattern(/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/).required().messages({
            'string.min': 'Password must be at least 8 characters',
            'string.pattern.base': 'Password must contain at least one letter and one number',
        }),
        confirmPassword: JoiUtils.password().valid(Joi.ref('password')).required().messages({
            'any.only': 'Passwords do not match.',
        }),
        licenseNumber: JoiUtils.requiredString(),
        licenseIssuer: JoiUtils.requiredString(),
        licenseIssueDate: JoiUtils.requiredString().isoDate(), // e khong ro cai format date
        licenseFile: JoiUtils.requiredString(),
        referralCode: JoiUtils.optionalString().allow(''),
    })
);