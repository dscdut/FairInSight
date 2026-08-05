import prisma from 'core/database';
import { BcryptService } from 'core/modules/auth';
import { NotFoundException } from 'packages/httpException';
import { LawyerRepository } from '../lawyer.repository';
import { mapLawyerListItem, mapLawyerDetail } from './lawyer.mapper';

const DOMAIN_TO_SPECIALTY = {
    doanh_nghiep: 'Doanh nghiệp',
    dau_tu: 'Đầu tư - Đấu thầu',
    thuong_mai: 'Thương mại',
    tai_chinh: 'Tài chính - Ngân hàng',
    thue: 'Thuế - Phí - Lệ phí',
    chung_khoan: 'Chứng khoán',
    bao_hiem: 'Bảo hiểm',
    dat_dai: 'Đất đai - Nhà ở',
    xay_dung: 'Xây dựng - Đô thị',
    tai_nguyen_moi_truong: 'Tài nguyên - Môi trường',
    nong_nghiep: 'Nông nghiệp',
    giao_thong_van_tai: 'Giao thông vận tải',
    nang_luong: 'Năng lượng',
    dan_su: 'Dân sự',
    hon_nhan: 'Hôn nhân - Gia đình',
    hon_nhan_gia_dinh: 'Hôn nhân - Gia đình',
    lao_dong: 'Lao động',
    chinh_sach_xa_hoi: 'Chính sách xã hội',
    y_te: 'Y tế - Dược',
    giao_duc: 'Giáo dục - Đào tạo',
    van_hoa: 'Văn hóa - Thể thao - Du lịch',
    hanh_chinh: 'Hành chính - Bộ máy NN',
    can_bo_cong_chuc: 'Cán bộ - Công chức - Viên chức',
    hinh_su: 'Hình sự',
    to_tung: 'Tố tụng - Thi hành án',
    an_ninh_quoc_phong: 'An ninh - Quốc phòng',
    khoa_hoc_cong_nghe: 'Khoa học - Công nghệ - CNTT',
    cong_nghiep: 'Công nghiệp - Sản xuất',
    dan_toc_ton_giao: 'Dân tộc - Tôn giáo',
    ngoai_giao: 'Ngoại giao - Điều ước quốc tế',
    thanh_tra: 'Thanh tra - Khiếu nại - PCTN'
};

const normalizeSpecialties = specialties => [...new Set(
    String(specialties || '')
        .split(',')
        .map(value => value.trim())
        .filter(Boolean)
        .map(value => DOMAIN_TO_SPECIALTY[value.toLocaleLowerCase('vi')] || value)
)].slice(0, 10);

class Service {
    constructor() {
        this.repository = LawyerRepository;
        this.bcryptService = BcryptService;
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

    async createLawyer(createDto) {
        const createdLawyer = await this.repository.createLawyer({
            userPayload: {
                email: createDto.email,
                password_hash: this.bcryptService.hash(createDto.password),
                full_name: createDto.fullName,
                phone: createDto.phone,
                location: createDto.location,
                avatar_url: createDto.avatarUrl,
                is_email_confirmed: true,
            },
            lawyerDetailsPayload: {
                bio: createDto.bio,
                experience_years: createDto.experienceYears,
                successful_cases: createDto.successfulCases,
                price_per_hour: createDto.consultingFee,
                status: createDto.status || 'AVAILABLE',
                bar_association: createDto.barAssociation,
                license_number: createDto.licenseNumber,
                is_verified: true,
            },
            specializations: normalizeSpecialties(createDto.specializations),
        });

        return mapLawyerDetail(createdLawyer);
    }

    async adminUpdateProfile(userId, updateDto) {
        const lawyer = await this.repository.findLawyerById(userId);
        if (!lawyer) {
            throw new NotFoundException('Lawyer not found');
        }

        const userPayload = {
            email: updateDto.email,
            full_name: updateDto.fullName,
            phone: updateDto.phone,
            location: updateDto.location,
            avatar_url: updateDto.avatarUrl,
            date_of_birth: updateDto.dateOfBirth ? new Date(updateDto.dateOfBirth) : undefined,
        };

        const lawyerDetailsPayload = {
            bio: updateDto.bio,
            experience_years: updateDto.experienceYears,
            successful_cases: updateDto.successfulCases,
            price_per_hour: updateDto.consultingFee,
            is_verified: updateDto.isVerified,
            status: updateDto.status,
            bar_association: updateDto.barAssociation,
            license_number: updateDto.licenseNumber,
        };

        const updatedLawyer = await this.repository.updateLawyerProfile(userId, {
            userPayload,
            lawyerDetailsPayload,
            specializations: updateDto.specializations === undefined
                ? undefined
                : normalizeSpecialties(updateDto.specializations),
        });

        if (!updatedLawyer) {
            throw new NotFoundException('Lawyer not found after update');
        }

        return mapLawyerDetail(updatedLawyer);
    }

    async deleteLawyer(userId) {
        const lawyer = await this.repository.findLawyerById(userId);
        if (!lawyer) {
            throw new NotFoundException('Lawyer not found');
        }
        await this.repository.softDeleteLawyer(userId);
        return true;
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
            successful_cases: updateDto.successfulCases,
            price_per_hour: updateDto.consultingFee,
            status: updateDto.status,
            bar_association: updateDto.barAssociation,
            license_number: updateDto.licenseNumber,
        };

        const updatedLawyer = await this.repository.updateLawyerProfile(userId, {
            userPayload,
            lawyerDetailsPayload,
            specializations: updateDto.specializations === undefined
                ? undefined
                : normalizeSpecialties(updateDto.specializations),
        });

        if (!updatedLawyer) {
            throw new NotFoundException('Lawyer not found after update');
        }

        return mapLawyerDetail(updatedLawyer);
    }

    async recommend({ specialties, limit = 5 }) {
        const normalized = normalizeSpecialties(specialties);
        if (!normalized.length) return { data: { items: [], reason: 'MISSING_VERIFIED_ISSUE_TAGS' } };
        const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 10);
        const lawyers = await this.repository.recommendBySpecialties(normalized, safeLimit);
        return {
            data: {
                items: lawyers.map(user => ({
                    ...mapLawyerListItem(user),
                    matchedSpecialties: user.lawyer_details.lawyer_specialties
                        .map(item => item.specialties.name)
                        .filter(name => normalized.some(tag => tag.toLocaleLowerCase('vi') === name.toLocaleLowerCase('vi'))),
                })),
                reason: lawyers.length ? null : 'NO_VERIFIED_LAWYER_MATCH',
            },
        };
    }
}


export const LawyerService = new Service();
