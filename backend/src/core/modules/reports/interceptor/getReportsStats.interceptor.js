import { DefaultValidatorInterceptor } from 'core/infrastructure/interceptor';
import { JoiUtils } from 'core/utils';
import Joi from 'joi';

const DATE_YYYY_MM_FORMAT = /^\d{4}-\d{2}$/;

export const GetReportsStatsInterceptor = new DefaultValidatorInterceptor(
    Joi.object({
        month: Joi.string().regex(DATE_YYYY_MM_FORMAT),
    })
);