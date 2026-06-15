import { LawService } from 'core/modules/law/services/law.service';
import { ValidHttpResponse } from 'packages/handler/response/validHttp.response';

class Controller {
    constructor() {
        this.service = LawService;
    }

    listLaws = async req => {
        const page = parseInt(req.query.page, 10) || 1;
        const size = parseInt(req.query.size, 10) || 10;
        const filter = {
            search: req.query.search,
            status: req.query.status,
            issuedDate: req.query.issuedDate,
        };

        const data = await this.service.listLaws({ page, size, filter });
        return ValidHttpResponse.toOkResponse(data);
    };

    findById = async req => {
        const { id } = req.params;
        const data = await this.service.getLawById(id);
        return ValidHttpResponse.toOkResponse(data);
    };

    createLaw = async req => {
        const userId = req.user.payload.id;
        const data = await this.service.createLaw(req.body, userId);
        return ValidHttpResponse.toOkResponse(data);
    };

    updateLaw = async req => {
        const { id } = req.params;
        const userId = req.user.payload.id;
        const data = await this.service.updateLaw(id, req.body, userId);
        return ValidHttpResponse.toOkResponse(data);
    };

    toggleStatus = async req => {
        const { id } = req.params;
        const userId = req.user.payload.id;
        const data = await this.service.toggleStatus(id, req.body, userId);
        return ValidHttpResponse.toOkResponse(data);
    };

    listVersions = async req => {
        const { id } = req.params;
        const data = await this.service.listVersions(id);
        return ValidHttpResponse.toOkResponse(data);
    };

    restoreVersion = async req => {
        const { id, versionId } = req.params;
        const userId = req.user.payload.id;
        const data = await this.service.restoreVersion(id, versionId, userId);
        return ValidHttpResponse.toOkResponse(data);
    };

    parseDocx = async req => {
        const { fileUrl } = req.body;
        const data = await this.service.parseDocxFromUrl(fileUrl);
        return ValidHttpResponse.toOkResponse(data);
    };
}

export const LawController = new Controller();
