import prisma from 'core/database';
import { BaseRepository } from '../../common/base.repository';

const DEFAULT_INCLUDE = { roles: true };
const INCLUDE_WITH_LAWYER = { roles: true, lawyer_details: true };

class Repository extends BaseRepository {
    constructor() {
        super('users');
    }

    /**
     * Find active user by email
     */
    async findByEmail(email) {
        return super.findOne({ email }, DEFAULT_INCLUDE);
    }

    /**
     * Find active user by ID
     */
    async findById(id) {
        return super.findById(id, DEFAULT_INCLUDE);
    }

    /**
     * Find user including soft-deleted (banned)
     */
    async findByIdIncludingDeleted(id) {
        return prisma.users.findFirst({
            where: { id },
            include: INCLUDE_WITH_LAWYER,
        });
    }



    /**
     * Update user by ID
     */
    async updateById(id, payload) {
        return super.update(id, payload, DEFAULT_INCLUDE);
    }

    /**
     * List active users with pagination and filters
     */
    async list({ page, size, filter }) {
        const skip = (page - 1) * size;
        const where = { deleted_at: null };

        if (filter.role) {
            where.roles = { name: String(filter.role).toUpperCase() };
        }

        if (filter.email) {
            where.email = { contains: filter.email, mode: 'insensitive' };
        }

        if (filter.status) {
            if (filter.status === 'banned') {
                where.banned_by = { not: null };
            } else if (filter.status === 'active') {
                where.banned_by = null;
            }
        }

        const [items, total] = await Promise.all([
            prisma.users.findMany({
                where,
                include: DEFAULT_INCLUDE,
                skip,
                take: size,
                orderBy: { created_at: 'desc' },
            }),
            prisma.users.count({ where }),
        ]);

        return { items, total };
    }

    /**
     * List banned users with pagination
     */
    async listBanned({ page, size }) {
        const skip = (page - 1) * size;
        const where = { deleted_at: null, NOT: { banned_by: null } };

        const [items, total] = await Promise.all([
            prisma.users.findMany({
                where,
                include: DEFAULT_INCLUDE,
                skip,
                take: size,
                orderBy: { updated_at: 'desc' },
            }),
            prisma.users.count({ where }),
        ]);

        return { items, total };
    }

    /**
     * Soft delete user (mark as deleted)
     */
    async softDelete(id) {
        return prisma.users.updateMany({
            where: { id, deleted_at: null },
            data: { deleted_at: new Date() },
        });
    }

    /**
     * Set user deleted state (ban/unban)
     */
    async setDeletedState(id, isDeleted) {
        return prisma.users.updateMany({
            where: isDeleted
                ? { id, deleted_at: null }
                : { id, NOT: { deleted_at: null } },
            data: { deleted_at: isDeleted ? new Date() : null },
        });
    }

    /**
     * Set user ban state
     */
    async setBanState(id, isBanned, bannedBy = null, banReason = null) {
        return prisma.users.updateMany({
            where: { id, deleted_at: null },
            data: {
                banned_by: isBanned ? bannedBy : null,
                ban_reason: isBanned ? banReason : null,
            },
        });
    }

    /**
     * Count active users
     */
    async countActiveUsers() {
        return super.count();
    }

    /**
     * Find role by name
     */
    async findRoleByName(name) {
        return prisma.roles.findFirst({ where: { name } });
    }

    /**
     * Update user role
     */
    async updateRole(userId, roleId) {
        return super.update(userId, { role_id: roleId }, INCLUDE_WITH_LAWYER);
    }

    /**
     * Upsert lawyer details
     */
    async upsertLawyerDetails(userId, lawyerData) {
        return prisma.lawyer_details.upsert({
            where: { user_id: userId },
            create: {
                user_id: userId,
                ...lawyerData,
            },
            update: {
                license_number: lawyerData.license_number || undefined,
                bar_association: lawyerData.bar_association || undefined,
            },
        });
    }

    /**
     * Update role and lawyer details in transaction
     */
    async updateRoleAndLawyerDetails(userId, roleId, lawyerData) {
        return prisma.$transaction(async tx => {
            // Update user role using super
            await super.update(userId, { role_id: roleId }, null, tx);

            // Update lawyer details if lawyerData is provided
            if (lawyerData) {
                await tx.lawyer_details.upsert({
                    where: { user_id: userId },
                    create: {
                        user_id: userId,
                        ...lawyerData,
                    },
                    update: {
                        license_number: lawyerData.license_number || undefined,
                        bar_association: lawyerData.bar_association || undefined,
                    },
                });
            }

            // Return updated user
            return super.findById(userId, INCLUDE_WITH_LAWYER, tx);
        });
    }
}


export const UserRepository = new Repository();
