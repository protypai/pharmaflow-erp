import { ipcMain, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import { logger } from '../services/logger';

export function setupUpdateHandlers(mainWindow: BrowserWindow): void {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    logger.info('Update available', info);
    mainWindow.webContents.send('update:available', info);
  });

  autoUpdater.on('update-downloaded', () => {
    logger.info('Update downloaded');
    mainWindow.webContents.send('update:downloaded');
  });

  autoUpdater.on('error', (err) => {
    logger.error('Auto-updater error', { error: err.message });
  });

  ipcMain.handle('update:check', async () => {
    try {
      await autoUpdater.checkForUpdates();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Check for updates on startup (production only)
  if (process.env.NODE_ENV !== 'development') {
    setTimeout(() => autoUpdater.checkForUpdates(), 3000);
  }
}
