import crypto from 'crypto';
import connection from 'core/database';
import { pick } from 'lodash';
import { JwtPayload } from 'core/modules/auth/dto/jwt-sign.dto';
import { UserDataService } from 'core/modules/user/services/userData.service';
import { joinUserRoles } from 'core/utils/userFilter';
import { BcryptService } from './bcrypt.service';
import { JwtService } from './jwt.service';
import { UserRepository } from '../../user/user.repository';
import { UnAuthorizedException, DuplicateException, BadRequestException } from '../../../../packages/httpException';
import { RefreshTokenRepository } from '../repository/refresh-token.repository';

const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000;

class Service {
    constructor() {
        this.userRepository = UserRepository;
        this.jwtService = JwtService;
        this.bcryptService = BcryptService;
        this.refreshTokenRepository = RefreshTokenRepository;
    }

    async register(registerDto) {
        const existingEmail = await this.userRepository.findByEmail(registerDto.email);
        if (existingEmail) {
            throw new DuplicateException("Email already in use");
        }

        if (registerDto.password !== registerDto.confirmPassword) {
            throw new BadRequestException("Passwords do not match " + registerDto.password + ' ' + registerDto.confirmPassword);
        }

        let existingRole = await connection.roles.findFirst({
            where: {name: registerDto.role}
        });
        if (!existingRole) {
            throw new BadRequestException("Role does not exist");
        }

        registerDto.password = await this.bcryptService.hash(registerDto.password);

        let role_id = existingRole.id;

        const result = await connection.$transaction(async (trx) => {
            const insertedUser = await trx.users.create({
                data: {
                    role_id: role_id,
                    email: registerDto.email,
                    password_hash: registerDto.password,
                    referral_code: registerDto.referralCode,
                    full_name: registerDto.fullName,
                },
                select: { id: true }
            });

            return insertedUser;
        });

        const { id: ref, token: refreshToken } = await this.#createRefreshToken(result.id);
        const accessToken = this.jwtService.sign(JwtPayload({ id: result.id, role: [registerDto.role] }, ref));
        
        return {
            id: result.id,
            full_name: registerDto.fullName,
            email: registerDto.email,
            role_id: role_id,
            access_token: accessToken,
            refresh_token: refreshToken,
        };
    }

    async login(loginDto) {
        const user = await this.userRepository.findByEmail(loginDto.email);
        if (!user) {
            throw new UnAuthorizedException('Email or password is incorrect');
        }

        const isMatch = await this.bcryptService.compare(loginDto.password, user.password_hash);

        if (!isMatch) {
            throw new UnAuthorizedException('Email or password is incorrect');
        }

        const userData = {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: loginDto.role,
        };

        const { id: ref, token: accessTokenString } = await this.#createRefreshToken(user.id);
        const accessToken = this.jwtService.sign(JwtPayload({ id: user.id, role: [loginDto.role] }, ref));

        const result = {
            user: userData,
            access_token: accessToken,
            refresh_token: accessTokenString,
        };

        return {
            data: result,
            message: 'Đăng nhập thành công',
        };
    }

    async #createRefreshToken(userId) {
        // Tao chuoi ngau nhien 32 bytes (64 ky tu hex) cho Refresh Token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY);
        const record = await this.refreshTokenRepository.createToken(userId, token, expiresAt);
        return {
            id: record.user_id || record,
            token: record.token || token
        };
    }
}

export const AuthService = new Service();
