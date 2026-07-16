import { Module } from 'packages/handler/Module';
import { CreateDraftInterceptor } from 'core/modules/draft/interceptor';
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
            method: 'post',
            interceptors: [CreateDraftInterceptor],
            body: 'CreateDraftDto',
            controller: DraftController.createDraft,
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

