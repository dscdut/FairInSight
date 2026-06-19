import { SwaggerDocument } from '../../../packages/swagger';

export const GetReportsCriteriaDocument = {
    page: (desc = 'Max page: 100000. Default: 1') => SwaggerDocument.ApiParams({
        name: 'page',
        paramsIn: 'query',
        required: true,
        type: 'int',
        description: desc
    }),
    limit: (desc = 'Max size: 200. Default: 20') => SwaggerDocument.ApiParams({
        name: 'limit',
        paramsIn: 'query',
        required: true,
        type: 'int',
        description: desc
    }),
    status: (desc = 'Of three types: pending, processing, and resolved') => SwaggerDocument.ApiParams({
        name: 'status',
        paramsIn: 'query',
        required: true,
        type: 'date',
        description: desc
    }),
    startDate: desc => SwaggerDocument.ApiParams({
        name: 'startDate',
        paramsIn: 'query',
        required: true,
        type: 'date',
        description: desc
    }),
    endDate: desc => SwaggerDocument.ApiParams({
        name: 'endDate',
        paramsIn: 'query',
        required: true,
        type: 'date',
        description: desc
    })
};

export const GetReportsStatsCriteriaDocument = {
    month: (desc = 'Get reports statistics of month. Format: YYYY-MM') => SwaggerDocument.ApiParams({
        name: 'month',
        paramsIn: 'query',
        required: true,
        type: 'date',
        description: desc
    })
};

export const GetReportsParams = [...Object.values(GetReportsCriteriaDocument).map(exec => exec())];
export const GetReportsStatsParams = [...Object.values(GetReportsStatsCriteriaDocument).map(exec => exec())];