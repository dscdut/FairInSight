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
        const user = await this.repository.findLawyerById(id);
        if (!user) {
            throw new NotFoundException('Lawyer not found');
        }

        return mapLawyerDetail(user);
    }

    async updateProfile(userId, updateDto) {
        // Check if the lawyer exists
        const lawyer = await this.repository.findById(userId);
        if (!lawyer) {
            throw new NotFoundException('Lawyer not found');
        }

        const userPayload = {
            full_name: updateDto.fullName,
            phone: updateDto.phone,
            location: updateDto.location,
            avatar_url: updateDto.avatarUrl,
            date_of_birth: updateDto.dateOfBirth ? new Date(updateDto.dateOfBirth) : undefined,
        };

        const lawyerDetailsPayload = {
            bio: updateDto.bio,
            experience_years: updateDto.experienceYears,
            price_per_hour: updateDto.consultingFee,
            status: updateDto.status,
            bar_association: updateDto.barAssociation,
            license_number: updateDto.licenseNumber,
        };

        const updatedLawyer = await this.repository.updateLawyerProfile(userId, {
            userPayload,
            lawyerDetailsPayload,
            specializations: updateDto.specializations,
        });

        if (!updatedLawyer) {
            throw new NotFoundException('Lawyer not found after update');
        }

        return mapLawyerDetail(updatedLawyer);
    }
}


export const LawyerService = new Service();
