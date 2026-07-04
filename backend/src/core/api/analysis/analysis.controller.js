import { AnalysisService } from 'core/modules/analysis/services';
import { ValidHttpResponse } from 'packages/handler/response/validHttp.response';

class Controller {
    constructor() {
        this.service = AnalysisService;
    }

    getAnalysisHistory = async req => {
        const userId = req.user.payload.id;
        const data = await this.service.listAnalysisHistory(userId);
        return ValidHttpResponse.toOkResponse(data);
    };

    deleteAnalysisHistory = async req => {
        const userId = req.user.payload.id;
        const analysisId = req.params.id;
        const data = await this.service.deleteAnalysisHistory(userId, analysisId);
        return ValidHttpResponse.toOkResponse(data);
    };
}

export const AnalysisController = new Controller();

