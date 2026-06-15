import { Module } from 'packages/handler/Module';
import { DocumentController } from './document.controller';

export const DocumentResolver = Module.builder()
    .addPrefix({
        prefixPath: '/documents',
        tag: 'documents',
        module: 'DocumentModule'
    })
    .register([
        {
            route: '/',
            method: 'post',
            controller: DocumentController.createOrUpdateDocument,
            preAuthorization: true
        },
        {
            route: '/',
            method: 'get',
            controller: DocumentController.listDocuments,
            preAuthorization: true
        },
        {
            route: '/:id',
            method: 'get',
            controller: DocumentController.getDocumentById,
            preAuthorization: true
        },
        {
            route: '/:id',
            method: 'delete',
            controller: DocumentController.deleteDocument,
            preAuthorization: true
        }
    ]);
