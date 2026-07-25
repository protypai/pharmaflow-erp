import { db } from '../config/database';
import bcrypt from 'bcryptjs';
import { logger } from './logger';

export async function seedSuperAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    logger.warn('ADMIN_EMAIL or ADMIN_PASSWORD missing in env, skipping SuperAdmin seed.');
    return;
  }

  const hash = await bcrypt.hash(adminPassword, 12);

  await db.superAdmin.upsert({
    where: { email: adminEmail },
    update: { passwordHash: hash },
    create: { email: adminEmail, passwordHash: hash, name: 'Super Admin' },
  });

  logger.info(`Super Admin seeded/updated: ${adminEmail}`);
}
