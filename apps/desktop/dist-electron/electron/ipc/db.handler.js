"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDbHandlers = setupDbHandlers;
const electron_1 = require("electron");
const localDb_service_1 = require("../services/localDb.service");
const logger_1 = require("../services/logger");
function setupDbHandlers() {
    electron_1.ipcMain.handle('db:query', async (_event, sql, params) => {
        try {
            return { success: true, data: (0, localDb_service_1.queryDb)(sql, params) };
        }
        catch (err) {
            logger_1.logger.error('db:query failed', { sql, error: err.message });
            return { success: false, error: err.message };
        }
    });
    electron_1.ipcMain.handle('db:run', async (_event, sql, params) => {
        try {
            const result = (0, localDb_service_1.runDb)(sql, params);
            return { success: true, changes: result.changes, lastInsertRowid: result.lastInsertRowid };
        }
        catch (err) {
            logger_1.logger.error('db:run failed', { sql, error: err.message });
            return { success: false, error: err.message };
        }
    });
    electron_1.ipcMain.handle('db:transaction', async (_event, operations) => {
        try {
            (0, localDb_service_1.transactionDb)(operations);
            return { success: true };
        }
        catch (err) {
            logger_1.logger.error('db:transaction failed', { error: err.message });
            return { success: false, error: err.message };
        }
    });
}
