import { Module } from 'packages/handler/Module';
import { BillingController } from './billing.controller';

export const BillingResolver = Module.builder()
    .addPrefix({
        prefixPath: '/billing',
        tag: 'billing',
        module: 'BillingModule',
    })
    .register([
        {
            route: '/plans',
            method: 'get',
            controller: BillingController.listPlans,
            preAuthorization: false,
        },
        {
            route: '/me',
            method: 'get',
            controller: BillingController.getMe,
            preAuthorization: true,
        },
        {
            route: '/ledger',
            method: 'get',
            controller: BillingController.listLedger,
            preAuthorization: true,
        },
        {
            route: '/usage',
            method: 'get',
            controller: BillingController.listUsage,
            preAuthorization: true,
        },
        {
            route: '/subscriptions/change',
            method: 'post',
            controller: BillingController.changeSubscription,
            preAuthorization: true,
        },
        {
            route: '/subscriptions/cancel',
            method: 'post',
            controller: BillingController.cancelSubscription,
            preAuthorization: true,
        },
    ]);
