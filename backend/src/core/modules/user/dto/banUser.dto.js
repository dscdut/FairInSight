import { ApiDocument } from 'core/config/swagger.config';
import { SwaggerDocument } from 'packages/swagger';

ApiDocument.addModel('BanUserDto', {
    reason: SwaggerDocument.ApiProperty({
        type: 'string',
        required: false,
        description: 'Reason for banning the user (max 500 characters)'
    }),
});

export const BanUserDto = body => ({
    reason: body?.reason || null,
});
