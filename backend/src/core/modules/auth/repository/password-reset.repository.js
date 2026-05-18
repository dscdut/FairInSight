// import { UserRepository } from 'core/modules/user/user.repository';
import connection from 'core/database';
import { DataRepository } from 'packages/restBuilder/core/dataHandler';

class Repository extends DataRepository {
    async passwordResetCreateToken(userId, token, expiresAt, trx = null) {
        return await connection.users.update({
            where: {
                id: userId,
            },
            data: {
                password_reset_token: token,
                password_reset_expiry: expiresAt,
            },
        });
    };
}

export const PasswordResetRepository = new Repository('users');