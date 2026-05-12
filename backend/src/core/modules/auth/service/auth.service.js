import { pick } from 'lodash';
import { JwtPayload } from 'core/modules/auth/dto/jwt-sign.dto';
import { UserDataService } from 'core/modules/user/services/userData.service';
import { joinUserRoles } from 'core/utils/userFilter';
import { BcryptService } from './bcrypt.service';
import { JwtService } from './jwt.service';
import { UserRepository } from '../../user/user.repository';
import { UnAuthorizedException } from '../../../../packages/httpException';

class Service {
    constructor() {
        this.userRepository = UserRepository;
        this.jwtService = JwtService;
        this.bcryptService = BcryptService;
    }

    async login(loginDto) {
        const user = await this.userRepository.findByEmail(loginDto.email);

        if (!user) {
            throw new UnAuthorizedException('Email or password is incorrect');
        }

        const isMatch = await this.bcryptService.compare(
            loginDto.password,
            user.password_hash
        );

        if (!isMatch) {
            throw new UnAuthorizedException('Email or password is incorrect');
        }

        const userData = {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.roles?.name,
        };

        const result = {
            user: userData,
            access_token: this.jwtService.sign(JwtPayload(userData)),
            refresh_token: this.jwtService.sign(JwtPayload(userData)), // Dummy refresh token for now
        };

        return {
            data: result,
            message: 'Đăng nhập thành công',
        };
    }
}

export const AuthService = new Service();
