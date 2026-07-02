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

    async findLawyerById(id) {
        const include = {
            roles: true,
            lawyer_details: {
                include: {
                    lawyer_specialties: {
                        include: {
                            specialties: true
                        }
                    },
                    lawyer_experiences: {
                        where: { deleted_at: null },
                        orderBy: { start_date: 'desc' }
                    },
                    lawyer_certificates: {
                        where: { deleted_at: null }
                    },
                    ratings: {
                        where: { deleted_at: null },
                        include: {
                            users: true
                        },
                        orderBy: { created_at: 'desc' }
                    }
                }
            }
        };

        return prisma.users.findFirst({
            where: {
                id,
                deleted_at: null,
                roles: {
                    name: 'LAWYER'
                },
                lawyer_details: {
                    is_verified: true
                }
            },
            include
        });
    }

    async updateLawyerProfile(userId, { userPayload, lawyerDetailsPayload, specializations }) {
        return prisma.$transaction(async tx => {
            // Update users table
            if (Object.keys(userPayload).length > 0) {
                await tx.users.update({
                    where: { id: userId },
                    data: userPayload,
                });
            }

            // Update lawyer_details using upsert to prevent issues if details do not exist
            if (Object.keys(lawyerDetailsPayload).length > 0) {
                await tx.lawyer_details.upsert({
                    where: { user_id: userId },
                    create: {
                        user_id: userId,
                        ...lawyerDetailsPayload,
                    },
                    update: lawyerDetailsPayload,
                });
            }

            // Update specializations if provided
            if (Array.isArray(specializations)) {
                const foundSpecialties = await tx.specialties.findMany({
                    where: {
                        name: { in: specializations },
                    },
                });

                // Delete old specialties
                await tx.lawyer_specialties.deleteMany({
                    where: { lawyer_id: userId },
                });

                // Insert new specialties
                if (foundSpecialties.length > 0) {
                    await tx.lawyer_specialties.createMany({
                        data: foundSpecialties.map(spec => ({
                            lawyer_id: userId,
                            specialty_id: spec.id,
                        })),
                    });
                }
            }

            // Fetch updated lawyer details
            const include = {
                roles: true,
                lawyer_details: {
                    include: {
                        lawyer_specialties: {
                            include: {
                                specialties: true
                            }
                        },
                        lawyer_experiences: {
                            where: { deleted_at: null },
                            orderBy: { start_date: 'desc' }
                        },
                        lawyer_certificates: {
                            where: { deleted_at: null }
                        },
                        ratings: {
                            where: { deleted_at: null },
                            include: {
                                users: true
                            },
                            orderBy: { created_at: 'desc' }
                        }
                    }
                }
            };

            return tx.users.findFirst({
                where: {
                    id: userId,
                    deleted_at: null,
                },
                include,
            });
        });
    }
}


export const LawyerRepository = new Repository();
