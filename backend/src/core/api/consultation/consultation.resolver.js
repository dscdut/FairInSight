import { Module } from 'packages/handler/Module';
import Controller from './consultation.controller';

export const ConsultationResolver = Module.builder()
    .addPrefix({
        prefixPath: '/consultations',
        tag: 'consultations',
        module: 'ConsultationModule'
    })
    .register([
        {
            route: '/',
            method: 'get',
            controller: Controller.listConsultations,
            preAuthorization: true
        },
        {
            route: '/',
            method: 'post',
            controller: Controller.createConsultation,
            preAuthorization: true
        },
        {
            route: '/:id',
            method: 'get',
            controller: Controller.getConsultation,
            preAuthorization: true
        },
        {
            route: '/analysis/:analysisId',
            method: 'get',
            controller: Controller.getConsultationByAnalysis,
            preAuthorization: true
        },
        {
            route: '/:id/cancel',
            method: 'patch',
            controller: Controller.cancelConsultation,
            preAuthorization: true
        },
        {
            route: '/:id/stage',
            method: 'patch',
            controller: Controller.updateStage,
            preAuthorization: true
        },
        {
            route: '/:id/skip',
            method: 'patch',
            controller: Controller.skipStage,
            preAuthorization: true
        },
        {
            route: '/:id/pdf',
            method: 'post',
            controller: Controller.submitPdf,
            preAuthorization: true
        },
        {
            route: '/:id/mock-portal-callback',
            method: 'post',
            controller: Controller.mockPortalCallback,
            preAuthorization: false
        },
        {
            route: '/:id/review',
            method: 'post',
            controller: Controller.submitReview,
            preAuthorization: true
        },
        {
            route: '/:id/select-template',
            method: 'put',
            controller: Controller.selectTemplate,
            preAuthorization: true
        },
        {
            route: '/:id/submit-template-data',
            method: 'put',
            controller: Controller.submitTemplateData,
            preAuthorization: true
        },
        {
            route: '/:id/messages',
            method: 'post',
            controller: Controller.sendMessage,
            preAuthorization: true
        }
    ]);
