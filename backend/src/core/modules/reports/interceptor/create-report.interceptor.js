import Joi from 'joi';
import { DefaultValidatorInterceptor } from 'core/infrastructure/interceptor';

export const CreateReportInterceptor = new DefaultValidatorInterceptor(
    Joi.object({
        targetUserId: Joi.string()
            .pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
            .optional()
            .allow(null),
        type: Joi.string().valid('SYSTEM', 'LAWYER', 'USER').required(),
        category: Joi.string().valid(
            'HARASSMENT',
            'UNPROFESSIONAL_BEHAVIOR',
            'FRAUD',
            'TECHNICAL_ERROR',
            'PAYMENT_ERROR',
            'FEATURE_ERROR',
            'OTHER',
        ).required(),
        customReason: Joi.string().max(500).optional().allow(null, ''),
        description: Joi.string().trim().min(5).max(5000).required(),
        priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH').optional(),
        attachments: Joi.array().items(Joi.object()).max(10).optional().allow(null),
    }),
);
