import { AuthService } from '../../modules/auth/service/auth.service';
import { RegisterUserDto, RegisterLawyerDto, LoginUserDto, LoginLawyerDto, ForgotPasswordDto, VerifyOtpDto, ResetPasswordDto, UpdateMyProfileDto, RefreshTokenDto } from '../../modules/auth';
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

    getMyProfile = async req => {
        const data = await this.service.getMyProfile(req.user.payload.id); // nếu sử dụng req.user.payload.id thì không cần dùng tới phần nhập như kiểu swagger (nhập id như thế nào cũng sẽ chỉ hiện mỗi hồ sơ của họ). Như này được không ạ? (@c quynh)
        return ValidHttpResponse.toOkResponse(data);
    }
    updateMyProfile = async req => {
        const data = await this.service.updateMyProfile(UpdateMyProfileDto(req.body), req.user.payload.id);
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

    refreshToken = async req => {
        const data = await this.service.refreshToken(RefreshTokenDto(req.body), req.user.payload.id);
        return ValidHttpResponse.toOkResponse(data);
    }
}

export const AuthController = new Controller();
