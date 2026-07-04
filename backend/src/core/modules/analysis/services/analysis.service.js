import { InternalServerException, NotFoundException } from 'packages/httpException';
import { AnalysisRepository } from '../analysis.repository';

class Service {
    constructor() {
        this.repository = AnalysisRepository;
    }

    async listAnalysisHistory(userId) {
        try {
            return await this.repository.findMany({
                user_id: userId
            });
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
}

export const AnalysisService = new Service();


