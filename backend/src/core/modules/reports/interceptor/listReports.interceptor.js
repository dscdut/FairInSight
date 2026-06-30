import { DefaultValidatorInterceptor } from 'core/infrastructure/interceptor';
import { JoiUtils } from 'core/utils';
import Joi from 'joi';

export const ListReportsInterceptor = new DefaultValidatorInterceptor(
    Joi.object({
        page: JoiUtils.positiveNumber().min(1).default(1).required(),
        limit: JoiUtils.positiveNumber().min(1).max(100).default(20).required(),
        status: JoiUtils.requiredString(),
        startDate: JoiUtils.date(),
        endDate: JoiUtils.date(),
    })
);