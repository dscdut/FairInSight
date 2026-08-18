import { HttpResponse } from 'packages/handler/response/http.response';

const HOP_BY_HOP_HEADERS = new Set([
    'connection',
    'content-length',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
]);

export class ProxyHttpResponse extends HttpResponse {
    headers;

    constructor(status, data, headers = {}) {
        super(status, data);
        this.headers = headers;
    }

    toResponse(res) {
        Object.entries(this.headers || {}).forEach(([key, value]) => {
            if (!value || HOP_BY_HOP_HEADERS.has(key.toLowerCase())) return;
            res.setHeader(key, value);
        });
        return res.status(this.status).send(this.data);
    }
}
