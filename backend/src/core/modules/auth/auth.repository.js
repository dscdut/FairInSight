import connection from 'core/database';

const PROFILE_SELECT = {
    id: true,
    avatar_url: true,
    full_name: true,
    email: true,
    phone: true,
    date_of_birth: true,
    location: true,
    subscriptions: {
        select: { plan_name: true },
    },
    created_at: true,
};

const ROLE_SELECT = {
    roles: {
        select: { name: true },
    },
};

class Repository {
    async findActiveUserByEmail(email) {
        return connection.users.findFirst({
            where: { email, deleted_at: null },
            include: { roles: true },
        });
    }

    async findRoleByName(name) {
        return connection.roles.findFirst({
            where: { name },
            select: { id: true, name: true },
        });
    }

    async createUser(data) {
        return connection.users.create({
            data,
            select: { id: true },
        });
    }

    async getUserRoles(userId) {
        return connection.users.findFirst({
            where: { id: userId },
            select: ROLE_SELECT,
        });
    }

    async getProfile(userId) {
        return connection.users.findFirst({
            where: { id: userId },
            select: PROFILE_SELECT,
        });
    }

    async updateProfile(userId, data) {
        return connection.users.update({
            where: { id: userId },
            data,
            select: PROFILE_SELECT,
        });
    }

    async getPasswordResetData(userId) {
        return connection.users.findFirst({
            where: { id: userId },
            select: { password_reset_token: true, password_reset_expiry: true },
        });
    }

    async updatePasswordResetToken(userId, token, expiresAt) {
        return connection.users.update({
            where: { id: userId },
            data: {
                password_reset_token: token,
                password_reset_expiry: expiresAt,
            },
        });
    }

    async findUserByResetToken(token) {
        return connection.users.findFirst({
            where: { password_reset_token: token },
            select: { id: true },
        });
    }

    async updatePasswordHash(userId, passwordHash) {
        return connection.users.update({
            where: { id: userId },
            data: { password_hash: passwordHash },
            select: { id: true },
        });
    }

    async findRefreshToken(token) {
        return connection.refresh_tokens.findFirst({
            where: { token },
            select: { user_id: true, expires_at: true },
        });
    }

    async deleteRefreshToken(token) {
        return connection.refresh_tokens.update({
            where: { token },
            data: { deleted_at: Date.now() },
            select: { user_id: true, deleted_at: true }
        });
    }

    async upsertRefreshToken(userId, token, expiresAt) {
        return connection.refresh_tokens.upsert({
            where: { user_id: userId },
            update: { token, expires_at: expiresAt },
            create: { user_id: userId, token, expires_at: expiresAt },
            select: { user_id: true, token: true },
        });
    }

    async deleteRefreshToken(token) {
        
    }
}

export const AuthRepository = new Repository();
