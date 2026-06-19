import { Module } from 'packages/handler/Module';
import { TemplateController } from './template.controller';

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
        }
    ]);
