import { AuthService } from '../../modules/auth/service/auth.service';
import { RegisterUserDto, RegisterLawyerDto, LoginUserDto, LoginLawyerDto, ForgotPasswordDto, VerifyOtpDto, ResetPasswordDto } from '../../modules/auth';
import { ValidHttpResponse } from '../../../packages/handler/response/validHttp.response';

class Controller {
    constructor() {
        this.service = AuthService;
    }

    registerUser = async req => {
        const data = await this.service.register(RegisterUserDto(req.body));
        return ValidHttpResponse.toOkResponse(data);
    }

    registerLawyer = async req => {
        const data = await this.service.register(RegisterLawyerDto(req.body));
        return ValidHttpResponse.toOkResponse(data);
    }

    loginUser = async req => {
        const data = await this.service.login(LoginUserDto(req.body));
        return ValidHttpResponse.toOkResponse(data);
    }
    loginLawyer = async req => {
        const data = await this.service.login(LoginLawyerDto(req.body));
        return ValidHttpResponse.toOkResponse(data);
    }

    forgotPassword = async req => {
        const data = await this.service.forgotPassword(ForgotPasswordDto(req.body));
        return ValidHttpResponse.toOkResponse(data);
    }
    verifyOtp = async req => {
        const data = await this.service.verifyOtp(VerifyOtpDto(req.body));
        return ValidHttpResponse.toOkResponse(data);
    }
    resetPassword = async req => {
        const data = await this.service.resetPassword(ResetPasswordDto(req.body));
        return ValidHttpResponse.toOkResponse(data);
    }
}

export const AuthController = new Controller();
