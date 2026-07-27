import { ipcMain, BrowserWindow } from 'electron';
import { pushPendingQueue, getPendingCount } from '../services/syncQueue.service';
import { logger } from '../services/logger';
import keytar from 'keytar';

const SERVICE_NAME = 'PharmaFlowERP';
const ACCOUNT_NAME = 'access_token';
const REFRESH_ACCOUNT_NAME = 'refresh_token';

export function setupSyncHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle('auth:setToken', async (_e, token: string, refreshToken?: string) => {
    try {
      if (token) await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, token);
      if (refreshToken) await keytar.setPassword(SERVICE_NAME, REFRESH_ACCOUNT_NAME, refreshToken);
      return { success: true };
    } catch (err: any) {
      logger.error('Failed to set token', { error: err.message });
      return { success: false };
    }
  });

  ipcMain.handle('auth:clearToken', async () => {
    try {
      await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
      await keytar.deletePassword(SERVICE_NAME, REFRESH_ACCOUNT_NAME);
      return { success: true };
    } catch (err: any) {
      logger.error('Failed to clear token', { error: err.message });
      return { success: false };
    }
  });

  ipcMain.handle('sync:push', async () => {
    try {
      const token = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
      const refreshToken = await keytar.getPassword(SERVICE_NAME, REFRESH_ACCOUNT_NAME);
      if (!token) return { success: false, error: 'Not authenticated' };
      const result = await pushPendingQueue(token, refreshToken || undefined);
      mainWindow.webContents.send('sync:complete', result);
      return { ok: true, ...result };
    } catch (err: any) {
      logger.error('sync:push failed', { error: err.message });
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('sync:status', async () => {
    return { pending: getPendingCount() };
  });

  // Auto-sync every 5 minutes when online
  setInterval(async () => {
    try {
      const token = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
      const refreshToken = await keytar.getPassword(SERVICE_NAME, REFRESH_ACCOUNT_NAME);
      if (!token) return;
      const result = await pushPendingQueue(token, refreshToken || undefined);
      if (result.success > 0) {
        mainWindow.webContents.send('sync:complete', result);
      }
    } catch {
      // Silent fail — offline or auth expired
    }
  }, 5 * 60 * 1000);
}
