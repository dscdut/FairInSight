import { ApiDocument } from 'core/config/swagger.config';
import { SwaggerDocument } from 'packages/swagger';

ApiDocument.addModel('CreateLawyerDto', {
    email: SwaggerDocument.ApiProperty({ type: 'string', required: true }),
    password: SwaggerDocument.ApiProperty({ type: 'string', required: true }),
    fullName: SwaggerDocument.ApiProperty({ type: 'string', required: true }),
    phone: SwaggerDocument.ApiProperty({ type: 'string', required: false }),
    location: SwaggerDocument.ApiProperty({ type: 'string', required: false }),
    avatarUrl: SwaggerDocument.ApiProperty({ type: 'string', required: false }),
    bio: SwaggerDocument.ApiProperty({ type: 'string', required: false }),
    experienceYears: SwaggerDocument.ApiProperty({ type: 'integer', required: false }),
    successfulCases: SwaggerDocument.ApiProperty({ type: 'integer', required: false }),
    consultingFee: SwaggerDocument.ApiProperty({ type: 'number', required: false }),
    status: SwaggerDocument.ApiProperty({ type: 'string', enum: ['AVAILABLE', 'BUSY', 'OFFLINE'], required: false }),
    barAssociation: SwaggerDocument.ApiProperty({ type: 'string', required: false }),
    licenseNumber: SwaggerDocument.ApiProperty({ type: 'string', required: true }),
    specializations: SwaggerDocument.ApiProperty({ type: 'array', items: { type: 'string' }, required: false }),
});

export const CreateLawyerDto = body => ({
    email: body.email,
    password: body.password,
    fullName: body.fullName,
    phone: body.phone,
    location: body.location,
    avatarUrl: body.avatarUrl,
    bio: body.bio,
    experienceYears: body.experienceYears,
    successfulCases: body.successfulCases,
    consultingFee: body.consultingFee,
    status: body.status,
    barAssociation: body.barAssociation,
    licenseNumber: body.licenseNumber,
    specializations: body.specializations,
});
