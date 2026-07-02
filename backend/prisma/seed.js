/* eslint-disable */
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting database seeding...');

    // =========================
    // ROLES
    // =========================
    console.log('Creating roles...');
    const roles = ['USER', 'LAWYER', 'ADMIN'];
    const roleMap = {};

    for (const roleName of roles) {
        const role = await prisma.roles.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName },
        });
        roleMap[roleName] = role.id;
    }

    // =========================
    // SPECIALTIES
    // =========================
    console.log('Creating specialties...');
    const specialties = ['Hình sự', 'Dân sự', 'Doanh nghiệp', 'Đất đai', 'Hôn nhân', 'Lao động'];
    for (const specName of specialties) {
        await prisma.specialties.upsert({
            where: { name: specName },
            update: {},
            create: { name: specName },
        });
    }

    // =========================
    // USERS
    // =========================
    console.log('Creating users...');
    const passwordHash = await bcrypt.hash('ADMIN@123456', 10);

    const users = [
        {
            email: 'admin@gmail.com',
            full_name: 'Admin User',
            role_id: roleMap['ADMIN'],
            phone: '0900000001',
            location: 'Da Nang, Vietnam',
            is_email_confirmed: true,
        },
        {
            email: 'lawyer@gmail.com',
            full_name: 'Lawyer User',
            role_id: roleMap['LAWYER'],
            phone: '0900000002',
            location: 'Ho Chi Minh City, Vietnam',
            is_email_confirmed: true,
            avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
        },
        {
            email: 'user@gmail.com',
            full_name: 'Normal User',
            role_id: roleMap['USER'],
            phone: '0912832123',
            location: 'Hanoi, Vietnam',
            is_email_confirmed: true,
        },
        // 10 new professional lawyers
        {
            email: 'tri.nguyen@law.com',
            full_name: 'Nguyễn Minh Trí',
            role_id: roleMap['LAWYER'],
            phone: '0912345671',
            location: 'Hanoi',
            is_email_confirmed: true,
            avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
        },
        {
            email: 'mai.le@law.com',
            full_name: 'Lê Thị Mai',
            role_id: roleMap['LAWYER'],
            phone: '0912345672',
            location: 'Ho Chi Minh City',
            is_email_confirmed: true,
            avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        },
        {
            email: 'khanh.pham@law.com',
            full_name: 'Phạm Quốc Khánh',
            role_id: roleMap['LAWYER'],
            phone: '0912345673',
            location: 'Da Nang',
            is_email_confirmed: true,
            avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        },
        {
            email: 'son.hoang@law.com',
            full_name: 'Hoàng Xuân Sơn',
            role_id: roleMap['LAWYER'],
            phone: '0912345674',
            location: 'Hanoi',
            is_email_confirmed: true,
            avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        },
        {
            email: 'oanh.vu@law.com',
            full_name: 'Vũ Thị Kim Oanh',
            role_id: roleMap['LAWYER'],
            phone: '0912345675',
            location: 'Hai Phong',
            is_email_confirmed: true,
            avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
        },
        {
            email: 'long.dang@law.com',
            full_name: 'Đặng Hoàng Long',
            role_id: roleMap['LAWYER'],
            phone: '0912345676',
            location: 'Ho Chi Minh City',
            is_email_confirmed: true,
            avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
        },
        {
            email: 'tuan.bui@law.com',
            full_name: 'Bùi Minh Tuấn',
            role_id: roleMap['LAWYER'],
            phone: '0912345677',
            location: 'Can Tho',
            is_email_confirmed: true,
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        },
        {
            email: 'hai.do@law.com',
            full_name: 'Đỗ Thanh Hải',
            role_id: roleMap['LAWYER'],
            phone: '0912345678',
            location: 'Da Nang',
            is_email_confirmed: true,
            avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        },
        {
            email: 'diep.phan@law.com',
            full_name: 'Phan Ngọc Diệp',
            role_id: roleMap['LAWYER'],
            phone: '0912345679',
            location: 'Nha Trang',
            is_email_confirmed: true,
            avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        },
        {
            email: 'dung.trinh@law.com',
            full_name: 'Trịnh Tiến Dũng',
            role_id: roleMap['LAWYER'],
            phone: '0912345680',
            location: 'Hanoi',
            is_email_confirmed: true,
            avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        }
    ];

    const createdUsers = {};
    for (const userData of users) {
        let user = await prisma.users.findFirst({
            where: { email: userData.email, deleted_at: null },
        });

        if (user) {
            user = await prisma.users.update({
                where: { id: user.id },
                data: {
                    full_name: userData.full_name,
                    role_id: userData.role_id,
                    password_hash: passwordHash,
                    phone: userData.phone,
                    location: userData.location,
                    avatar_url: userData.avatar_url || null,
                    is_email_confirmed: userData.is_email_confirmed,
                },
            });
        } else {
            user = await prisma.users.create({
                data: {
                    ...userData,
                    password_hash: passwordHash,
                },
            });
        }
        createdUsers[userData.email] = user;
    }

    // =========================
    // LAWYER DETAILS & SPECIALTIES
    // =========================
    console.log('Creating lawyer details and specializations...');
    
    // Find specialties map
    const dbSpecs = await prisma.specialties.findMany();
    const specMap = {};
    dbSpecs.forEach(s => {
        specMap[s.name] = s.id;
    });

    const lawyerDetailsData = [
        {
            email: 'lawyer@gmail.com',
            bio: 'Luật sư chuyên về dân sự và doanh nghiệp với hơn 5 năm kinh nghiệm.',
            experience_years: 5,
            rating_avg: 4.5,
            price_per_hour: 500000,
            bar_association: 'Đoàn Luật sư TP.HCM',
            license_number: 'LAW123456',
            specs: ['Dân sự', 'Doanh nghiệp']
        },
        {
            email: 'tri.nguyen@law.com',
            bio: 'Luật sư cao cấp chuyên bào chữa các vụ án hình sự phức tạp và giải quyết tranh chấp hợp đồng dân sự.',
            experience_years: 12,
            rating_avg: 4.9,
            price_per_hour: 1500000,
            bar_association: 'Đoàn Luật sư Hà Nội',
            license_number: 'LAW888777',
            specs: ['Hình sự', 'Dân sự']
        },
        {
            email: 'mai.le@law.com',
            bio: 'Tư vấn ly hôn, quyền nuôi con và phân chia tài sản gia đình chuyên nghiệp, tận tâm.',
            experience_years: 8,
            rating_avg: 4.8,
            price_per_hour: 1000000,
            bar_association: 'Đoàn Luật sư TP.HCM',
            license_number: 'LAW666555',
            specs: ['Hôn nhân', 'Dân sự']
        },
        {
            email: 'khanh.pham@law.com',
            bio: 'Tư vấn pháp luật doanh nghiệp, mua bán sáp nhập (M&A) và giải quyết tranh chấp lao động.',
            experience_years: 10,
            rating_avg: 4.7,
            price_per_hour: 1200000,
            bar_association: 'Đoàn Luật sư Đà Nẵng',
            license_number: 'LAW444333',
            specs: ['Doanh nghiệp', 'Lao động']
        },
        {
            email: 'son.hoang@law.com',
            bio: 'Chuyên gia pháp lý hàng đầu về tranh chấp đất đai, cấp sổ đỏ và giải quyết khiếu nại đền bù đất đai.',
            experience_years: 15,
            rating_avg: 4.9,
            price_per_hour: 2000000,
            bar_association: 'Đoàn Luật sư Hà Nội',
            license_number: 'LAW111222',
            specs: ['Đất đai', 'Dân sự']
        },
        {
            email: 'oanh.vu@law.com',
            bio: 'Hỗ trợ pháp lý về bảo hiểm xã hội, tranh chấp tiền lương và soạn thảo quy chế lao động nội bộ doanh nghiệp.',
            experience_years: 6,
            rating_avg: 4.6,
            price_per_hour: 800000,
            bar_association: 'Đoàn Luật sư Hải Phòng',
            license_number: 'LAW333222',
            specs: ['Lao động', 'Doanh nghiệp']
        },
        {
            email: 'long.dang@law.com',
            bio: 'Bào chữa các tội danh hình sự kinh tế, chức vụ, tham nhũng và các tội vi phạm trật tự quản lý xã hội.',
            experience_years: 7,
            rating_avg: 4.5,
            price_per_hour: 900000,
            bar_association: 'Đoàn Luật sư TP.HCM',
            license_number: 'LAW555444',
            specs: ['Hình sự']
        },
        {
            email: 'tuan.bui@law.com',
            bio: 'Thành lập doanh nghiệp đầu tư nước ngoài, xin giấy phép con và tư vấn bảo hộ sở hữu trí tuệ.',
            experience_years: 9,
            rating_avg: 4.7,
            price_per_hour: 1100000,
            bar_association: 'Đoàn Luật sư Cần Thơ',
            license_number: 'LAW777888',
            specs: ['Doanh nghiệp']
        },
        {
            email: 'hai.do@law.com',
            bio: 'Chuyên gia tư vấn pháp lý giao dịch bất động sản dự án, chuyển nhượng đất đai và tranh chấp quyền sử dụng đất.',
            experience_years: 11,
            rating_avg: 4.8,
            price_per_hour: 1600000,
            bar_association: 'Đoàn Luật sư Đà Nẵng',
            license_number: 'LAW999000',
            specs: ['Đất đai']
        },
        {
            email: 'diep.phan@law.com',
            bio: 'Hỗ trợ các vụ việc kết hôn có yếu tố nước ngoài, ly hôn thuận tình nhanh và ly hôn đơn phương vắng mặt.',
            experience_years: 5,
            rating_avg: 4.4,
            price_per_hour: 700000,
            bar_association: 'Đoàn Luật sư Khánh Hoà',
            license_number: 'LAW121212',
            specs: ['Hôn nhân']
        },
        {
            email: 'dung.trinh@law.com',
            bio: 'Luật sư tranh tụng kỳ cựu tại tòa án các cấp trong các vụ án dân sự phức tạp và đại diện ngoài tố tụng.',
            experience_years: 14,
            rating_avg: 4.9,
            price_per_hour: 1800000,
            bar_association: 'Đoàn Luật sư Hà Nội',
            license_number: 'LAW232323',
            specs: ['Dân sự', 'Hình sự']
        }
    ];

    for (const data of lawyerDetailsData) {
        const user = createdUsers[data.email];
        if (!user) continue;

        // Upsert lawyer details
        await prisma.lawyer_details.upsert({
            where: { user_id: user.id },
            update: {
                bio: data.bio,
                experience_years: data.experience_years,
                is_verified: true,
                rating_avg: data.rating_avg,
                price_per_hour: data.price_per_hour,
                bar_association: data.bar_association,
                license_number: data.license_number,
                status: 'AVAILABLE',
            },
            create: {
                user_id: user.id,
                bio: data.bio,
                experience_years: data.experience_years,
                is_verified: true,
                rating_avg: data.rating_avg,
                price_per_hour: data.price_per_hour,
                bar_association: data.bar_association,
                license_number: data.license_number,
                status: 'AVAILABLE',
            },
        });

        // Delete old specialties for clean seed
        await prisma.lawyer_specialties.deleteMany({
            where: { lawyer_id: user.id }
        });

        // Insert lawyer specialties
        for (const specName of data.specs) {
            const specId = specMap[specName];
            if (specId) {
                await prisma.lawyer_specialties.create({
                    data: {
                        lawyer_id: user.id,
                        specialty_id: specId
                    }
                });
            }
        }

        // Delete old certificates for clean seed
        await prisma.lawyer_certificates.deleteMany({
            where: { lawyer_id: user.id }
        });

        // Insert lawyer certificates
        await prisma.lawyer_certificates.createMany({
            data: [
                {
                    lawyer_id: user.id,
                    certificate_name: 'Thẻ hành nghề Luật sư',
                    file_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400',
                    issued_by: 'Bộ Tư pháp Việt Nam',
                    issue_date: new Date('2020-01-15')
                },
                {
                    lawyer_id: user.id,
                    certificate_name: 'Chứng chỉ Đào tạo Nghề Luật sư',
                    file_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400',
                    issued_by: 'Học viện Tư pháp',
                    issue_date: new Date('2018-06-10')
                }
            ]
        });
    }

    // =========================
    // TEMPLATES (Kho biểu mẫu)
    // =========================
    console.log('Seeding templates...');
    const templateDir = path.join(__dirname, '../../templates');

    console.log('Uploading components.html to Cloudinary...');
    const componentsPath = path.join(templateDir, 'components.html');
    if (fs.existsSync(componentsPath)) {
        try {
            await cloudinary.uploader.upload(componentsPath, {
                public_id: 'components.html',
                folder: 'templates',
                resource_type: 'raw',
                type: 'upload'
            });
        } catch (e) {
            console.warn('Cloudinary upload for components.html failed, using mock fallback:', e.message);
        }
    }

    const templatesToSeed = [
        {
            id: 'd3b07384-d113-4c9f-a2e6-ebcd2a2f8c5b',
            name: 'Hợp đồng nhượng quyền thương mại',
            description: 'Biểu mẫu hợp đồng nhượng quyền thương mại chuẩn chỉnh, áp dụng cho các chuỗi nhượng quyền bán lẻ và dịch vụ.',
            fileName: 'hop_dong_nhuong_quyen.html',
            fields: [
                {
                    section: 'Thông tin cá nhân',
                    inputs: [
                        { key: 'fullName', label: 'Họ và Tên', type: 'text', defaultValue: 'Lê Văn B', required: true },
                        { key: 'phone', label: 'Số điện thoại', type: 'text', defaultValue: '01234567', required: true },
                        { key: 'dob', label: 'Ngày sinh', type: 'text', defaultValue: '01/01/2000', required: true },
                        { key: 'idNumber', label: 'Số CCCD/CMND', type: 'text', defaultValue: '012345678910', required: true },
                        { key: 'permanentAddress', label: 'Địa chỉ thường trú', type: 'text', defaultValue: 'Đà Nẵng, Việt Nam', required: true },
                        { key: 'idIssueInfo', label: 'Ngày cấp, nơi cấp CCCD', type: 'text', defaultValue: '01/01/2019, UBND Huyện ABC, Đà Nẵng', required: true },
                        { key: 'currentAddress', label: 'Địa chỉ hiện tại', type: 'text', defaultValue: 'Đà Nẵng, Việt Nam', required: true }
                    ]
                },
                {
                    section: 'Thông tin hợp đồng',
                    inputs: [
                        { key: 'contractNumber', label: 'Số hợp đồng', type: 'text', defaultValue: '12345678901112345', required: true },
                        { key: 'signDate', label: 'Ngày ký', type: 'date', defaultValue: '2026-06-15', required: true },
                        { key: 'signLocation', label: 'Địa điểm ký', type: 'text', defaultValue: 'ĐN, VN', required: true }
                    ]
                },
                {
                    section: 'Điều khoản tài chính',
                    inputs: [
                        { key: 'contractValue', label: 'Giá trị hợp đồng (VND)', type: 'text', defaultValue: '5,000,000,000', required: true }
                    ]
                }
            ]
        },
        {
            id: 'cf401a02-d224-4f8e-a3f7-fbcd3a3f9c6c',
            name: 'Giấy đề nghị đăng ký doanh nghiệp tư nhân',
            description: 'Biểu mẫu CF401A-02 để đăng ký thành lập doanh nghiệp tư nhân theo quy định của Sở Kế hoạch và Đầu tư.',
            fileName: 'cf401a_02_dntn.html',
            fields: [
                {
                    section: 'Thông tin chủ doanh nghiệp',
                    inputs: [
                        { key: 'ownerName', label: 'Họ và tên chủ doanh nghiệp', type: 'text', defaultValue: 'Nguyễn Văn A', required: true },
                        { key: 'ownerDob', label: 'Ngày sinh', type: 'date', defaultValue: '1990-05-15', required: true },
                        { key: 'ownerGender', label: 'Giới tính', type: 'text', defaultValue: 'Nam', required: true },
                        { key: 'ownerId', label: 'Số CMND/CCCD/Hộ chiếu', type: 'text', defaultValue: '048090001234', required: true }
                    ]
                },
                {
                    section: 'Thông tin doanh nghiệp',
                    inputs: [
                        { key: 'businessName', label: 'Tên doanh nghiệp viết bằng tiếng Việt', type: 'text', defaultValue: 'DOANH NGHIỆP TƯ NHÂN THƯƠNG MẠI A', required: true },
                        { key: 'officeAddress', label: 'Địa chỉ trụ sở chính', type: 'text', defaultValue: '123 Nguyễn Hữu Thọ, Hải Châu, Đà Nẵng', required: true },
                        { key: 'capital', label: 'Vốn đầu tư (VND)', type: 'text', defaultValue: '500,000,000', required: true }
                    ]
                }
            ]
        },
        {
            id: 'e4c01b03-d335-4f9e-b4f8-abcd4a4f0d7d',
            name: 'Hợp đồng thuê văn phòng',
            description: 'Mẫu hợp đồng thuê văn phòng làm việc dành cho các doanh nghiệp, quy định rõ ràng trách nhiệm bên thuê và bên cho thuê.',
            fileName: 'hop_dong_thue_van_phong.html',
            fields: [
                {
                    section: 'Thông tin bên cho thuê (Bên A)',
                    inputs: [
                        { key: 'lessorName', label: 'Tên tổ chức/cá nhân', type: 'text', defaultValue: 'Công ty Quản lý Bất động sản OfficeLand', required: true },
                        { key: 'lessorAddress', label: 'Địa chỉ', type: 'text', defaultValue: '456 Lê Lợi, Hải Châu, Đà Nẵng', required: true }
                    ]
                },
                {
                    section: 'Thông tin thuê văn phòng',
                    inputs: [
                        { key: 'area', label: 'Diện tích thuê (m2)', type: 'text', defaultValue: '150', required: true },
                        { key: 'price', label: 'Giá thuê hàng tháng (VND)', type: 'text', defaultValue: '30,000,000', required: true },
                        { key: 'rentPeriod', label: 'Thời hạn thuê (Tháng)', type: 'text', defaultValue: '24', required: true }
                    ]
                }
            ]
        }
    ];

    for (const t of templatesToSeed) {
        const filePath = path.join(templateDir, t.fileName);
        if (!fs.existsSync(filePath)) {
            console.warn(`Warning: Template file ${t.fileName} not found at ${filePath}`);
            continue;
        }

        let secureUrl = `https://res.cloudinary.com/drx34env0/raw/upload/v1700000000/templates/${t.fileName}`;
        console.log(`Uploading ${t.fileName} to Cloudinary...`);
        try {
            const uploadResponse = await cloudinary.uploader.upload(filePath, {
                folder: 'templates',
                resource_type: 'raw',
                type: process.env.CLOUDINARY_TYPE || 'upload'
            });
            secureUrl = uploadResponse.secure_url;
        } catch (e) {
            console.warn(`Cloudinary upload for ${t.fileName} failed, using mock fallback URL:`, e.message);
        }

        console.log(`Saving template "${t.name}" into database...`);
        await prisma.templates.upsert({
            where: { id: t.id },
            update: {
                name: t.name,
                description: t.description,
                file_url: secureUrl,
                fields: t.fields,
                deleted_at: null
            },
            create: {
                id: t.id,
                name: t.name,
                description: t.description,
                file_url: secureUrl,
                fields: t.fields
            }
        });
    }

    console.log('✅ Seed completed successfully');
}

main()
    .catch(e => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });