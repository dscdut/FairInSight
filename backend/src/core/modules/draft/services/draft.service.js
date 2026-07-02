import prisma from 'core/database';
import { NotFoundException, InternalServerException } from 'packages/httpException';

class Service {
    async createDraft(userId, payload) {
        try {
            const { templateId, content } = payload;

            const template = await prisma.templates.findFirst({
                where: { id: templateId, deleted_at: null }
            });

            if (!template) {
                throw new NotFoundException(`Template with ID "${templateId}" not found`);
            }

            return await prisma.documents.create({
                data: {
                    user_id: userId,
                    template_id: templateId,
                    content: content || {},
                    is_draft: true
                }
            });
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerException(error.message);
        }
    }

    async updateDraft(userId, draftId, payload) {
        try {
            const { content } = payload;

            const existing = await prisma.documents.findFirst({
                where: {
                    id: draftId,
                    user_id: userId,
                    is_draft: true,
                    deleted_at: null
                }
            });

            if (!existing) {
                throw new NotFoundException(`Draft with ID "${draftId}" not found`);
            }

            return await prisma.documents.update({
                where: { id: draftId },
                data: {
                    content: content || {},
                    updated_at: new Date()
                }
            });
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerException(error.message);
        }
    }
}


export const DraftService = new Service();
