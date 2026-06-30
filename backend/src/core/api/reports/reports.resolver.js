import {
    GetReportsInterceptor
} from 'core/modules/reports';
import { Module } from 'packages/handler/Module';
import { ReportsController } from './reports.controller';
import { authMiddleware } from 'core/modules/auth/middleware/auth.middleware';
import { uploadMediaSwagger } from 'core/common/swagger';
import { MediaInterceptor } from 'core/modules/document';
import { hasAdminRole } from 'core/modules/auth/guard';
import { ListReportsParams, GetReportsStatsParams, GetReportsHistoryParams } from 'core/common/swagger/reportFilter';

export const ReportsResolver = Module.builder()
    .addPrefix({
        prefixPath: '/reports',
        tag: 'reports',
        module: 'ReportsModule'
    })
    .register([
        {
            route: '/',
            method: 'get',
            params: ListReportsParams,
            guards: [hasAdminRole],
            controller: ReportsController.listReports,
            preAuthorization: true,
        },
        {
            route: '/stats',
            method: 'get',
            params: GetReportsStatsParams,
            guards: [hasAdminRole],
            controller: ReportsController.getReportsStats,
            preAuthorization: true,
        },
        {
            route: '/history',
            method: 'get',
            params: GetReportsHistoryParams,
            guards: [hasAdminRole],
            controller: ReportsController.getReportsHistory,
            preAuthorization: true,
        },
    ]);
