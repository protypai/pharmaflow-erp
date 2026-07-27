import { 
  products as mockProducts, 
  suppliers as mockSuppliers, 
  customers as mockCustomers,
  manufacturers as mockManufacturers,
  categories as mockCategories,
  racks as mockRacks
} from '../data/mockData';

// Helper to check if running inside Electron shell
export const isElectron = () => {
  return typeof window !== 'undefined' && window.pharmaAPI !== undefined;
};

// Generic DB query wrapper with mock fallback
export async function getEntities(tableName, mockFallback = []) {
  if (isElectron()) {
    try {
      const res = await window.pharmaAPI.db.query(`SELECT * FROM ${tableName} WHERE status = 'active'`);
      if (res.success && res.data && res.data.length > 0) {
        return res.data;
      }
    } catch (err) {
      console.warn(`[LocalDB] Failed to fetch ${tableName}, falling back to mock:`, err);
    }
  }
  return mockFallback;
}

// Entity-specific getters
export const getProducts = () => getEntities('products', mockProducts);
export const getSuppliers = () => getEntities('suppliers', mockSuppliers);
export const getCustomers = () => getEntities('customers', mockCustomers);
export const getManufacturers = () => getEntities('manufacturers', mockManufacturers);
export const getCategories = () => getEntities('categories', mockCategories);
export const getRacks = () => getEntities('racks', mockRacks);

// Queue an offline sync operation
export async function syncEntity(cloudTableName, operation, payload) {
  if (isElectron()) {
    try {
      const syncSql = `
        INSERT INTO sync_queue (id, table_name, operation, payload, is_synced, app_version, created_at)
        VALUES (?, ?, ?, ?, 0, ?, datetime('now'))
      `;
      // Use crypto.randomUUID for the sync_queue ID, not the entity ID (since an entity can be updated multiple times)
      const queueId = crypto.randomUUID ? crypto.randomUUID() : 'sq-' + Date.now() + Math.random().toString(36).substr(2, 9);
      const currentVersion = import.meta.env.VITE_APP_VERSION || 'v1.0.0';
      
      await window.pharmaAPI.db.run(syncSql, [queueId, cloudTableName, operation, JSON.stringify(payload), currentVersion]);

      // Ensure Electron has current tokens before syncing
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      if (accessToken && window.pharmaAPI.auth?.setToken) {
        await window.pharmaAPI.auth.setToken(accessToken, refreshToken);
      }

      // Trigger background sync push if online
      window.pharmaAPI.sync.push().catch(() => {});
    } catch (err) {
      console.error(`[Sync] Failed to queue sync for ${cloudTableName}:`, err);
    }
  }
}
