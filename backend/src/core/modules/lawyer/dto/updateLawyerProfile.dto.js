import { ApiDocument } from 'core/config/swagger.config';
import { SwaggerDocument } from 'packages/swagger';

ApiDocument.addModel('UpdateLawyerProfileDto', {
    email: SwaggerDocument.ApiProperty({ type: 'string', required: false }),
    fullName: SwaggerDocument.ApiProperty({ type: 'string', required: false }),
    phone: SwaggerDocument.ApiProperty({ type: 'string', required: false }),
    location: SwaggerDocument.ApiProperty({ type: 'string', required: false }),
    avatarUrl: SwaggerDocument.ApiProperty({ type: 'string', required: false }),
    dateOfBirth: SwaggerDocument.ApiProperty({ type: 'string', format: 'date', required: false }),
    bio: SwaggerDocument.ApiProperty({ type: 'string', required: false }),
    experienceYears: SwaggerDocument.ApiProperty({ type: 'integer', required: false }),
    successfulCases: SwaggerDocument.ApiProperty({ type: 'integer', required: false }),
    consultingFee: SwaggerDocument.ApiProperty({ type: 'number', required: false }),
    isVerified: SwaggerDocument.ApiProperty({ type: 'boolean', required: false }),
    status: SwaggerDocument.ApiProperty({ type: 'string', enum: ['AVAILABLE', 'BUSY', 'OFFLINE'], required: false }),
    barAssociation: SwaggerDocument.ApiProperty({ type: 'string', required: false }),
    licenseNumber: SwaggerDocument.ApiProperty({ type: 'string', required: false }),
    specializations: SwaggerDocument.ApiProperty({ type: 'array', items: { type: 'string' }, required: false }),
});

export const UpdateLawyerProfileDto = body => ({
    email: body.email,
    fullName: body.fullName,
    phone: body.phone,
    location: body.location,
    avatarUrl: body.avatarUrl,
    dateOfBirth: body.dateOfBirth,
    bio: body.bio,
    experienceYears: body.experienceYears,
    successfulCases: body.successfulCases,
    consultingFee: body.consultingFee,
    isVerified: body.isVerified,
    status: body.status,
    barAssociation: body.barAssociation,
    licenseNumber: body.licenseNumber,
    specializations: body.specializations,
});
