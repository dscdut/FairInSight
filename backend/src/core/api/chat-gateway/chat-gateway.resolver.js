import { Module } from 'packages/handler/Module';
import { ChatGatewayController } from './chat-gateway.controller';

export const ChatGatewayResolver = Module.builder()
    .addPrefix({
        prefixPath: '/chat',
        tag: 'chat-gateway',
        module: 'ChatGatewayModule',
    })
    .register([
        {
            route: '/preflight',
            method: 'post',
            controller: ChatGatewayController.preflight,
            preAuthorization: true,
        },
        {
            route: '/turns',
            method: 'post',
            controller: ChatGatewayController.runTurn,
            preAuthorization: true,
        },
    ]);
