import { ipcMain, BrowserWindow, dialog } from 'electron';
import { migrationEngine } from '../services/migrationEngine';
import { logger } from '../services/logger';

export function setupImportHandlers(mainWindow: BrowserWindow | null) {
  ipcMain.handle('import:selectFile', async () => {
    if (!mainWindow) return null;
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Data Files', extensions: ['csv', 'xlsx', 'db', 'sqlite'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    if (canceled || filePaths.length === 0) {
      return null;
    }
    return filePaths[0];
  });

  ipcMain.handle('import:analyze', async (_event, filePath: string, format: string) => {
    logger.info(`IPC: import:analyze called with ${filePath}, ${format}`);
    return await migrationEngine.analyzeSource(filePath, format);
  });

  ipcMain.handle('import:start', async (_event, filePath: string, format: string, options: any) => {
    logger.info(`IPC: import:start called with ${filePath}, ${format}`);
    
    // Attach listener specifically for this import run
    const onProgress = (progress: any) => {
      if (mainWindow) {
        mainWindow.webContents.send('import:progress', progress);
      }
    };
    
    migrationEngine.on('progress', onProgress);

    try {
      await migrationEngine.startImport(filePath, format, options);
      return { success: true };
    } catch (error: any) {
      logger.error('Import process failed via IPC', { error: error.message });
      throw error;
    } finally {
      // Clean up the listener after import completes or fails
      migrationEngine.off('progress', onProgress);
    }
  });
}
