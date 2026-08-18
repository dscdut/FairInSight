import multer from 'multer';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
});

export class AiMultipartInterceptor {
    static intercept(req, res, next) {
        return upload.single('file')(req, res, next);
    }
}
