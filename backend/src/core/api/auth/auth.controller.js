import { AuthService } from '../../modules/auth/service/auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, VerifyOtpDto, ResetPasswordDto, UpdateMyProfileDto, RefreshTokenDto } from '../../modules/auth';
import { ValidHttpResponse } from '../../../packages/handler/response/validHttp.response';

class Controller {
    constructor() {
        this.service = AuthService;
    }

    register = async req => {
        const data = await this.service.register(RegisterDto(req.body));
        return ValidHttpResponse.toOkResponse(data);
    }

    login = async req => {
        const data = await this.service.login(LoginDto(req.body));
        return ValidHttpResponse.toOkResponse(data);
    }

    getMyProfile = async req => {
        const data = await this.service.getMyProfile(req.user.payload.id);
        return ValidHttpResponse.toOkResponse(data);
    }
    updateMyProfile = async req => {
        const data = await this.service.updateMyProfile(UpdateMyProfileDto(req.body), req.user.payload.id);
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

    refreshToken = async req => {
        const data = await this.service.refreshToken(RefreshTokenDto(req.body), req.user.payload.id);
        return ValidHttpResponse.toOkResponse(data);
    }
}

export const AuthController = new Controller();
