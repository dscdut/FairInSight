/**
 * Formats a date to MM/YYYY string.
 * @param {Date|string|null} date
 * @returns {string|null}
 */
const formatDate = date => {
    if (!date) return null;
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${year}`;
};

/**
 * Maps a rating record to a review response object.
 * @param {object} r
 * @returns {object}
 */
const mapReview = r => ({
    comment: r.comment || '',
    createdAt: r.created_at?.toISOString() || null,
    rating: r.rating || 0,
    reviewId: `rev_${r.user_id.slice(0, 8)}`,
    reviewerAvatar: r.users?.avatar_url || null,
    reviewerName: r.users?.full_name || '',
});

/**
 * Maps an experience record to a career milestone object.
 * @param {object} exp
 * @returns {object}
 */
const mapCareerMilestone = exp => ({
    description: exp.description || '',
    endDate: formatDate(exp.end_date) || 'Present',
    startDate: formatDate(exp.start_date) || '',
    title: exp.title || '',
});

/**
 * Extracts specialization names from lawyer_specialties.
 * @param {Array} lawyerSpecialties
 * @returns {string[]}
 */
const mapSpecializations = (lawyerSpecialties = []) =>
    lawyerSpecialties.map(ls => ls.specialties.name);

/**
 * Maps a lawyer list item to a summary card object.
 * @param {object} user
 * @returns {object}
 */
export const mapLawyerListItem = user => {
    const lawyerDetails = user.lawyer_details || {};
    const specializations = mapSpecializations(lawyerDetails.lawyer_specialties);
    const bio = lawyerDetails.bio || '';
    const experiences = lawyerDetails.lawyer_experiences || [];
    const latestExperience = experiences.length > 0 ? experiences[0].description : '';
    const careerHistory = latestExperience || bio;

    return {
        id: user.id,
        fullName: user.full_name,
        avatar: user.avatar_url,
        careerHistory,
        bio,
        averageRating: lawyerDetails.rating_avg || 0,
        successfulCases: lawyerDetails.successful_cases || 0,
        specializations,
        location: user.location || '',
    };
};

/**
 * Maps a full lawyer record (with details) to the getLawyerById response shape.
 * @param {object} user
 * @returns {object}
 */
export const mapLawyerDetail = user => {
    const lawyerDetails = user.lawyer_details || {};
    const ratings = lawyerDetails.ratings || [];
    const experiences = lawyerDetails.lawyer_experiences || [];

    const reviews = ratings.map(mapReview);
    const specializations = mapSpecializations(lawyerDetails.lawyer_specialties);
    const careerMilestones = experiences.map(mapCareerMilestone);

    const bio = lawyerDetails.bio || '';
    const latestExperience = experiences.length > 0 ? experiences[0].description : '';
    const careerHistory = latestExperience || bio;

    const certificate = lawyerDetails.lawyer_certificates?.[0];

    return {
        data: {
            items: reviews,
            summary: {
                id: user.id,
                email: user.email,
                phone: user.phone ?? '',
                location: user.location ?? '',
                avatarUrl: user.avatar_url ?? null,
                avatar: user.avatar_url ?? null,
                name: user.full_name,
                role: (user.roles?.name || 'lawyer').toLowerCase(),
                roleName: (user.roles?.name || 'lawyer').toUpperCase(),
                bio,
                averageRating: lawyerDetails.rating_avg || 0,
                careerHistory,
                careerMilestones,
                consultingFee: lawyerDetails.price_per_hour
                    ? Number(lawyerDetails.price_per_hour)
                    : 0,
                experienceYears: lawyerDetails.experience_years || 0,
                successfulCases: lawyerDetails.successful_cases || 0,
                lawyerStatus: lawyerDetails.status || 'OFFLINE',
                status: user.banned_by ? 'BANNED' : (!user.is_email_confirmed ? 'INACTIVE' : 'ACTIVE'),
                licenseInfo: {
                    isVerified: lawyerDetails.is_verified || false,
                    licenseFileUrl: certificate?.file_url || null,
                    licenseIssuer: lawyerDetails.bar_association || '',
                    licenseNumber: lawyerDetails.license_number || '',
                },
                specializations,
                createdAt: user.created_at ?? null,
                updatedAt: user.updated_at ?? null,
            },
        },
    };
};
