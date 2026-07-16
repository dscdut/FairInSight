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
            controller: DraftController.listDrafts,
            preAuthorization: true
        },
        {
            route: '/',
            method: 'post',
            interceptors: [CreateDraftInterceptor],
            body: 'CreateDraftDto',
            controller: DraftController.createDraft,
            preAuthorization: true
        },
        {
            route: '/:id',
            method: 'put',
            params: [RecordId],
            interceptors: [RecordIdInterceptor, UpdateDraftInterceptor],
            body: 'UpdateDraftDto',
            controller: DraftController.updateDraft,
            preAuthorization: true
        },
        {
            route: '/:id',
            method: 'delete',
            params: [RecordId],
            interceptors: [RecordIdInterceptor],
            controller: DraftController.deleteDraft,
            preAuthorization: true
        }
    ]);
