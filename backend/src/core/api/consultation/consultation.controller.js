import service from 'core/modules/consultation/services/consultation.service';
import { ValidHttpResponse } from 'packages/handler/response/validHttp.response';

class Controller {
    listConsultations = async req => {
        const userId = req.user.payload.id;
        const data = await service.listConsultations(userId);
        return ValidHttpResponse.toOkResponse(data);
    };

    createConsultation = async req => {
        const userId = req.user.payload.id;
        const data = await service.createConsultation(userId, req.body);
        return ValidHttpResponse.toCreatedResponse(data);
    };

    getConsultation = async req => {
        const userId = req.user.payload.id;
        const { id } = req.params;
        const data = await service.getConsultation(userId, id);
        return ValidHttpResponse.toOkResponse(data);
    };

    getConsultationByAnalysis = async req => {
        const userId = req.user.payload.id;
        const { analysisId } = req.params;
        const data = await service.getConsultationByAnalysis(userId, analysisId);
        return ValidHttpResponse.toOkResponse(data);
    };

    cancelConsultation = async req => {
        const userId = req.user.payload.id;
        const { id } = req.params;
        const data = await service.cancelConsultation(userId, id);
        return ValidHttpResponse.toOkResponse(data);
    };

    updateStage = async req => {
        const userId = req.user.payload.id;
        const { id } = req.params;
        const data = await service.updateStage(userId, id, req.body);
        return ValidHttpResponse.toOkResponse(data);
    };

    skipStage = async req => {
        const userId = req.user.payload.id;
        const { id } = req.params;
        const data = await service.skipStage(userId, id, req.body);
        return ValidHttpResponse.toOkResponse(data);
    };

    submitPdf = async req => {
        const userId = req.user.payload.id;
        const { id } = req.params;
        const data = await service.submitPdf(userId, id, req.body);
        return ValidHttpResponse.toOkResponse(data);
    };

    mockPortalCallback = async req => {
        const { id } = req.params;
        const data = await service.mockPortalCallback(id, req.body);
        return ValidHttpResponse.toOkResponse(data);
    };

    submitReview = async req => {
        const userId = req.user.payload.id;
        const { id } = req.params;
        const data = await service.submitReview(userId, id, req.body);
        return ValidHttpResponse.toOkResponse(data);
    };

    selectTemplate = async req => {
        const userId = req.user.payload.id;
        const { id } = req.params;
        const { templateId } = req.body;
        const data = await service.selectTemplate(userId, id, templateId);
        return ValidHttpResponse.toOkResponse(data);
    };

    submitTemplateData = async req => {
        const userId = req.user.payload.id;
        const { id } = req.params;
        const { templateData } = req.body;
        const data = await service.submitTemplateData(userId, id, templateData);
        return ValidHttpResponse.toOkResponse(data);
    };

    sendMessage = async req => {
        const userId = req.user.payload.id;
        const { id } = req.params;
        const data = await service.sendMessage(userId, id, req.body);
        return ValidHttpResponse.toCreatedResponse(data);
    };
}

export default new Controller();
