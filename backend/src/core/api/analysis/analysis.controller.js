import { AnalysisService } from 'core/modules/analysis/services';
import { ValidHttpResponse } from 'packages/handler/response/validHttp.response';
import { parsePagination } from 'core/utils';

class Controller {
    constructor() {
        this.service = AnalysisService;
    }

    getAnalysisHistory = async req => {
        const userId = req.user.payload.id;
        const { page, size } = parsePagination(req.query);
        const data = await this.service.listAnalysisHistory({ userId, page, size });
        return ValidHttpResponse.toOkResponse(data);
    };

    getAnalysisHistoryDetail = async req => {
        const userId = req.user.payload.id;
        const analysisId = req.params.id;
        const data = await this.service.getAnalysisHistoryDetail(userId, analysisId);
        return ValidHttpResponse.toOkResponse(data);
    };
}

export const AnalysisController = new Controller();
