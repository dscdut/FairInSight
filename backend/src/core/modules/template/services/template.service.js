import prisma from 'core/database';
import { NotFoundException, InternalServerException } from 'packages/httpException';
import { DynamicSchemaGenerator } from '../utils/schema.generator';

class Service {
    async listTemplates() {
        try {
            return await prisma.templates.findMany({
                where: { deleted_at: null },
                orderBy: { created_at: 'desc' }
            });
        } catch (error) {
            throw new InternalServerException(error.message);
        }
    }

    async getTemplateById(id) {
        try {
            const template = await prisma.templates.findFirst({
                where: { id, deleted_at: null }
            });
            if (!template) {
                throw new NotFoundException(`Template with ID "${id}" not found`);
            }
            return template;
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerException(error.message);
        }
    }

    async getTemplateSchema(id) {
        try {
            const template = await this.getTemplateById(id);
            return DynamicSchemaGenerator.generateJsonSchema(template.name, template.fields);
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerException(error.message);
        }
    }
}

export const TemplateService = new Service();

