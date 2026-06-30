import { SwaggerDocument } from '../../../packages/swagger';

export const ListReportsCriteriaDocument = {
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

export const GetReportsHistoryCriteriaDocument = {
    page: (desc = 'Page number (starts from 1)') => SwaggerDocument.ApiParams({
        name: 'page',
        paramsIn: 'query',
        required: true,
        type: 'int',
        description: desc
    }),
    limit: (desc = 'Number of reports per page (max 100)') => SwaggerDocument.ApiParams({
        name: 'limit',
        paramsIn: 'query',
        required: true,
        type: 'int',
        description: desc
    }),
};


export const ListReportsParams = [...Object.values(ListReportsCriteriaDocument).map(exec => exec())];
export const GetReportsStatsParams = [...Object.values(GetReportsStatsCriteriaDocument).map(exec => exec())];
export const GetReportsHistoryParams = [...Object.values(GetReportsHistoryCriteriaDocument).map(exec => exec())];