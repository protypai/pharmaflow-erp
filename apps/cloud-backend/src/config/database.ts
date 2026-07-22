import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

declare global {
  var prisma: PrismaClient | undefined;
}

export const db = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = db;
}

export async function connectDb() {
  await db.$connect();
  logger.info('Database connected');
}

export async function disconnectDb() {
  await db.$disconnect();
  logger.info('Database disconnected');
}
