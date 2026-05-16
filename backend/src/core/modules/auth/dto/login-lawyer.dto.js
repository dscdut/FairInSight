import { ApiDocument } from 'core/config/swagger.config';
import { SwaggerDocument } from 'packages/swagger';

ApiDocument.addModel('LoginLawyerDto',
    {
        email: SwaggerDocument.ApiProperty({ type: 'string' }),
        password: SwaggerDocument.ApiProperty({ type: 'string' }),
        licenseNumber: SwaggerDocument.ApiProperty({ type: 'string' })
    });

export const LoginLawyerDto = body => ({
    email: body.email,
    password: body.password,
    licenseNumber: body.licenseNumber,
});
