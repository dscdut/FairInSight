import { NotFoundException } from 'packages/httpException';
import { AnalysisRepository } from '../analysis.repository';

class Service {
    constructor() {
        this.repository = AnalysisRepository;
    }

    async getAnalysisHistoryDetail(userId, analysisId) {
        const analysis = await this.repository.findAnalysisWithMessages(userId, analysisId);
        if (!analysis) {
            throw new NotFoundException(`Analysis with ID "${analysisId}" not found`);
        }

        return {
            id: analysis.id,
            userId: analysis.user_id,
            inputData: analysis.input_data,
            result: analysis.result,
            contextSummary: analysis.context_summary,
            createdAt: analysis.created_at,
            updatedAt: analysis.updated_at,
            aiMessages: (analysis.ai_messages || []).map(msg => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                createdAt: msg.created_at,
                updatedAt: msg.updated_at,
            })),
        };
    }
}

export const AnalysisService = new Service();
