import { ApiDocument } from 'core/config/swagger.config';
import { SwaggerDocument } from 'packages/swagger';

ApiDocument.addModel('CreateDraftDto', {
    templateId: SwaggerDocument.ApiProperty({ type: 'string', format: 'uuid', required: true }),
    content: SwaggerDocument.ApiProperty({ type: 'object', required: false }),
});

export const CreateDraftDto = body => ({
    templateId: body.templateId,
    content: body.content || {},
});
