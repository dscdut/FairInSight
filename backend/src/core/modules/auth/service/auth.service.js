import crypto from 'crypto';
import {
    REFRESH_TOKEN_EXPIRY,
    FORGOT_PASSWORD_TOKEN_EXPIRY,
    PASSWORD_RESET_TOKEN_EXPIRY,
} from 'core/env';
import { MailerService } from 'core/common/mailer.service';
import { JwtPayload } from 'core/modules/auth/dto/jwt-sign.dto';
import { AuthRepository } from '../auth.repository';
import { BcryptService } from './bcrypt.service';
import { JwtService } from './jwt.service';
import { UnAuthorizedException, DuplicateException, BadRequestException } from '../../../../packages/httpException';

class Service {
    constructor() {
        this.repository = AuthRepository;
        this.jwtService = JwtService;
        this.bcryptService = BcryptService;
    }

    async register(registerDto) {
        const existingEmail = await this.repository.findActiveUserByEmail(registerDto.email);
        if (existingEmail) {
            throw new DuplicateException('Email already in use');
        }

        registerDto.password = await this.bcryptService.hash(registerDto.password);

        const existingRole = await this.repository.findRoleByName(registerDto.role);
        if (!existingRole) {
            throw new BadRequestException('Role does not exist');
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + FORGOT_PASSWORD_TOKEN_EXPIRY);
        const emailConfirmationToken = this.#buildOtpToken(otp, expiresAt);
        const result = await this.repository.createUser({
            role_id: existingRole.id,
            email: registerDto.email,
            password_hash: registerDto.password,
            referral_code: registerDto.referralCode,
            full_name: registerDto.fullName,
            email_confirmation_token: emailConfirmationToken,
            is_email_confirmed: false,
        });

        const otpExpiryMinutes = Math.max(1, Math.floor(FORGOT_PASSWORD_TOKEN_EXPIRY / 60000));
        await MailerService.send({
            to: registerDto.email,
            subject: 'Verify your email',
            text: `Your OTP code is ${otp}. It expires in ${otpExpiryMinutes} minutes.`,
        });

        return {
            data: {
                id: result.id,
                fullName: registerDto.fullName,
                email: registerDto.email,
                roleName: existingRole.name.toUpperCase(),
            },
            message: 'User registered successfully',
        };
    }

    async login(loginDto, userId) {
        const user = await this.repository.findActiveUserByEmail(loginDto.email);
        if (!user) {
            throw new UnAuthorizedException('Email or password is incorrect');
        }

        const isMatch = await this.bcryptService.compare(loginDto.password, user.password_hash);
        if (!isMatch) {
            throw new UnAuthorizedException('Email or password is incorrect');
        }

        if (!user.is_email_confirmed) {
            throw new UnAuthorizedException('Email is not verified');
        }

        const userData = {
            userId: user.id,
            email: user.email,
            fullName: user.full_name,
            roleName: user.roles?.name ? user.roles.name.toUpperCase() : null,
        };

        const targetUserId = userId ?? user.id;
        const roleNames = await this.#getRoleNames(targetUserId);

        const { accessToken, refreshToken } = await this.#issueTokens(user.id, roleNames);

        return {
            data: {
                user: userData,
                accessToken,
                refreshToken,
            },
            message: 'Login successful.',
        };
    }

    async forgotPassword(forgotPasswordDto) {
        const existingEmail = await this.repository.findActiveUserByEmail(forgotPasswordDto.email);

        if (!existingEmail) {
            throw new BadRequestException('Email does not exist');
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + FORGOT_PASSWORD_TOKEN_EXPIRY);

        await this.repository.updatePasswordResetToken(existingEmail.id, otp, expiresAt);

        const otpExpiryMinutes = Math.max(1, Math.floor(FORGOT_PASSWORD_TOKEN_EXPIRY / 60000));
        await MailerService.send({
            to: existingEmail.email,
            subject: 'Your OTP code',
            text: `Your OTP code is ${otp}. It expires in ${otpExpiryMinutes} minutes.`,
        });

        return {
            message: 'OTP has been sent to your email.',
        };
    }

    async verifyOtp(verifyOtpDto) {
        const type = verifyOtpDto.type || 'password';

        if (type === 'email') {
            const user = await this.repository.getEmailConfirmationDataByEmail(verifyOtpDto.email);
            if (!user) {
                throw new BadRequestException('Email does not exist');
            }

            if (user.is_email_confirmed) {
                return { message: 'Email is already verified' };
            }

            const parsed = this.#parseOtpToken(user.email_confirmation_token);
            if (!parsed) {
                throw new UnAuthorizedException('Invalid OTP');
            }

            if (parsed.expiresAt < Date.now()) {
                throw new UnAuthorizedException('OTP has expired');
            }

            if (parsed.otp !== verifyOtpDto.otp) {
                throw new UnAuthorizedException('Invalid OTP');
            }

            await this.repository.confirmEmail(user.id);

            return { message: 'Email verified successfully' };
        }

        if (type !== 'password') {
            throw new BadRequestException('Invalid OTP type');
        }

        const existingEmail = await this.repository.findActiveUserByEmail(verifyOtpDto.email);
        if (!existingEmail) {
            throw new BadRequestException('Email does not exist');
        }

        const existingOtp = await this.repository.getPasswordResetData(existingEmail.id);

        if (existingOtp.password_reset_expiry < Date.now()) {
            throw new UnAuthorizedException('OTP has expired');
        }

        if (existingOtp.password_reset_token !== verifyOtpDto.otp) {
            throw new UnAuthorizedException('Invalid OTP');
        }

        const { token: passwordResetToken } = await this.#createPasswordResetToken(existingEmail.id);

        return {
            data: {
                password_reset_token: passwordResetToken,
            }
        };
    }

    async resetPassword(resetPasswordDto) {
        const user = await this.repository.findUserByResetToken(resetPasswordDto.token);
        if (!user) {
            throw new UnAuthorizedException('Invalid or expired token');
        }

        resetPasswordDto.newPassword = await this.bcryptService.hash(resetPasswordDto.newPassword);

        await this.repository.updatePasswordHash(user.id, resetPasswordDto.newPassword);

        return {
            message: 'Password has been reset successfully',
        };
    }

    async getMyProfile(userId) {
        const user = await this.repository.getProfile(userId);

        return user ? this.#mapProfile(user) : null;
    }

    async updateMyProfile(updateMyProfileDto, userId) {
        const dateOfBirth = updateMyProfileDto.dateOfBirth
            ? new Date(updateMyProfileDto.dateOfBirth).toISOString()
            : null;

        const result = await this.repository.updateProfile(userId, {
            avatar_url: updateMyProfileDto.avatarUrl,
            full_name: updateMyProfileDto.fullName,
            phone: updateMyProfileDto.phone,
            date_of_birth: dateOfBirth,
            location: updateMyProfileDto.location,
        });
        return {
            data: this.#mapProfile(result),
        };
    }

    async refreshToken(refreshTokenDto, userId) {
        const result = await this.repository.findRefreshToken(refreshTokenDto.refresh_token);
        if (!result) {
            throw new UnAuthorizedException('Invalid or expired refresh token');
        }
        if (result.expires_at < Date.now() || result.is_revoked) {
            throw new UnAuthorizedException('Invalid or expired refresh token');
        }

        const roleNames = await this.#getRoleNames(userId);
        const { accessToken, refreshToken } = await this.#issueTokens(userId, roleNames);

        return {
            data: {
                accessToken,
                refreshToken,
            },
        };
    }

    async logout(logoutDto) {
        const existToken = await this.repository.findRefreshToken(logoutDto.refresh_token);
        if (!existToken) {
            throw new UnAuthorizedException('Invalid or expired refresh token');
        }

        await this.repository.revokeRefreshToken(logoutDto.refresh_token);
        return {
            type: 'string',
            message: 'Logout successful',
        };
    }

    async logout(logoutDto) {
        const existToken = await this.repository.findRefreshToken(logoutDto.refresh_token);
        if (!existToken) {
            throw new UnAuthorizedException("Invalid or expired refresh token");
        }

        if (existToken.expires_at < Date.now()) {
            throw new UnAuthorizedException("Invalid or expired refresh token");
        }

        await this.repository.deleteRefreshToken(logoutDto.refresh_token);
        return { 
            type: "string",
            message: "Logout successful ",
        };
    }

    async #createRefreshToken(userId) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY);
        const record = await this.repository.upsertRefreshToken(userId, token, expiresAt);
        return {
            id: record.user_id,
            token: record.token
        };
    }

    async #issueTokens(userId, roleNames) {
        const { token: refreshToken } = await this.#createRefreshToken(userId);
        const accessToken = this.jwtService.sign(JwtPayload({ id: userId, role: roleNames }));

        return {
            accessToken,
            refreshToken,
        };
    }

    async #createPasswordResetToken(userId) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY);
        await this.repository.updatePasswordResetToken(userId, token, expiresAt);
        return {
            id: userId,
            token
        };
    }

    async #getRoleNames(userId) {
        const userWithRole = await this.repository.getUserRoles(userId);

        if (!userWithRole || !userWithRole.roles) {
            return [];
        }

        if (Array.isArray(userWithRole.roles)) {
            return userWithRole.roles.map(role => role.name);
        }

        return [userWithRole.roles.name];
    }

    #mapProfile(user) {
        return {
            id: user.id,
            avatarUrl: user.avatar_url ?? null,
            fullName: user.full_name ?? null,
            email: user.email ?? null,
            phone: user.phone ?? null,
            dateOfBirth: user.date_of_birth ?? null,
            location: user.location ?? null,
            subscriptions: user.subscriptions
                ? { planName: user.subscriptions.plan_name ?? null }
                : undefined,
            createdAt: user.created_at ?? undefined,
        };
    }

    #buildOtpToken(otp, expiresAt) {
        return `${otp}.${expiresAt.getTime()}`;
    }

    #parseOtpToken(token) {
        if (!token) {
            return null;
        }

        const [otp, expiresAtRaw] = String(token).split('.');
        const expiresAt = Number.parseInt(expiresAtRaw, 10);

        if (!otp || !Number.isFinite(expiresAt)) {
            return null;
        }

        return { otp, expiresAt };
    }
}

export const AuthService = new Service();
