import { ChatRequestService } from 'core/modules/chat-request/services';
import { ValidHttpResponse } from 'packages/handler/response/validHttp.response';

class Controller {
    constructor() {
        this.service = ChatRequestService;
    }

    createChatRequest = async req => {
        const userId = req.user.payload.id;
        const data = await this.service.createChatRequest(userId, req.body);
        return ValidHttpResponse.toCreatedResponse(data);
    };

    getReceivedRequests = async req => {
        const lawyerId = req.user.payload.id;
        const data = await this.service.getReceivedRequests(lawyerId);
        return ValidHttpResponse.toOkResponse(data);
    };

    getSentRequests = async req => {
        const userId = req.user.payload.id;
        const data = await this.service.getSentRequests(userId);
        return ValidHttpResponse.toOkResponse(data);
    };

    updateRequestStatus = async req => {
        const lawyerId = req.user.payload.id;
        const { id } = req.params;
        const data = await this.service.updateRequestStatus(id, lawyerId, req.body);
        return ValidHttpResponse.toOkResponse(data);
    };
}

export const ChatRequestController = new Controller();
