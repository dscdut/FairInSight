import { LawyerService } from '../../modules/lawyer/services/lawyer.service';
import { ValidHttpResponse } from '../../../packages/handler/response/validHttp.response';
import { parsePaginationAndFilters } from '../../utils';
import { UpdateLawyerProfileDto } from '../../modules/lawyer/dto';

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

    /**
     * GET /api/v1/lawyers/{id}
     * Get lawyer details by ID
     */
    findById = async req => {
        const data = await this.service.getLawyerById(req.params.id);
        return ValidHttpResponse.toOkResponse(data);
    };

    /**
     * PATCH /api/v1/lawyers/profile
     * Update authenticated lawyer's profile
     */
    updateProfile = async req => {
        const userId = req.user.payload.id;
        const data = await this.service.updateProfile(userId, UpdateLawyerProfileDto(req.body));
        return ValidHttpResponse.toOkResponse(data);
    };
}


export const LawyerController = new Controller();
