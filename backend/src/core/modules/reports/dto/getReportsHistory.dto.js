import { ApiDocument } from 'core/config/swagger.config';
import { SwaggerDocument } from 'packages/swagger';

ApiDocument.addModel('GetReportsHistoryDto', {
    page: SwaggerDocument.ApiProperty({ type: 'string' }),
    limit: SwaggerDocument.ApiProperty({ type: 'string' }),
});

export const GetReportsHistoryDto = body => ({
    page: body.page,
    limit: body.limit
});