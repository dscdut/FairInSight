import {
    LoginUserInterceptor,
    LoginLawyerInterceptor,
    RegisterUserInterceptor,
    RegisterLawyerInterceptor,
    ForgotPasswordInterceptor,
    VerifyOtpInterceptor,
    ResetPasswordInterceptor,
} from 'core/modules/auth';
import { Module } from 'packages/handler/Module';
import { AuthController } from './auth.controller';

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
    ]);
