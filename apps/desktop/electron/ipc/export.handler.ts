import { ipcMain, BrowserWindow, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import { logger } from '../services/logger';

interface ExportSaveOpts {
  base64?: boolean;
}

// Map a file extension to an appropriate save-dialog filter.
function filtersForFile(fileName: string): Electron.FileFilter[] {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case '.csv':
      return [{ name: 'CSV (Comma delimited)', extensions: ['csv'] }];
    case '.xlsx':
      return [{ name: 'Excel Workbook', extensions: ['xlsx'] }];
    case '.txt':
      return [{ name: 'Text File', extensions: ['txt'] }];
    default:
      return [{ name: 'All Files', extensions: ['*'] }];
  }
}

export function setupExportHandlers(): void {
  // Save arbitrary data (text or base64-encoded binary) to a user-chosen file.
  ipcMain.handle(
    'export:save',
    async (_event, defaultFileName: string, data: string, opts?: ExportSaveOpts) => {
      try {
        const { canceled, filePath } = await dialog.showSaveDialog({
          defaultPath: defaultFileName,
          filters: filtersForFile(defaultFileName),
        });

        if (canceled || !filePath) {
          return { success: false, canceled: true };
        }

        const buffer = opts?.base64
          ? Buffer.from(data, 'base64')
          : Buffer.from(data, 'utf8');

        fs.writeFileSync(filePath, buffer);

        return { success: true, path: filePath };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error('Export save failed', { error: msg });
        return { success: false, error: msg };
      }
    }
  );

  // Render an HTML string to PDF via an offscreen window and save it.
  ipcMain.handle('export:pdf', async (_event, html: string, defaultFileName: string) => {
    let pdfWindow: BrowserWindow | null = new BrowserWindow({
      show: false,
      webPreferences: { contextIsolation: true, nodeIntegration: false },
    });

    try {
      const buffer: Buffer = await new Promise((resolve, reject) => {
        pdfWindow!.webContents.once('did-finish-load', () => {
          const isLandscape = html.includes('landscape') || defaultFileName.toLowerCase().includes('invoice');
          pdfWindow!.webContents
            .printToPDF({
              printBackground: true,
              pageSize: 'A4',
              landscape: isLandscape,
              margins: { marginType: 'default' },
            })
            .then(resolve)
            .catch(reject);
        });
        pdfWindow!.webContents.once('did-fail-load', (_e, code, desc) => {
          reject(new Error(`Failed to load PDF content: ${code} ${desc}`));
        });
        pdfWindow!.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
      });

      const { canceled, filePath } = await dialog.showSaveDialog({
        defaultPath: defaultFileName,
        filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
      });

      if (canceled || !filePath) {
        return { success: false, canceled: true };
      }

      fs.writeFileSync(filePath, buffer);

      return { success: true, path: filePath };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('Export PDF failed', { error: msg });
      return { success: false, error: msg };
    } finally {
      // Always tear down the offscreen window.
      if (pdfWindow && !pdfWindow.isDestroyed()) {
        pdfWindow.close();
      }
      pdfWindow = null;
    }
  });
}
