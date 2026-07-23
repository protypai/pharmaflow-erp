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
const isDev = process.env.NODE_ENV === 'development';
let mainWindow = null;
let tray = null;
async function createWindow() {
    // Initialize local SQLite database
    await (0, localDb_service_1.initLocalDb)();
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        title: 'PharmaFlow ERP',
        icon: path_1.default.join(__dirname, '../../assets/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
            preload: path_1.default.join(__dirname, 'preload.js'),
        },
        show: false,
        backgroundColor: '#F1F5F9',
    });
    // Load URL
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../../dist/index.html'));
    }
    // Always open DevTools to debug (remove before final release)
    mainWindow.webContents.openDevTools();
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
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
electron_1.app.on('before-quit', () => {
    mainWindow?.removeAllListeners('close');
});
