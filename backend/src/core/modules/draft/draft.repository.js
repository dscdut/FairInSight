import { BaseRepository } from '../../common/base.repository';

class Repository extends BaseRepository {
    constructor() {
        super('documents');
    }
}

export const DraftRepository = new Repository();
