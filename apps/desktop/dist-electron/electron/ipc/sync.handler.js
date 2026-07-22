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
function setupSyncHandlers(mainWindow) {
    electron_1.ipcMain.handle('sync:push', async () => {
        try {
            const token = await keytar_1.default.getPassword(SERVICE_NAME, ACCOUNT_NAME);
            if (!token)
                return { success: false, error: 'Not authenticated' };
            const result = await (0, syncQueue_service_1.pushPendingQueue)(token);
            mainWindow.webContents.send('sync:complete', result);
            return { ok: true, ...result };
        }
        catch (err) {
            logger_1.logger.error('sync:push failed', { error: err.message });
            return { success: false, error: err.message };
        }
    });
    electron_1.ipcMain.handle('sync:status', async () => {
        return { pending: (0, syncQueue_service_1.getPendingCount)() };
    });
    // Auto-sync every 5 minutes when online
    setInterval(async () => {
        try {
            const token = await keytar_1.default.getPassword(SERVICE_NAME, ACCOUNT_NAME);
            if (!token)
                return;
            const result = await (0, syncQueue_service_1.pushPendingQueue)(token);
            if (result.success > 0) {
                mainWindow.webContents.send('sync:complete', result);
            }
        }
        catch {
            // Silent fail — offline or auth expired
        }
    }, 5 * 60 * 1000);
}
