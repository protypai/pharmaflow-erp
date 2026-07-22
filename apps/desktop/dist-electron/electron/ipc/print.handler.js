"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPrintHandlers = setupPrintHandlers;
const electron_1 = require("electron");
const logger_1 = require("../services/logger");
function setupPrintHandlers() {
    electron_1.ipcMain.handle('print:invoice', async (_event, html) => {
        return new Promise((resolve) => {
            const printWindow = new electron_1.BrowserWindow({
                show: false,
                webPreferences: { nodeIntegration: false, contextIsolation: true },
            });
            printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
            printWindow.webContents.once('did-finish-load', () => {
                printWindow.webContents.print({ silent: true, printBackground: true }, (success, reason) => {
                    printWindow.close();
                    if (success) {
                        resolve({ success: true });
                    }
                    else {
                        logger_1.logger.error('Print failed', { reason });
                        resolve({ success: false, error: reason });
                    }
                });
            });
        });
    });
    electron_1.ipcMain.handle('print:report', async (_event, html) => {
        return new Promise((resolve) => {
            const printWindow = new electron_1.BrowserWindow({
                show: false,
                webPreferences: { nodeIntegration: false, contextIsolation: true },
            });
            printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
            printWindow.webContents.once('did-finish-load', () => {
                printWindow.webContents.print({ silent: false, printBackground: true }, (success) => {
                    printWindow.close();
                    resolve({ success });
                });
            });
        });
    });
}
