"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupBackupHandlers = setupBackupHandlers;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../services/logger");
function setupBackupHandlers() {
    electron_1.ipcMain.handle('backup:create', async (_event, destination) => {
        try {
            const dbPath = path_1.default.join(electron_1.app.getPath('userData'), 'pharmaflow.db');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = `pharmaflow-backup-${timestamp}.db`;
            let backupDir = destination;
            if (!backupDir) {
                const result = await electron_1.dialog.showOpenDialog({
                    title: 'Select Backup Location',
                    properties: ['openDirectory'],
                    defaultPath: 'D:\\',
                });
                if (result.canceled || !result.filePaths[0]) {
                    return { success: false, error: 'Backup cancelled' };
                }
                backupDir = result.filePaths[0];
            }
            const backupPath = path_1.default.join(backupDir, backupName);
            fs_1.default.copyFileSync(dbPath, backupPath);
            logger_1.logger.info(`Backup created: ${backupPath}`);
            return { success: true, path: backupPath };
        }
        catch (err) {
            logger_1.logger.error('Backup failed', { error: err.message });
            return { success: false, error: err.message };
        }
    });
    electron_1.ipcMain.handle('backup:list', async () => {
        const backupDir = path_1.default.join(electron_1.app.getPath('userData'), 'backups');
        if (!fs_1.default.existsSync(backupDir))
            return { success: true, data: [] };
        const files = fs_1.default.readdirSync(backupDir)
            .filter(f => f.endsWith('.db'))
            .map(f => ({
            name: f,
            path: path_1.default.join(backupDir, f),
            size: fs_1.default.statSync(path_1.default.join(backupDir, f)).size,
            createdAt: fs_1.default.statSync(path_1.default.join(backupDir, f)).birthtime,
        }));
        return { success: true, data: files };
    });
}
