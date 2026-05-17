import { BcryptService } from 'core/modules/auth';
import { Optional } from 'core/utils';
import { NotFoundException, DuplicateException, BadRequestException } from 'packages/httpException';
import { UserRepository } from '../user.repository';

class Service {
  constructor() {
    this.repository = UserRepository;
    this.bcryptService = BcryptService;
  }

  async createOne(createUserDto) {
    const existingUser = await this.repository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new DuplicateException('Email is being used');
    }

    if (createUserDto.password !== createUserDto.confirm_password) {
      throw new BadRequestException('Password does not match');
    }

    const passwordHash = this.bcryptService.hash(createUserDto.password);
    const userRole = await this.repository.findRoleByName('USER');

    try {
      const { confirm_password, password, ...userData } = createUserDto;
      const createdUser = await this.repository.create({
        ...userData,
        password_hash: passwordHash,
        role_id: userRole ? userRole.id : null,
      });

      return createdUser;
    } catch (error) {
      console.error('UserService.createOne error:', error);
      throw error;
    }
  }

  /**
   * Update authenticated user's profile
   * Allows email and full_name updates with validation
   */
  async upsertOne(updateUserDto, userId) {
    const user = Optional.of(await this.repository.findById(userId))
      .throwIfNotPresent(new NotFoundException())
      .get();

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      Optional.of(await this.repository.findByEmail(updateUserDto.email))
        .throwIfPresent(new DuplicateException('Email is being used'));
    }

    const payload = {};
    if (updateUserDto.email) {
      payload.email = updateUserDto.email;
    }
    if (updateUserDto.full_name) {
      payload.full_name = updateUserDto.full_name;
    }

    await this.repository.updateById(userId, payload);
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
    const role = (user.roles?.name || 'USER').toLowerCase();
    const status = user.deleted_at ? 'banned' : 'active';
    return {
      id: user.id,
      userCode: `USR-${user.id.slice(0, 8).toUpperCase()}`,
      avatar: user.avatar_url,
      fullName: user.full_name,
      email: user.email,
      role,
      status,
      actions: {
        type: status === 'banned' && role === 'lawyer' ? 'pending_lawyer' : 'default',
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
    const user = await this.repository.findById(id);
    Optional.of(user).throwIfNotPresent(new NotFoundException());

    const result = await this.repository.softDelete(id);
    if (result.count === 0) {
      throw new NotFoundException();
    }
    return true;
  }

  /**
   * Ban a user account
   * Sets deleted_at flag and tracks ban metadata
   */
  async banUser(id, byUserId, reason) {
    // Validate user exists and is not already banned
    const user = await this.repository.findByIdIncludingDeleted(id);
    Optional.of(user).throwIfNotPresent(new NotFoundException());

    if (user.deleted_at) {
      throw new BadRequestException('User is already banned');
    }

    // Validate reason length if provided
    if (reason && reason.length > 500) {
      throw new BadRequestException('reason must not exceed 500 characters');
    }

    // Ban the user
    const result = await this.repository.setDeletedState(id, true);
    if (result.count === 0) {
      throw new BadRequestException('Failed to ban user');
    }

    // Fetch updated user
    const bannedUser = await this.repository.findByIdIncludingDeleted(id);
    return {
      data: {
        id: bannedUser.id,
        fullName: bannedUser.full_name,
        email: bannedUser.email,
        role: (bannedUser.roles?.name || 'USER').toLowerCase(),
        status: 'banned',
        bannedAt: bannedUser.deleted_at.toISOString(),
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
    const user = await this.repository.findByIdIncludingDeleted(id);
    Optional.of(user).throwIfNotPresent(new NotFoundException());

    if (!user.deleted_at) {
      throw new BadRequestException('User is not banned');
    }

    // Validate reason length if provided
    if (reason && reason.length > 500) {
      throw new BadRequestException('reason must not exceed 500 characters');
    }

    // Unban the user
    const result = await this.repository.setDeletedState(id, false);
    if (result.count === 0) {
      throw new BadRequestException('Failed to unban user');
    }

    // Fetch updated user
    const unbannedUser = await this.repository.findById(id);
    return {
      data: {
        id: unbannedUser.id,
        fullName: unbannedUser.full_name,
        email: unbannedUser.email,
        role: (unbannedUser.roles?.name || 'USER').toLowerCase(),
        status: 'active',
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
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          userCode: `USR-${user.id.slice(0, 8).toUpperCase()}`,
          avatar: user.avatar_url,
          role: (user.roles?.name || 'USER').toLowerCase(),
          bannedAt: user.deleted_at.toISOString(),
          bannedBy: null,
          banReason: null,
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
    if (!['user', 'lawyer', 'admin'].includes(role)) {
      throw new BadRequestException('role must be one of: user, lawyer, admin');
    }

    // Validate lawyer-specific fields
    if (role === 'lawyer') {
      if (!payload?.licenseNumber) {
        throw new BadRequestException('licenseNumber is required when role is lawyer');
      }
      if (!payload?.licenseIssuer) {
        throw new BadRequestException('licenseIssuer is required when role is lawyer');
      }
    }

    // Find user (including deleted)
    const existing = await this.repository.findByIdIncludingDeleted(id);
    Optional.of(existing).throwIfNotPresent(new NotFoundException());

    // Find role record
    const roleRecord = await this.repository.findRoleByName(role.toUpperCase());
    Optional.of(roleRecord).throwIfNotPresent(new NotFoundException('Role not found'));

    // Update user role and lawyer details in transaction
    const updatedUser = await this.repository.updateRoleAndLawyerDetails(
      id,
      roleRecord.id,
      { ...payload, role }
    );

    return {
      data: {
        fullName: updatedUser.full_name,
        email: updatedUser.email,
        avatar: updatedUser.avatar_url,
        role,
        licenseInfo: role === 'lawyer'
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
