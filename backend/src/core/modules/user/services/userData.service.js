import { Role } from 'core/common/enum';

class Service {
    getUserInfo(user) {
        return {
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            roleName: (user.roles?.name || Role.USER).toUpperCase(),
        };
    }
}

export const UserDataService = new Service();
