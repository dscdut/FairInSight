import {
    LoginUserInterceptor,
    LoginLawyerInterceptor,
    RegisterUserInterceptor,
    RegisterLawyerInterceptor,
    GetMyProfileInterceptor,
    UpdateMyProfileInterceptor,
    ForgotPasswordInterceptor,
    VerifyOtpInterceptor,
    ResetPasswordInterceptor,
    RefreshTokenInterceptor,
} from 'core/modules/auth';
import { Module } from 'packages/handler/Module';
import { AuthController } from './auth.controller';
import { GetMyProfileParams } from '../params';
import { authMiddleware } from 'core/modules/auth/middleware/auth.middleware';
import { uploadMediaSwagger } from 'core/common/swagger';
import { MediaInterceptor } from 'core/modules/document';

export const AuthResolver = Module.builder()
    .addPrefix({
        prefixPath: '/auth',
        tag: 'auth',
        module: 'AuthModule'
    })
    .register([
        {
            route: '/login_user',
            method: 'post',
            interceptors: [LoginUserInterceptor],
            body: 'LoginUserDto',
            controller: AuthController.loginUser,
        },
        {
            route: '/login_lawyer',
            method: 'post',
            interceptors: [LoginLawyerInterceptor],
            body: 'LoginLawyerDto',
            controller: AuthController.loginLawyer,
        },
        {
            route: '/register_user',
            method: 'post',
            interceptors: [RegisterUserInterceptor],
            body: 'RegisterUserDto',
            controller: AuthController.registerUser,
        },
        {
            route: '/register_lawyer',
            method: 'post',
            interceptors: [RegisterLawyerInterceptor],
            body: 'RegisterLawyerDto',
            controller: AuthController.registerLawyer,
        },
        {
            route: '/me/:id',
            method: 'get',
            params: [GetMyProfileParams],
            interceptors: [GetMyProfileInterceptor],
            middleware: [authMiddleware], // phần này em không rõ lắm (@c quynh)
            controller: AuthController.getMyProfile,
            preAuthorization: true,
        },
        {
            route: '/update_my_profile',
            method: 'post',
            interceptors: [UpdateMyProfileInterceptor],
            middleware: [authMiddleware], // tương tự như trên (@c quynh)
            body: 'UpdateMyProfileDto',
            controller: AuthController.updateMyProfile,
            preAuthorization: true,
        },
        {
            route: '/forgot_password',
            method: 'post',
            interceptors: [ForgotPasswordInterceptor],
            body: 'ForgotPasswordDto',
            controller: AuthController.forgotPassword,
        },
        {
            route: '/verify_otp',
            method: 'post',
            interceptors: [VerifyOtpInterceptor],
            body: 'VerifyOtpDto',
            controller: AuthController.verifyOtp,
        },
        {
            route: '/reset-password',
            method: 'post',
            interceptors: [ResetPasswordInterceptor],
            body: 'ResetPasswordDto',
            controller: AuthController.resetPassword,
        },
        {
            route: '/refresh-token',
            method: 'post',
            interceptors: [RefreshTokenInterceptor],
            middleware: [authMiddleware], // tương tự như trên (@c quynh)
            body: 'RefreshTokenDto',
            controller: AuthController.refreshToken,
            preAuthorization: true,
        },
        {
            route: '/avatar',
            method: 'post',
            params: [uploadMediaSwagger],
            consumes: ['multipart/form-data'],
            interceptors: [new MediaInterceptor(10)],
            controller: AuthController.uploadAvatar,
            preAuthorization: true
        },
    ]);
