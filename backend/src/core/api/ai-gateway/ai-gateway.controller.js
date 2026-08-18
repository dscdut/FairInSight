import { AiGatewayService, ProxyHttpResponse } from 'core/modules/ai-gateway';

const proxyPath = req => {
    if (req.params?.[0]) return req.params[0];

    const originalPath = (req.originalUrl || '').split('?')[0];
    const baseUrl = req.baseUrl || '';
    if (baseUrl && originalPath.startsWith(baseUrl)) {
        return originalPath.slice(baseUrl.length).replace(/^\/+/, '');
    }
    return (req.path || '').replace(/^\/+/, '');
};

class Controller {
    proxy = async req => {
        const result = await AiGatewayService.proxyJson(req, proxyPath(req));
        return new ProxyHttpResponse(result.status, result.data, result.headers);
    };

    proxyMultipart = async req => {
        const result = await AiGatewayService.proxyMultipart(req, proxyPath(req));
        return new ProxyHttpResponse(result.status, result.data, result.headers);
    };
}

export const AiGatewayController = new Controller();
