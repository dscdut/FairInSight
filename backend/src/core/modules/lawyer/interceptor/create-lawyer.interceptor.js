import Joi from 'joi';
import { DefaultValidatorInterceptor } from 'core/infrastructure/interceptor';

export const CreateLawyerInterceptor = new DefaultValidatorInterceptor(
    Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
        fullName: Joi.string().trim().required(),
        phone: Joi.string().trim().optional(),
        location: Joi.string().trim().optional(),
        avatarUrl: Joi.string().uri().optional(),
        bio: Joi.string().trim().optional(),
        experienceYears: Joi.number().integer().min(0).optional(),
        successfulCases: Joi.number().integer().min(0).optional(),
        consultingFee: Joi.number().min(0).optional(),
        status: Joi.string().valid('AVAILABLE', 'BUSY', 'OFFLINE').optional(),
        barAssociation: Joi.string().trim().optional(),
        licenseNumber: Joi.string().trim().required(),
        specializations: Joi.array().items(Joi.string().trim()).optional(),
    })
);
