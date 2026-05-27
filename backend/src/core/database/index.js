import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { logger } from '../utils';

// Tạo connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Adapter cho Prisma 7
const adapter = new PrismaPg(pool);

// Prisma client
const prisma = new PrismaClient({
    adapter,
});

export default prisma;

// Connect DB
export const connectDatabase = async () => {
    try {
        await prisma.$connect();
        logger.info('Prisma connected successfully');
    } catch (error) {
        logger.error('Prisma connection error');
        console.error(error);
    }
};