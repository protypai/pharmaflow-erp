"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProductMaster;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const dataService_1 = require("../../services/dataService");
function ProductMaster() {
    const [search, setSearch] = (0, react_1.useState)('');
    const [catFilter, setCatFilter] = (0, react_1.useState)('');
    const [mfgFilter, setMfgFilter] = (0, react_1.useState)('');
    const [isModalOpen, setIsModalOpen] = (0, react_1.useState)(false);
    const [modalTab, setModalTab] = (0, react_1.useState)('basic');
    const [isBatchesModalOpen, setIsBatchesModalOpen] = (0, react_1.useState)(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = (0, react_1.useState)(false);
    const [selectedProduct, setSelectedProduct] = (0, react_1.useState)(null);
    const [productBatches, setProductBatches] = (0, react_1.useState)([]);
    const [productHistory, setProductHistory] = (0, react_1.useState)([]);
    const [productsList, setProductsList] = (0, react_1.useState)([]);
    const [categories, setCategories] = (0, react_1.useState)([]);
    const [manufacturers, setManufacturers] = (0, react_1.useState)([]);
    const [racks, setRacks] = (0, react_1.useState)([]);
    // Form State
    const [formData, setFormData] = (0, react_1.useState)({
        id: null,
        name: '', generic_name: '', manufacturer_id: '', category_id: '',
        code: '', barcode: '', packing: '',
        hsn_code: '', gst_rate: 12, schedule: 'Not Scheduled (OTC)',
        purchase_unit: 'Box', sale_unit: 'Strip', conversion_factor: 10,
        rack_id: '', min_stock: 0, max_stock: 0
    });
    const [errorMsg, setErrorMsg] = (0, react_1.useState)('');
    const fetchData = async () => {
        try {
            const prodsRes = await window.pharmaAPI.db.query(`
        SELECT p.*, c.name as category_name, m.name as mfg_name, r.code as rack_code,
               IFNULL(b_agg.totalQty, 0) as totalQty
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
        LEFT JOIN racks r ON p.rack_id = r.id
        LEFT JOIN (
           SELECT product_id, SUM(current_qty) as totalQty
           FROM batches
           WHERE current_qty > 0
           GROUP BY product_id
        ) b_agg ON b_agg.product_id = p.id
        ORDER BY p.name ASC
      `);
            setProductsList(prodsRes?.data || []);
            const catsRes = await window.pharmaAPI.db.query("SELECT * FROM categories ORDER BY name ASC");
            setCategories(catsRes?.data || []);
            const mfgsRes = await window.pharmaAPI.db.query("SELECT * FROM manufacturers ORDER BY name ASC");
            setManufacturers(mfgsRes?.data || []);
            const racksRes = await window.pharmaAPI.db.query("SELECT * FROM racks ORDER BY code ASC");
            setRacks(racksRes?.data || []);
        }
        catch (err) {
            console.error('Failed to load product data', err);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchData();
    }, []);
    const handleSave = async () => {
        setErrorMsg('');
        if (!formData.name || !formData.generic_name || !formData.hsn_code || !formData.conversion_factor) {
            setErrorMsg("Name, Generic Name, HSN Code, and Conversion Factor are required.");
            return;
        }
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userRes = await window.pharmaAPI.db.query("SELECT company_id FROM users WHERE email = ?", [user.email]);
            if (!userRes?.data?.length)
                throw new Error("Admin user not found in local DB");
            const companyId = userRes.data[0].company_id;
            const code = formData.code || ('ITM' + Math.floor(Math.random() * 100000));
            const isNew = !formData.id;
            const id = isNew ? 'PROD-' + Date.now() : formData.id;
            if (!isNew) {
                const res = await window.pharmaAPI.db.run(`
          UPDATE products SET
            code = ?, barcode = ?, name = ?, generic_name = ?, manufacturer_id = ?, category_id = ?,
            rack_id = ?, packing = ?, purchase_unit = ?, sale_unit = ?, conversion_factor = ?,
            hsn_code = ?, gst_rate = ?, schedule = ?, min_stock = ?, max_stock = ?, updated_at = datetime('now')
          WHERE id = ?
        `, [
                    code, formData.barcode, formData.name, formData.generic_name,
                    formData.manufacturer_id || null, formData.category_id || null, formData.rack_id || null,
                    formData.packing, formData.purchase_unit, formData.sale_unit, formData.conversion_factor,
                    formData.hsn_code, formData.gst_rate, formData.schedule, formData.min_stock, formData.max_stock,
                    formData.id
                ]);
                if (!res.success) {
                    setErrorMsg("Database error: " + res.error);
                    return;
                }
            }
            else {
                const res = await window.pharmaAPI.db.run(`
          INSERT INTO products (
            id, company_id, code, barcode, name, generic_name, manufacturer_id, category_id,
            rack_id, packing, purchase_unit, sale_unit, conversion_factor, hsn_code, gst_rate,
            schedule, min_stock, max_stock, status, created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now')
          )
        `, [
                    id, companyId, code, formData.barcode, formData.name, formData.generic_name,
                    formData.manufacturer_id || null, formData.category_id || null, formData.rack_id || null,
                    formData.packing, formData.purchase_unit, formData.sale_unit, formData.conversion_factor,
                    formData.hsn_code, formData.gst_rate, formData.schedule, formData.min_stock, formData.max_stock
                ]);
                if (!res.success) {
                    setErrorMsg("Database error: " + res.error);
                    return;
                }
            }
            // Sync to cloud
            await (0, dataService_1.syncEntity)('Product', isNew ? 'create' : 'update', {
                id,
                companyId,
                code,
                barcode: formData.barcode,
                name: formData.name,
                genericName: formData.generic_name,
                manufacturerId: formData.manufacturer_id || null,
                categoryId: formData.category_id || null,
                rackId: formData.rack_id || null,
                packing: formData.packing,
                purchaseUnit: formData.purchase_unit,
                saleUnit: formData.sale_unit,
                conversionFactor: formData.conversion_factor,
                hsnCode: formData.hsn_code,
                gstRate: formData.gst_rate,
                schedule: formData.schedule,
                minStock: formData.min_stock,
                maxStock: formData.max_stock,
                status: 'active'
            });
            setIsModalOpen(false);
            setFormData({
                id: null,
                name: '', generic_name: '', manufacturer_id: '', category_id: '',
                code: '', barcode: '', packing: '',
                hsn_code: '', gst_rate: 12, schedule: 'Not Scheduled (OTC)',
                purchase_unit: 'Box', sale_unit: 'Strip', conversion_factor: 10,
                rack_id: '', min_stock: 0, max_stock: 0
            });
            fetchData();
        }
        catch (err) {
            console.error("Save failed", err);
            setErrorMsg("Failed to save product: " + err.message);
        }
    };
    const handleEdit = (prod) => {
        setFormData({
            id: prod.id,
            name: prod.name || '', generic_name: prod.generic_name || '', manufacturer_id: prod.manufacturer_id || '', category_id: prod.category_id || '',
            code: prod.code || '', barcode: prod.barcode || '', packing: prod.packing || '',
            hsn_code: prod.hsn_code || '', gst_rate: prod.gst_rate || 12, schedule: prod.schedule || 'Not Scheduled (OTC)',
            purchase_unit: prod.purchase_unit || 'Box', sale_unit: prod.sale_unit || 'Strip', conversion_factor: prod.conversion_factor || 10,
            rack_id: prod.rack_id || '', min_stock: prod.min_stock || 0, max_stock: prod.max_stock || 0
        });
        setModalTab('basic');
        setIsModalOpen(true);
    };
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?"))
            return;
        try {
            await window.pharmaAPI.db.run("DELETE FROM products WHERE id = ?", [id]);
            // Sync to cloud
            await (0, dataService_1.syncEntity)('Product', 'delete', { id });
            fetchData();
        }
        catch (err) {
            alert("Failed to delete product: " + err.message);
        }
    };
    const handleViewBatches = async (prod) => {
        setSelectedProduct(prod);
        try {
            const res = await window.pharmaAPI.db.query("SELECT * FROM batches WHERE product_id = ? ORDER BY expiry_date ASC", [prod.id]);
            setProductBatches(res?.data || []);
            setIsBatchesModalOpen(true);
        }
        catch (err) {
            alert("Failed to load batches: " + err.message);
        }
    };
    const handleStockHistory = async (prod) => {
        setSelectedProduct(prod);
        try {
            // Fetch Purchases
            const purRes = await window.pharmaAPI.db.query(`
        SELECT p.invoice_date as date, 'Purchase' as type, p.invoice_no as ref_no, pi.qty, pi.free_qty, b.batch_no
        FROM purchase_items pi
        JOIN purchases p ON pi.purchase_id = p.id
        JOIN batches b ON pi.batch_id = b.id
        WHERE pi.product_id = ?
        ORDER BY p.invoice_date DESC
      `, [prod.id]);
            // Fetch Sales
            const saleRes = await window.pharmaAPI.db.query(`
        SELECT s.date as date, 'Sale' as type, s.invoice_no as ref_no, si.qty, 0 as free_qty, b.batch_no
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN batches b ON si.batch_id = b.id
        WHERE si.product_id = ?
        ORDER BY s.date DESC
      `, [prod.id]);
            const history = [...(purRes?.data || []), ...(saleRes?.data || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
            setProductHistory(history);
            setIsHistoryModalOpen(true);
        }
        catch (err) {
            alert("Failed to load history: " + err.message);
        }
    };
    const filtered = productsList.filter(p => {
        if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.generic_name?.toLowerCase().includes(search.toLowerCase()) && !p.code.toLowerCase().includes(search.toLowerCase()))
            return false;
        if (catFilter && p.category_id !== catFilter)
            return false;
        if (mfgFilter && p.manufacturer_id !== mfgFilter)
            return false;
        return true;
    });
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsx)("h2", { className: "card-title", children: "Product Master" }), (0, jsx_runtime_1.jsxs)("div", { className: "search-bar", children: [(0, jsx_runtime_1.jsxs)("div", { className: "search-input-wrap", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 16, className: "search-icon" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", placeholder: "Search product name or generic...", value: search, onChange: e => setSearch(e.target.value), style: { width: '250px' } })] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-primary", onClick: () => {
                                    setFormData({
                                        id: null,
                                        name: '', generic_name: '', manufacturer_id: '', category_id: '',
                                        code: '', barcode: '', packing: '',
                                        hsn_code: '', gst_rate: 12, schedule: 'Not Scheduled (OTC)',
                                        purchase_unit: 'Box', sale_unit: 'Strip', conversion_factor: 10,
                                        rack_id: '', min_stock: 0, max_stock: 0
                                    });
                                    setModalTab('basic');
                                    setIsModalOpen(true);
                                }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { size: 16 }), " New Product"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "filter-bar", children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Filter, { size: 16 }), " Filters:"] }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: catFilter, onChange: e => setCatFilter(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "All Categories" }), categories.map(c => (0, jsx_runtime_1.jsx)("option", { value: c.id, children: c.name }, c.id))] }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: mfgFilter, onChange: e => setMfgFilter(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "All Manufacturers" }), manufacturers.map(m => (0, jsx_runtime_1.jsx)("option", { value: m.id, children: m.name }, m.id))] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Item Code" }), (0, jsx_runtime_1.jsx)("th", { children: "Product Details" }), (0, jsx_runtime_1.jsx)("th", { children: "Category / Mfg" }), (0, jsx_runtime_1.jsx)("th", { children: "Stock Status" }), (0, jsx_runtime_1.jsx)("th", { children: "Tax Info" }), (0, jsx_runtime_1.jsx)("th", { className: "col-actions", children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: filtered.map(prod => {
                                const totalStock = prod.totalQty || 0;
                                const isLow = totalStock < prod.min_stock;
                                return ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { style: { color: 'var(--text-secondary)', fontWeight: 500 }, children: prod.code }), (0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 600, color: 'var(--text-primary)' }, children: prod.name }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: [prod.generic_name, " \u2022 ", prod.packing] })] }), (0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem' }, children: prod.category_name || 'N/A' }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: prod.mfg_name || 'N/A' })] }), (0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { fontWeight: 600, color: isLow ? 'var(--danger)' : 'var(--text-primary)' }, children: [totalStock, " ", prod.sale_unit] }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: ["Rack: ", prod.rack_code || 'None'] })] }), (0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.8rem' }, children: ["GST: ", prod.gst_rate, "%"] }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: ["HSN: ", prod.hsn_code] })] }), (0, jsx_runtime_1.jsx)("td", { className: "col-actions", children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }, children: [(0, jsx_runtime_1.jsx)("button", { className: "btn btn-outline btn-sm", title: "View Batches", style: { color: 'var(--purple)', borderColor: 'var(--purple)' }, onClick: () => handleViewBatches(prod), children: (0, jsx_runtime_1.jsx)(lucide_react_1.Package, { size: 14 }) }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-outline btn-sm", title: "Stock History", style: { color: 'var(--info-dark)', borderColor: 'var(--info-dark)' }, onClick: () => handleStockHistory(prod), children: (0, jsx_runtime_1.jsx)(lucide_react_1.History, { size: 14 }) }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost btn-sm", title: "Edit", onClick: () => handleEdit(prod), children: (0, jsx_runtime_1.jsx)(lucide_react_1.Edit2, { size: 14 }) }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost btn-sm", title: "Delete", onClick: () => handleDelete(prod.id), style: { color: 'var(--danger)' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 14 }) })] }) })] }, prod.id));
                            }) })] }) }), isModalOpen && ((0, jsx_runtime_1.jsx)("div", { style: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }, children: (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { width: '800px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", style: { borderBottom: '1px solid var(--border)', background: '#F8FAFC' }, children: [(0, jsx_runtime_1.jsx)("h3", { className: "card-title", children: "Add New Product" }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost", onClick: () => setIsModalOpen(false), style: { padding: '0.25rem' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 20 }) })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', borderBottom: '1px solid var(--border)' }, children: [(0, jsx_runtime_1.jsx)("button", { className: `btn btn-ghost`, style: { borderRadius: 0, borderBottom: modalTab === 'basic' ? '2px solid var(--primary)' : '2px solid transparent', color: modalTab === 'basic' ? 'var(--primary)' : 'inherit', padding: '1rem 1.5rem' }, onClick: () => setModalTab('basic'), children: "1. Basic Details" }), (0, jsx_runtime_1.jsx)("button", { className: `btn btn-ghost`, style: { borderRadius: 0, borderBottom: modalTab === 'tax' ? '2px solid var(--primary)' : '2px solid transparent', color: modalTab === 'tax' ? 'var(--primary)' : 'inherit', padding: '1rem 1.5rem' }, onClick: () => setModalTab('tax'), children: "2. Taxation & Compliance" }), (0, jsx_runtime_1.jsx)("button", { className: `btn btn-ghost`, style: { borderRadius: 0, borderBottom: modalTab === 'inv' ? '2px solid var(--primary)' : '2px solid transparent', color: modalTab === 'inv' ? 'var(--primary)' : 'inherit', padding: '1rem 1.5rem' }, onClick: () => setModalTab('inv'), children: "3. Inventory & Units" })] }), errorMsg && ((0, jsx_runtime_1.jsx)("div", { style: { background: '#fee2e2', color: '#dc2626', padding: '0.75rem', margin: '1rem 1.5rem 0', borderRadius: '4px', border: '1px solid #f87171' }, children: errorMsg })), (0, jsx_runtime_1.jsxs)("div", { className: "card-body", style: { overflowY: 'auto' }, children: [modalTab === 'basic' && ((0, jsx_runtime_1.jsxs)("div", { className: "form-row-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", style: { gridColumn: 'span 2' }, children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Product Name (as on pack) ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", placeholder: "e.g. Dolo 650mg Tablet", value: formData.name, onChange: e => setFormData({ ...formData, name: e.target.value }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", style: { gridColumn: 'span 2' }, children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Generic Name / Composition ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", placeholder: "e.g. Paracetamol 650mg", value: formData.generic_name, onChange: e => setFormData({ ...formData, generic_name: e.target.value }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Manufacturer / Company" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: formData.manufacturer_id, onChange: e => setFormData({ ...formData, manufacturer_id: e.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select Company..." }), manufacturers.map(m => (0, jsx_runtime_1.jsx)("option", { value: m.id, children: m.name }, m.id))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Category" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: formData.category_id, onChange: e => setFormData({ ...formData, category_id: e.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select Category..." }), categories.map(c => (0, jsx_runtime_1.jsx)("option", { value: c.id, children: c.name }, c.id))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Item Code / Barcode" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", placeholder: "Leave empty to auto-generate", value: formData.code, onChange: e => setFormData({ ...formData, code: e.target.value }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Packing Description" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", placeholder: "e.g. 15x10 (15 strips of 10)", value: formData.packing, onChange: e => setFormData({ ...formData, packing: e.target.value }) })] })] })), modalTab === 'tax' && ((0, jsx_runtime_1.jsxs)("div", { className: "form-row-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["HSN Code ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", placeholder: "e.g. 3004", maxLength: "8", value: formData.hsn_code, onChange: e => setFormData({ ...formData, hsn_code: e.target.value }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["GST Slab % ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: formData.gst_rate, onChange: e => setFormData({ ...formData, gst_rate: Number(e.target.value) }), children: [(0, jsx_runtime_1.jsx)("option", { value: "12", children: "12% (Common Medicines)" }), (0, jsx_runtime_1.jsx)("option", { value: "5", children: "5% (Life Saving)" }), (0, jsx_runtime_1.jsx)("option", { value: "18", children: "18% (Supplements/Cosmetics)" }), (0, jsx_runtime_1.jsx)("option", { value: "0", children: "0% (Exempt)" }), (0, jsx_runtime_1.jsx)("option", { value: "28", children: "28%" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Drug Schedule" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: formData.schedule, onChange: e => setFormData({ ...formData, schedule: e.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { children: "Not Scheduled (OTC)" }), (0, jsx_runtime_1.jsx)("option", { children: "Schedule H (Prescription)" }), (0, jsx_runtime_1.jsx)("option", { children: "Schedule H1 (Strict Rx)" }), (0, jsx_runtime_1.jsx)("option", { children: "Schedule X (Narcotics)" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "form-group", style: { display: 'flex', alignItems: 'flex-end', paddingBottom: '0.5rem' }, children: (0, jsx_runtime_1.jsxs)("label", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", style: { width: '18px', height: '18px' } }), (0, jsx_runtime_1.jsx)("span", { style: { fontWeight: 600 }, children: "Under DPCO (Price Control)" })] }) })] })), modalTab === 'inv' && ((0, jsx_runtime_1.jsxs)("div", { className: "form-row-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Purchase Unit" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: formData.purchase_unit, onChange: e => setFormData({ ...formData, purchase_unit: e.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { children: "Box" }), (0, jsx_runtime_1.jsx)("option", { children: "Case" }), (0, jsx_runtime_1.jsx)("option", { children: "Jar" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Sale Unit" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: formData.sale_unit, onChange: e => setFormData({ ...formData, sale_unit: e.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { children: "Strip" }), (0, jsx_runtime_1.jsx)("option", { children: "Bottle" }), (0, jsx_runtime_1.jsx)("option", { children: "Tube" }), (0, jsx_runtime_1.jsx)("option", { children: "Box" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Conversion Factor ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("span", { children: ["1 ", formData.purchase_unit, " ="] }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: "number", placeholder: "Qty", style: { width: '80px' }, value: formData.conversion_factor, onChange: e => setFormData({ ...formData, conversion_factor: Number(e.target.value) }) }), (0, jsx_runtime_1.jsxs)("span", { children: [formData.sale_unit, "s"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Default Rack / Location" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: formData.rack_id, onChange: e => setFormData({ ...formData, rack_id: e.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "No Rack Assigned" }), racks.map(r => (0, jsx_runtime_1.jsxs)("option", { value: r.id, children: [r.code, " - ", r.description] }, r.id))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Min Stock Level (", formData.sale_unit, "s)"] }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: "number", placeholder: "Alert below this", value: formData.min_stock, onChange: e => setFormData({ ...formData, min_stock: Number(e.target.value) }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Max Stock Level (", formData.sale_unit, "s)"] }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: "number", placeholder: "Stop over-ordering", value: formData.max_stock, onChange: e => setFormData({ ...formData, max_stock: Number(e.target.value) }) })] })] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "card-header", style: { borderTop: '1px solid var(--border)', justifyContent: 'flex-end', background: '#F8FAFC' }, children: [(0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost", onClick: () => setIsModalOpen(false), children: "Cancel" }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-primary", onClick: handleSave, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Save, { size: 16 }), " Save Product"] })] })] }) })), isBatchesModalOpen && ((0, jsx_runtime_1.jsx)("div", { className: "modal-overlay", children: (0, jsx_runtime_1.jsxs)("div", { className: "modal", style: { width: '800px', maxWidth: '95vw' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "modal-header", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "modal-title", children: ["Batches - ", selectedProduct?.name] }), (0, jsx_runtime_1.jsx)("button", { className: "modal-close", onClick: () => setIsBatchesModalOpen(false), children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 18 }) })] }), (0, jsx_runtime_1.jsx)("div", { className: "modal-body no-pad", style: { maxHeight: '60vh', overflowY: 'auto' }, children: productBatches.length > 0 ? ((0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Batch No" }), (0, jsx_runtime_1.jsx)("th", { children: "Expiry" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "MRP" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "PTR" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Current Qty" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: productBatches.map(b => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 600 }, children: b.batch_no }), (0, jsx_runtime_1.jsx)("td", { style: { color: new Date(b.expiry_date) < new Date() ? 'var(--danger)' : 'inherit' }, children: b.expiry_date }), (0, jsx_runtime_1.jsxs)("td", { style: { textAlign: 'right' }, children: ["\u20B9", b.mrp.toFixed(2)] }), (0, jsx_runtime_1.jsxs)("td", { style: { textAlign: 'right' }, children: ["\u20B9", b.ptr.toFixed(2)] }), (0, jsx_runtime_1.jsxs)("td", { style: { textAlign: 'right', fontWeight: 600, color: b.current_qty > 0 ? 'var(--text-primary)' : 'var(--danger)' }, children: [b.current_qty, " ", selectedProduct?.sale_unit] })] }, b.id))) })] })) : ((0, jsx_runtime_1.jsx)("div", { style: { padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }, children: "No batches found for this product." })) }), (0, jsx_runtime_1.jsx)("div", { className: "modal-footer", children: (0, jsx_runtime_1.jsx)("button", { className: "btn btn-secondary", onClick: () => setIsBatchesModalOpen(false), children: "Close" }) })] }) })), isHistoryModalOpen && ((0, jsx_runtime_1.jsx)("div", { className: "modal-overlay", children: (0, jsx_runtime_1.jsxs)("div", { className: "modal", style: { width: '800px', maxWidth: '95vw' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "modal-header", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "modal-title", children: ["Stock History - ", selectedProduct?.name] }), (0, jsx_runtime_1.jsx)("button", { className: "modal-close", onClick: () => setIsHistoryModalOpen(false), children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 18 }) })] }), (0, jsx_runtime_1.jsx)("div", { className: "modal-body no-pad", style: { maxHeight: '60vh', overflowY: 'auto' }, children: productHistory.length > 0 ? ((0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Date" }), (0, jsx_runtime_1.jsx)("th", { children: "Type" }), (0, jsx_runtime_1.jsx)("th", { children: "Ref No" }), (0, jsx_runtime_1.jsx)("th", { children: "Batch No" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Qty In" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Qty Out" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: productHistory.map((h, i) => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { children: h.date }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("span", { className: `badge ${h.type === 'Purchase' ? 'badge-success' : 'badge-primary'}`, children: h.type }) }), (0, jsx_runtime_1.jsx)("td", { children: h.ref_no }), (0, jsx_runtime_1.jsx)("td", { children: h.batch_no }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', color: 'var(--success)' }, children: h.type === 'Purchase' ? `+${h.qty + h.free_qty}` : '-' }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', color: 'var(--danger)' }, children: h.type === 'Sale' ? `-${h.qty}` : '-' })] }, i))) })] })) : ((0, jsx_runtime_1.jsx)("div", { style: { padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }, children: "No transaction history found for this product." })) }), (0, jsx_runtime_1.jsx)("div", { className: "modal-footer", children: (0, jsx_runtime_1.jsx)("button", { className: "btn btn-secondary", onClick: () => setIsHistoryModalOpen(false), children: "Close" }) })] }) }))] }));
}
