import { BaseRepository } from '../../common/base.repository';

class Repository extends BaseRepository {
    constructor() {
        super('analysis');
    }
}

export const AnalysisRepository = new Repository();
