import { Module } from 'packages/handler/Module';
import { RecordIdInterceptor } from 'core/modules/interceptor/recordId/record-id.interceptor';
import { LawyerController } from './lawyer.controller';
import { DefaultQueryCriteriaDocument } from '../../common/swagger/filter';
import { RecordId } from '../../common/swagger/record-id';
import { UpdateLawyerProfileInterceptor } from 'core/modules/lawyer/interceptor';
import { hasLawyerRole } from 'core/modules/auth/guard';

export const LawyerResolver = Module.builder()
    .addPrefix({
        prefixPath: '/lawyers',
        tag: 'lawyers',
        module: 'LawyerModule',
    })
    .register([
        {
            route: '',
            method: 'get',
            params: DefaultQueryCriteriaDocument,
            controller: LawyerController.listLawyers,
            preAuthorization: false,
        },
        {
            route: '/:id',
            method: 'get',
            params: [RecordId],
            interceptors: [RecordIdInterceptor],
            controller: LawyerController.findById,
            preAuthorization: false,
        },
        {
            route: '/profile',
            method: 'patch',
            interceptors: [UpdateLawyerProfileInterceptor],
            body: 'UpdateLawyerProfileDto',
            guards: [hasLawyerRole],
            controller: LawyerController.updateProfile,
            preAuthorization: true,
        }
    ]);

