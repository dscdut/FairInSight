import { AuthService } from '../../modules/auth/service/auth.service';
import { RegisterUserDto, RegisterLawyerDto } from '../../modules/auth';
import { LoginUserDto, LoginLawyerDto } from '../../modules/auth';
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
}

export const AuthController = new Controller();
