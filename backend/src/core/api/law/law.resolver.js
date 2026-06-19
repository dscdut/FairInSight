import { Module } from 'packages/handler/Module';
import { hasAdminRole } from 'core/modules/auth/guard';
import { LawController } from './law.controller';

export const LawResolver = Module.builder()
    .addPrefix({
        prefixPath: '/laws',
        tag: 'laws',
        module: 'LawModule',
    })
    .register([
        {
            route: '',
            method: 'get',
            controller: LawController.listLaws,
            preAuthorization: true,
        },
        {
            route: '',
            method: 'post',
            guards: [hasAdminRole],
            controller: LawController.createLaw,
            preAuthorization: true,
        },
        {
            route: '/parse-docx',
            method: 'post',
            guards: [hasAdminRole],
            controller: LawController.parseDocx,
            preAuthorization: true,
        },
        {
            route: '/:id',
            method: 'get',
            controller: LawController.findById,
            preAuthorization: true,
        },
        {
            route: '/:id',
            method: 'put',
            guards: [hasAdminRole],
            controller: LawController.updateLaw,
            preAuthorization: true,
        },
        {
            route: '/:id/status',
            method: 'patch',
            guards: [hasAdminRole],
            controller: LawController.toggleStatus,
            preAuthorization: true,
        },
        {
            route: '/:id/versions',
            method: 'get',
            controller: LawController.listVersions,
            preAuthorization: true,
        },
        {
            route: '/:id/versions/:versionId/restore',
            method: 'post',
            guards: [hasAdminRole],
            controller: LawController.restoreVersion,
            preAuthorization: true,
        },
    ]);
