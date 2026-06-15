import { DocumentService } from 'core/modules/document/service/document.service';
import { ValidHttpResponse } from 'packages/handler/response/validHttp.response';

class Controller {
    constructor() {
        this.service = DocumentService;
    }

    createOrUpdateDocument = async req => {
        const userId = req.user.payload.id;
        const data = await this.service.createOrUpdateDocument(userId, req.body);
        return ValidHttpResponse.toOkResponse(data);
    };

    listDocuments = async req => {
        const userId = req.user.payload.id;
        const data = await this.service.listDocuments(userId);
        return ValidHttpResponse.toOkResponse(data);
    };

    getDocumentById = async req => {
        const userId = req.user.payload.id;
        const data = await this.service.getDocumentById(userId, req.params.id);
        return ValidHttpResponse.toOkResponse(data);
    };

    deleteDocument = async req => {
        const userId = req.user.payload.id;
        const data = await this.service.deleteDocument(userId, req.params.id);
        return ValidHttpResponse.toOkResponse(data);
    };
}

export const DocumentController = new Controller();
