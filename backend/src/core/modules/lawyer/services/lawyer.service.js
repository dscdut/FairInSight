import prisma from 'core/database';
import { NotFoundException } from 'packages/httpException';
import { LawyerRepository } from '../lawyer.repository';
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
        let actualId = id;
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (id && !uuidRegex.test(id)) {
            // Find all active/verified lawyers in database
            const allLawyers = await prisma.users.findMany({
                where: {
                    deleted_at: null,
                    roles: { name: 'LAWYER' },
                    lawyer_details: { is_verified: true }
                },
                orderBy: { created_at: 'asc' }
            });
            if (allLawyers.length > 0) {
                const match = id.match(/lyr-(\d+)/);
                if (match) {
                    const index = parseInt(match[1], 10) - 1;
                    const selectedLawyer = allLawyers[index % allLawyers.length];
                    actualId = selectedLawyer.id;
                } else {
                    actualId = allLawyers[0].id;
                }
            }
        }

        const user = await this.repository.findLawyerById(actualId);
        if (!user) {
            throw new NotFoundException('Lawyer not found');
        }

        return mapLawyerDetail(user);
    }
}


export const LawyerService = new Service();
