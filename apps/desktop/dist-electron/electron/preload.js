"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pharmaAPI = void 0;
const electron_1 = require("electron");
// Expose safe IPC API to React renderer process
electron_1.contextBridge.exposeInMainWorld('pharmaAPI', {
    // Database operations
    db: {
        query: (sql, params) => electron_1.ipcRenderer.invoke('db:query', sql, params),
        run: (sql, params) => electron_1.ipcRenderer.invoke('db:run', sql, params),
        transaction: (operations) => electron_1.ipcRenderer.invoke('db:transaction', operations),
        reset: () => electron_1.ipcRenderer.invoke('db:reset'),
    },
    // Sync operations
    sync: {
        push: () => electron_1.ipcRenderer.invoke('sync:push'),
        getStatus: () => electron_1.ipcRenderer.invoke('sync:status'),
        onSyncComplete: (callback) => electron_1.ipcRenderer.on('sync:complete', (_e, result) => callback(result)),
    },
    // Auth operations
    auth: {
        setToken: (token, refreshToken) => electron_1.ipcRenderer.invoke('auth:setToken', token, refreshToken),
        clearToken: () => electron_1.ipcRenderer.invoke('auth:clearToken')
    },
    // Print operations
    print: {
        invoice: (html) => electron_1.ipcRenderer.invoke('print:invoice', html),
        report: (html) => electron_1.ipcRenderer.invoke('print:report', html),
    },
    // Backup operations
    backup: {
        create: (destination) => electron_1.ipcRenderer.invoke('backup:create', destination),
        getList: () => electron_1.ipcRenderer.invoke('backup:list'),
    },
    // App info
    app: {
        getVersion: () => electron_1.ipcRenderer.invoke('app:version'),
        getDeviceId: () => electron_1.ipcRenderer.invoke('app:deviceId'),
    },
    // Updates
    update: {
        check: () => electron_1.ipcRenderer.invoke('update:check'),
        quitAndInstall: () => electron_1.ipcRenderer.invoke('update:install'),
        onAvailable: (callback) => electron_1.ipcRenderer.on('update:available', (_e, info) => callback(info)),
        onDownloaded: (callback) => electron_1.ipcRenderer.on('update:downloaded', () => callback()),
    },
});
exports.pharmaAPI = {}; // placeholder for type export
