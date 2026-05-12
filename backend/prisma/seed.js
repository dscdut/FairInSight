require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');

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
  const passwordHash = await bcrypt.hash('123456', 10);

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

  console.log('✅ Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });