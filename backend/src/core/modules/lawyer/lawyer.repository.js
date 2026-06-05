import prisma from 'core/database';
import { BaseRepository } from '../../common/base.repository';

class Repository extends BaseRepository {
    constructor() {
        super('users'); 
    }

    async listLawyers({ page, size, filters }) {
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

        if (filters.search) {
            where.OR = [
                { full_name: { contains: filters.search, mode: 'insensitive' } },
                {
                    lawyer_details: {
                        lawyer_specialties: {
                            some: {
                                specialties: {
                                    name: { contains: filters.search, mode: 'insensitive' }
                                }
                            }
                        }
                    }
                }
            ];
        }

        if (filters.specialization) {
            where.lawyer_details = {
                ...where.lawyer_details,
                lawyer_specialties: {
                    some: {
                        specialties: {
                            name: { contains: filters.specialization, mode: 'insensitive' }
                        }
                    }
                }
            };
        }

        if (filters.city) {
            where.location = { contains: filters.city, mode: 'insensitive' };
        }

        if (filters.minRating) {
            where.lawyer_details = {
                ...where.lawyer_details,
                rating_avg: { gte: parseFloat(filters.minRating) }
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
