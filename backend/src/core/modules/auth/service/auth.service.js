import connection from 'core/database';
import { pick } from 'lodash';
import { JwtPayload } from 'core/modules/auth/dto/jwt-sign.dto';
import { UserDataService } from 'core/modules/user/services/userData.service';
import { joinUserRoles } from 'core/utils/userFilter';
import { BcryptService } from './bcrypt.service';
import { JwtService } from './jwt.service';
import { UserRepository } from '../../user/user.repository';
import { UnAuthorizedException, DuplicateException, BadRequestException } from '../../../../packages/httpException';

class Service {
    constructor() {
        this.userRepository = UserRepository;
        this.jwtService = JwtService;
        this.bcryptService = BcryptService;
    }

    // async registerLawyer_addon(trx, registerLawyerDto, lawyer_id) {
    //     await trx.lawyer_certificates.create({
    //         data: {
    //             lawyer_id:   lawyer_id,
    //             file_url:    registerLawyerDto.licenseFile,
    //             issued_by:    registerLawyerDto.licenseIssuer,
    //             issue_date:  registerLawyerDto.licenseIssueDate,
    //             certificate_name: "placeholder" // cai nay o day de giu cho (@c quynh)
    //         },
    //         select: { id: true }
    //     });
    //     await trx.lawyer_details.create({
    //         data: {
    //             user_id: lawyer_id,
    //             email:   registerLawyerDto.email,
    //             password_hash: registerLawyerDto.password,
    //             full_name: registerLawyerDto.fullName,
    //             license_number: registerLawyerDto.licenseNumber,
    //             bar_association: registerLawyerDto.licenseIssuer, // khong biet co dung khong (@c quynh)
    //             is_verified: true, // (@c quynh)
    //             status: "AVAILABLE" // (@c quynh)
    //         },
    //         select: { id: true }
    //     });
    // };

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
                    full_name: "placeholder", // cai nay o day de giu cho (@c quynh)
                },
                select: { id: true }
            });

            // if (registerDto.role === "LAWYER") {
            //     await this.registerLawyer_addon(trx, registerDto, insertedUser.id);
            // }

            return insertedUser;
        });

        // them phan access token vs refresh token sau.
        
        return {
            id: result.id,
            email: registerDto.email,
            password_hash: registerDto.password,
            role_id: role_id,
            referral_code: registerDto.referralCode,
            // access_token: accessToken,
            // refresh_token: accessTokenString,
        };
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
