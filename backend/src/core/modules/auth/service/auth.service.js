import crypto from 'crypto';
import connection from 'core/database';
import { pick, update } from 'lodash';
import { JwtPayload } from 'core/modules/auth/dto/jwt-sign.dto';
import { UserDataService } from 'core/modules/user/services/userData.service';
import { joinUserRoles } from 'core/utils/userFilter';
import { BcryptService } from './bcrypt.service';
import { JwtService } from './jwt.service';
import { UserRepository } from '../../user/user.repository';
import { UnAuthorizedException, DuplicateException, BadRequestException } from '../../../../packages/httpException';
import { authMiddleware, rbac } from '../middleware'
import { MediaService } from 'core/modules/document';

const REFRESH_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 1 day
const FORGOT_PASSWORD_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minute
const PASSWORD_RESET_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minute

class Service {
    constructor() {
        this.userRepository = UserRepository;
        this.jwtService = JwtService;
        this.bcryptService = BcryptService;
        this.createRefreshTokenRepository = CreateRefreshTokenRepository;
        this.passwordResetRepository = PasswordResetRepository;
        this.forgotPasswordRepository = ForgotPasswordRepository;
    }

    async register(registerDto) {
        const existingEmail = await this.userRepository.findByEmail(registerDto.email);
        if (existingEmail) {
            throw new DuplicateException("Email already in use");
        }

        registerDto.password = await this.bcryptService.hash(registerDto.password);

        let existingRole = await connection.roles.findFirst({
            where: {name: registerDto.role},
            select: {id: true},
        });
        let role_id = existingRole.id;

        const result = await connection.users.create({
            data: {
                role_id: role_id,
                email: registerDto.email,
                password_hash: registerDto.password,
                referral_code: registerDto.referralCode,
                full_name: registerDto.fullName,
            },
            select: { id: true },
        });

        const { token: refreshToken } = await this.#createRefreshToken(result.id);
        const accessToken = this.jwtService.sign(JwtPayload({ id: result.id, role: [registerDto.role] }));
        
        return {
            data: {
                id: result.id,
                full_name: registerDto.fullName,
                email: registerDto.email,
                role_id: role_id,
                access_token: accessToken,
                refresh_token: refreshToken,
            },
            message: "User registered successfully",
        };
    }

    async login(loginDto, userId) {
        const user = await this.userRepository.findByEmail(loginDto.email);
        if (!user) {
            throw new UnAuthorizedException('Email or password is incorrect');
        }

        const isMatch = await this.bcryptService.compare(loginDto.password, user.password_hash);
        if (!isMatch) {
            throw new UnAuthorizedException('Email or password is incorrect');
        }

        if (loginDto.role === "LAWYER") {
            let existingLicenseNumber = await connection.lawyer_details.findFirst({
                where: {user_id: user.id}
            });

            if (existingLicenseNumber.license_number !== loginDto.license_number) {
                throw new UnAuthorizedException('Invalid credentials')
            }
        }

        const userData = {
            user_id: user.id,
            email: user.email,
            fullName: user.full_name,
        };

        const {userRole} = await connection.users.findFirst({
            where: {id: userId},
            select: {
                roles: {
                    select: { name: true }
                },
            }
        })

        const { token: refreshToken } = await this.#createRefreshToken(user.id);
        const accessToken = this.jwtService.sign(JwtPayload({ id: user.id, role: [userRole] }));

        return {
            data: {
                user: userData,
                access_token: accessToken,
                refresh_token: refreshToken,
            },
            message: "Login successful.",
        };
    }

    async forgotPassword(forgotPasswordDto) {
        const existingEmail = await this.userRepository.findByEmail(forgotPasswordDto.email);
        
        if (!existingEmail) {
            throw new BadRequestException("Email does not exist");
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + FORGOT_PASSWORD_TOKEN_EXPIRY);

        await connection.users.update({
            where: { id: existingEmail.id },
            data: {
                password_reset_token: otp, // chỗ này em bỏ vào password_reset_token vì không có cái column riêng cho otp thường
                password_reset_expiry: expiresAt, // tương tự
                // cái này chắc ảnh hưởng bảo mật nhiều, nhưng mà em không rõ có cách nào khác. (@c quynh)
            },
        });

        return {
            message: "OTP has been sent to your email.",
        };
    }

    async verifyOtp(verifyOtpDto) {
        const existingEmail = await this.userRepository.findByEmail(verifyOtpDto.email);
        if (!existingEmail) {
            throw new BadRequestException("Email does not exist");
        }
        
        const existingOtp = await connection.users.findFirst({
            where: { id: existingEmail.id },
            select: { password_reset_token: true, password_reset_expiry: true }
        });

        if (existingOtp.password_reset_expiry < Date.now()) {
            throw new UnAuthorizedException("OTP has expired");
        }

        if (existingOtp.password_reset_token != verifyOtpDto.otp) {
            throw new UnAuthorizedException("Invalid OTP");
        }

        const { token: passwordResetToken } = await this.#createPasswordResetToken(existingEmail.id);

        return {
            data: {
                password_reset_token: passwordResetToken,
            }
        };
    }

    async resetPassword(resetPasswordDto) {
        const user = await connection.users.findFirst({
            where: { password_reset_token: resetPasswordDto.token },
            select: { id: true },
        })
        if (!user) {
            throw new UnAuthorizedException("Invalid or expired token");
        }

        resetPasswordDto.newPassword = await this.bcryptService.hash(resetPasswordDto.newPassword);

        await connection.users.update({
            where: { id: user.id },
            data: { password_hash: resetPasswordDto.newPassword },
            select: { id: true },
        });

        return {
            message: "Password has been reset successfully",
        }
    }

    async getMyProfile(userId) {
        return await connection.users.findFirst({
            where: { id: userId },
            select: { id: true, avatar_url: true, full_name: true, email: true, phone: true, date_of_birth: true, location: true }
        });
    }

    async updateMyProfile(updateMyProfileDto, userId) {
        const result = await connection.users.update({
            where: {
                id: userId,
            },
            data: {
                avatar_url: updateMyProfileDto.avatar_url,
                full_name: updateMyProfileDto.full_name,
                phone: updateMyProfileDto.phone,
                date_of_birth: new Date(updateMyProfileDto.date_of_birth).toISOString(),
                location: updateMyProfileDto.location,
            },
            select: {
                id: true,
                avatar_url: true,
                full_name: true,
                email: true,
                phone: true,
                date_of_birth: true,
                location: true,
                subscriptions: {
                    select: { plan_name: true }
                },
                created_at: true,
            }
        });
        return {
            data: result,
        }
    }

    async refreshToken(refreshTokenDto, userId) {
        const result = await connection.refresh_tokens.findFirst({
            where: { token: refreshTokenDto.refresh_token },
            select: { expires_at: true }
        });
        if (!result) {
            throw new UnAuthorizedException("Invalid or expired refresh token");
        }
        if (result.expires_at < Date.now()) {
            throw new UnAuthorizedException("Invalid or expired refresh token");
        }

        const { token: refreshToken } = await this.#createRefreshToken(userId);

        await connection.refresh_tokens.update({
            where: {user_id: userId},
            data: {
                token: refreshTokenDto.refresh_token,
                expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRY)
            },
            select: { token: true }
        });

        const {userRole} = await connection.users.findFirst({
            where: {id: userId},
            select: {
                roles: {
                    select: { name: true }
                },
            }
        })

        const accessToken = this.jwtService.sign(JwtPayload({ id: userId, role: [userRole] }));

        return {
            data: {
                accessToken: accessToken,
                refreshToken: refreshToken,
            },
        }
    }

    async #createRefreshToken(userId) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY);
        const record = await connection.refresh_tokens.upsert({
            where: { user_id: userId },
            update: { token, expires_at: expiresAt },
            create: { user_id: userId, token, expires_at: expiresAt },
            select: { user_id: true, token: true },
        });
        return {
            id: record.user_id || record,
            token: record.token || token
        };
    }

    async #createPasswordResetToken(userId) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY);
        const record = await connection.users.update({
            where: { id: userId },
            data: {
                password_reset_token: token,
                password_reset_expiry: expiresAt,
            },
        });
        return {
            id: record.user_id || record,
            token: record.token || token
        };
    }

    async #createRefreshToken(userId) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY);
        const record = await this.createRefreshTokenRepository.createToken(userId, token, expiresAt);
        return {
            id: record.user_id || record,
            token: record.token || token
        };
    }

    async #createPasswordResetToken(userId) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY);
        const record = await this.passwordResetRepository.passwordResetCreateToken(userId, token, expiresAt);
        return {
            id: record.user_id || record,
            token: record.token || token
        };
    }
}

export const AuthService = new Service();
