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

// Insert or save entity locally + add to offline sync queue
export async function saveEntity(tableName, entityData) {
  if (isElectron()) {
    try {
      const keys = Object.keys(entityData);
      const fields = keys.join(', ');
      const placeholders = keys.map(() => '?').join(', ');
      const values = Object.values(entityData);

      const sql = `INSERT OR REPLACE INTO ${tableName} (${fields}) VALUES (${placeholders})`;
      const result = await window.pharmaAPI.db.run(sql, values);

      // Trigger background sync push if online
      window.pharmaAPI.sync.push().catch(() => {});

      return { success: true, result };
    } catch (err) {
      console.error(`[LocalDB] Failed to save to ${tableName}:`, err);
      return { success: false, error: err.message };
    }
  }
  return { success: true, mocked: true };
}
