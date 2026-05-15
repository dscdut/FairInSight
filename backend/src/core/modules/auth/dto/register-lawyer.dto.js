import { ApiDocument } from "core/config/swagger.config";
import { SwaggerDocument } from "packages/swagger";

ApiDocument.addModel('RegisterLawyerDto', {
    role: SwaggerDocument.ApiProperty({type: 'string'}),
    email: SwaggerDocument.ApiProperty({type: 'string'}),
    password: SwaggerDocument.ApiProperty({type: 'string'}),
    confirmPassword: SwaggerDocument.ApiProperty({type: 'string'}),
    licenseNumber: SwaggerDocument.ApiProperty({type: 'string'}),
    licenseIssuer: SwaggerDocument.ApiProperty({type: 'string'}),
    licenseIssueDate: SwaggerDocument.ApiProperty({type: 'string'}),
    licenseFile: SwaggerDocument.ApiProperty({type: 'string'}),
    referralCode: SwaggerDocument.ApiProperty({type: 'string'}),
});

export const RegisterLawyerDto = body => ({
    role: body.role,
    email: body.email,
    password: body.password,
    confirmPassword: body.confirmPassword,
    licenseNumber: body.licenseNumber,
    licenseIssuer: body.licenseIssuer,
    licenseIssueDate: body.licenseIssueDate,
    licenseFile: body.licenseFile,
    referralCode: body.referralCode || null,
});