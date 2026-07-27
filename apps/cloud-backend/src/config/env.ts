import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const nodeEnv = (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';
const isProd = nodeEnv === 'production';

/**
 * Local-only fallbacks used ONLY in development/test so `npm run dev` works without a .env file.
 * In production these are intentionally NOT applied — the process fails fast (throws below) when
 * a required secret is missing, so we never boot with a hardcoded/insecure secret.
 */
const devDefaults = {
  DATABASE_URL: 'postgresql://pharmaflow:devpassword@localhost:5432/pharmaflow_dev',
  JWT_SECRET: 'dev_only_jwt_secret_key_min_32_characters_long_change_in_production',
  JWT_REFRESH_SECRET: 'dev_only_jwt_refresh_secret_key_min_32_characters_long_change_prod',
  ADMIN_EMAIL: 'admin@pharmaflow.local',
  ADMIN_PASSWORD: 'dev_admin_password',
};

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  ADMIN_EMAIL: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(1),
  CORS_ORIGIN: z.string().default('*'),
  LOG_LEVEL: z.string().default('info'),
  RUN_SEEDING: z.string().default('false'),
});

// Apply the dev fallback only outside production. In production a missing value stays undefined
// so the schema below fails and we throw (fail-fast) instead of booting with a fallback secret.
const pick = (value: string | undefined, devFallback: string): string | undefined => {
  if (value && value.length > 0) return value;
  return isProd ? undefined : devFallback;
};

const rawEnv = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: pick(process.env.DATABASE_URL, devDefaults.DATABASE_URL),
  JWT_SECRET: pick(process.env.JWT_SECRET, devDefaults.JWT_SECRET),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET: pick(process.env.JWT_REFRESH_SECRET, devDefaults.JWT_REFRESH_SECRET),
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
  ADMIN_EMAIL: pick(process.env.ADMIN_EMAIL, devDefaults.ADMIN_EMAIL),
  ADMIN_PASSWORD: pick(process.env.ADMIN_PASSWORD, devDefaults.ADMIN_PASSWORD),
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  LOG_LEVEL: process.env.LOG_LEVEL,
  RUN_SEEDING: process.env.RUN_SEEDING,
};

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  // Fail fast on any invalid/missing configuration. This is required in production so we never
  // start the server with missing secrets, and it also surfaces misconfiguration early in dev.
  // eslint-disable-next-line no-console
  console.error(
    'FATAL: Invalid environment configuration:',
    JSON.stringify(parsed.error.format(), null, 2),
  );
  throw new Error(
    'Invalid or missing required environment variables. ' +
      'In production, JWT_SECRET, JWT_REFRESH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD and DATABASE_URL ' +
      'must be provided (see .env.example).',
  );
}

export const env = parsed.data;
