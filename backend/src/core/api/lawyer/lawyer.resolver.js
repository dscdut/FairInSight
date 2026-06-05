import { Module } from 'packages/handler/Module';
import { LawyerController } from './lawyer.controller';
import { DefaultQueryCriteriaDocument } from '../../common/swagger/filter';

export const LawyerResolver = Module.builder()
    .addPrefix({
        prefixPath: '/api/v1/lawyers',
        tag: 'lawyers',
        module: 'LawyerModule',
    })
    .register([
        {
            route: '/',
            method: 'get',
            params: DefaultQueryCriteriaDocument,
            controller: LawyerController.listLawyers,
            preAuthorization: false,
        }
    ]);
