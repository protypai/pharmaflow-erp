"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSyncHandlers = setupSyncHandlers;
const electron_1 = require("electron");
const syncQueue_service_1 = require("../services/syncQueue.service");
const logger_1 = require("../services/logger");
const keytar_1 = __importDefault(require("keytar"));
const SERVICE_NAME = 'PharmaFlowERP';
const ACCOUNT_NAME = 'access_token';
const REFRESH_ACCOUNT_NAME = 'refresh_token';
function setupSyncHandlers(mainWindow) {
    electron_1.ipcMain.handle('auth:setToken', async (_e, token, refreshToken) => {
        try {
            if (token)
                await keytar_1.default.setPassword(SERVICE_NAME, ACCOUNT_NAME, token);
            if (refreshToken)
                await keytar_1.default.setPassword(SERVICE_NAME, REFRESH_ACCOUNT_NAME, refreshToken);
            return { success: true };
        }
        catch (err) {
            logger_1.logger.error('Failed to set token', { error: err.message });
            return { success: false };
        }
    });
    electron_1.ipcMain.handle('auth:clearToken', async () => {
        try {
            await keytar_1.default.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
            await keytar_1.default.deletePassword(SERVICE_NAME, REFRESH_ACCOUNT_NAME);
            return { success: true };
        }
        catch (err) {
            logger_1.logger.error('Failed to clear token', { error: err.message });
            return { success: false };
        }
    });
    electron_1.ipcMain.handle('sync:push', async () => {
        try {
            const token = await keytar_1.default.getPassword(SERVICE_NAME, ACCOUNT_NAME);
            const refreshToken = await keytar_1.default.getPassword(SERVICE_NAME, REFRESH_ACCOUNT_NAME);
            if (!token)
                return { success: false, error: 'Not authenticated' };
            const result = await (0, syncQueue_service_1.pushPendingQueue)(token, refreshToken || undefined);
            mainWindow.webContents.send('sync:complete', result);
            return { ok: true, ...result };
        }
        catch (err) {
            logger_1.logger.error('sync:push failed', { error: err.message });
            return { success: false, error: err.message };
        }
    });
    electron_1.ipcMain.handle('sync:status', async () => {
        const status = (0, syncQueue_service_1.getLocalSyncStatus)();
        return {
            pending: (0, syncQueue_service_1.getPendingCount)(),
            ...status
        };
    });
    electron_1.ipcMain.handle('app:version', () => {
        return process.env.VITE_APP_VERSION || '1.0.52';
    });
    electron_1.ipcMain.handle('app:deviceId', () => {
        return (0, syncQueue_service_1.getOrCreateDeviceId)();
    });
    // Auto-sync helper function
    const autoSync = async () => {
        try {
            const token = await keytar_1.default.getPassword(SERVICE_NAME, ACCOUNT_NAME);
            const refreshToken = await keytar_1.default.getPassword(SERVICE_NAME, REFRESH_ACCOUNT_NAME);
            if (!token)
                return;
            const result = await (0, syncQueue_service_1.pushPendingQueue)(token, refreshToken || undefined);
            if (result.success > 0) {
                mainWindow.webContents.send('sync:complete', result);
            }
        }
        catch {
            // Silent fail — offline or auth expired
        }
    };
    // Trigger sync on startup after 5 seconds
    setTimeout(autoSync, 5000);
    // Auto-sync every 5 minutes when online
    setInterval(autoSync, 5 * 60 * 1000);
}
