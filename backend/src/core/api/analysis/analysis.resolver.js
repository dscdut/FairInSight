import { Module } from 'packages/handler/Module';
import { RecordId } from 'core/common/swagger';
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
            method: 'get',
            params: [RecordId],
            controller: AnalysisController.getAnalysisHistoryDetail,
            preAuthorization: true
        }
    ]);
