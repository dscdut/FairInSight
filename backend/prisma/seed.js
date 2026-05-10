require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');

// tạo connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// truyền adapter vào Prisma
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  // =========================
  // DELETE (đúng thứ tự tránh FK)
  // =========================
  await prisma.lawyer_details.deleteMany();
  await prisma.users.deleteMany();
  await prisma.roles.deleteMany();
  await prisma.specialties.deleteMany();

  // =========================
  // ROLES
  // =========================
  const userRole = await prisma.roles.create({
    data: { name: 'USER' },
  });

  const lawyerRole = await prisma.roles.create({
    data: { name: 'LAWYER' },
  });

  const adminRole = await prisma.roles.create({
    data: { name: 'ADMIN' },
  });

  // =========================
  // USERS
  // =========================
  const password = await bcrypt.hash('123456', 10);

  const normalUser = await prisma.users.create({
    data: {
      email: 'user@gmail.com',
      password_hash: password,
      full_name: 'Normal User',
      role_id: userRole.id,
    },
  });

  const lawyerUser = await prisma.users.create({
    data: {
      email: 'lawyer@gmail.com',
      password_hash: password,
      full_name: 'Lawyer User',
      role_id: lawyerRole.id,
    },
  });

  await prisma.users.create({
    data: {
      email: 'admin@gmail.com',
      password_hash: password,
      full_name: 'Admin User',
      role_id: adminRole.id,
    },
  });

  // =========================
  // LAWYER DETAILS
  // =========================
  await prisma.lawyer_details.create({
    data: {
      user_id: lawyerUser.id,
      bio: 'Luật sư chuyên về dân sự và doanh nghiệp',
      experience_years: 5,
      is_verified: true,
      rating_avg: 4.5,
      price_per_hour: 50,
      status: 'AVAILABLE',
      bar_association: 'Vietnam Bar Federation',
      license_number: 'LAW123456',
    },
  });

  // =========================
  // SPECIALTIES
  // =========================
  await prisma.specialties.createMany({
    data: [
      { name: 'Hình sự' },
      { name: 'Dân sự' },
      { name: 'Doanh nghiệp' },
      { name: 'Đất đai' },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seed completed');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });