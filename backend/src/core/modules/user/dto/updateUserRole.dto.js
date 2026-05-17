import { ApiDocument } from 'core/config/swagger.config';
import { SwaggerDocument } from 'packages/swagger';

ApiDocument.addModel('UpdateUserRoleDto', {
    role: SwaggerDocument.ApiProperty({
        type: 'string',
        enum: ['user', 'lawyer', 'admin'],
        description: 'The new role for the user'
    }),
    licenseNumber: SwaggerDocument.ApiProperty({
        type: 'string',
        required: false,
        description: 'License number (required if role is lawyer)'
    }),
    licenseIssuer: SwaggerDocument.ApiProperty({
        type: 'string',
        required: false,
        description: 'License issuer/bar association (required if role is lawyer)'
    }),
});

export const UpdateUserRoleDto = body => ({
    role: body?.role || null,
    licenseNumber: body?.licenseNumber || null,
    licenseIssuer: body?.licenseIssuer || null,
});
