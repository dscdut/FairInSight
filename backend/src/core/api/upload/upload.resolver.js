import { uploadFileSwagger } from 'core/common/swagger';
import { RecordId } from 'core/common/swagger';
import { UploadInterceptor } from 'core/modules/document';
import { Module } from 'packages/handler/Module';
import { UploadController } from './upload.controller';

export const UploadResolver = Module.builder()
    .addPrefix({
        prefixPath: '/uploads',
        tag: 'uploads',
        module: 'UploadModule'
    })
    .register([
        {
            route: '/',
            method: 'post',
            params: [uploadFileSwagger],
            consumes: ['multipart/form-data'],
            interceptors: [new UploadInterceptor(10)],
            controller: UploadController.upload,
            preAuthorization: true
        },
        {
            route: '/:id',
            method: 'get',
            params: [RecordId],
            controller: UploadController.getOne,
            preAuthorization: true
        },
        {
            route: '/:id',
            method: 'delete',
            params: [RecordId],
            controller: UploadController.deleteFile,
            preAuthorization: true
        }
    ]);

