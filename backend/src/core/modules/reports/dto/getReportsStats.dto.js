import { ApiDocument } from 'core/config/swagger.config';
import { SwaggerDocument } from 'packages/swagger';

ApiDocument.addModel('GetReportsStatsDto', {
    month: SwaggerDocument.ApiProperty({ type: 'string' })
});

export const GetReportsStatsDto = body => ({
    month: body.month
});