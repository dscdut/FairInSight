import { ApiDocument } from 'core/config/swagger.config';
import { SwaggerDocument } from 'packages/swagger';

ApiDocument.addModel('ResetPasswordDto', {
    token: SwaggerDocument.ApiProperty({ type: 'string' }),
    newPassword: SwaggerDocument.ApiProperty({ type: 'string' }),
    confirmNewPassword: SwaggerDocument.ApiProperty({ type: 'string' }),
});

export const ResetPasswordDto = body => ({
    token: body.token,
    newPassword: body.newPassword,
    confirmNewPassword: body.confirmNewPassword,
});