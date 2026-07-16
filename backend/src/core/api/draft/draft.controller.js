import { DocumentService } from 'core/modules/document/service/document.service';
import { DraftService } from 'core/modules/draft/services';
import { CreateDraftDto, UpdateDraftDto } from 'core/modules/draft/dto';
import { ValidHttpResponse } from 'packages/handler/response/validHttp.response';

class Controller {
    constructor() {
        this.documentService = DocumentService;
        this.draftService = DraftService;
    }

    listDrafts = async req => {
        const userId = req.user.payload.id;
        const data = await this.documentService.listDrafts(userId);
        return ValidHttpResponse.toOkResponse(data);
    };

    createDraft = async req => {
        const userId = req.user.payload.id;
        const dto = CreateDraftDto(req.body);
        const data = await this.draftService.createDraft(userId, dto);
        return ValidHttpResponse.toOkResponse(data);
    };

    updateDraft = async req => {
        const userId = req.user.payload.id;
        const draftId = req.params.id;
        const dto = UpdateDraftDto(req.body);
        const data = await this.service.updateDraft(userId, draftId, dto);
        return ValidHttpResponse.toOkResponse(data);
    };

    deleteDraft = async req => {
        const userId = req.user.payload.id;
        const draftId = req.params.id;
        const data = await this.draftService.deleteDraft(userId, draftId);
        return ValidHttpResponse.toOkResponse(data);
    };
}

export const DraftController = new Controller();
