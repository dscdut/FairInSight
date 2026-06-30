import { ReportsService } from '../../modules/reports/service/reports.service';
import { ListReportsDto } from '../../modules/reports';
import { ValidHttpResponse } from '../../../packages/handler/response/validHttp.response';

class Controller {
    constructor() {
        this.service = ReportsService;
    }

    listReports = async req => {
        const data = await this.service.listReports(req.query);
        return ValidHttpResponse.toOkResponse(data);
    }
    getReportsStats = async req => {
        const data = await this.service.getReportsStats(req.query);
        return ValidHttpResponse.toOkResponse(data);
    }
    getReportsHistory = async req => {
        const data = await this.service.getReportsHistory(req.query);
        return ValidHttpResponse.toOkResponse(data);
    }
}

export const ReportsController = new Controller();
