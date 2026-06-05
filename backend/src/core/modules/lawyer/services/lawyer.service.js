import { LawyerRepository } from '../lawyer.repository';

class Service {
    constructor() {
        this.repository = LawyerRepository;
    }

    async listLawyers({ page, size, filters }) {
        const { items, total } = await this.repository.listLawyers({ page, size, filters });

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
}

export const LawyerService = new Service();
