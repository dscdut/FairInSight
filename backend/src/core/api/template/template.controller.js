import { TemplateService } from 'core/modules/template/services/template.service';
import { ValidHttpResponse } from 'packages/handler/response/validHttp.response';

class Controller {
    constructor() {
        this.service = TemplateService;
    }

    listTemplates = async () => {
        const data = await this.service.listTemplates();
        return ValidHttpResponse.toOkResponse(data);
    };

    getTemplateById = async req => {
        const data = await this.service.getTemplateById(req.params.id);
        return ValidHttpResponse.toOkResponse(data);
    };
}

export const TemplateController = new Controller();
