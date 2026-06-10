import prisma from 'core/database';
import { BaseRepository } from '../../common/base.repository';

class Repository extends BaseRepository {
    constructor() {
        super('users'); 
    }

    async listLawyers({ page, size, filter = {} }) {
        const skip = (page - 1) * size;
        const where = {
            deleted_at: null,
            roles: {
                name: 'LAWYER'
            },
            lawyer_details: {
                is_verified: true 
            }
        };

        if (filter.search) {
            where.OR = [
                { full_name: { contains: filter.search, mode: 'insensitive' } },
                {
                    lawyer_details: {
                        lawyer_specialties: {
                            some: {
                                specialties: {
                                    name: { contains: filter.search, mode: 'insensitive' }
                                }
                            }
                        }
                    }
                }
            ];
        }

        if (filter.specialization) {
            where.lawyer_details = {
                ...where.lawyer_details,
                lawyer_specialties: {
                    some: {
                        specialties: {
                            name: { contains: filter.specialization, mode: 'insensitive' }
                        }
                    }
                }
            };
        }

        if (filter.city) {
            where.location = { contains: filter.city, mode: 'insensitive' };
        }

        if (filter.minRating) {
            where.lawyer_details = {
                ...where.lawyer_details,
                rating_avg: { gte: parseFloat(filter.minRating) }
            };
        }

        const include = {
            lawyer_details: {
                include: {
                    lawyer_specialties: {
                        include: {
                            specialties: true
                        }
                    },
                    lawyer_experiences: true
                }
            }
        };

        const [items, total] = await Promise.all([
            prisma.users.findMany({
                where,
                include,
                skip,
                take: size,
                orderBy: { created_at: 'desc' } 
            }),
            prisma.users.count({ where })
        ]);

        return { items, total };
    }
}

export const LawyerRepository = new Repository();
