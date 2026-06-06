import { ApiDocument } from 'core/config/swagger.config';
import { SwaggerDocument } from 'packages/swagger';

ApiDocument.addModel('VerifyOtpDto', {
    email: SwaggerDocument.ApiProperty({ type: 'string' }),
    otp: SwaggerDocument.ApiProperty({ type: 'string' }),
    type: SwaggerDocument.ApiProperty({ type: 'string' }),
});

export const VerifyOtpDto = body => ({
    email: body.email,
    otp: body.otp,
    type: body.type,
});