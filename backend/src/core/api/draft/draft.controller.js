import { DraftService } from 'core/modules/draft/services';
import { CreateDraftDto } from 'core/modules/draft/dto';
import { ValidHttpResponse } from 'packages/handler/response/validHttp.response';

class Controller {
    constructor() {
        this.service = DraftService;
    }

    createDraft = async req => {
        const userId = req.user.payload.id;
        const dto = CreateDraftDto(req.body);
        const data = await this.service.createDraft(userId, dto);
        return ValidHttpResponse.toOkResponse(data);
    };
}

export const DraftController = new Controller();
