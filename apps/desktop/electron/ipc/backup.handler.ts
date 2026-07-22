import { ipcMain, app, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { logger } from '../services/logger';

export function setupBackupHandlers(): void {
  ipcMain.handle('backup:create', async (_event, destination?: string) => {
    try {
      const dbPath = path.join(app.getPath('userData'), 'pharmaflow.db');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `pharmaflow-backup-${timestamp}.db`;

      let backupDir = destination;
      if (!backupDir) {
        const result = await dialog.showOpenDialog({
          title: 'Select Backup Location',
          properties: ['openDirectory'],
          defaultPath: 'D:\\',
        });
        if (result.canceled || !result.filePaths[0]) {
          return { success: false, error: 'Backup cancelled' };
        }
        backupDir = result.filePaths[0];
      }

      const backupPath = path.join(backupDir, backupName);
      fs.copyFileSync(dbPath, backupPath);
      logger.info(`Backup created: ${backupPath}`);
      return { success: true, path: backupPath };
    } catch (err: any) {
      logger.error('Backup failed', { error: err.message });
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('backup:list', async () => {
    const backupDir = path.join(app.getPath('userData'), 'backups');
    if (!fs.existsSync(backupDir)) return { success: true, data: [] };
    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.db'))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
        size: fs.statSync(path.join(backupDir, f)).size,
        createdAt: fs.statSync(path.join(backupDir, f)).birthtime,
      }));
    return { success: true, data: files };
  });
}
