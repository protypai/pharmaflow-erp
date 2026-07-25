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
exports.default = BatchEnquiry;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
function BatchEnquiry() {
    const [products, set_products] = (0, react_1.useState)([]);
    const [suppliers, set_suppliers] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchData = async () => {
            const res_products = await window.pharmaAPI.db.query(`
        SELECT p.id as p_id, p.name, p.code, b.id as b_id, b.batch_no as batch, b.expiry_date as expiry, b.mrp, b.current_qty as qty, b.created_at as inwardDate
        FROM products p
        LEFT JOIN batches b ON p.id = b.product_id
      `);
            const prodMap = {};
            (res_products?.data || []).forEach(row => {
                if (!prodMap[row.p_id])
                    prodMap[row.p_id] = { id: row.p_id, name: row.name, code: row.code, batches: [] };
                if (row.b_id) {
                    prodMap[row.p_id].batches.push({
                        id: row.b_id, batch: row.batch, expiry: row.expiry, mrp: row.mrp, qty: row.qty, inwardDate: row.inwardDate
                    });
                }
            });
            set_products(Object.values(prodMap));
            const res_suppliers = await window.pharmaAPI.db.query("SELECT * FROM suppliers");
            set_suppliers(res_suppliers?.data || []);
        };
        fetchData();
    }, []);
    const [selectedProductId, setSelectedProductId] = (0, react_1.useState)('');
    const selectedProduct = products.find(p => p.id.toString() === selectedProductId.toString());
    // Mock function to attach a random supplier to a batch for demonstration of the flow
    const enrichBatchWithSupplier = (batch) => {
        // If supplier logic is complex, just mock for now or use real inwardDate from batch
        return {
            ...batch,
            supplierName: 'Local Supplier',
            inwardDate: batch.inwardDate ? batch.inwardDate.split(' ')[0] : 'N/A',
            invoiceNo: `INV-BATCH`
        };
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsx)("div", { className: "card-header", children: (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "card-title", children: "Batch Enquiry" }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", children: "Track granular batch details, inward history, and supplier sources" })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "filter-bar", style: { padding: '1.5rem', background: '#F8FAFC', borderBottom: '1px solid var(--border)' }, children: (0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', gap: '1rem', alignItems: 'flex-end', maxWidth: '600px' }, children: (0, jsx_runtime_1.jsxs)("div", { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Search & Select Product ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "search-input-wrap", style: { width: '100%' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 16, className: "search-icon" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-input", style: { paddingLeft: '2.5rem', appearance: 'none' }, value: selectedProductId, onChange: e => setSelectedProductId(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select a product to view batches..." }), products.map(p => (0, jsx_runtime_1.jsxs)("option", { value: p.id, children: [p.name, " (", p.code, ")"] }, p.id))] })] })] }) }) }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Product" }), (0, jsx_runtime_1.jsx)("th", { children: "Batch Number" }), (0, jsx_runtime_1.jsx)("th", { children: "Expiry Date" }), (0, jsx_runtime_1.jsx)("th", { children: "Available Qty" }), (0, jsx_runtime_1.jsx)("th", { children: "MRP (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { children: "Supplied By (Vendor)" }), (0, jsx_runtime_1.jsx)("th", { children: "Inward Date" }), (0, jsx_runtime_1.jsx)("th", { className: "col-actions", children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: (selectedProductId && selectedProduct ? [selectedProduct] : products).flatMap(p => (p?.batches || []).map(batch => ({ ...batch, product: p }))).length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: "8", style: { textAlign: 'center', padding: '2rem' }, children: "No active batches found." }) })) : ((selectedProductId && selectedProduct ? [selectedProduct] : products).flatMap(p => (p?.batches || []).map(batch => ({ ...batch, product: p }))).map(batch => {
                                const enriched = enrichBatchWithSupplier(batch);
                                return ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 600, color: 'var(--primary)' }, children: batch.product.name }), (0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 600 }, children: enriched.batch }), (0, jsx_runtime_1.jsx)("td", { children: enriched.expiry }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("span", { style: { fontWeight: 600, color: enriched.qty === 0 ? 'var(--danger)' : 'inherit' }, children: enriched.qty }) }), (0, jsx_runtime_1.jsx)("td", { children: enriched.mrp.toFixed(2) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 500 }, children: enriched.supplierName }) }), (0, jsx_runtime_1.jsx)("td", { style: { color: 'var(--text-secondary)' }, children: enriched.inwardDate }), (0, jsx_runtime_1.jsx)("td", { className: "col-actions", children: (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline btn-sm", title: "View Transaction History", style: { color: 'var(--info-dark)', borderColor: 'var(--info-dark)' }, onClick: () => alert(`Full trace history for Batch ${enriched.batch} will be available in the next update.`), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.History, { size: 14 }), " Trace"] }) })] }, `${batch.product.id}-${enriched.batch}`));
                            })) })] }) })] }));
}
