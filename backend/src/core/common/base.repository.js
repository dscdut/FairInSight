import { DuplicateException, NotFoundException } from 'packages/httpException';
import prisma from '../database';

export class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    handlePrismaError(error) {
        if (error.code === 'P2002') {
            const targets = error.meta?.target || 'Field';
            throw new DuplicateException(`${targets} is already in use`);
        }
        if (error.code === 'P2025') {
            throw new NotFoundException('Record not found');
        }
        throw error;
    }

    async findById(id, include = null, tx = null) {
        const client = tx || prisma;
        return client[this.model].findFirst({
            where: {
                id,
                deleted_at: null,
            },
            include,
        });
    }

    async findOne(where, include = null, tx = null) {
        const client = tx || prisma;
        return client[this.model].findFirst({
            where: {
                ...where,
                deleted_at: null,
            },
            include,
        });
    }

    async findMany(where = {}, include = null, orderBy = { created_at: 'desc' }, tx = null) {
        const client = tx || prisma;
        return client[this.model].findMany({
            where: {
                ...where,
                deleted_at: null,
            },
            include,
            orderBy,
        });
    }

    async create(data, include, tx = null) {
        const client = tx || prisma;
        try {
            return await client[this.model].create({
                data,
                ...(include && { include }),
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async update(id, data, include) {
        try {
            return await prisma[this.model].update({
                where: { id },
                data,
                ...(include && { include }),
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async softDelete(id) {
        try {
            return await prisma[this.model].update({
                where: { id },
                data: { deleted_at: new Date() },
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async hardDelete(id) {
        try {
            return await prisma[this.model].delete({
                where: { id },
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async count(where = {}) {
        return prisma[this.model].count({
            where: {
                ...where,
                deleted_at: null,
            },
        });
    }
}
