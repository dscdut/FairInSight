import { LoginInterceptor, RegisterUserDto, RegisterLawyerDto } from 'core/modules/auth';
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
            interceptors: [LoginInterceptor],
            body: 'LoginDto',
            controller: AuthController.login,
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
