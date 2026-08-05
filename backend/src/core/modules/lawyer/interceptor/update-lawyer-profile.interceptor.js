import Joi from 'joi';
import { DefaultValidatorInterceptor } from 'core/infrastructure/interceptor';
import { JoiUtils } from '../../../utils';

export const UpdateLawyerProfileInterceptor = new DefaultValidatorInterceptor(
    Joi.object({
        email: Joi.string().email().optional(),
        fullName: Joi.string().trim().optional(),
        phone: Joi.string().trim().optional(),
        location: Joi.string().trim().optional(),
        avatarUrl: Joi.string().uri().optional(),
        dateOfBirth: JoiUtils.date(true).optional(),
        bio: Joi.string().trim().optional(),
        experienceYears: Joi.number().integer().min(0).optional(),
        successfulCases: Joi.number().integer().min(0).optional(),
        consultingFee: Joi.number().min(0).optional(),
        isVerified: Joi.boolean().optional(),
        status: Joi.string().valid('AVAILABLE', 'BUSY', 'OFFLINE').optional(),
        barAssociation: Joi.string().trim().optional(),
        licenseNumber: Joi.string().trim().optional(),
        specializations: Joi.array().items(Joi.string().trim()).optional(),
    })
);
