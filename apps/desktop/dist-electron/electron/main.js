"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
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
    // Resolve icon path — works in dev and packaged
    const iconPath = path_1.default.join(electron_1.app.getAppPath(), 'assets', 'icon.png');
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
        show: true,
        backgroundColor: '#F1F5F9',
    });
    // Load URL - use app.getAppPath() so it works in packaged .exe too
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    }
    else {
        // Use the custom app:// protocol to bypass file:// CORS restrictions for ES modules
        mainWindow.loadURL('app://index.html');
    }
    // Always open DevTools during local runs (unpackaged) for easy debugging
    if (!electron_1.app.isPackaged) {
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
    electron_1.protocol.handle('app', (request) => {
        console.log(`[Protocol Request] Original: ${request.url}`);
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
        const filePath = path_1.default.join(electron_1.app.getAppPath(), 'dist', requestUrl);
        console.log(`[Protocol Resolve] URL: ${requestUrl} -> FilePath: ${filePath}`);
        // Check if file exists to help debugging
        const fs = require('fs');
        if (!fs.existsSync(filePath)) {
            console.error(`[Protocol Error] File NOT found: ${filePath}`);
        }
        return electron_1.net.fetch(`file:///${filePath.replace(/\\/g, '/')}`);
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
