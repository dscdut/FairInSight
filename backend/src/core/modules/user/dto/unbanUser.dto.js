import { ApiDocument } from 'core/config/swagger.config';
import { SwaggerDocument } from 'packages/swagger';

ApiDocument.addModel('UnbanUserDto', {
    reason: SwaggerDocument.ApiProperty({
        type: 'string',
        required: false,
        description: 'Reason for unbanning the user (max 500 characters)'
    }),
});

export const UnbanUserDto = body => ({
    reason: body?.reason || null,
});
