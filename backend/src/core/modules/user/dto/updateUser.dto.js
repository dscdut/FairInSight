import { ApiDocument } from 'core/config/swagger.config';
import { SwaggerDocument } from 'packages/swagger';

ApiDocument.addModel('UpdateUserDto', {
    email: SwaggerDocument.ApiProperty({ type: 'string' }),
    fullName: SwaggerDocument.ApiProperty({ type: 'string' }),
    phone: SwaggerDocument.ApiProperty({ type: 'string' }),
    location: SwaggerDocument.ApiProperty({ type: 'string' }),
    avatarUrl: SwaggerDocument.ApiProperty({ type: 'string' }),
    bio: SwaggerDocument.ApiProperty({ type: 'string' }),
    experienceYears: SwaggerDocument.ApiProperty({ type: 'number' }),
    pricePerHour: SwaggerDocument.ApiProperty({ type: 'number' }),
    barAssociation: SwaggerDocument.ApiProperty({ type: 'string' }),
    licenseNumber: SwaggerDocument.ApiProperty({ type: 'string' }),
});

export const UpdateUserDto = body => ({
    email: body.email,
    full_name: body.fullName,
    phone: body.phone,
    location: body.location,
    avatar_url: body.avatarUrl,
    bio: body.bio,
    experience_years: body.experienceYears ? Number(body.experienceYears) : undefined,
    price_per_hour: body.pricePerHour ? Number(body.pricePerHour) : undefined,
    bar_association: body.barAssociation,
    license_number: body.licenseNumber,
});
