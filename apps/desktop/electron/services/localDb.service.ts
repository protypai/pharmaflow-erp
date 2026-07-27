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
  logger.info('Resetting local database tables');
  
  if (!db) {
    await initLocalDb();
  }
  
  try {
    // Disable foreign keys temporarily to avoid delete restrictions during wipe
    db.pragma('foreign_keys = OFF');
    
    // Get all user tables
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all() as { name: string }[];
    
    // Begin transaction for speed and safety
    const deleteTx = db.transaction(() => {
      for (const table of tables) {
        db.prepare(`DELETE FROM "${table.name}"`).run();
      }
      // Reset auto-increment sequences
      try {
        db.prepare(`DELETE FROM sqlite_sequence`).run();
      } catch {
        // sqlite_sequence might not exist if no autoincrement tables are created yet
      }
    });
    
    deleteTx();
    
    // Re-enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Re-run migrations to ensure seeded values (e.g. sync_status 'current' row) are created
    await runMigrations(db);
    
    logger.info('Database reset complete via truncation');
  } catch (err: any) {
    logger.error('Truncation reset failed, attempting hard delete', { error: err.message });
    
    // Fallback: If truncation fails, try closing and deleting the file
    try {
      if (db) {
        db.close();
        db = undefined as any;
      }
      
      const dbPath = path.join(app.getPath('userData'), 'pharmaflow.db');
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
    } catch (fallbackErr: any) {
      logger.error('Hard database reset failed', { error: fallbackErr.message });
      // Critical: even if reset fails completely, make sure we try to re-initialize db to prevent bricking the app
      try {
        await initLocalDb();
      } catch {}
      throw fallbackErr;
    }
  }
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
