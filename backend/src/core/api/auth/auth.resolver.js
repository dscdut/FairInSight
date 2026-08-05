import {
    LoginInterceptor,
    RegisterInterceptor,
    GetMyProfileInterceptor,
    UpdateMyProfileInterceptor,
    ForgotPasswordInterceptor,
    VerifyOtpInterceptor,
    ResetPasswordInterceptor,
    RefreshTokenInterceptor,
    LogoutInterceptor
} from 'core/modules/auth';
import { Module } from 'packages/handler/Module';
import { authMiddleware } from 'core/modules/auth/middleware/auth.middleware';
import { AuthController } from './auth.controller';

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
            interceptors: [LoginInterceptor],
            body: 'LoginDto',
            controller: AuthController.login,
        },
        {
            route: '/register',
            method: 'post',
            interceptors: [RegisterInterceptor],
            body: 'RegisterDto',
            controller: AuthController.register,
        },
        {
            route: '/me',
            method: 'get',
            interceptors: [GetMyProfileInterceptor],
            middleware: [authMiddleware],
            controller: AuthController.getMyProfile,
            preAuthorization: true,
        },
        {
            route: '/me',
            method: 'patch',
            interceptors: [UpdateMyProfileInterceptor],
            middleware: [authMiddleware],
            body: 'UpdateMyProfileDto',
            controller: AuthController.updateMyProfile,
            preAuthorization: true,
        },
        {
            route: '/forgot-password',
            method: 'post',
            interceptors: [ForgotPasswordInterceptor],
            body: 'ForgotPasswordDto',
            controller: AuthController.forgotPassword,
        },
        {
            route: '/verify-otp',
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
            body: 'RefreshTokenDto',
            controller: AuthController.refreshToken,
        },

        {
            route: '/logout',
            method: 'post',
            interceptors: [LogoutInterceptor],
            middleware: [authMiddleware],
            body: 'LogoutDto',
            controller: AuthController.logout,
            preAuthorization: true,
        },
    ]);
