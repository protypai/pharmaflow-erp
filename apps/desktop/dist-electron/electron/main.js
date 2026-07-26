"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const url_1 = require("url");
const db_handler_1 = require("./ipc/db.handler");
const sync_handler_1 = require("./ipc/sync.handler");
const print_handler_1 = require("./ipc/print.handler");
const backup_handler_1 = require("./ipc/backup.handler");
const update_handler_1 = require("./ipc/update.handler");
const localDb_service_1 = require("./services/localDb.service");
const tray_1 = require("./windows/tray");
const isDev = !electron_1.app.isPackaged && !process.argv.includes('--prod');
let mainWindow = null;
let tray = null;
async function createWindow() {
    // Initialize local SQLite database
    await (0, localDb_service_1.initLocalDb)();
    // Resolve icon path — use unpacked assets in packaged mode
    const iconPath = electron_1.app.isPackaged
        ? path_1.default.join(process.resourcesPath, 'app.asar.unpacked', 'assets', 'icon.png')
        : path_1.default.join(electron_1.app.getAppPath(), 'assets', 'icon.png');
    mainWindow = new electron_1.BrowserWindow({
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
            preload: path_1.default.join(__dirname, 'preload.js'),
        },
        show: false, // Show window only when content is ready
        backgroundColor: '#F1F5F9',
    });
    // CRITICAL FIX: Destroy the native Windows menu bar so it cannot steal keyboard focus when ALT is pressed
    mainWindow.setMenu(null);
    // Load URL - use app.getAppPath() so it works in packaged .exe too
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    }
    else {
        // Use the custom app:// protocol to bypass file:// CORS restrictions for ES modules
        mainWindow.loadURL('app://index.html');
    }
    // Enable DevTools via F12 or Ctrl+Shift+I for debugging network API calls
    mainWindow.webContents.on('before-input-event', (_event, input) => {
        if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
            mainWindow?.webContents.toggleDevTools();
        }
    });
    if (!electron_1.app.isPackaged) {
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
    tray = (0, tray_1.setupTray)(mainWindow);
    // Setup IPC handlers
    (0, db_handler_1.setupDbHandlers)();
    (0, sync_handler_1.setupSyncHandlers)(mainWindow);
    (0, print_handler_1.setupPrintHandlers)();
    (0, backup_handler_1.setupBackupHandlers)();
    (0, update_handler_1.setupUpdateHandlers)(mainWindow);
}
electron_1.protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true } }
]);
electron_1.app.whenReady().then(() => {
    // In packaged app: dist/ is in app.asar.unpacked/ (not inside app.asar)
    // In dev/preview: dist/ is directly under the project root
    const getDistPath = (...parts) => {
        if (electron_1.app.isPackaged) {
            return path_1.default.join(process.resourcesPath, 'app.asar.unpacked', 'dist', ...parts);
        }
        return path_1.default.join(electron_1.app.getAppPath(), 'dist', ...parts);
    };
    electron_1.protocol.handle('app', async (request) => {
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
            if (!fs_1.default.existsSync(filePath) && (!requestUrl.includes('.') || requestUrl === 'index.html')) {
                filePath = getDistPath('index.html');
            }
            // Convert to proper file:// URL for Windows and Unix
            const fileUrl = (0, url_1.pathToFileURL)(filePath).toString();
            console.log(`Loading: ${fileUrl}`);
            const response = await electron_1.net.fetch(fileUrl);
            if (!response.ok) {
                console.error(`File fetch error for ${requestUrl}: ${response.status}`);
                if (!requestUrl.includes('.')) {
                    const fallbackUrl = (0, url_1.pathToFileURL)(getDistPath('index.html')).toString();
                    return electron_1.net.fetch(fallbackUrl);
                }
                if (response.status === 404 && requestUrl.endsWith('.map')) {
                    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
                }
            }
            return response;
        }
        catch (error) {
            console.error('Protocol handler error:', error);
            return new Response('Error loading resource', { status: 500 });
        }
    });
    createWindow();
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
electron_1.app.on('before-quit', () => {
    mainWindow?.removeAllListeners('close');
});
