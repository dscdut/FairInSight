import { DataRepository } from 'packages/restBuilder/core/dataHandler/data.repository';
import connection from 'core/database';

class Repository extends DataRepository {
    async createToken(userId, token, expiresAt, trx = null) {
        return await connection.refresh_tokens.upsert({
            where: {
                user_id: userId,
            },
            update: {
                token,
                expires_at: expiresAt,
            },
            create: {
                user_id: userId,
                token,
                expires_at: expiresAt,
            },
            select: { user_id: true, token: true },
        });
    }
}

export const CreateRefreshTokenRepository = new Repository('refresh_tokens');