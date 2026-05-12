import { BaseRepository } from '../../common/base.repository';

class Repository extends BaseRepository {
  constructor() {
    super('users');
  }

  async findByEmail(email) {
    return this.findOne({ email }, { roles: true });
  }

  async findById(id) {
    return super.findById(id, { roles: true });
  }
}

export const UserRepository = new Repository();