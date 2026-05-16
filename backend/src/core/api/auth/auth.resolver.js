import {
    LoginInterceptor,
    RegisterInterceptor,
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
            route: '/login',
            method: 'post',
            interceptors: [LoginUserInterceptor],
            body: 'LoginUserDto',
            controller: AuthController.loginUser,
        },
        {
            route: '/login',
            method: 'post',
            interceptors: [LoginLawyerInterceptor],
            body: 'LoginLawyerDto',
            controller: AuthController.loginLawyer,
        },
        {
            route: '/register',
            method: 'post',
            interceptors: [RegisterInterceptor],
            body: 'RegisterDto',
            controller: AuthController.register,
        },
        {
            route: '/me/:id',
            method: 'get',
            params: [GetMyProfileParams],
            interceptors: [GetMyProfileInterceptor],
            middleware: [authMiddleware],
            controller: AuthController.getMyProfile,
            preAuthorization: true,
        },
        {
            route: '/update_my_profile',
            method: 'post',
            interceptors: [UpdateMyProfileInterceptor],
            middleware: [authMiddleware],
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
            middleware: [authMiddleware],
            body: 'RefreshTokenDto',
            controller: AuthController.refreshToken,
            preAuthorization: true,
        },
    ]);
