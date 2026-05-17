import connection from 'core/database';
import { DataRepository } from 'packages/restBuilder/core/dataHandler';

class Repository extends DataRepository {
    async forgotPassword(userId, token, expiresAt, trx = null) {
        return await connection.users.update({
            where: {
                id: userId,
            },
            data: {
                password_reset_token: token, // chỗ này em bỏ vào password_reset_token vì không có cái column riêng cho otp thường
                password_reset_expiry: expiresAt, // tương tự
                // cái này chắc ảnh hưởng bảo mật nhiều, nhưng mà em không rõ có cách nào khác. (@c quynh)
            },
        });
    };
}

export const ForgotPasswordRepository = new Repository('users');