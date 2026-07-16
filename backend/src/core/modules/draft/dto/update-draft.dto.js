import { ApiDocument } from 'core/config/swagger.config';
import { SwaggerDocument } from 'packages/swagger';

ApiDocument.addModel('UpdateDraftDto', {
    content: SwaggerDocument.ApiProperty({ type: 'object', required: false }),
});

export const UpdateDraftDto = body => ({
    content: body.content || {},
});
