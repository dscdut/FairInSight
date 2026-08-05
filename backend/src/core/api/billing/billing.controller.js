import { ValidHttpResponse } from 'packages/handler/response/validHttp.response';
import { BillingService } from 'core/modules/billing';

class Controller {
    listPlans = async () => ValidHttpResponse.toOkResponse(await BillingService.listPlans());

    getMe = async req => ValidHttpResponse.toOkResponse(
        await BillingService.getMyBilling(req.user.payload.id),
    );

    listLedger = async req => ValidHttpResponse.toOkResponse(
        await BillingService.listMyLedger(req.user.payload.id, {
            cursor: req.query.cursor,
            size: req.query.size,
        }),
    );

    listUsage = async req => ValidHttpResponse.toOkResponse(
        await BillingService.listMyUsage(req.user.payload.id, {
            cursor: req.query.cursor,
            size: req.query.size,
        }),
    );

    cancelSubscription = async req => ValidHttpResponse.toOkResponse(
        await BillingService.cancelSubscription(req.user.payload.id),
    );

    changeSubscription = async req => ValidHttpResponse.toOkResponse(
        await BillingService.changeSubscription(req.user.payload.id, req.body?.planCode),
    );
}

export const BillingController = new Controller();
