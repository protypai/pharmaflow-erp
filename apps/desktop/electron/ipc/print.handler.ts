import { ipcMain, BrowserWindow } from 'electron';
import { logger } from '../services/logger';

export function setupPrintHandlers(): void {
  ipcMain.handle('print:invoice', async (_event, html: string) => {
    return new Promise((resolve) => {
      const printWindow = new BrowserWindow({
        show: false,
        webPreferences: { nodeIntegration: false, contextIsolation: true },
      });

      printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

      printWindow.webContents.once('did-finish-load', () => {
        printWindow.webContents.print(
          { silent: true, printBackground: true },
          (success, reason) => {
            printWindow.close();
            if (success) {
              resolve({ success: true });
            } else {
              logger.error('Print failed', { reason });
              resolve({ success: false, error: reason });
            }
          }
        );
      });
    });
  });

  ipcMain.handle('print:report', async (_event, html: string) => {
    return new Promise((resolve) => {
      const printWindow = new BrowserWindow({
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
