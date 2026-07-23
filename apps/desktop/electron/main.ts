import { app, BrowserWindow, Tray } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import { setupDbHandlers } from './ipc/db.handler';
import { setupSyncHandlers } from './ipc/sync.handler';
import { setupPrintHandlers } from './ipc/print.handler';
import { setupBackupHandlers } from './ipc/backup.handler';
import { setupUpdateHandlers } from './ipc/update.handler';
import { initLocalDb } from './services/localDb.service';
import { setupTray } from './windows/tray';

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

async function createWindow() {
  // Initialize local SQLite database
  await initLocalDb();

  // Resolve icon path — works in dev and packaged
  const iconPath = path.join(app.getAppPath(), 'assets', 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'PharmaFlow ERP',
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: true,
    backgroundColor: '#F1F5F9',
  });

  // Load URL - use app.getAppPath() so it works in packaged .exe too
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // app.getAppPath() returns the root of the ASAR or app directory
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow?.hide();
  });

  // Setup tray
  tray = setupTray(mainWindow);

  // Setup IPC handlers
  setupDbHandlers();
  setupSyncHandlers(mainWindow);
  setupPrintHandlers();
  setupBackupHandlers();
  setupUpdateHandlers(mainWindow);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  mainWindow?.removeAllListeners('close');
});
