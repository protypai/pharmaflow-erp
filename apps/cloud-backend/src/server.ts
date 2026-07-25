import app from './app';
import { env } from './config/env';
import { connectDb, disconnectDb } from './config/database';
import { logger } from './utils/logger';

const PORT = parseInt(env.PORT);

async function start() {
  await connectDb();
  if (process.env.RUN_SEEDING === 'true') {
    try {
      logger.info('RUN_SEEDING is true, running seed script...');
      const { execSync } = await import('child_process');
      execSync('npx prisma db seed', { stdio: 'inherit' });
    } catch (seedErr) {
      logger.warn('Seed execution warning:', seedErr);
    }
  }
  const server = app.listen(PORT, () => {
    logger.info(`PharmaFlow Cloud Backend running on port ${PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down`);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
