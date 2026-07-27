"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRacks = exports.getCategories = exports.getManufacturers = exports.getCustomers = exports.getSuppliers = exports.getProducts = exports.isElectron = void 0;
exports.getEntities = getEntities;
exports.syncEntity = syncEntity;
const mockData_1 = require("../data/mockData");
// Helper to check if running inside Electron shell
const isElectron = () => {
    return typeof window !== 'undefined' && window.pharmaAPI !== undefined;
};
exports.isElectron = isElectron;
// Generic DB query wrapper with mock fallback
async function getEntities(tableName, mockFallback = []) {
    if ((0, exports.isElectron)()) {
        try {
            const res = await window.pharmaAPI.db.query(`SELECT * FROM ${tableName} WHERE status = 'active'`);
            if (res.success && res.data && res.data.length > 0) {
                return res.data;
            }
        }
        catch (err) {
            console.warn(`[LocalDB] Failed to fetch ${tableName}, falling back to mock:`, err);
        }
    }
    return mockFallback;
}
// Entity-specific getters
const getProducts = () => getEntities('products', mockData_1.products);
exports.getProducts = getProducts;
const getSuppliers = () => getEntities('suppliers', mockData_1.suppliers);
exports.getSuppliers = getSuppliers;
const getCustomers = () => getEntities('customers', mockData_1.customers);
exports.getCustomers = getCustomers;
const getManufacturers = () => getEntities('manufacturers', mockData_1.manufacturers);
exports.getManufacturers = getManufacturers;
const getCategories = () => getEntities('categories', mockData_1.categories);
exports.getCategories = getCategories;
const getRacks = () => getEntities('racks', mockData_1.racks);
exports.getRacks = getRacks;
// Queue an offline sync operation
async function syncEntity(cloudTableName, operation, payload) {
    if ((0, exports.isElectron)()) {
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
            window.pharmaAPI.sync.push().catch(() => { });
        }
        catch (err) {
            console.error(`[Sync] Failed to queue sync for ${cloudTableName}:`, err);
        }
    }
}
