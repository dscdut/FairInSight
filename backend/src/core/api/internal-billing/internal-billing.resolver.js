import { Module } from 'packages/handler/Module';
import { ServiceAuthInterceptor } from 'core/modules/service-auth';
import { InternalBillingController } from './internal-billing.controller';

export const InternalBillingResolver = Module.builder()
    .addPrefix({
        prefixPath: '/internal/billing',
        tag: 'internal-billing',
        module: 'InternalBillingModule',
    })
    .register([
        {
            route: '/usage/settle',
            method: 'post',
            interceptors: [ServiceAuthInterceptor],
            controller: InternalBillingController.settleUsage,
            preAuthorization: false,
        },
    ]);
