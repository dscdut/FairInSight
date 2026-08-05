import { ChatGatewayService } from 'core/modules/chat-gateway';
import { ValidHttpResponse } from 'packages/handler/response/validHttp.response';

class Controller {
    preflight = async req => ValidHttpResponse.toOkResponse({
        data: await ChatGatewayService.preflight({
            userId: req.user.payload.id,
            idempotencyKey: req.headers['idempotency-key'],
            sessionId: req.body?.sessionId ?? null,
            message: req.body?.message,
            attachments: req.body?.attachments ?? [],
            requestedMode: req.body?.requestedMode ?? 'auto',
        }),
    });

    runTurn = async req => ValidHttpResponse.toOkResponse(
        await ChatGatewayService.runTurn({
            userId: req.user.payload.id,
            authorization: req.headers.authorization,
            idempotencyKey: req.headers['idempotency-key'],
            preflightId: req.body?.preflightId,
            message: req.body?.message,
            sessionId: req.body?.sessionId ?? null,
            sessionToken: req.body?.sessionToken ?? null,
            confirmedMaxCredits: req.body?.confirmedMaxCredits ?? null,
        }),
    );
}

export const ChatGatewayController = new Controller();
