import { ROOT_DIR } from 'core/env';
import { BaseMulterInterceptor } from './multer.interceptor';
import { MulterUploader } from '../multer.handler';

export class UploadInterceptor extends BaseMulterInterceptor {
    constructor(fileQuantity = 10) {
        super(new MulterUploader(
            ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv'],
            'file',
            fileQuantity,
            `${ROOT_DIR}/core/uploads/documents`
        ));
    }
}
