import { hasAdminRole } from 'core/modules/auth/guard';
import {
    CreateReportInterceptor,
    CreateReportMessageInterceptor,
    UpdateReportStatusInterceptor,
} from 'core/modules/reports';
import { Module } from 'packages/handler/Module';
import { ReportsController } from './reports.controller';

export const ReportsResolver = Module.builder()
    .addPrefix({
        prefixPath: '/reports',
        tag: 'reports',
        module: 'ReportsModule',
    })
    .register([
        {
            route: '',
            method: 'post',
            interceptors: [CreateReportInterceptor],
            controller: ReportsController.createReport,
            preAuthorization: true,
        },
        {
            route: '',
            method: 'get',
            controller: ReportsController.listReports,
            preAuthorization: true,
        },
        {
            route: '/stats',
            method: 'get',
            guards: [hasAdminRole],
            controller: ReportsController.getReportsStats,
            preAuthorization: true,
        },
        {
            route: '/:id',
            method: 'get',
            controller: ReportsController.getReportById,
            preAuthorization: true,
        },
        {
            route: '/:id/messages',
            method: 'post',
            interceptors: [CreateReportMessageInterceptor],
            controller: ReportsController.createReportMessage,
            preAuthorization: true,
        },
        {
            route: '/:id/status',
            method: 'patch',
            guards: [hasAdminRole],
            interceptors: [UpdateReportStatusInterceptor],
            controller: ReportsController.updateReportStatus,
            preAuthorization: true,
        },
    ]);
