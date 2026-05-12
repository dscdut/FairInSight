import { BaseRepository } from '../../common/base.repository';

class Repository extends BaseRepository {
  constructor() {
    super('roles');
  }

  async findByName(name) {
    return this.findOne({ name });
  }
}

export const RoleRepository = new Repository();

