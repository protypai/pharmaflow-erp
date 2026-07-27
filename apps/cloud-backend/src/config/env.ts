import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string().default('postgresql://pharmaflow:devpassword@localhost:5432/pharmaflow_dev'),
  JWT_SECRET: z.string().default('default_jwt_secret_key_32_characters_minimum_length_required_here_12345'),
  JWT_EXPIRES_IN: z.string().default('30d'),
  JWT_REFRESH_SECRET: z.string().default('default_jwt_refresh_secret_key_32_characters_minimum_length_required_here_12345'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  ADMIN_EMAIL: z.string().default('admin@pharmaflow.in'),
  ADMIN_PASSWORD: z.string().default('changeme_strong_password'),
  CORS_ORIGIN: z.string().default('*'),
  LOG_LEVEL: z.string().default('info'),
  RUN_SEEDING: z.string().default('false'),
});

const rawEnv = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 8) ? process.env.JWT_SECRET : undefined,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET: (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length >= 8) ? process.env.JWT_REFRESH_SECRET : undefined,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 4) ? process.env.ADMIN_PASSWORD : undefined,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  LOG_LEVEL: process.env.LOG_LEVEL,
  RUN_SEEDING: process.env.RUN_SEEDING,
};

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.warn('Environment variable parse warnings:', parsed.error.format());
}

export const env = parsed.success ? parsed.data : envSchema.parse({});
