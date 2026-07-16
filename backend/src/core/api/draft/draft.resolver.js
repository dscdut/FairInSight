import { Module } from 'packages/handler/Module';
import { CreateDraftInterceptor, UpdateDraftInterceptor } from 'core/modules/draft/interceptor';
import { RecordIdInterceptor } from 'core/modules/interceptor/recordId/record-id.interceptor';
import { RecordId } from 'core/common/swagger';
import { DraftController } from './draft.controller';

export const DraftResolver = Module.builder()
    .addPrefix({
        prefixPath: '/drafts',
        tag: 'drafts',
        module: 'DraftModule'
    })
    .register([
        {
            route: '/',
            method: 'get',
            description: 'Get list of user drafts',
            controller: DraftController.listDrafts,
            preAuthorization: true
        },
        {
            route: '/',
            method: 'post',
            description: 'Create a new draft',
            interceptors: [CreateDraftInterceptor],
            body: 'CreateDraftDto',
            controller: DraftController.createDraft,
            preAuthorization: true
        },
        {
            route: '/:id',
            method: 'put',
            description: 'Auto save a draft (Update)',
            params: [RecordId],
            interceptors: [RecordIdInterceptor, UpdateDraftInterceptor],
            body: 'UpdateDraftDto',
            controller: DraftController.updateDraft,
            preAuthorization: true
        },
        {
            route: '/:id',
            method: 'delete',
            description: 'Delete a draft',
            params: [RecordId],
            interceptors: [RecordIdInterceptor],
            controller: DraftController.deleteDraft,
            preAuthorization: true
        }
    ]);
