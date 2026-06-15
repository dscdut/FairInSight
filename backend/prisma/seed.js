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
        },
        {
            email: 'user@gmail.com',
            full_name: 'Normal User',
            role_id: roleMap['USER'],
            phone: '0912832123',
            location: 'Hanoi, Vietnam',
            is_email_confirmed: true,
        },
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
    // LAWYER DETAILS
    // =========================
    console.log('Creating lawyer details...');
    const lawyerUser = createdUsers['lawyer@gmail.com'];
    if (lawyerUser) {
        await prisma.lawyer_details.upsert({
            where: { user_id: lawyerUser.id },
            update: {
                bio: 'Luật sư chuyên về dân sự và doanh nghiệp với hơn 5 năm kinh nghiệm.',
                experience_years: 5,
                is_verified: true,
                status: 'AVAILABLE',
            },
            create: {
                user_id: lawyerUser.id,
                bio: 'Luật sư chuyên về dân sự và doanh nghiệp với hơn 5 năm kinh nghiệm.',
                experience_years: 5,
                is_verified: true,
                rating_avg: 4.5,
                price_per_hour: 50,
                status: 'AVAILABLE',
                bar_association: 'Vietnam Bar Federation',
                license_number: 'LAW123456',
            },
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
        await cloudinary.uploader.upload(componentsPath, {
            public_id: 'components.html',
            folder: 'templates',
            resource_type: 'raw',
            type: 'upload'
        });
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

        console.log(`Uploading ${t.fileName} to Cloudinary...`);
        const uploadResponse = await cloudinary.uploader.upload(filePath, {
            folder: 'templates',
            resource_type: 'raw',
            type: process.env.CLOUDINARY_TYPE || 'upload'
        });

        console.log(`Saving template "${t.name}" into database...`);
        await prisma.templates.upsert({
            where: { id: t.id },
            update: {
                name: t.name,
                description: t.description,
                file_url: uploadResponse.secure_url,
                fields: t.fields,
                deleted_at: null
            },
            create: {
                id: t.id,
                name: t.name,
                description: t.description,
                file_url: uploadResponse.secure_url,
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