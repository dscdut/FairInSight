/* eslint-disable */
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

if (process.env.NODE_ENV === 'production') {
    throw new Error('Demo seed is disabled in production');
}
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
}
const databaseHost = new URL(process.env.DATABASE_URL).hostname;
const allowedSeedHosts = new Set(
    (process.env.SEED_ALLOWED_DB_HOSTS || 'localhost,127.0.0.1,db,postgres')
        .split(',')
        .map(value => value.trim())
        .filter(Boolean),
);
if (!allowedSeedHosts.has(databaseHost)) {
    throw new Error('Demo seed target is not in SEED_ALLOWED_DB_HOSTS');
}

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
    const specialties = [
        'Doanh nghiệp',
        'Đầu tư - Đấu thầu',
        'Thương mại',
        'Tài chính - Ngân hàng',
        'Thuế - Phí - Lệ phí',
        'Chứng khoán',
        'Bảo hiểm',
        'Đất đai - Nhà ở',
        'Xây dựng - Đô thị',
        'Tài nguyên - Môi trường',
        'Nông nghiệp',
        'Giao thông vận tải',
        'Năng lượng',
        'Dân sự',
        'Hôn nhân - Gia đình',
        'Lao động',
        'Chính sách xã hội',
        'Y tế - Dược',
        'Giáo dục - Đào tạo',
        'Văn hóa - Thể thao - Du lịch',
        'Hành chính - Bộ máy NN',
        'Cán bộ - Công chức - Viên chức',
        'Hình sự',
        'Tố tụng - Thi hành án',
        'An ninh - Quốc phòng',
        'Khoa học - Công nghệ - CNTT',
        'Công nghiệp - Sản xuất',
        'Dân tộc - Tôn giáo',
        'Ngoại giao - Điều ước quốc tế',
        'Thanh tra - Khiếu nại - PCTN'
    ];
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
    const demoPassword = process.env.SEED_DEMO_PASSWORD || 'ADMIN@123456';
    const passwordHash = await bcrypt.hash(demoPassword, 10);

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
        {
            email: 'user1@gmail.com',
            full_name: 'Free Plan User',
            role_id: roleMap['USER'],
            phone: '0900000011',
            location: 'Da Nang, Vietnam',
            is_email_confirmed: true,
        },
        {
            email: 'user2@gmail.com',
            full_name: 'Plus Plan User',
            role_id: roleMap['USER'],
            phone: '0900000012',
            location: 'Da Nang, Vietnam',
            is_email_confirmed: true,
        },
        {
            email: 'user3@gmail.com',
            full_name: 'Pro Plan User',
            role_id: roleMap['USER'],
            phone: '0900000013',
            location: 'Da Nang, Vietnam',
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
                    phone: userData.phone,
                    location: userData.location,
                    avatar_url: userData.avatar_url || null,
                    is_email_confirmed: userData.is_email_confirmed,
                    password_hash: passwordHash,
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

    const legacyDemoLawyer = createdUsers['lawyer@gmail.com'];
    if (legacyDemoLawyer) {
        await prisma.lawyer_details.updateMany({
            where: { user_id: legacyDemoLawyer.id },
            data: { is_verified: false, status: 'OFFLINE' }
        });
        await prisma.lawyer_specialties.deleteMany({
            where: { lawyer_id: legacyDemoLawyer.id }
        });
    }

    const lawyerDetailsData = [
        {
            email: 'tri.nguyen@law.com',
            bio: 'Luật sư tranh tụng hình sự, dân sự và thi hành án với kinh nghiệm xử lý hồ sơ có rủi ro cao, ưu tiên chiến lược chứng cứ và bảo vệ quyền lợi thân chủ tại tòa.',
            experience_years: 12,
            successful_cases: 168,
            rating_avg: 4.9,
            price_per_hour: 1500000,
            bar_association: 'Đoàn Luật sư Hà Nội',
            license_number: 'LS-HN-2014-0888',
            specs: ['Hình sự', 'Tố tụng - Thi hành án', 'Dân sự', 'Thanh tra - Khiếu nại - PCTN', 'An ninh - Quốc phòng'],
            experiences: [
                {
                    title: 'Luật sư điều hành - Nhóm tranh tụng',
                    description: 'Đại diện và bào chữa trong các vụ án hình sự, dân sự và khiếu nại hành chính phức tạp.',
                    start_date: '2017-01-01'
                }
            ]
        },
        {
            email: 'mai.le@law.com',
            bio: 'Tư vấn ly hôn, quyền nuôi con, tài sản chung và các giao dịch dân sự liên quan đến nhà đất trong gia đình. Phong cách làm việc rõ ràng, kín đáo, ưu tiên hòa giải khi có thể.',
            experience_years: 8,
            successful_cases: 124,
            rating_avg: 4.8,
            price_per_hour: 1000000,
            bar_association: 'Đoàn Luật sư TP.HCM',
            license_number: 'LS-HCM-2018-0666',
            specs: ['Hôn nhân - Gia đình', 'Dân sự', 'Đất đai - Nhà ở', 'Chính sách xã hội', 'Tố tụng - Thi hành án'],
            experiences: [
                {
                    title: 'Luật sư gia đình và dân sự',
                    description: 'Xử lý hồ sơ ly hôn, nuôi con, chia tài sản và tranh chấp dân sự sau hôn nhân.',
                    start_date: '2018-03-01'
                }
            ]
        },
        {
            email: 'khanh.pham@law.com',
            bio: 'Tư vấn pháp luật doanh nghiệp, thương mại, đầu tư và lao động cho công ty vừa và nhỏ, startup và nhà đầu tư nước ngoài tại miền Trung.',
            experience_years: 10,
            successful_cases: 156,
            rating_avg: 4.7,
            price_per_hour: 1200000,
            bar_association: 'Đoàn Luật sư Đà Nẵng',
            license_number: 'LS-DN-2016-0444',
            specs: ['Doanh nghiệp', 'Thương mại', 'Đầu tư - Đấu thầu', 'Lao động', 'Thuế - Phí - Lệ phí'],
            experiences: [
                {
                    title: 'Cố vấn pháp chế doanh nghiệp',
                    description: 'Tư vấn thành lập, vận hành, hợp đồng thương mại, thuế và quan hệ lao động cho doanh nghiệp.',
                    start_date: '2016-06-01'
                }
            ]
        },
        {
            email: 'son.hoang@law.com',
            bio: 'Chuyên sâu tranh chấp đất đai, bồi thường thu hồi đất, giấy chứng nhận quyền sử dụng đất, xây dựng và thủ tục hành chính liên quan đến dự án bất động sản.',
            experience_years: 15,
            successful_cases: 210,
            rating_avg: 4.9,
            price_per_hour: 2000000,
            bar_association: 'Đoàn Luật sư Hà Nội',
            license_number: 'LS-HN-2011-0111',
            specs: ['Đất đai - Nhà ở', 'Xây dựng - Đô thị', 'Tài nguyên - Môi trường', 'Hành chính - Bộ máy NN', 'Thanh tra - Khiếu nại - PCTN'],
            experiences: [
                {
                    title: 'Luật sư đất đai và hành chính',
                    description: 'Đại diện khách hàng trong khiếu nại thu hồi đất, cấp sổ, quy hoạch và giấy phép xây dựng.',
                    start_date: '2012-02-01'
                }
            ]
        },
        {
            email: 'oanh.vu@law.com',
            bio: 'Hỗ trợ pháp lý lao động, bảo hiểm, tiền lương, kỷ luật lao động và chính sách nội bộ. Có kinh nghiệm làm việc với doanh nghiệp sản xuất và người lao động.',
            experience_years: 6,
            successful_cases: 89,
            rating_avg: 4.6,
            price_per_hour: 800000,
            bar_association: 'Đoàn Luật sư Hải Phòng',
            license_number: 'LS-HP-2020-0333',
            specs: ['Lao động', 'Bảo hiểm', 'Chính sách xã hội', 'Doanh nghiệp', 'Cán bộ - Công chức - Viên chức'],
            experiences: [
                {
                    title: 'Luật sư lao động và bảo hiểm',
                    description: 'Tư vấn tranh chấp lương, bảo hiểm xã hội, chấm dứt hợp đồng và nội quy lao động.',
                    start_date: '2020-04-01'
                }
            ]
        },
        {
            email: 'long.dang@law.com',
            bio: 'Bào chữa và tư vấn trong các vụ án hình sự kinh tế, tài chính, thuế, chứng khoán và tội phạm chức vụ. Tập trung phân tích dòng tiền, hồ sơ kế toán và chứng cứ điện tử.',
            experience_years: 7,
            successful_cases: 96,
            rating_avg: 4.5,
            price_per_hour: 900000,
            bar_association: 'Đoàn Luật sư TP.HCM',
            license_number: 'LS-HCM-2019-0555',
            specs: ['Hình sự', 'Tài chính - Ngân hàng', 'Thuế - Phí - Lệ phí', 'Chứng khoán', 'Tố tụng - Thi hành án'],
            experiences: [
                {
                    title: 'Luật sư hình sự kinh tế',
                    description: 'Bào chữa và tư vấn rủi ro pháp lý trong các vụ án kinh tế, thuế và ngân hàng.',
                    start_date: '2019-05-01'
                }
            ]
        },
        {
            email: 'tuan.bui@law.com',
            bio: 'Tư vấn đầu tư, công nghệ, sở hữu trí tuệ, thương mại điện tử và sản xuất. Phù hợp hồ sơ startup, chuyển đổi số, hợp đồng phần mềm và giấy phép kinh doanh có điều kiện.',
            experience_years: 9,
            successful_cases: 132,
            rating_avg: 4.7,
            price_per_hour: 1100000,
            bar_association: 'Đoàn Luật sư Cần Thơ',
            license_number: 'LS-CT-2017-0777',
            specs: ['Doanh nghiệp', 'Đầu tư - Đấu thầu', 'Khoa học - Công nghệ - CNTT', 'Công nghiệp - Sản xuất', 'Thương mại'],
            experiences: [
                {
                    title: 'Luật sư công nghệ và đầu tư',
                    description: 'Tư vấn thành lập, gọi vốn, hợp đồng công nghệ và bảo vệ tài sản trí tuệ cho doanh nghiệp.',
                    start_date: '2017-09-01'
                }
            ]
        },
        {
            email: 'hai.do@law.com',
            bio: 'Tư vấn giao dịch bất động sản, dự án hạ tầng, năng lượng, môi trường và vận tải. Có kinh nghiệm rà soát pháp lý dự án và hợp đồng chuyển nhượng quyền sử dụng đất.',
            experience_years: 11,
            successful_cases: 147,
            rating_avg: 4.8,
            price_per_hour: 1600000,
            bar_association: 'Đoàn Luật sư Đà Nẵng',
            license_number: 'LS-DN-2015-0999',
            specs: ['Đất đai - Nhà ở', 'Xây dựng - Đô thị', 'Giao thông vận tải', 'Năng lượng', 'Tài nguyên - Môi trường'],
            experiences: [
                {
                    title: 'Luật sư dự án bất động sản',
                    description: 'Rà soát pháp lý dự án, hợp đồng mua bán, chuyển nhượng, xây dựng và môi trường.',
                    start_date: '2015-08-01'
                }
            ]
        },
        {
            email: 'diep.phan@law.com',
            bio: 'Tư vấn hôn nhân có yếu tố nước ngoài, quốc tịch, lãnh sự, tài sản gia đình và hồ sơ liên quan đến tôn giáo, phong tục, dân tộc trong quan hệ gia đình.',
            experience_years: 5,
            successful_cases: 73,
            rating_avg: 4.4,
            price_per_hour: 700000,
            bar_association: 'Đoàn Luật sư Khánh Hoà',
            license_number: 'LS-KH-2021-1212',
            specs: ['Hôn nhân - Gia đình', 'Ngoại giao - Điều ước quốc tế', 'Dân tộc - Tôn giáo', 'Dân sự', 'Tố tụng - Thi hành án'],
            experiences: [
                {
                    title: 'Luật sư hôn nhân có yếu tố nước ngoài',
                    description: 'Xử lý đăng ký kết hôn, ly hôn, quốc tịch, lãnh sự và tài sản gia đình xuyên biên giới.',
                    start_date: '2021-01-01'
                }
            ]
        },
        {
            email: 'dung.trinh@law.com',
            bio: 'Luật sư tranh tụng dân sự, hành chính và công vụ. Mạnh về đại diện ngoài tố tụng, khiếu nại, tố cáo, trách nhiệm cán bộ và thi hành án.',
            experience_years: 14,
            successful_cases: 188,
            rating_avg: 4.9,
            price_per_hour: 1800000,
            bar_association: 'Đoàn Luật sư Hà Nội',
            license_number: 'LS-HN-2012-2323',
            specs: ['Dân sự', 'Tố tụng - Thi hành án', 'Hành chính - Bộ máy NN', 'Thanh tra - Khiếu nại - PCTN', 'Cán bộ - Công chức - Viên chức'],
            experiences: [
                {
                    title: 'Luật sư tranh tụng dân sự - hành chính',
                    description: 'Đại diện khách hàng trong tranh chấp dân sự, vụ án hành chính, thi hành án và khiếu nại.',
                    start_date: '2012-10-01'
                }
            ]
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
                successful_cases: data.successful_cases,
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
                successful_cases: data.successful_cases,
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

        await prisma.lawyer_experiences.deleteMany({
            where: { lawyer_id: user.id }
        });
        await prisma.lawyer_experiences.createMany({
            data: (data.experiences || []).map(item => ({
                lawyer_id: user.id,
                title: item.title,
                description: item.description,
                start_date: new Date(item.start_date),
                end_date: item.end_date ? new Date(item.end_date) : null
            }))
        });
    }

    // =========================
    // BILLING CATALOG & DEMO ACCOUNTS
    // =========================
    console.log('Seeding billing catalog and representative plan accounts...');
    const planFixtures = [
        { code: 'FREE', name: 'Free', sort: 10, price: 0, credits: 20, entitlements: { max_active_cases: 1, max_upload_pages_per_job: 5, history_retention_days: 30, priority_class: 'STANDARD', can_export_pdf: false, can_generate_dynamic_form: false, can_use_lawyer_handoff: false, monthly_included_credits: 20, max_auto_spend_per_turn: 2 } },
        { code: 'PLUS', name: 'Plus', sort: 20, price: 99000, credits: 120, entitlements: { max_active_cases: 5, max_upload_pages_per_job: 15, history_retention_days: 90, priority_class: 'STANDARD', can_export_pdf: true, can_generate_dynamic_form: false, can_use_lawyer_handoff: true, monthly_included_credits: 120, max_auto_spend_per_turn: 5 } },
        { code: 'PRO', name: 'Pro', sort: 30, price: 249000, credits: 400, entitlements: { max_active_cases: 20, max_upload_pages_per_job: 50, history_retention_days: 365, priority_class: 'PRIORITY', can_export_pdf: true, can_generate_dynamic_form: true, can_use_lawyer_handoff: true, monthly_included_credits: 400, max_auto_spend_per_turn: 10 } },
        { code: 'MAX', name: 'Max', sort: 40, price: 599000, credits: 1200, entitlements: { max_active_cases: 100, max_upload_pages_per_job: 100, history_retention_days: 730, priority_class: 'HIGH', can_export_pdf: true, can_generate_dynamic_form: true, can_use_lawyer_handoff: true, monthly_included_credits: 1200, max_auto_spend_per_turn: 15 } },
    ];
    const planVersions = {};
    const planStart = new Date('2026-08-01T00:00:00.000Z');
    for (const fixture of planFixtures) {
        const plan = await prisma.billing_plans.upsert({
            where: { code: fixture.code },
            update: { name: fixture.name, sort_order: fixture.sort, is_public: true, is_active: true },
            create: { code: fixture.code, name: fixture.name, sort_order: fixture.sort, audience: 'INDIVIDUAL' },
        });
        let version = await prisma.billing_plan_versions.findUnique({ where: { plan_id_version: { plan_id: plan.id, version: 1 } } });
        if (!version) {
            version = await prisma.billing_plan_versions.create({
                data: { plan_id: plan.id, version: 1, price_vnd: fixture.price, billing_interval: 'MONTH', included_credits: fixture.credits, starts_at: planStart },
            });
        }
        planVersions[fixture.code] = version;
        for (const [key, value] of Object.entries(fixture.entitlements)) {
            await prisma.billing_plan_entitlements.upsert({
                where: { plan_version_id_key: { plan_version_id: version.id, key } },
                update: { value_json: value },
                create: { plan_version_id: version.id, key, value_json: value },
            });
        }
    }

    const rateCard = await prisma.billing_rate_cards.upsert({
        where: { code_version: { code: 'MVP', version: 1 } },
        update: {},
        create: { code: 'MVP', version: 1, status: 'ACTIVE', starts_at: planStart },
    });
    const rateItems = { LOOKUP: [1, 2], GUIDED_ANALYSIS: [3, 5], DEEP_ANALYSIS: [8, 15], DOCUMENT_ANALYSIS: [3, 15], DRAFTING: [3, 15], HANDOFF_PREP: [3, 8] };
    for (const [taskClass, [min, max]] of Object.entries(rateItems)) {
        await prisma.billing_rate_card_items.upsert({
            where: { rate_card_id_task_class: { rate_card_id: rateCard.id, task_class: taskClass } },
            update: {},
            create: { rate_card_id: rateCard.id, task_class: taskClass, estimated_min: min, estimated_max: max, units_per_credit: 1000 },
        });
    }

    const accountPlans = [
        ['user1@gmail.com', 'FREE', '10000000-0000-4000-8000-000000000001'],
        ['user2@gmail.com', 'PLUS', '10000000-0000-4000-8000-000000000002'],
        ['user3@gmail.com', 'PRO', '10000000-0000-4000-8000-000000000003'],
        ['user@gmail.com', 'MAX', '10000000-0000-4000-8000-000000000004'],
        ['admin@gmail.com', 'MAX', '10000000-0000-4000-8000-000000000005'],
    ];
    for (const [email, planCode, subscriptionId] of accountPlans) {
        const user = createdUsers[email];
        const version = planVersions[planCode];
        if (!user || !version) continue;
        await prisma.subscriptions.upsert({
            where: { id: subscriptionId },
            update: { user_id: user.id, plan_name: planCode, plan_version_id: version.id, status: 'ACTIVE', is_active: true, current_period_start: planStart, current_period_end: new Date('2027-08-01T00:00:00.000Z') },
            create: { id: subscriptionId, user_id: user.id, plan_name: planCode, plan_version_id: version.id, status: 'ACTIVE', is_active: true, start_date: planStart, end_date: new Date('2027-08-01T00:00:00.000Z'), current_period_start: planStart, current_period_end: new Date('2027-08-01T00:00:00.000Z'), quota: version.included_credits, provider: 'LOCAL_SEED' },
        });
        await prisma.$transaction(async tx => {
            const wallet = await tx.billing_credit_wallets.upsert({
                where: { owner_type_owner_id: { owner_type: 'USER', owner_id: user.id } },
                update: {},
                create: { owner_type: 'USER', owner_id: user.id },
            });
            const sourceRef = `seed:${email}:${planCode}:v1`;
            const existingLot = await tx.billing_credit_lots.findUnique({ where: { wallet_id_source_ref: { wallet_id: wallet.id, source_ref: sourceRef } } });
            if (!existingLot) {
                const updatedWallet = await tx.billing_credit_wallets.update({ where: { id: wallet.id }, data: { available_credits: { increment: version.included_credits }, version: { increment: 1 } } });
                await tx.billing_credit_lots.create({ data: { wallet_id: wallet.id, source: 'SUBSCRIPTION', granted_amount: version.included_credits, remaining_amount: version.included_credits, source_ref: sourceRef, expires_at: new Date('2027-08-01T00:00:00.000Z') } });
                await tx.billing_credit_ledger.create({ data: { wallet_id: wallet.id, entry_type: 'GRANT', amount: version.included_credits, available_after: updatedWallet.available_credits, reserved_after: updatedWallet.reserved_credits, idempotency_key: sourceRef, source_ref: subscriptionId } });
            }
        });
    }

    // =========================
    // TEMPLATES (Kho biểu mẫu)
    // =========================
    console.log('Seeding templates...');
    const templateDir = path.join(__dirname, '../../templates');

    console.log('Preparing template fixtures...');
    const componentsPath = path.join(templateDir, 'components.html');
    if (process.env.SEED_UPLOAD_TEMPLATES === 'true' && fs.existsSync(componentsPath)) {
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
        if (process.env.SEED_UPLOAD_TEMPLATES === 'true') {
            console.log(`Uploading ${t.fileName} to Cloudinary...`);
            try {
                const uploadResponse = await cloudinary.uploader.upload(filePath, {
                    folder: 'templates',
                    resource_type: 'raw',
                    type: process.env.CLOUDINARY_TYPE || 'upload'
                });
                secureUrl = uploadResponse.secure_url;
            } catch (e) {
                console.warn(`Cloudinary upload for ${t.fileName} failed, using fallback URL:`, e.message);
            }
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
