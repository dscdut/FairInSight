import { LawyerRepository } from '../lawyer.repository';
import { NotFoundException } from 'packages/httpException';

class Service {
    constructor() {
        this.repository = LawyerRepository;
    }

    async listLawyers({ page, size, filter }) {
        const { items, total } = await this.repository.listLawyers({ page, size, filter });

        const transformed = items.map(user => {
            const lawyerDetails = user.lawyer_details || {};
            
            // Extract specializations
            const specializations = (lawyerDetails.lawyer_specialties || []).map(ls => ls.specialties.name);
            
            // Extract a bio / careerHistory
            const bio = lawyerDetails.bio || '';
            const experiences = lawyerDetails.lawyer_experiences || [];
            const latestExperience = experiences.length > 0 ? experiences[0].description : '';
            const careerHistory = latestExperience || bio;

            return {
                id: user.id,
                fullName: user.full_name,
                avatar: user.avatar_url,
                careerHistory: careerHistory,
                bio: bio,
                averageRating: lawyerDetails.rating_avg || 0,
                successfulCases: lawyerDetails.successful_cases || 0,
                specializations: specializations,
                city: user.location || '',
            };
        });

        return {
            data: {
                items: transformed,
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

        const lawyerDetails = user.lawyer_details || {};
        const ratings = lawyerDetails.ratings || [];
        const experiences = lawyerDetails.lawyer_experiences || [];

        // Format dates as MM/YYYY
        const formatDate = (date) => {
            if (!date) return null;
            const d = new Date(date);
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${month}/${year}`;
        };

        // Format reviews
        const transformedReviews = ratings.map(r => ({
            comment: r.comment || '',
            createdAt: r.created_at?.toISOString() || null,
            rating: r.rating || 0,
            reviewId: `rev_${r.user_id.slice(0, 8)}`,
            reviewerAvatar: r.users?.avatar_url || null,
            reviewerName: r.users?.full_name || ''
        }));

        // Format specializations
        const specializations = (lawyerDetails.lawyer_specialties || []).map(ls => ls.specialties.name);

        // Format milestones
        const careerMilestones = experiences.map(exp => ({
            description: exp.description || '',
            endDate: formatDate(exp.end_date) || 'Present',
            startDate: formatDate(exp.start_date) || '',
            title: exp.title || ''
        }));

        // Extract a bio / careerHistory
        const bio = lawyerDetails.bio || '';
        const latestExperience = experiences.length > 0 ? experiences[0].description : '';
        const careerHistory = latestExperience || bio;

        const certificate = lawyerDetails.lawyer_certificates?.[0];

        return {
            data: {
                items: transformedReviews,
                summary: {
                    averageRating: lawyerDetails.rating_avg || 0,
                    careerHistory: careerHistory,
                    careerMilestones: careerMilestones,
                    consultingFee: lawyerDetails.price_per_hour ? Number(lawyerDetails.price_per_hour) : 0,
                    experienceYears: lawyerDetails.experience_years || 0,
                    licenseInfo: {
                        isVerified: lawyerDetails.is_verified || false,
                        licenseFileUrl: certificate?.file_url || null,
                        licenseIssuer: lawyerDetails.bar_association || '',
                        licenseNumber: lawyerDetails.license_number || ''
                    },
                    name: user.full_name,
                    role: user.roles?.name?.toLowerCase() || 'lawyer',
                    specializations: specializations
                }
            }
        };
    }
}


export const LawyerService = new Service();
