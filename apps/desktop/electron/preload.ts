import { contextBridge, ipcRenderer } from 'electron';

// Expose safe IPC API to React renderer process
contextBridge.exposeInMainWorld('pharmaAPI', {
  // Database operations
  db: {
    query: (sql: string, params?: any[]) => ipcRenderer.invoke('db:query', sql, params),
    run: (sql: string, params?: any[]) => ipcRenderer.invoke('db:run', sql, params),
    transaction: (operations: { sql: string; params?: any[] }[]) =>
      ipcRenderer.invoke('db:transaction', operations),
  },

  // Sync operations
  sync: {
    push: () => ipcRenderer.invoke('sync:push'),
    getStatus: () => ipcRenderer.invoke('sync:status'),
    onSyncComplete: (callback: (result: any) => void) =>
      ipcRenderer.on('sync:complete', (_e, result) => callback(result)),
  },

  // Print operations
  print: {
    invoice: (html: string) => ipcRenderer.invoke('print:invoice', html),
    report: (html: string) => ipcRenderer.invoke('print:report', html),
  },

  // Backup operations
  backup: {
    create: (destination?: string) => ipcRenderer.invoke('backup:create', destination),
    getList: () => ipcRenderer.invoke('backup:list'),
  },

  // App info
  app: {
    getVersion: () => ipcRenderer.invoke('app:version'),
    getDeviceId: () => ipcRenderer.invoke('app:deviceId'),
  },

  // Updates
  update: {
    check: () => ipcRenderer.invoke('update:check'),
    onAvailable: (callback: (info: any) => void) =>
      ipcRenderer.on('update:available', (_e, info) => callback(info)),
    onDownloaded: (callback: () => void) =>
      ipcRenderer.on('update:downloaded', () => callback()),
  },
});

// TypeScript declaration
declare global {
  interface Window {
    pharmaAPI: typeof import('./preload').pharmaAPI;
  }
}

export const pharmaAPI = {} as any; // placeholder for type export
