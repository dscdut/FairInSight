import { Module } from 'packages/handler/Module';
import { RecordId } from 'core/common/swagger';
import { RecordIdInterceptor } from 'core/modules/interceptor/recordId/record-id.interceptor';
import { AnalysisController } from './analysis.controller';

export const AnalysisResolver = Module.builder()
    .addPrefix({
        prefixPath: '/analysis',
        tag: 'analysis',
        module: 'AnalysisModule'
    })
    .register([
        {
            route: '/history',
            method: 'get',
            controller: AnalysisController.getAnalysisHistory,
            preAuthorization: true
        },
        {
            route: '/history/:id',
            method: 'delete',
            params: [RecordId],
            interceptors: [RecordIdInterceptor],
            controller: AnalysisController.deleteAnalysisHistory,
            preAuthorization: true
        }
    ]);

