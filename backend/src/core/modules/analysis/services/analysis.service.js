import { InternalServerException } from 'packages/httpException';
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
}

export const AnalysisService = new Service();

