import { UserService } from '../../modules/user/services/user.service';
import { CreateUserDto, UpdateUserDto, BanUserDto, UnbanUserDto, UpdateUserRoleDto } from '../../modules/user/dto';
import { ValidHttpResponse } from '../../../packages/handler/response/validHttp.response';
import { parsePaginationAndFilters, parsePagination } from '../../utils';

class Controller {
    constructor() {
        this.service = UserService;
    }

    /**
     * GET /api/v1/users
     * Get list of users with pagination and filtering (admin only)
     */
    listUsers = async req => {
        const { page, size, filter } = parsePaginationAndFilters(req.query, {
            allowedFilters: ['role', 'email', 'status'],
        });

        const data = await this.service.listUsers({ page, size, filter });
        return ValidHttpResponse.toOkResponse(data);
    };

    /**
     * POST /api/v1/users
     * Create a new user (public endpoint)
     */
    createOne = async req => {
        const data = await this.service.createOne(CreateUserDto(req.body));
        return ValidHttpResponse.toCreatedResponse(data);
    };

    /**
     * PUT /api/v1/users
     * Update authenticated user's profile
     */
    updateOne = async req => {
        await this.service.upsertOne(UpdateUserDto(req.body), req.user.payload.userId);
        return ValidHttpResponse.toNoContentResponse();
    };

    /**
     * GET /api/v1/users/{id}
     * Get user details by ID (admin only)
     */
    findById = async req => {
        const data = await this.service.getUserById(req.params.id);
        return ValidHttpResponse.toOkResponse(data);
    };

    /**
     * DELETE /api/v1/users/{id}
     * Delete user by ID (admin only)
     */
    deleteUser = async req => {
        await this.service.deleteUser(req.params.id);
        return ValidHttpResponse.toOkResponse({ message: 'User deleted successfully' });
    };

    /**
     * PATCH /api/v1/users/{id}/ban
     * Ban a user account (admin only)
     */
    banUser = async req => {
        const banDto = BanUserDto(req.body);
        const adminId = req.user?.payload?.userId;

        const data = await this.service.banUser(
            req.params.id,
            adminId,
            banDto.reason
        );
        return ValidHttpResponse.toOkResponse(data);
    };

    /**
     * PATCH /api/v1/users/{id}/unban
     * Unban a user account (admin only)
     */
    unbanUser = async req => {
        const unbanDto = UnbanUserDto(req.body);
        const adminId = req.user?.payload?.userId;

        const data = await this.service.unbanUser(
            req.params.id,
            adminId,
            unbanDto.reason
        );
        return ValidHttpResponse.toOkResponse(data);
    };

    /**
     * GET /api/v1/users/banned
     * Get list of banned users with pagination (admin only)
     */
    listBannedUsers = async req => {
        const { page, size } = parsePagination(req.query);

        const data = await this.service.listBannedUsers({ page, size });
        return ValidHttpResponse.toOkResponse(data);
    };

    /**
     * PUT /api/v1/users/{id}/role
     * Update user role with optional lawyer details (admin only)
     */
    updateUserRole = async req => {
        const roleDto = UpdateUserRoleDto(req.body);
        const data = await this.service.updateUserRole(req.params.id, roleDto);
        return ValidHttpResponse.toOkResponse(data);
    };

    /**
     * GET /api/v1/users/stats
     * Get user statistics (admin only)
     */
    getUserStats = async () => {
        const data = await this.service.getUserStats();
        return ValidHttpResponse.toOkResponse(data);
    };
}

export const UserController = new Controller();
