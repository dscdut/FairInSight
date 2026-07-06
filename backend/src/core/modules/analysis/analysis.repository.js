import prisma from 'core/database';
import { BaseRepository } from '../../common/base.repository';

class Repository extends BaseRepository {
    constructor() {
        super('analysis');
    }

    async list({ userId, page, size }) {
        const skip = (page - 1) * size;
        const where = { user_id: userId, deleted_at: null };
        const [items, total] = await Promise.all([
            prisma.analysis.findMany({
                where,
                skip,
                take: size,
                orderBy: { created_at: 'desc' },
            }),
            prisma.analysis.count({ where }),
        ]);
        return { items, total };
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
