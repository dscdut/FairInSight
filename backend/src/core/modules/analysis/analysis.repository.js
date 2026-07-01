import prisma from 'core/database';
import { BaseRepository } from '../../common/base.repository';

class Repository extends BaseRepository {
    constructor() {
        super('analysis');
    }

    async findAnalysisWithMessages(userId, analysisId) {
        return prisma.analysis.findFirst({
            where: {
                id: analysisId,
                user_id: userId,
                deleted_at: null,
            },
            include: {
                ai_messages: {
                    where: { deleted_at: null },
                    orderBy: { created_at: 'asc' },
                },
            },
        });
    }
}

export const AnalysisRepository = new Repository();
