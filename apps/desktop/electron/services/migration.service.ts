import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { logger } from './logger';

export async function runMigrations(db: Database.Database): Promise<void> {
  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const isDev = !app.isPackaged;
  logger.info(`App path: ${app.getAppPath()}`);
  const migrationsDir = isDev 
    ? path.join(app.getAppPath(), 'electron', 'migrations')
    : path.join(app.getAppPath(), 'dist-electron', 'electron', 'migrations');
  logger.info(`Checking migrations dir: ${migrationsDir}`);
  if (!fs.existsSync(migrationsDir)) {
    logger.warn('No migrations directory found, skipping migrations');
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const applied = db.prepare('SELECT id FROM _migrations WHERE name = ?').get(file);
    if (applied) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    logger.info(`Applying migration: ${file}`);
    try {
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
      logger.info(`Migration applied: ${file}`);
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('duplicate column name') || msg.includes('already exists')) {
        logger.warn(`Migration ${file} skipped: schema change already exists (${msg})`);
        db.prepare('INSERT OR IGNORE INTO _migrations (name) VALUES (?)').run(file);
      } else {
        logger.error(`Migration ${file} failed: ${msg}`);
        throw err;
      }
    }
  }

  logger.info('All migrations applied');
}
