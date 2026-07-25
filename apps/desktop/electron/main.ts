import { app, BrowserWindow, Tray, protocol, net } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
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

  // Resolve icon path — use unpacked assets in packaged mode
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'assets', 'icon.png')
    : path.join(app.getAppPath(), 'assets', 'icon.png');

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
    show: false,  // Show window only when content is ready
    backgroundColor: '#F1F5F9',
  });

  // Load URL - use app.getAppPath() so it works in packaged .exe too
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // Use the custom app:// protocol to bypass file:// CORS restrictions for ES modules
    mainWindow.loadURL('app://index.html');
  }

  // Enable DevTools via F12 or Ctrl+Shift+I for debugging network API calls
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow?.webContents.toggleDevTools();
    }
  });

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer] ${message} (${sourceId}:${line})`);
  });

  // Show window only when content has finished loading
  mainWindow.once('ready-to-show', () => {
    console.log('✓ Content ready, showing window');
    mainWindow?.show();
  });

  // Handle failed page loads
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`✗ Failed to load ${validatedURL}: ${errorCode} - ${errorDescription}`);
  });

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
  // In packaged app: dist/ is in app.asar.unpacked/ (not inside app.asar)
  // In dev/preview: dist/ is directly under the project root
  const getDistPath = (...parts: string[]) => {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', ...parts);
    }
    return path.join(app.getAppPath(), 'dist', ...parts);
  };

  protocol.handle('app', async (request) => {
    try {
      let requestUrl = request.url.replace('app://', '').split('?')[0].split('#')[0];
      
      // Normalize request URL
      if (requestUrl.startsWith('index.html/')) {
        requestUrl = requestUrl.substring('index.html/'.length);
      }
      if (requestUrl.endsWith('/')) {
        requestUrl = requestUrl.slice(0, -1);
      }
      if (!requestUrl || requestUrl === 'index.html') {
        requestUrl = 'index.html';
      }
      
      let filePath = getDistPath(requestUrl);
      if (!fs.existsSync(filePath) && (!requestUrl.includes('.') || requestUrl === 'index.html')) {
        filePath = getDistPath('index.html');
      }
      
      // Convert to proper file:// URL for Windows and Unix
      const fileUrl = pathToFileURL(filePath).toString();
      console.log(`Loading: ${fileUrl}`);
      
      const response = await net.fetch(fileUrl);
      if (!response.ok) {
        console.error(`File fetch error for ${requestUrl}: ${response.status}`);
        if (!requestUrl.includes('.')) {
          const fallbackUrl = pathToFileURL(getDistPath('index.html')).toString();
          return net.fetch(fallbackUrl);
        }
        if (response.status === 404 && requestUrl.endsWith('.map')) {
          return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      }
      return response;
    } catch (error) {
      console.error('Protocol handler error:', error);
      return new Response('Error loading resource', { status: 500 });
    }
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  mainWindow?.removeAllListeners('close');
});
