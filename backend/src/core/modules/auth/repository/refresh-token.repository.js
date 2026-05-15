import { DataRepository } from 'packages/restBuilder/core/dataHandler/data.repository';
import connection from 'core/database';

class Repository extends DataRepository {
    async createToken(userId, token, expiresAt, trx = null) {
        const result = await connection.$transaction(async (trx) => {
            const insertedUser = await trx.refresh_tokens.create({
                data: {
                    user_id: userId,
                    token,
                    expires_at: expiresAt,
                },
                select: { user_id: true, token: true }
            });
            return insertedUser;
        });
        return result;
    }
}

export const RefreshTokenRepository = new Repository('refresh_tokens');