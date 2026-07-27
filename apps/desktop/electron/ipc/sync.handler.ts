import { ipcMain, BrowserWindow } from 'electron';
import bcrypt from 'bcryptjs';
import { pushPendingQueue, pullChanges, getPendingCount, getLocalSyncStatus, getOrCreateDeviceId, AccountDisabledError } from '../services/syncQueue.service';
import { queryDb } from '../services/localDb.service';
import { logger } from '../services/logger';
import keytar from 'keytar';

const SERVICE_NAME = 'PharmaFlowERP';
const ACCOUNT_NAME = 'access_token';
const REFRESH_ACCOUNT_NAME = 'refresh_token';
const BCRYPT_ROUNDS = 10;

export function setupSyncHandlers(mainWindow: BrowserWindow): void {
  // Notify the renderer of a refreshed access token so it can update localStorage
  // and stop re-injecting the stale token into keytar on subsequent writes.
  const emitTokenRefreshed = (newAccessToken?: string) => {
    if (newAccessToken && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('auth:token-refreshed', { accessToken: newAccessToken });
    }
  };

  // Super Admin deactivated this user/company. Clear stored tokens so background
  // sync stops, and tell the renderer to log out immediately.
  const forceLogout = async (message: string) => {
    try {
      await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
      await keytar.deletePassword(SERVICE_NAME, REFRESH_ACCOUNT_NAME);
    } catch { /* ignore */ }
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('auth:force-logout', { reason: 'ACCOUNT_DISABLED', message });
    }
  };

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

  // Hash a plaintext password with bcrypt (runs in main, not the renderer).
  ipcMain.handle('auth:hashPassword', async (_e, plain: string) => {
    try {
      return bcrypt.hashSync(plain, BCRYPT_ROUNDS);
    } catch (err: any) {
      logger.error('Failed to hash password', { error: err.message });
      return '';
    }
  });

  // Verify an offline login: look up the user's stored bcrypt hash and compare.
  // Never compares plaintext against the stored hash.
  ipcMain.handle('auth:verifyLocalPassword', async (_e, email: string, plain: string) => {
    try {
      const rows = queryDb(
        'SELECT id, name, email, company_id as companyId, role, password_hash FROM users WHERE email = ? AND is_active = 1',
        [email]
      );
      const row = rows && rows[0];
      if (!row || !row.password_hash) {
        return { success: false };
      }
      const match = bcrypt.compareSync(plain, row.password_hash);
      if (!match) {
        return { success: false };
      }
      const { password_hash, ...user } = row;
      return { success: true, user };
    } catch (err: any) {
      logger.error('auth:verifyLocalPassword failed', { error: err.message });
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('sync:push', async () => {
    try {
      const token = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
      const refreshToken = await keytar.getPassword(SERVICE_NAME, REFRESH_ACCOUNT_NAME);
      if (!token) return { success: false, error: 'Not authenticated' };
      const result = await pushPendingQueue(token, refreshToken || undefined);
      emitTokenRefreshed(result.newAccessToken);
      mainWindow.webContents.send('sync:complete', result);
      return { ok: true, ...result };
    } catch (err: any) {
      if (err instanceof AccountDisabledError) {
        await forceLogout(err.message);
        return { success: false, error: err.message, accountDisabled: true };
      }
      logger.error('sync:push failed', { error: err.message });
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('sync:pull', async () => {
    try {
      const token = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
      const refreshToken = await keytar.getPassword(SERVICE_NAME, REFRESH_ACCOUNT_NAME);
      if (!token) return { success: false, error: 'Not authenticated' };
      const result = await pullChanges(token, refreshToken || undefined);
      emitTokenRefreshed(result.newAccessToken);
      return { ok: true, ...result };
    } catch (err: any) {
      if (err instanceof AccountDisabledError) {
        await forceLogout(err.message);
        return { success: false, error: err.message, accountDisabled: true };
      }
      logger.error('sync:pull failed', { error: err.message });
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('sync:status', async () => {
    const status = getLocalSyncStatus();
    return {
      pending: getPendingCount(),
      ...status
    };
  });

  ipcMain.handle('app:version', () => {
    return process.env.VITE_APP_VERSION || '1.0.52';
  });

  ipcMain.handle('app:deviceId', () => {
    return getOrCreateDeviceId();
  });


  // Auto-sync helper: push local changes, then pull remote deltas.
  const autoSync = async () => {
    try {
      const token = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
      const refreshToken = await keytar.getPassword(SERVICE_NAME, REFRESH_ACCOUNT_NAME);
      if (!token) return;

      const pushResult = await pushPendingQueue(token, refreshToken || undefined);
      emitTokenRefreshed(pushResult.newAccessToken);
      if (pushResult.success > 0 || pushResult.failed > 0) {
        mainWindow.webContents.send('sync:complete', pushResult);
      }

      // Pull deltas after push, using the freshest token available.
      const currentToken = pushResult.newAccessToken || token;
      const pullResult = await pullChanges(currentToken, refreshToken || undefined);
      emitTokenRefreshed(pullResult.newAccessToken);
    } catch (err: any) {
      // Account deactivated by Super Admin → force logout on this device.
      if (err instanceof AccountDisabledError) {
        await forceLogout(err.message);
        return;
      }
      // Otherwise silent fail — offline or auth expired; backoff/retry handles it.
    }
  };

  // Trigger sync on startup after 5 seconds
  setTimeout(autoSync, 5000);

  // Auto-sync every 5 minutes when online
  setInterval(autoSync, 5 * 60 * 1000);
}
