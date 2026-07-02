import { Module } from 'packages/handler/Module';
import { ChatRequestController } from './chat-request.controller';

export const ChatRequestResolver = Module.builder()
    .addPrefix({
        prefixPath: '/chat-requests',
        tag: 'chat-requests',
        module: 'ChatRequestModule'
    })
    .register([
        {
            route: '/',
            method: 'post',
            controller: ChatRequestController.createChatRequest,
            preAuthorization: true
        },
        {
            route: '/received',
            method: 'get',
            controller: ChatRequestController.getReceivedRequests,
            preAuthorization: true
        },
        {
            route: '/sent',
            method: 'get',
            controller: ChatRequestController.getSentRequests,
            preAuthorization: true
        },
        {
            route: '/:id',
            method: 'patch',
            controller: ChatRequestController.updateRequestStatus,
            preAuthorization: true
        }
    ]);
