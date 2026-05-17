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
        return prisma.users.findFirst({
            where: { email, deleted_at: null },
            include: DEFAULT_INCLUDE,
        });
    }

    /**
     * Find active user by ID
     */
    async findById(id) {
        return prisma.users.findFirst({
            where: { id, deleted_at: null },
            include: DEFAULT_INCLUDE,
        });
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
     * Insert new user
     */
    async insert(createUserDto) {
        return prisma.users.create({
            data: {
                email: createUserDto.email,
                full_name: createUserDto.full_name,
                password_hash: createUserDto.password,
                role_id: createUserDto.role_id || null,
            },
            include: DEFAULT_INCLUDE,
        });
    }

    /**
     * Update user by ID
     */
    async updateById(id, payload) {
        return prisma.users.update({
            where: { id },
            data: payload,
            include: DEFAULT_INCLUDE,
        });
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
                where.deleted_at = { not: null };
            } else if (filter.status === 'active') {
                where.deleted_at = null;
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
     * List banned users (soft-deleted) with pagination
     */
    async listBanned({ page, size }) {
        const skip = (page - 1) * size;
        const where = { NOT: { deleted_at: null } };

        const [items, total] = await Promise.all([
            prisma.users.findMany({
                where,
                include: DEFAULT_INCLUDE,
                skip,
                take: size,
                orderBy: { deleted_at: 'desc' },
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
     * Count active users
     */
    async countActiveUsers() {
        return prisma.users.count({ where: { deleted_at: null } });
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
        return prisma.users.update({
            where: { id: userId },
            data: { role_id: roleId },
            include: INCLUDE_WITH_LAWYER,
        });
    }

    /**
     * Upsert lawyer details
     */
    async upsertLawyerDetails(userId, payload) {
        return prisma.lawyer_details.upsert({
            where: { user_id: userId },
            create: {
                user_id: userId,
                license_number: payload.licenseNumber || null,
                bar_association: payload.licenseIssuer || null,
            },
            update: {
                license_number: payload.licenseNumber || undefined,
                bar_association: payload.licenseIssuer || undefined,
            },
        });
    }

    /**
     * Update role and lawyer details in transaction
     */
    async updateRoleAndLawyerDetails(userId, roleId, payload) {
        return prisma.$transaction(async tx => {
            // Update user role
            await tx.users.update({
                where: { id: userId },
                data: { role_id: roleId },
            });

            // Update lawyer details if role is lawyer
            if (payload && payload.role === 'lawyer') {
                await tx.lawyer_details.upsert({
                    where: { user_id: userId },
                    create: {
                        user_id: userId,
                        license_number: payload.licenseNumber || null,
                        bar_association: payload.licenseIssuer || null,
                    },
                    update: {
                        license_number: payload.licenseNumber || undefined,
                        bar_association: payload.licenseIssuer || undefined,
                    },
                });
            }

            // Return updated user
            return tx.users.findFirst({
                where: { id: userId },
                include: INCLUDE_WITH_LAWYER,
            });
        });
    }
}


export const UserRepository = new Repository();
