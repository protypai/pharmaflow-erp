import { contextBridge, ipcRenderer } from 'electron';

// Expose safe IPC API to React renderer process
contextBridge.exposeInMainWorld('pharmaAPI', {
  // Database operations
  db: {
    query: (sql: string, params?: any[]) => ipcRenderer.invoke('db:query', sql, params),
    run: (sql: string, params?: any[]) => ipcRenderer.invoke('db:run', sql, params),
    transaction: (operations: { sql: string; params?: any[] }[]) =>
      ipcRenderer.invoke('db:transaction', operations),
    reset: () => ipcRenderer.invoke('db:reset'),
  },

  // Sync operations
  sync: {
    push: () => ipcRenderer.invoke('sync:push'),
    pull: () => ipcRenderer.invoke('sync:pull'),
    getStatus: () => ipcRenderer.invoke('sync:status'),
    onSyncComplete: (callback: (result: any) => void) =>
      ipcRenderer.on('sync:complete', (_e, result) => callback(result)),
  },

  // Auth operations
  auth: {
    setToken: (token: string, refreshToken?: string) => ipcRenderer.invoke('auth:setToken', token, refreshToken),
    getToken: () => ipcRenderer.invoke('auth:getToken'),
    clearToken: () => ipcRenderer.invoke('auth:clearToken'),
    // Local (offline) auth helpers — bcrypt runs in main, never in the renderer.
    hashPassword: (plain: string) => ipcRenderer.invoke('auth:hashPassword', plain),
    verifyLocalPassword: (email: string, plain: string) =>
      ipcRenderer.invoke('auth:verifyLocalPassword', email, plain),
    // Fired after a 401 refresh in main so the renderer can update its stored token.
    onTokenRefreshed: (callback: (tokens: { accessToken: string }) => void) =>
      ipcRenderer.on('auth:token-refreshed', (_e, tokens) => callback(tokens)),
    onForceLogout: (callback: (info: { reason: string; message: string }) => void) =>
      ipcRenderer.on('auth:force-logout', (_e, info) => callback(info)),
  },

  // Print operations
  print: {
    invoice: (html: string) => ipcRenderer.invoke('print:invoice', html),
    report: (html: string) => ipcRenderer.invoke('print:report', html),
  },

  // Export operations (CSV / XLSX / TXT save + HTML-to-PDF)
  export: {
    save: (defaultFileName: string, data: string, opts?: { base64?: boolean }) =>
      ipcRenderer.invoke('export:save', defaultFileName, data, opts),
    pdf: (html: string, defaultFileName: string) =>
      ipcRenderer.invoke('export:pdf', html, defaultFileName),
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
    quitAndInstall: () => ipcRenderer.invoke('update:install'),
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
