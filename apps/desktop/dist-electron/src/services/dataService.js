"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRacks = exports.getCategories = exports.getManufacturers = exports.getCustomers = exports.getSuppliers = exports.getProducts = exports.isElectron = void 0;
exports.getEntities = getEntities;
exports.saveEntity = saveEntity;
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
// Insert or save entity locally + add to offline sync queue
async function saveEntity(tableName, entityData) {
    if ((0, exports.isElectron)()) {
        try {
            const keys = Object.keys(entityData);
            const fields = keys.join(', ');
            const placeholders = keys.map(() => '?').join(', ');
            const values = Object.values(entityData);
            const sql = `INSERT OR REPLACE INTO ${tableName} (${fields}) VALUES (${placeholders})`;
            const result = await window.pharmaAPI.db.run(sql, values);
            // Trigger background sync push if online
            window.pharmaAPI.sync.push().catch(() => { });
            return { success: true, result };
        }
        catch (err) {
            console.error(`[LocalDB] Failed to save to ${tableName}:`, err);
            return { success: false, error: err.message };
        }
    }
    return { success: true, mocked: true };
}
