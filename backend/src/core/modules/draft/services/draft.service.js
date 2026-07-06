import prisma from 'core/database';
import { NotFoundException, InternalServerException } from 'packages/httpException';
import { DraftRepository } from '../draft.repository';

class Service {
    constructor() {
        this.repository = DraftRepository;
    }

    async createDraft(userId, payload) {
        try {
            const { templateId, content } = payload;

            const template = await prisma.templates.findFirst({
                where: { id: templateId, deleted_at: null }
            });

            if (!template) {
                throw new NotFoundException(`Template with ID "${templateId}" not found`);
            }

            return await this.repository.create({
                user_id: userId,
                template_id: templateId,
                content: content || {},
                is_draft: true
            });
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerException(error.message);
        }
    }

    async deleteDraft(userId, draftId) {
        try {
            const existing = await this.repository.findOne({
                id: draftId,
                user_id: userId,
                is_draft: true
            });

            if (!existing) {
                throw new NotFoundException(`Draft with ID "${draftId}" not found`);
            }

            return await this.repository.softDelete(draftId);
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerException(error.message);
        }
    }
}

export const DraftService = new Service();

