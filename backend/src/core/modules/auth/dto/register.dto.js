import { ApiDocument } from "core/config/swagger.config";
import { SwaggerDocument } from "packages/swagger";

ApiDocument.addModel('RegisterDto', {
    role: SwaggerDocument.ApiProperty({type: 'string'}),
    fullName: SwaggerDocument.ApiProperty({type: 'string'}),
    email: SwaggerDocument.ApiProperty({type: 'string'}),
    password: SwaggerDocument.ApiProperty({type: 'string'}),
    confirmPassword: SwaggerDocument.ApiProperty({type: 'string'}),
    referralCode: SwaggerDocument.ApiProperty({type: 'string'}),
});

export const RegisterDto = body => ({
    role: body.role,
    fullName: body.fullName,
    email: body.email,
    password: body.password,
    confirmPassword: body.confirmPassword,
    referralCode: body.referralCode || null,
});