import { ApiDocument } from 'core/config/swagger.config';
import { SwaggerDocument } from 'packages/swagger';

ApiDocument.addModel('LoginDto', {
    email: SwaggerDocument.ApiProperty({ type: 'string' }),
    password: SwaggerDocument.ApiProperty({ type: 'string' }),
});

export const LoginUserDto = body => ({
    email: body.email,
    password: body.password,
});