import { Role } from 'core/common/enum';

class Service {
    getUserInfo(user) {
        return {
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            role: (user.roles?.name || Role.USER).toLowerCase(),
        };
    }
}

export const UserDataService = new Service();
