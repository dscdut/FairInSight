import { LawyerService } from '../../modules/lawyer/services/lawyer.service';
import { ValidHttpResponse } from '../../../packages/handler/response/validHttp.response';
import { parsePaginationAndFilters } from '../../utils';

class Controller {
    constructor() {
        this.service = LawyerService;
    }

    /**
     * GET /api/v1/lawyers
     * Get list of lawyers with pagination and filtering
     */
    listLawyers = async req => {
        const { page, size, filter } = parsePaginationAndFilters(req.query, {
            allowedFilters: ['specialization', 'city', 'minRating', 'search'],
        });

        const data = await this.service.listLawyers({ page, size, filter });
        return ValidHttpResponse.toOkResponse(data);
    };
}

export const LawyerController = new Controller();
