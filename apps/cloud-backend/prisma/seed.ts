import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Super Admin...');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@pharmaflow.in';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const hash = await bcrypt.hash(adminPassword, 12);

  await prisma.superAdmin.upsert({
    where: { email: adminEmail },
    update: { passwordHash: hash },
    create: { email: adminEmail, passwordHash: hash, name: 'Super Admin' },
  });

  console.log(`Super Admin created: ${adminEmail}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
