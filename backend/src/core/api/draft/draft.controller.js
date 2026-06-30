import { DocumentService } from 'core/modules/document/service/document.service';
import { ValidHttpResponse } from 'packages/handler/response/validHttp.response';

class Controller {
    constructor() {
        this.service = DocumentService;
    }

    listDrafts = async req => {
        const userId = req.user.payload.id;
        const data = await this.service.listDrafts(userId);
        return ValidHttpResponse.toOkResponse(data);
    };
}

export const DraftController = new Controller();
