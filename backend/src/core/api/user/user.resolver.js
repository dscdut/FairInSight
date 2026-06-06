import { Module } from 'packages/handler/Module';
import {
    CreateUserInterceptor,
    UpdateUserInterceptor,
    BanUserInterceptor,
    UnbanUserInterceptor,
    UpdateUserRoleInterceptor
} from 'core/modules/user/interceptor';
import { hasAdminRole } from 'core/modules/auth/guard';
import { RecordIdInterceptor } from 'core/modules/interceptor/recordId/record-id.interceptor';
import { UserController } from './user.controller';
import { RecordId } from '../../common/swagger/record-id';
import { DefaultQueryCriteriaDocument } from '../../common/swagger/filter';

export const UserResolver = Module.builder()
    .addPrefix({
        prefixPath: '/users',
        tag: 'users',
        module: 'UserModule',
    })
    .register([
        // Get list of users with pagination (admin only)
        {
            route: '/',
            method: 'get',
            params: DefaultQueryCriteriaDocument,
            guards: [hasAdminRole],
            controller: UserController.listUsers,
            preAuthorization: true,
        },
        // Update user profile (authenticated)
        {
            route: '/',
            method: 'put',
            interceptors: [UpdateUserInterceptor],
            body: 'UpdateUserDto',
            guards: [hasAdminRole],
            controller: UserController.updateOne,
            preAuthorization: true,
        },
        // Get user statistics (admin only)
        {
            route: '/stats',
            method: 'get',
            guards: [hasAdminRole],
            controller: UserController.getUserStats,
            preAuthorization: true,
        },
        // Get list of banned users (admin only)
        {
            route: '/banned',
            method: 'get',
            params: DefaultQueryCriteriaDocument,
            guards: [hasAdminRole],
            controller: UserController.listBannedUsers,
            preAuthorization: true,
        },
        // Get user details by ID (admin only)
        {
            route: '/:id',
            method: 'get',
            params: [RecordId],
            interceptors: [RecordIdInterceptor],
            guards: [hasAdminRole],
            controller: UserController.findById,
            preAuthorization: true,
        },
        // Delete user (admin only)
        {
            route: '/:id',
            method: 'delete',
            params: [RecordId],
            interceptors: [RecordIdInterceptor],
            guards: [hasAdminRole],
            controller: UserController.deleteUser,
            preAuthorization: true,
        },
        // Ban user account (admin only)
        {
            route: '/:id/ban',
            method: 'patch',
            params: [RecordId],
            interceptors: [RecordIdInterceptor, BanUserInterceptor],
            body: 'BanUserDto',
            guards: [hasAdminRole],
            controller: UserController.banUser,
            preAuthorization: true,
        },
        // Unban user account (admin only)
        {
            route: '/:id/unban',
            method: 'patch',
            params: [RecordId],
            interceptors: [RecordIdInterceptor, UnbanUserInterceptor],
            body: 'UnbanUserDto',
            guards: [hasAdminRole],
            controller: UserController.unbanUser,
            preAuthorization: true,
        },
        // Update user role (admin only)
        {
            route: '/:id/role',
            method: 'put',
            params: [RecordId],
            interceptors: [RecordIdInterceptor, UpdateUserRoleInterceptor],
            body: 'UpdateUserRoleDto',
            guards: [hasAdminRole],
            controller: UserController.updateUserRole,
            preAuthorization: true,
        },
    ]);
