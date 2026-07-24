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
exports.default = SupplierMaster;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
function SupplierMaster() {
    const [search, setSearch] = (0, react_1.useState)('');
    const [isModalOpen, setIsModalOpen] = (0, react_1.useState)(false);
    const [suppliersList, setSuppliersList] = (0, react_1.useState)([]);
    // Form State
    const [formData, setFormData] = (0, react_1.useState)({
        id: null,
        name: '', contact_person: '', phone: '', email: '', city: '',
        address: '', pincode: '', drug_license: '', gstin: '',
        credit_limit: 500000, credit_days: 45, opening_balance: 0, opening_balance_type: 'credit'
    });
    const [errorMsg, setErrorMsg] = (0, react_1.useState)('');
    const fetchSuppliers = async () => {
        try {
            const res = await window.pharmaAPI.db.query("SELECT * FROM suppliers ORDER BY name ASC");
            setSuppliersList(res?.data || []);
        }
        catch (err) {
            console.error('Failed to load suppliers', err);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchSuppliers();
    }, []);
    const handleSave = async () => {
        setErrorMsg('');
        if (!formData.name || !formData.phone || !formData.drug_license || !formData.gstin) {
            setErrorMsg("Name, Phone, Drug License, and GSTIN are required.");
            return;
        }
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const companyId = user.companyId || 'COMP-DEMO-001';
            if (formData.id) {
                const res = await window.pharmaAPI.db.run(`
          UPDATE suppliers SET
            name = ?, phone = ?, email = ?, address = ?, city = ?, pincode = ?, 
            drug_license = ?, gstin = ?, credit_limit = ?, credit_days = ?, opening_balance = ?, opening_balance_type = ?,
            updated_at = datetime('now')
          WHERE id = ?
        `, [
                    formData.name, formData.phone, formData.email,
                    formData.address, formData.city, formData.pincode, formData.drug_license, formData.gstin,
                    formData.credit_limit, formData.credit_days, formData.opening_balance, formData.opening_balance_type,
                    formData.id
                ]);
                if (!res.success) {
                    setErrorMsg("Database error: " + res.error);
                    return;
                }
            }
            else {
                const id = 'SUPP-' + Date.now();
                const res = await window.pharmaAPI.db.run(`
          INSERT INTO suppliers (
            id, company_id, name, phone, email, address, city, pincode, 
            drug_license, gstin, credit_limit, credit_days, opening_balance, opening_balance_type,
            status, created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now')
          )
        `, [
                    id, companyId, formData.name, formData.phone, formData.email,
                    formData.address, formData.city, formData.pincode, formData.drug_license, formData.gstin,
                    formData.credit_limit, formData.credit_days, formData.opening_balance, formData.opening_balance_type
                ]);
                if (!res.success) {
                    setErrorMsg("Database error: " + res.error);
                    return;
                }
            }
            setIsModalOpen(false);
            setFormData({
                id: null,
                name: '', contact_person: '', phone: '', email: '', city: '',
                address: '', pincode: '', drug_license: '', gstin: '',
                credit_limit: 500000, credit_days: 45, opening_balance: 0, opening_balance_type: 'credit'
            });
            fetchSuppliers();
        }
        catch (err) {
            console.error("Save failed", err);
            setErrorMsg("Failed to save supplier: " + err.message);
        }
    };
    const handleEdit = (supp) => {
        setFormData({
            id: supp.id,
            name: supp.name || '', contact_person: supp.contact_person || '', phone: supp.phone || '', email: supp.email || '', city: supp.city || '',
            address: supp.address || '', pincode: supp.pincode || '', drug_license: supp.drug_license || '', gstin: supp.gstin || '',
            credit_limit: supp.credit_limit || 500000, credit_days: supp.credit_days || 45, opening_balance: supp.opening_balance || 0, opening_balance_type: supp.opening_balance_type || 'credit'
        });
        setIsModalOpen(true);
    };
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this supplier?"))
            return;
        try {
            await window.pharmaAPI.db.run("DELETE FROM suppliers WHERE id = ?", [id]);
            fetchSuppliers();
        }
        catch (err) {
            alert("Failed to delete supplier: " + err.message);
        }
    };
    const filtered = suppliersList.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.city && s.city.toLowerCase().includes(search.toLowerCase())));
    const formatCurr = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsx)("h2", { className: "card-title", children: "Supplier Master" }), (0, jsx_runtime_1.jsxs)("div", { className: "search-bar", children: [(0, jsx_runtime_1.jsxs)("div", { className: "search-input-wrap", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 16, className: "search-icon" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", placeholder: "Search suppliers by name or city...", value: search, onChange: e => setSearch(e.target.value), style: { width: '250px' } })] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-primary", onClick: () => {
                                    setFormData({
                                        id: null,
                                        name: '', contact_person: '', phone: '', email: '', city: '',
                                        address: '', pincode: '', drug_license: '', gstin: '',
                                        credit_limit: 500000, credit_days: 45, opening_balance: 0, opening_balance_type: 'credit'
                                    });
                                    setIsModalOpen(true);
                                }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { size: 16 }), " New Supplier"] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Supplier Info" }), (0, jsx_runtime_1.jsx)("th", { children: "Contact & City" }), (0, jsx_runtime_1.jsx)("th", { children: "License Details" }), (0, jsx_runtime_1.jsx)("th", { children: "Credit Terms" }), (0, jsx_runtime_1.jsx)("th", { children: "Status" }), (0, jsx_runtime_1.jsx)("th", { className: "col-actions", children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: filtered.map(supp => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 600, color: 'var(--text-primary)' }, children: supp.name }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: "CFA / Distributor" })] }), (0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem' }, children: supp.phone }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '2px' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MapPin, { size: 10 }), " ", supp.city] })] }), (0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.8rem' }, children: ["DL: ", supp.drug_license] }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: ["GST: ", supp.gstin] })] }), (0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { fontWeight: 600, color: 'var(--text-primary)' }, children: ["Limit: ", formatCurr(supp.credit_limit)] }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: [supp.credit_days, " days credit"] })] }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("span", { className: `badge ${supp.status === 'active' ? 'badge-success' : 'badge-danger'}`, children: supp.status === 'active' ? 'Active' : 'Inactive' }) }), (0, jsx_runtime_1.jsx)("td", { className: "col-actions", children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }, children: [(0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost btn-sm", title: "Edit", onClick: () => handleEdit(supp), children: (0, jsx_runtime_1.jsx)(lucide_react_1.Edit2, { size: 14 }) }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost btn-sm", title: "Delete", onClick: () => handleDelete(supp.id), style: { color: 'var(--danger)' }, children: (0, jsx_runtime_1.jsx)("span", { style: { fontSize: '1.2rem', lineHeight: 1 }, children: "\u00D7" }) })] }) })] }, supp.id))) })] }) }), isModalOpen && ((0, jsx_runtime_1.jsx)("div", { style: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }, children: (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { width: '700px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", style: { borderBottom: '1px solid var(--border)', background: '#F8FAFC' }, children: [(0, jsx_runtime_1.jsx)("h3", { className: "card-title", children: "Add New Supplier (Vendor)" }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost", onClick: () => setIsModalOpen(false), style: { padding: '0.25rem' }, children: "\u00D7" })] }), errorMsg && ((0, jsx_runtime_1.jsx)("div", { style: { background: '#fee2e2', color: '#dc2626', padding: '0.75rem', margin: '1rem 1.5rem 0', borderRadius: '4px', border: '1px solid #f87171' }, children: errorMsg })), (0, jsx_runtime_1.jsx)("div", { className: "card-body", style: { overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("div", { className: "form-row-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", style: { gridColumn: 'span 2' }, children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Supplier Name (Agency) ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", placeholder: "e.g. Sun Pharma CFA", value: formData.name, onChange: e => setFormData({ ...formData, name: e.target.value }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Contact Person" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", placeholder: "e.g. Supplier Contact", value: formData.contact_person, onChange: e => setFormData({ ...formData, contact_person: e.target.value }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Phone Number ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", placeholder: "e.g. 022-40398000", value: formData.phone, onChange: e => setFormData({ ...formData, phone: e.target.value }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Email ID" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: "email", placeholder: "e.g. orders@supplier.com", value: formData.email, onChange: e => setFormData({ ...formData, email: e.target.value }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "City" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", placeholder: "e.g. Mumbai", value: formData.city, onChange: e => setFormData({ ...formData, city: e.target.value }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", style: { gridColumn: 'span 2' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Address" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", placeholder: "Full address", value: formData.address, onChange: e => setFormData({ ...formData, address: e.target.value }) })] }), (0, jsx_runtime_1.jsx)("h4", { style: { gridColumn: 'span 2', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }, children: "Licenses & Procurement Terms" }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Drug License No. ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", placeholder: "e.g. MH-CFA-...", value: formData.drug_license, onChange: e => setFormData({ ...formData, drug_license: e.target.value }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["GSTIN ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", placeholder: "15-digit GSTIN", maxLength: "15", value: formData.gstin, onChange: e => setFormData({ ...formData, gstin: e.target.value }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Credit Limit (\u20B9)" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: "number", placeholder: "e.g. 500000", value: formData.credit_limit, onChange: e => setFormData({ ...formData, credit_limit: Number(e.target.value) }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Credit Days" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: "number", placeholder: "e.g. 45", value: formData.credit_days, onChange: e => setFormData({ ...formData, credit_days: Number(e.target.value) }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Opening Balance (\u20B9)" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: "number", placeholder: "0", value: formData.opening_balance, onChange: e => setFormData({ ...formData, opening_balance: Number(e.target.value) }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Balance Type" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: formData.opening_balance_type, onChange: e => setFormData({ ...formData, opening_balance_type: e.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "credit", children: "Credit (Cr) - We owe them" }), (0, jsx_runtime_1.jsx)("option", { value: "debit", children: "Debit (Dr) - They owe us" })] })] })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "card-header", style: { borderTop: '1px solid var(--border)', justifyContent: 'flex-end', background: '#F8FAFC' }, children: [(0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost", onClick: () => setIsModalOpen(false), children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-primary", onClick: handleSave, children: "Save Supplier" })] })] }) }))] }));
}
