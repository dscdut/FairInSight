import { ReportsService, CreateReportDto, CreateReportMessageDto, UpdateReportStatusDto } from 'core/modules/reports';
import { parsePagination } from 'core/utils';
import { ValidHttpResponse } from 'packages/handler/response/validHttp.response';

class Controller {
    constructor() {
        this.service = ReportsService;
    }

    createReport = async req => {
        const data = await this.service.createReport({
            user: req.user.payload,
            dto: CreateReportDto(req.body),
        });
        return ValidHttpResponse.toOkResponse(data);
    };

    listReports = async req => {
        const { page, size } = parsePagination(req.query);
        const data = await this.service.listReports({
            user: req.user.payload,
            page,
            size,
            filters: {
                status: req.query?.status,
                type: req.query?.type,
                category: req.query?.category,
                priority: req.query?.priority,
                startDate: req.query?.startDate,
                endDate: req.query?.endDate,
                search: req.query?.search,
            },
        });
        return ValidHttpResponse.toOkResponse(data);
    };

    getReportsStats = async req => {
        const data = await this.service.getReportsStats({
            month: req.query?.month,
        });
        return ValidHttpResponse.toOkResponse(data);
    };

    getReportById = async req => {
        const data = await this.service.getReportById({
            user: req.user.payload,
            id: req.params.id,
        });
        return ValidHttpResponse.toOkResponse(data);
    };

    createReportMessage = async req => {
        const data = await this.service.createReportMessage({
            user: req.user.payload,
            reportId: req.params.id,
            dto: CreateReportMessageDto(req.body),
        });
        return ValidHttpResponse.toOkResponse(data);
    };

    updateReportStatus = async req => {
        const data = await this.service.updateReportStatus({
            user: req.user.payload,
            reportId: req.params.id,
            dto: UpdateReportStatusDto(req.body),
        });
        return ValidHttpResponse.toOkResponse(data);
    };
}

export const ReportsController = new Controller();
