import { ReportsService } from '../../modules/reports/service/reports.service';
import { GetReportsDto } from '../../modules/reports';
import { ValidHttpResponse } from '../../../packages/handler/response/validHttp.response';

class Controller {
    constructor() {
        this.service = ReportsService;
    }

    getReports = async req => {
        const data = await this.service.getReports(req.query);
        return ValidHttpResponse.toOkResponse(data);
    }
    getReportsStats = async req => {
        const data = await this.service.getReportsStats(req.query);
        return ValidHttpResponse.toOkResponse(data);
    }
}

export const ReportsController = new Controller();
