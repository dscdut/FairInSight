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

        // Map size to limit or size interchangeably as the OpenAPI might use limit.
        // parsePaginationAndFilters returns page and size.
        
        const data = await this.service.listLawyers({ page, size, filters: filter });
        
        // Match the pagination structure in the OpenAPI response.
        const responseData = {
            data: {
                items: data.data.items,
                pagination: {
                    page: data.data.pagination.page,
                    limit: data.data.pagination.size,
                    total: data.data.pagination.total,
                    totalPages: data.data.pagination.totalPages
                }
            }
        };

        return ValidHttpResponse.toOkResponse(responseData);
    };
}

export const LawyerController = new Controller();
