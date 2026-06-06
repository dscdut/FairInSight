import { BcryptService } from 'core/modules/auth';
import { Optional } from 'core/utils';
import { NotFoundException, BadRequestException } from 'packages/httpException';
import { Role, UserStatus, UserActionType } from 'core/common/enum';
import { UserRepository } from '../user.repository';
import { UserDataService } from './userData.service';

class Service {
    constructor() {
        this.repository = UserRepository;
        this.bcryptService = BcryptService;
    }

    async createOne(createUserDto) {
        const passwordHash = this.bcryptService.hash(createUserDto.password);

        const userRole = await this.repository.findRoleByName(Role.USER);
        Optional.of(userRole).throwIfNotPresent(new NotFoundException(`Default role ${Role.USER} not found`));

        const userModel = {
            email: createUserDto.email,
            full_name: createUserDto.full_name,
            password_hash: passwordHash,
            role_id: userRole.id,
        };

        return this.repository.create(userModel);
    }

    /**
   * Update authenticated user's profile
   * Allows email and full_name updates with validation
   */
    async upsertOne(updateUserDto, userId) {
        const updateModel = {
            ...(updateUserDto.email && { email: updateUserDto.email }),
            ...(updateUserDto.full_name && { full_name: updateUserDto.full_name })
        };

        if (Object.keys(updateModel).length > 0) {
            await this.repository.updateById(userId, updateModel);
        }
    }

    /**
   * Get user details by ID
   * Returns formatted user information
   */
    async findById(id) {
        const user = await this.repository.findById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }


    /**
   * Format user for list response
   * Includes code, role, status, and available actions
   */
    toUserListItem(user) {
        const role = (user.roles?.name || Role.USER).toLowerCase();
        const status = user.banned_by ? UserStatus.BANNED : UserStatus.ACTIVE;
        return {
            id: user.id,
            userCode: `USR-${user.id.slice(0, 8).toUpperCase()}`,
            avatar: user.avatar_url,
            fullName: user.full_name,
            email: user.email,
            role,
            status,
            actions: {
                type: status === UserStatus.BANNED && role === Role.LAWYER.toLowerCase() ? UserActionType.PENDING_LAWYER : UserActionType.DEFAULT,
            },
        };
    }

    /**
   * List users with pagination and optional filters
   * Service: Orchestration + transformation only
   * Repository: Data retrieval only
   */
    async listUsers({ page, size, filter }) {
        const { items, total } = await this.repository.list({ page, size, filter });

        const transformed = items.map(i => this.toUserListItem(i));

        return {
            data: {
                items: transformed,
                pagination: {
                    page,
                    size,
                    total,
                    totalPages: Math.ceil(total / size) || 0,
                },
            },
        };
    }

    /**
   * Alias for findById (OpenAPI naming)
   */
    async getUserById(id) {
        return this.findById(id);
    }

    /**
   * Soft delete user
   * Sets deleted_at timestamp to mark as deleted
   */
    async deleteUser(id) {
        await this.repository.softDelete(id);
        return true;
    }

    /**
   * Ban a user account
   * Sets deleted_at flag and tracks ban metadata
   */
    async banUser(id, byUserId, reason) {
        // Validate user exists and is not already banned
        const user = await this.repository.findById(id);
        Optional.of(user).throwIfNotPresent(new NotFoundException());

        const role = (user.roles?.name || Role.USER).toUpperCase();
        if (role !== Role.USER) {
            throw new BadRequestException('Only users with USER role can be banned');
        }

        // Ban the user
        const result = await this.repository.setBanState(id, true, byUserId, reason);
        if (result.count === 0) {
            throw new BadRequestException('Failed to ban user');
        }

        // Return updated state using already fetched user data
        return {
            data: {
                ...UserDataService.getUserInfo(user),
                status: UserStatus.BANNED,
                bannedAt: new Date().toISOString(),
                bannedBy: byUserId,
                reason: reason || null,
            },
        };
    }

    /**
   * Unban a user account
   * Clears deleted_at flag and tracks unban metadata
   */
    async unbanUser(id, byUserId, reason) {
        // Validate user exists and is currently banned
        const user = await this.repository.findById(id);
        Optional.of(user).throwIfNotPresent(new NotFoundException());

        // Unban the user
        const result = await this.repository.setBanState(id, false);
        if (result.count === 0) {
            throw new BadRequestException('Failed to unban user');
        }

        // Return updated state using already fetched user data
        return {
            data: {
                ...UserDataService.getUserInfo(user),
                status: UserStatus.ACTIVE,
                unbannedAt: new Date().toISOString(),
                unbannedBy: byUserId,
                reason: reason || null,
            },
        };
    }

    /**
   * List banned users with pagination
   * Returns banned users sorted by ban date
   */
    async listBannedUsers({ page, size }) {
        const { items, total } = await this.repository.listBanned({ page, size });

        return {
            data: {
                items: items.map(user => ({
                    ...this.toUserListItem(user),
                    bannedAt: user.deleted_at?.toISOString() || null,
                    bannedBy: user.banned_by,
                    banReason: user.ban_reason,
                })),
                pagination: {
                    page,
                    size,
                    total,
                    totalPages: Math.ceil(total / size),
                },
            },
        };
    }

    /**
   * Update user role with optional lawyer details
   * Validates role value and lawyer-specific requirements
   */
    async updateUserRole(id, payload) {
        // Validate role value
        const role = (payload?.role || '').toLowerCase();
        const allowedRoles = [Role.USER, Role.LAWYER, Role.ADMIN].map(r => r.toLowerCase());

        if (!allowedRoles.includes(role)) {
            throw new BadRequestException(`role must be one of: ${allowedRoles.join(', ')}`);
        }

        // Validate lawyer-specific fields
        if (role === Role.LAWYER.toLowerCase()) {
            if (!payload?.licenseNumber) {
                throw new BadRequestException(`licenseNumber is required when role is ${Role.LAWYER.toLowerCase()}`);
            }
            if (!payload?.licenseIssuer) {
                throw new BadRequestException(`licenseIssuer is required when role is ${Role.LAWYER.toLowerCase()}`);
            }
        }

        // Find user (including deleted)
        const existing = await this.repository.findByIdIncludingDeleted(id);
        Optional.of(existing).throwIfNotPresent(new NotFoundException());

        // Find role record
        const roleRecord = await this.repository.findRoleByName(role.toUpperCase());
        Optional.of(roleRecord).throwIfNotPresent(new NotFoundException('Role not found'));

        // Prepare lawyer data if role is lawyer
        const lawyerData = role === Role.LAWYER.toLowerCase() ? {
            license_number: payload.licenseNumber || null,
            bar_association: payload.licenseIssuer || null,
        } : null;

        // Update user role and lawyer details in transaction
        const updatedUser = await this.repository.updateRoleAndLawyerDetails(
            id,
            roleRecord.id,
            lawyerData
        );

        return {
            data: {
                fullName: updatedUser.full_name,
                email: updatedUser.email,
                avatar: updatedUser.avatar_url,
                role,
                licenseInfo: role === Role.LAWYER.toLowerCase()
                    ? {
                        licenseNumber: payload.licenseNumber,
                        licenseIssuer: payload.licenseIssuer,
                        licenseFileUrl: null,
                    }
                    : null,
            },
        };
    }

    /**
   * Get user statistics
   * Returns total count of active users
   */
    async getUserStats() {
        const totalUsers = await this.repository.countActiveUsers();
        return {
            data: {
                totalUsers,
            },
        };
    }
}

export const UserService = new Service();
