import { app, BrowserWindow, Tray, protocol, net, session } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { setupDbHandlers } from './ipc/db.handler';
import { setupSyncHandlers } from './ipc/sync.handler';
import { setupPrintHandlers } from './ipc/print.handler';
import { setupExportHandlers } from './ipc/export.handler';
import { setupBackupHandlers } from './ipc/backup.handler';
import { setupUpdateHandlers } from './ipc/update.handler';
import { initLocalDb } from './services/localDb.service';
import { setupTray } from './windows/tray';

const isDev = !app.isPackaged && !process.argv.includes('--prod');
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// Load .env variables into process.env in dev mode so the main process knows
// about VITE_CLOUD_API_URL and does not block it in Content-Security-Policy.
if (isDev) {
  try {
    const envPath = path.join(app.getAppPath(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach((line) => {
        const parts = line.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          let val = parts.slice(1).join('=').trim();
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
          process.env[key] = val;
        }
      });
    }
  } catch (err: any) {
    console.error('Failed to load local .env file in main process:', err.message);
  }
}

const DEV_ORIGIN = 'http://localhost:5173';

// Resolve the configured API origin for the CSP connect-src allowlist.
// Packaged builds fall back to the production host (never localhost) so the CSP
// can't block the real API even if .env.production fails to load.
function getApiOrigin(): string {
  const fallback = app.isPackaged ? 'https://sagarpharma.duckdns.org' : 'http://localhost:5000';
  const raw = process.env.VITE_API_BASE_URL || process.env.VITE_CLOUD_API_URL || fallback;
  try {
    return new URL(raw).origin;
  } catch {
    return fallback;
  }
}

// Content-Security-Policy: restrict to self + the app:// protocol + configured API.
// The dev policy also permits the Vite dev server (inline/eval + HMR websocket).
function buildCsp(): string {
  const api = getApiOrigin();
  if (isDev) {
    return [
      `default-src 'self' app: ${DEV_ORIGIN}`,
      `script-src 'self' app: ${DEV_ORIGIN} 'unsafe-inline' 'unsafe-eval'`,
      "style-src 'self' app: 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' app: data: blob:",
      "font-src 'self' app: data: https://fonts.gstatic.com",
      `connect-src 'self' app: ${DEV_ORIGIN} ws://localhost:5173 ${api}`,
    ].join('; ');
  }
  return [
    "default-src 'self' app:",
    "script-src 'self' app:",
    "style-src 'self' app: 'unsafe-inline'",
    "img-src 'self' app: data:",
    "font-src 'self' app: data:",
    `connect-src 'self' app: ${api}`,
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

// Apply a CSP response header to every request in the default session.
function setupContentSecurityPolicy(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [buildCsp()],
      },
    });
  });
}

// Load env into process.env so the main process (CSP connect-src, sync URL) uses
// the same API origin as the renderer. Packaged builds read the bundled
// .env.production; dev reads the local .env.
try {
  const envFile = app.isPackaged ? '.env.production' : '.env';
  const envPath = path.join(app.getAppPath(), envFile);
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        if (key && !key.startsWith('#')) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (err) {
  console.warn('Failed to load local .env file in main process:', err);
}

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
      // Hardened defaults: enforce same-origin policy, and run the renderer in a
      // sandboxed process. The preload only uses electron's contextBridge/ipcRenderer,
      // both of which remain available under the sandbox.
      webSecurity: !isDev,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,  // Show window only when content is ready
    backgroundColor: '#F1F5F9',
  });

  // CRITICAL FIX: Destroy the native Windows menu bar so it cannot steal keyboard focus when ALT is pressed
  mainWindow.setMenu(null);

  // Load URL - use app.getAppPath() so it works in packaged .exe too
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // Use the custom app:// protocol to bypass file:// CORS restrictions for ES modules
    mainWindow.loadURL('app://index.html');
  }

  // DevTools toggle (F12 / Ctrl+Shift+I) — development builds only. Disabled in
  // packaged production builds so end users cannot open the inspector.
  if (!app.isPackaged) {
    mainWindow.webContents.on('before-input-event', (_event, input) => {
      if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
        mainWindow?.webContents.toggleDevTools();
      }
    });
    mainWindow.webContents.openDevTools();
  }

  // Navigation hardening: block navigation to any external origin and deny all
  // attempts to open new windows.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowed = url.startsWith('app://') || (isDev && url.startsWith(DEV_ORIGIN));
    if (!allowed) {
      event.preventDefault();
      console.warn(`Blocked navigation to external origin: ${url}`);
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.warn(`Blocked new window request: ${url}`);
    return { action: 'deny' };
  });

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
  setupExportHandlers();
  setupBackupHandlers();
  setupUpdateHandlers(mainWindow);
}

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true } }
]);

app.whenReady().then(() => {
  // Apply Content-Security-Policy headers to all responses.
  setupContentSecurityPolicy();

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
