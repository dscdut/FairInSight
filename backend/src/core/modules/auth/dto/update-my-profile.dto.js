import { ApiDocument } from 'core/config/swagger.config';
import { SwaggerDocument } from 'packages/swagger';

ApiDocument.addModel('UpdateMyProfileDto', {
    avatar_url: SwaggerDocument.ApiProperty({ type:'string' }),
    full_name: SwaggerDocument.ApiProperty({ type:'string' }),
    phone: SwaggerDocument.ApiProperty({ type:'string' }),
    date_of_birth: SwaggerDocument.ApiProperty({ type:'string' }),
    location: SwaggerDocument.ApiProperty({ type:'string' }),
});

export const UpdateMyProfileDto = body => ({
    avatar_url: body.avatar_url,
    full_name: body.full_name,
    phone: body.phone,
    date_of_birth: body.date_of_birth,
    location: body.location,
});