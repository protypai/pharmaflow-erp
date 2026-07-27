import { ipcMain } from 'electron';
import { queryDb, runDb, transactionDb, resetLocalDb } from '../services/localDb.service';
import { logger } from '../services/logger';

export function setupDbHandlers(): void {
  ipcMain.handle('db:reset', async () => {
    try {
      await resetLocalDb();
      return { success: true };
    } catch (err: any) {
      logger.error('db:reset failed', { error: err.message });
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:query', async (_event, sql: string, params?: any[]) => {
    try {
      // Do NOT log params — they can contain passwords, hashes, tokens or PII.
      logger.info('db:query', { sql, paramCount: params?.length ?? 0 });
      return { success: true, data: queryDb(sql, params) };
    } catch (err: any) {
      logger.error('db:query failed', { sql, error: err.message });
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:run', async (_event, sql: string, params?: any[]) => {
    try {
      // Do NOT log params — they can contain passwords, hashes, tokens or PII.
      logger.info('db:run', { sql, paramCount: params?.length ?? 0 });
      const result = runDb(sql, params);
      return { success: true, changes: result.changes, lastInsertRowid: result.lastInsertRowid };
    } catch (err: any) {
      logger.error('db:run failed', { sql, error: err.message });
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:transaction', async (_event, operations: { sql: string; params?: any[] }[]) => {
    try {
      transactionDb(operations);
      return { success: true };
    } catch (err: any) {
      logger.error('db:transaction failed', { error: err.message });
      return { success: false, error: err.message };
    }
  });
}
