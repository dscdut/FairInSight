import { InternalServerException, NotFoundException } from 'packages/httpException';
import { AnalysisRepository } from '../analysis.repository';

class Service {
    constructor() {
        this.repository = AnalysisRepository;
    }

    async listAnalysisHistory({ userId, page, size }) {
        try {
            const { items, total } = await this.repository.list({ userId, page, size });

            return {
                data: {
                    items: items.map(item => ({
                        id: item.id,
                        userId: item.user_id,
                        inputData: item.input_data,
                        result: item.result,
                        contextSummary: item.context_summary,
                        createdAt: item.created_at,
                        updatedAt: item.updated_at,
                    })),
                    pagination: {
                        page,
                        size,
                        total,
                        totalPages: Math.ceil(total / size) || 0,
                    },
                },
            };
        } catch (error) {
            throw new InternalServerException(error.message);
        }
    }

    async deleteAnalysisHistory(userId, analysisId) {
        try {
            const existing = await this.repository.findOne({
                id: analysisId,
                user_id: userId
            });

            if (!existing) {
                throw new NotFoundException(`Analysis history with ID "${analysisId}" not found`);
            }

            return await this.repository.softDelete(analysisId);
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerException(error.message);
        }
    }

    async getAnalysisHistoryDetail(userId, analysisId) {
        try {
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
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerException(error.message);
        }
    }
}

export const AnalysisService = new Service();

