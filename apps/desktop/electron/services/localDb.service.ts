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

export async function resetLocalDb(): Promise<void> {
  const dbPath = path.join(app.getPath('userData'), 'pharmaflow.db');
  logger.info(`Resetting local database at: ${dbPath}`);
  
  if (db) {
    db.close();
    db = undefined as any;
  }
  
  const fs = require('fs');
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    logger.info('Old database file deleted');
  }
  if (fs.existsSync(dbPath + '-wal')) {
    fs.unlinkSync(dbPath + '-wal');
  }
  if (fs.existsSync(dbPath + '-shm')) {
    fs.unlinkSync(dbPath + '-shm');
  }
  
  await initLocalDb();
  logger.info('Database reset complete');
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
