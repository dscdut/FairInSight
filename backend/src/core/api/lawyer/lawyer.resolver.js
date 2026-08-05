import { Module } from 'packages/handler/Module';
import { RecordIdInterceptor } from 'core/modules/interceptor/recordId/record-id.interceptor';
import { CreateLawyerInterceptor, UpdateLawyerProfileInterceptor } from 'core/modules/lawyer/interceptor';
import { hasAdminRole, hasLawyerRole } from 'core/modules/auth/guard';
import { LawyerController } from './lawyer.controller';
import { DefaultQueryCriteriaDocument } from '../../common/swagger/filter';
import { RecordId } from '../../common/swagger/record-id';

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
            route: '',
            method: 'post',
            interceptors: [CreateLawyerInterceptor],
            body: 'CreateLawyerDto',
            guards: [hasAdminRole],
            controller: LawyerController.createLawyer,
            preAuthorization: true,
        },
        {
            route: '/recommendations',
            method: 'get',
            controller: LawyerController.recommend,
            preAuthorization: true,
        },
        {
            route: '/profile',
            method: 'patch',
            interceptors: [UpdateLawyerProfileInterceptor],
            body: 'UpdateLawyerProfileDto',
            guards: [hasLawyerRole],
            controller: LawyerController.updateProfile,
            preAuthorization: true,
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
            route: '/:id',
            method: 'patch',
            params: [RecordId],
            interceptors: [RecordIdInterceptor, UpdateLawyerProfileInterceptor],
            body: 'UpdateLawyerProfileDto',
            guards: [hasAdminRole],
            controller: LawyerController.adminUpdateProfile,
            preAuthorization: true,
        },
        {
            route: '/:id',
            method: 'delete',
            params: [RecordId],
            interceptors: [RecordIdInterceptor],
            guards: [hasAdminRole],
            controller: LawyerController.deleteLawyer,
            preAuthorization: true,
        }
    ]);

