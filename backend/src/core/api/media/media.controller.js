import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_NAME, CLOUDINARY_TYPE } from 'core/env';
import { DeleteFileDto, MediaService } from 'core/modules/document';
import { ValidHttpResponse } from 'packages/handler/response/validHttp.response';

class Controller {
    constructor() {
        this.service = MediaService;
    }

    getCloudinarySignature = async req => {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const folder = req.query.folder || 'laws';
        const type = req.query.type || CLOUDINARY_TYPE || 'upload';

        const paramsToSign = {
            timestamp,
            folder,
            type,
        };

        const signature = cloudinary.utils.api_sign_request(paramsToSign, CLOUDINARY_API_SECRET);

        return ValidHttpResponse.toOkResponse({
            signature,
            timestamp,
            cloudName: CLOUDINARY_NAME,
            apiKey: CLOUDINARY_API_KEY,
            folder,
            type,
        });
    };

    uploadMany = async req => {
        const data = await this.service.uploadMany(req.files);
        return ValidHttpResponse.toOkResponse(data);
    };

    deleteMany = async req => {
        const data = await this.service.deleteMany(DeleteFileDto(req.body).ids);
        return ValidHttpResponse.toOkResponse(data);
    };
}

export const MediaController = new Controller();
