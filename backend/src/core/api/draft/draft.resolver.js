import { Module } from 'packages/handler/Module';
import { CreateDraftInterceptor } from 'core/modules/draft/interceptor';
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
        }
    ]);
