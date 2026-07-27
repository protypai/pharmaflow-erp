// Helper to check if running inside Electron shell
export const isElectron = () => {
  return typeof window !== 'undefined' && window.pharmaAPI !== undefined;
};

// When main refreshes the access token (after a 401), update localStorage so the
// next write does not push a stale token back into keytar.
if (typeof window !== 'undefined' && window.pharmaAPI?.auth?.onTokenRefreshed) {
  window.pharmaAPI.auth.onTokenRefreshed(({ accessToken }) => {
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }
  });
}

// Super Admin deactivated this account (detected on the next sync/refresh).
// Clear the session and bounce to the login screen with a message.
if (typeof window !== 'undefined' && window.pharmaAPI?.auth?.onForceLogout) {
  window.pharmaAPI.auth.onForceLogout((info) => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.setItem('logoutReason', (info && info.message) || 'Your account has been deactivated. Contact administrator.');
    window.location.hash = '#/login';
  });
}

// Queue an offline sync operation
export async function syncEntity(cloudTableName, operation, payload) {
  if (isElectron()) {
    try {
      const syncSql = `
        INSERT INTO sync_queue (id, table_name, operation, record_id, company_id, payload, is_synced, app_version, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?, datetime('now'))
      `;
      // Use crypto.randomUUID for the sync_queue ID, not the entity ID (since an entity can be updated multiple times)
      const queueId = crypto.randomUUID ? crypto.randomUUID() : 'sq-' + Date.now() + Math.random().toString(36).substr(2, 9);
      const currentVersion = import.meta.env.VITE_APP_VERSION || 'v1.0.0';
      const recordId = payload?.id ?? null;
      const companyId = payload?.companyId ?? payload?.company_id ?? null;

      await window.pharmaAPI.db.run(syncSql, [queueId, cloudTableName, operation, recordId, companyId, JSON.stringify(payload), currentVersion]);

      // Ensure Electron has current tokens before syncing. localStorage is kept
      // fresh by the auth:token-refreshed listener above, so this never pushes a
      // stale token back into keytar after a refresh.
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      if (accessToken && accessToken !== 'offline-session' && window.pharmaAPI.auth?.setToken) {
        await window.pharmaAPI.auth.setToken(accessToken, refreshToken);
      }

      // Trigger background sync push if online
      window.pharmaAPI.sync.push().catch(() => {});
    } catch (err) {
      console.error(`[Sync] Failed to queue sync for ${cloudTableName}:`, err);
    }
  }
}
