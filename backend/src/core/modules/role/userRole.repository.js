import { BaseRepository } from '../../common/base.repository';

class Repository extends BaseRepository {
    constructor() {
        super('roles');
    }
}

export const UserRoleRepository = new Repository();

