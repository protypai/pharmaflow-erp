"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupUpdateHandlers = setupUpdateHandlers;
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
const logger_1 = require("../services/logger");
function setupUpdateHandlers(mainWindow) {
    electron_updater_1.autoUpdater.autoDownload = true;
    electron_updater_1.autoUpdater.autoInstallOnAppQuit = true;
    electron_updater_1.autoUpdater.on('update-available', (info) => {
        logger_1.logger.info('Update available', info);
        mainWindow.webContents.send('update:available', info);
    });
    electron_updater_1.autoUpdater.on('update-downloaded', () => {
        logger_1.logger.info('Update downloaded');
        mainWindow.webContents.send('update:downloaded');
    });
    electron_updater_1.autoUpdater.on('error', (err) => {
        logger_1.logger.error('Auto-updater error', { error: err.message });
    });
    electron_1.ipcMain.handle('update:check', async () => {
        try {
            await electron_updater_1.autoUpdater.checkForUpdates();
            return { success: true };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    });
    // Check for updates on startup (production only)
    if (process.env.NODE_ENV !== 'development') {
        setTimeout(() => electron_updater_1.autoUpdater.checkForUpdates(), 3000);
    }
}
