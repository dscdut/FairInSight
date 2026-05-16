import { LoginUserInterceptor, LoginLawyerInterceptor, RegisterUserDto, RegisterLawyerDto } from 'core/modules/auth';
import { Module } from 'packages/handler/Module';
import { AuthController } from './auth.controller';
import { RegisterLawyerInterceptor, RegisterUserInterceptor } from 'core/modules/auth/';

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
        }
    ]);
