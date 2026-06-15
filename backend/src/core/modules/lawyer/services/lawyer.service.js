import { LawyerRepository } from '../lawyer.repository';
import { NotFoundException } from 'packages/httpException';
import { mapLawyerListItem, mapLawyerDetail } from './lawyer.mapper';

class Service {
    constructor() {
        this.repository = LawyerRepository;
    }

    async listLawyers({ page, size, filter }) {
        const { items, total } = await this.repository.listLawyers({ page, size, filter });

        return {
            data: {
                items: items.map(mapLawyerListItem),
                pagination: {
                    page,
                    size,
                    total,
                    totalPages: Math.ceil(total / size) || 0,
                },
            },
        };
    }

    async getLawyerById(id) {
        const user = await this.repository.findLawyerById(id);
        if (!user) {
            throw new NotFoundException('Lawyer not found');
        }

        return mapLawyerDetail(user);
    }
}


export const LawyerService = new Service();
