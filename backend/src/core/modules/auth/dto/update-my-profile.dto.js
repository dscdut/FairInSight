import { ApiDocument } from 'core/config/swagger.config';
import { SwaggerDocument } from 'packages/swagger';

ApiDocument.addModel('UpdateMyProfileDto', {
    avatarUrl: SwaggerDocument.ApiProperty({ type:'string' }),
    fullName: SwaggerDocument.ApiProperty({ type:'string' }),
    phone: SwaggerDocument.ApiProperty({ type:'string' }),
    dateOfBirth: SwaggerDocument.ApiProperty({ type:'string' }),
    location: SwaggerDocument.ApiProperty({ type:'string' }),
});

export const UpdateMyProfileDto = body => ({
    avatarUrl: body.avatarUrl,
    fullName: body.fullName,
    phone: body.phone,
    dateOfBirth: body.dateOfBirth,
    location: body.location,
});