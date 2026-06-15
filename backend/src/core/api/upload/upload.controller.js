import { MediaService } from 'core/modules/document';
import { ValidHttpResponse } from 'packages/handler/response/validHttp.response';

class Controller {
    constructor() {
        this.service = MediaService;
    }

    upload = async req => {
        const files = req.files || (req.file ? [req.file] : []);
        const data = await this.service.uploadMany(files);
        return ValidHttpResponse.toOkResponse(data);
    };

    getOne = async req => {
        const { id } = req.params;
        const data = await this.service.getOne(id);
        return ValidHttpResponse.toOkResponse(data);
    };

    deleteFile = async req => {
        const { id } = req.params;
        const data = await this.service.deleteOne(id);
        return ValidHttpResponse.toOkResponse(data);
    };
}

export const UploadController = new Controller();

