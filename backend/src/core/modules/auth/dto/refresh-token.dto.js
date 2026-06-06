import { ApiDocument } from 'core/config/swagger.config';
import { SwaggerDocument } from 'packages/swagger';

ApiDocument.addModel('RefreshTokenDto', {
    refresh_token: SwaggerDocument.ApiProperty({ type: 'string' }),
});

export const RefreshTokenDto = body => ({
    refresh_token: body.refresh_token,
});