import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { runMigrations } from './migration.service';
import { logger } from './logger';

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized. Call initLocalDb() first.');
  return db;
}

export async function initLocalDb(): Promise<void> {
  const dbPath = path.join(app.getPath('userData'), 'pharmaflow.db');
  logger.info(`Opening SQLite database at: ${dbPath}`);

  db = new Database(dbPath);

  // Performance pragmas
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');

  // Run migrations
  await runMigrations(db);
  logger.info('Local database initialized');
}

export function queryDb(sql: string, params: any[] = []): any[] {
  return getDb().prepare(sql).all(...params);
}

export function runDb(sql: string, params: any[] = []): Database.RunResult {
  return getDb().prepare(sql).run(...params);
}

export function transactionDb(operations: { sql: string; params?: any[] }[]): void {
  const txn = getDb().transaction(() => {
    for (const op of operations) {
      getDb().prepare(op.sql).run(...(op.params || []));
    }
  });
  txn();
}
