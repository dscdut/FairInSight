import prisma from 'core/database';
import { BaseRepository } from '../../common/base.repository';

const withoutUndefined = payload => Object.fromEntries(
    Object.entries(payload || {}).filter(([, value]) => value !== undefined)
);

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

        const orderBy = filter.sortByRating === 'true' || filter.sortByRating === true
            ? { lawyer_details: { rating_avg: 'desc' } }
            : { created_at: 'desc' };

        const [items, total] = await Promise.all([
            prisma.users.findMany({
                where,
                include,
                skip,
                take: size,
                orderBy
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
                }
            },
            include
        });
    }

    async recommendBySpecialties(specialties, limit = 5) {
        return prisma.users.findMany({
            where: {
                deleted_at: null,
                roles: { name: 'LAWYER' },
                lawyer_details: {
                    is_verified: true,
                    deleted_at: null,
                    lawyer_specialties: {
                        some: { specialties: { name: { in: specialties, mode: 'insensitive' } } },
                    },
                },
            },
            include: {
                lawyer_details: {
                    include: {
                        lawyer_specialties: { include: { specialties: true } },
                        lawyer_experiences: { where: { deleted_at: null }, orderBy: { start_date: 'desc' } },
                    },
                },
            },
            orderBy: [
                { lawyer_details: { rating_avg: 'desc' } },
                { lawyer_details: { experience_years: 'desc' } },
                { id: 'asc' },
            ],
            take: limit,
        });
    }

    async createLawyer({ userPayload, lawyerDetailsPayload, specializations }) {
        return prisma.$transaction(async tx => {
            const lawyerRole = await tx.roles.findFirst({ where: { name: 'LAWYER' } });
            if (!lawyerRole) throw new Error('LAWYER role not found');
            const user = await tx.users.create({
                data: {
                    ...withoutUndefined(userPayload),
                    role_id: lawyerRole.id,
                },
            });

            await tx.lawyer_details.create({
                data: {
                    user_id: user.id,
                    ...withoutUndefined(lawyerDetailsPayload),
                },
            });

            if (Array.isArray(specializations) && specializations.length > 0) {
                const foundSpecialties = await tx.specialties.findMany({
                    where: {
                        name: { in: specializations },
                    },
                });
                if (foundSpecialties.length > 0) {
                    await tx.lawyer_specialties.createMany({
                        data: foundSpecialties.map(spec => ({
                            lawyer_id: user.id,
                            specialty_id: spec.id,
                        })),
                    });
                }
            }

            return tx.users.findFirst({
                where: {
                    id: user.id,
                    deleted_at: null,
                },
                include: {
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
                },
            });
        });
    }

    async softDeleteLawyer(userId) {
        return prisma.users.update({
            where: { id: userId },
            data: { deleted_at: new Date() },
        });
    }

    async updateLawyerProfile(userId, { userPayload, lawyerDetailsPayload, specializations }) {
        return prisma.$transaction(async tx => {
            const cleanUserPayload = withoutUndefined(userPayload);
            const cleanLawyerDetailsPayload = withoutUndefined(lawyerDetailsPayload);

            // Update users table
            if (Object.keys(cleanUserPayload).length > 0) {
                await tx.users.update({
                    where: { id: userId },
                    data: cleanUserPayload,
                });
            }

            // Update lawyer_details using upsert to prevent issues if details do not exist
            if (Object.keys(cleanLawyerDetailsPayload).length > 0) {
                await tx.lawyer_details.upsert({
                    where: { user_id: userId },
                    create: {
                        user_id: userId,
                        ...cleanLawyerDetailsPayload,
                    },
                    update: cleanLawyerDetailsPayload,
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
