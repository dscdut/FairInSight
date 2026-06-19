import { ApiDocument } from 'core/config/swagger.config';
import { SwaggerDocument } from 'packages/swagger';

ApiDocument.addModel('GetReportsDto', {
    page: SwaggerDocument.ApiProperty({ type: 'string' }),
    limit: SwaggerDocument.ApiProperty({ type: 'string' }),
    status: SwaggerDocument.ApiProperty({ type: 'string' }),
    startDate: SwaggerDocument.ApiProperty({ type: 'string' }),
    endDate: SwaggerDocument.ApiProperty({ type: 'string' }),
});

export const GetReportsDto = body => ({
    page: body.page,
    limit: body.limit,
    status: body.status,
    startDate: body.startDate,
    endDate: body.endDate,
});