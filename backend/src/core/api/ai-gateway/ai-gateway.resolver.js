import { Module } from 'packages/handler/Module';
import { AiMultipartInterceptor } from 'core/modules/ai-gateway';
import { AiGatewayController } from './ai-gateway.controller';

const CONTRACT_MULTIPART_ROUTES = [
    '/contracts/extract-docx',
    '/contracts/analyze-docx',
    '/contracts/analyze-docx-llm',
];

export const AiGatewayResolver = Module.builder()
    .addPrefix({
        prefixPath: '/ai',
        tag: 'ai-gateway',
        module: 'AiGatewayModule',
    })
    .register([
        {
            route: '/documents/preview',
            method: 'post',
            controller: AiGatewayController.proxyMultipart,
            interceptors: [AiMultipartInterceptor],
            preAuthorization: true,
        },
        ...CONTRACT_MULTIPART_ROUTES.map(route => ({
            route,
            method: 'post',
            controller: AiGatewayController.proxyMultipart,
            interceptors: [AiMultipartInterceptor],
            preAuthorization: true,
        })),
        {
            route: '/*',
            method: 'get',
            controller: AiGatewayController.proxy,
            preAuthorization: true,
        },
        {
            route: '/*',
            method: 'post',
            controller: AiGatewayController.proxy,
            preAuthorization: true,
        },
        {
            route: '/*',
            method: 'patch',
            controller: AiGatewayController.proxy,
            preAuthorization: true,
        },
        {
            route: '/*',
            method: 'put',
            controller: AiGatewayController.proxy,
            preAuthorization: true,
        },
        {
            route: '/*',
            method: 'delete',
            controller: AiGatewayController.proxy,
            preAuthorization: true,
        },
    ]);
