import { app, BrowserWindow, Tray, protocol, net } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import { setupDbHandlers } from './ipc/db.handler';
import { setupSyncHandlers } from './ipc/sync.handler';
import { setupPrintHandlers } from './ipc/print.handler';
import { setupBackupHandlers } from './ipc/backup.handler';
import { setupUpdateHandlers } from './ipc/update.handler';
import { initLocalDb } from './services/localDb.service';
import { setupTray } from './windows/tray';

const isDev = !app.isPackaged && !process.argv.includes('--prod');
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
  } else {
    // Use the custom app:// protocol to bypass file:// CORS restrictions for ES modules
    mainWindow.loadURL('app://index.html');
  }

  // Always open DevTools during local runs (unpackaged) for easy debugging
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer] ${message} (${sourceId}:${line})`);
  });

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

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true } }
]);

app.whenReady().then(() => {
  protocol.handle('app', (request) => {
    let requestUrl = request.url.replace('app://', '').split('?')[0].split('#')[0];
    
    // If the browser treats index.html as a host, relative paths will request "index.html/assets/..."
    // We must strip "index.html/" to correctly locate the files under the "dist/" directory
    if (requestUrl.startsWith('index.html/')) {
      requestUrl = requestUrl.substring('index.html/'.length);
    }
    
    if (requestUrl.endsWith('/')) {
      requestUrl = requestUrl.slice(0, -1);
    }
    if (!requestUrl || requestUrl === 'index.html') {
      requestUrl = 'index.html';
    }
    const filePath = path.join(app.getAppPath(), 'dist', requestUrl);
    return net.fetch(`file:///${filePath.replace(/\\/g, '/')}`);
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  mainWindow?.removeAllListeners('close');
});
