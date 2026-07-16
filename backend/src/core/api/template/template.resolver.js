import { Module } from 'packages/handler/Module';
import { TemplateController } from './template.controller';
import { RecordId } from 'core/common/swagger';
import { RecordIdInterceptor } from 'core/modules/interceptor/recordId/record-id.interceptor';

export const TemplateResolver = Module.builder()
    .addPrefix({
        prefixPath: '/templates',
        tag: 'templates',
        module: 'TemplateModule'
    })
    .register([
        {
            route: '/',
            method: 'get',
            controller: TemplateController.listTemplates,
            preAuthorization: true
        },
        {
            route: '/:id',
            method: 'get',
            controller: TemplateController.getTemplateById,
            preAuthorization: true
        },
        {
            route: '/:id/schema',
            params: [RecordId],
            interceptors: [RecordIdInterceptor],
            method: 'get',
            controller: TemplateController.getTemplateSchema,
            preAuthorization: true
        }
    ]);

