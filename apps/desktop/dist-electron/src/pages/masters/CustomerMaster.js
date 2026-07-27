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
exports.default = CustomerMaster;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const dataService_1 = require("../../services/dataService");
function CustomerMaster() {
    const [search, setSearch] = (0, react_1.useState)('');
    const [isModalOpen, setIsModalOpen] = (0, react_1.useState)(false);
    const [customersList, setCustomersList] = (0, react_1.useState)([]);
    const [showEmail, setShowEmail] = (0, react_1.useState)(false);
    // Form State
    const [formData, setFormData] = (0, react_1.useState)({
        id: null,
        name: '', type: 'Retail', salesman: '', phone: '', email: '',
        address: '', area: '', pincode: '', drug_license: '', gstin: '',
        credit_limit: 50000, credit_days: 30, opening_balance: 0, opening_balance_type: 'debit'
    });
    const [errorMsg, setErrorMsg] = (0, react_1.useState)('');
    const fetchCustomers = async () => {
        try {
            const res = await window.pharmaAPI.db.query("SELECT * FROM customers ORDER BY name ASC");
            setCustomersList(res?.data || []);
        }
        catch (err) {
            console.error('Failed to load customers', err);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchCustomers();
    }, []);
    const handleSave = async () => {
        setErrorMsg('');
        if (!formData.name || !formData.phone) {
            setErrorMsg("Name and Phone are required.");
            return;
        }
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userRes = await window.pharmaAPI.db.query("SELECT company_id FROM users WHERE id = ? OR email = ?", [user.id || '', user.email || '']);
            if (!userRes?.data?.length)
                throw new Error("Admin user not found in local DB");
            const companyId = userRes.data[0].company_id;
            const isNew = !formData.id;
            const id = isNew ? 'CUST-' + Date.now() : formData.id;
            if (!isNew) {
                const res = await window.pharmaAPI.db.run(`
          UPDATE customers SET
            name = ?, type = ?, salesman = ?, phone = ?, email = ?, address = ?, area = ?, pincode = ?, 
            drug_license = ?, gstin = ?, credit_limit = ?, credit_days = ?, opening_balance = ?, opening_balance_type = ?,
            updated_at = datetime('now')
          WHERE id = ?
        `, [
                    formData.name, formData.type, formData.salesman, formData.phone, formData.email,
                    formData.address, formData.area, formData.pincode, formData.drug_license, formData.gstin,
                    formData.credit_limit, formData.credit_days, formData.opening_balance, formData.opening_balance_type,
                    formData.id
                ]);
                if (!res.success) {
                    setErrorMsg("Database error: " + res.error);
                    return;
                }
            }
            else {
                const res = await window.pharmaAPI.db.run(`
          INSERT INTO customers (
            id, company_id, name, type, salesman, phone, email, address, area, pincode, 
            drug_license, gstin, credit_limit, credit_days, opening_balance, opening_balance_type,
            status, created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now')
          )
        `, [
                    id, companyId, formData.name, formData.type, formData.salesman, formData.phone, formData.email,
                    formData.address, formData.area, formData.pincode, formData.drug_license, formData.gstin,
                    formData.credit_limit, formData.credit_days, formData.opening_balance, formData.opening_balance_type
                ]);
                if (!res.success) {
                    setErrorMsg("Database error: " + res.error);
                    return;
                }
            }
            // Sync to cloud
            await (0, dataService_1.syncEntity)('Customer', isNew ? 'create' : 'update', {
                id,
                companyId,
                name: formData.name,
                type: formData.type.toLowerCase(),
                salesman: formData.salesman,
                phone: formData.phone,
                email: formData.email,
                address: formData.address,
                area: formData.area,
                pincode: formData.pincode,
                drugLicense: formData.drug_license,
                gstin: formData.gstin,
                creditLimit: formData.credit_limit,
                creditDays: formData.credit_days,
                openingBalance: formData.opening_balance,
                openingBalanceType: formData.opening_balance_type,
                status: 'active'
            });
            setIsModalOpen(false);
            // Reset form
            setFormData({
                id: null,
                name: '', type: 'Retail', salesman: '', phone: '', email: '',
                address: '', area: '', pincode: '', drug_license: '', gstin: '',
                credit_limit: 50000, credit_days: 30, opening_balance: 0, opening_balance_type: 'debit'
            });
            setShowEmail(false);
            fetchCustomers();
        }
        catch (err) {
            console.error("Save failed", err);
            setErrorMsg("Failed to save customer: " + err.message);
        }
    };
    const handleEdit = (cust) => {
        setFormData({
            id: cust.id,
            name: cust.name || '', type: cust.type || 'Retail', salesman: cust.salesman || '', phone: cust.phone || '', email: cust.email || '',
            address: cust.address || '', area: cust.area || '', pincode: cust.pincode || '', drug_license: cust.drug_license || '', gstin: cust.gstin || '',
            credit_limit: cust.credit_limit || 50000, credit_days: cust.credit_days || 30, opening_balance: cust.opening_balance || 0, opening_balance_type: cust.opening_balance_type || 'debit'
        });
        setShowEmail(!!cust.email);
        setIsModalOpen(true);
    };
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this customer?"))
            return;
        try {
            await window.pharmaAPI.db.run("DELETE FROM customers WHERE id = ?", [id]);
            // Sync to cloud
            await (0, dataService_1.syncEntity)('Customer', 'delete', { id });
            fetchCustomers();
        }
        catch (err) {
            alert("Failed to delete customer: " + err.message);
        }
    };
    const filtered = customersList.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.area && c.area.toLowerCase().includes(search.toLowerCase())) ||
        (c.address && c.address.toLowerCase().includes(search.toLowerCase())));
    const formatCurr = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsx)("h2", { className: "card-title", children: "Customer Master" }), (0, jsx_runtime_1.jsxs)("div", { className: "search-bar", children: [(0, jsx_runtime_1.jsxs)("div", { className: "search-input-wrap", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 16, className: "search-icon" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", placeholder: "Search customers by name or area...", value: search, onChange: e => setSearch(e.target.value), style: { width: '250px' } })] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-primary", onClick: () => {
                                    setFormData({
                                        id: null,
                                        name: '', type: 'Retail', salesman: '', phone: '', email: '',
                                        address: '', area: '', pincode: '', drug_license: '', gstin: '',
                                        credit_limit: 50000, credit_days: 30, opening_balance: 0, opening_balance_type: 'debit'
                                    });
                                    setShowEmail(false);
                                    setIsModalOpen(true);
                                }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { size: 16 }), " New Customer"] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Customer Info" }), (0, jsx_runtime_1.jsx)("th", { children: "Contact & Address" }), (0, jsx_runtime_1.jsx)("th", { children: "License Details" }), (0, jsx_runtime_1.jsx)("th", { children: "Financials" }), (0, jsx_runtime_1.jsx)("th", { children: "Status" }), (0, jsx_runtime_1.jsx)("th", { className: "col-actions", children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: filtered.map(cust => {
                                const outstanding = cust.opening_balance || 0; // TODO: Calculate actual outstanding from transactions
                                const outstandingExceeds = outstanding > cust.credit_limit;
                                return ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 600, color: 'var(--text-primary)' }, children: cust.name }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }, children: (0, jsx_runtime_1.jsx)("span", { className: `badge ${cust.type === 'Retail' ? 'badge-info' : 'badge-purple'}`, style: { padding: '0 4px', fontSize: '0.65rem' }, children: cust.type }) })] }), (0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem' }, children: cust.phone }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '2px' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MapPin, { size: 10 }), " ", cust.address || cust.area || '-'] })] }), (0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.8rem' }, children: ["DL: ", cust.drug_license || '-'] }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: cust.gstin ? `GST: ${cust.gstin}` : 'Unregistered' })] }), (0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { fontWeight: 600, color: outstandingExceeds ? 'var(--danger)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }, children: [formatCurr(outstanding), outstandingExceeds && (0, jsx_runtime_1.jsx)(lucide_react_1.ShieldAlert, { size: 12, color: "var(--danger)", title: "Exceeds Credit Limit" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: ["Limit: ", formatCurr(cust.credit_limit), " \u2022 ", cust.credit_days, " days"] })] }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("span", { className: `badge ${cust.status === 'active' ? 'badge-success' : 'badge-danger'}`, children: cust.status === 'active' ? 'Active' : 'Inactive' }) }), (0, jsx_runtime_1.jsx)("td", { className: "col-actions", children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }, children: [(0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost btn-sm", title: "Edit", onClick: () => handleEdit(cust), children: (0, jsx_runtime_1.jsx)(lucide_react_1.Edit2, { size: 14 }) }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost btn-sm", title: "Delete", onClick: () => handleDelete(cust.id), style: { color: 'var(--danger)' }, children: (0, jsx_runtime_1.jsx)("span", { style: { fontSize: '1.2rem', lineHeight: 1 }, children: "\u00D7" }) })] }) })] }, cust.id));
                            }) })] }) }), isModalOpen && ((0, jsx_runtime_1.jsx)("div", { style: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }, children: (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { width: '700px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", style: { borderBottom: '1px solid var(--border)', background: '#F8FAFC' }, children: [(0, jsx_runtime_1.jsx)("h3", { className: "card-title", children: "Add New Customer" }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost", onClick: () => setIsModalOpen(false), style: { padding: '0.25rem' }, children: "\u00D7" })] }), errorMsg && ((0, jsx_runtime_1.jsx)("div", { style: { background: '#fee2e2', color: '#dc2626', padding: '0.75rem', margin: '1rem 1.5rem 0', borderRadius: '4px', border: '1px solid #f87171' }, children: errorMsg })), (0, jsx_runtime_1.jsx)("div", { className: "card-body", style: { overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("div", { className: "form-row-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", style: { gridColumn: 'span 2' }, children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Customer Name (Firm/Shop) ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", placeholder: "e.g. Balaji Medical Stores", value: formData.name, onChange: e => setFormData({ ...formData, name: e.target.value }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Customer Type ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: formData.type, onChange: e => setFormData({ ...formData, type: e.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { children: "Retail" }), (0, jsx_runtime_1.jsx)("option", { children: "Wholesale" }), (0, jsx_runtime_1.jsx)("option", { children: "Hospital / Clinic" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Contact Person" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", placeholder: "e.g. Ramesh", value: formData.salesman, onChange: e => setFormData({ ...formData, salesman: e.target.value }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Phone Number ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", placeholder: "e.g. 9876543210", value: formData.phone, onChange: e => setFormData({ ...formData, phone: e.target.value }) })] }), showEmail ? ((0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", style: { display: 'flex', justifyContent: 'space-between' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Email ID" }), (0, jsx_runtime_1.jsx)("span", { style: { cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 'normal' }, onClick: () => { setShowEmail(false); setFormData({ ...formData, email: '' }); }, children: "(\u00D7 Hide)" })] }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: "email", placeholder: "e.g. user@email.com", value: formData.email, onChange: e => setFormData({ ...formData, email: e.target.value }) })] })) : ((0, jsx_runtime_1.jsx)("div", { className: "form-group", style: { display: 'flex', alignItems: 'flex-end' }, children: (0, jsx_runtime_1.jsxs)("button", { type: "button", className: "btn btn-ghost", onClick: () => setShowEmail(true), style: { color: 'var(--primary)', border: '1px dashed #cbd5e1', width: '100%', height: '38px', justifyContent: 'center', fontWeight: '500' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { size: 14 }), " Add Email (Optional)"] }) })), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", style: { gridColumn: 'span 2' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Address" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", placeholder: "Enter complete address...", value: formData.address, onChange: e => setFormData({ ...formData, address: e.target.value }) })] }), (0, jsx_runtime_1.jsx)("h4", { style: { gridColumn: 'span 2', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }, children: "Licenses & Finance" }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Drug License No." }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", placeholder: "e.g. MH-MUM-...", value: formData.drug_license, onChange: e => setFormData({ ...formData, drug_license: e.target.value }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "GSTIN (Optional for Retail)" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", placeholder: "15-digit GSTIN", maxLength: "15", value: formData.gstin, onChange: e => setFormData({ ...formData, gstin: e.target.value }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Credit Limit (\u20B9)" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: "number", placeholder: "e.g. 50000", value: formData.credit_limit, onChange: e => setFormData({ ...formData, credit_limit: Number(e.target.value) }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Credit Days" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: "number", placeholder: "e.g. 30", value: formData.credit_days, onChange: e => setFormData({ ...formData, credit_days: Number(e.target.value) }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Opening Balance (\u20B9)" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: "number", placeholder: "0", value: formData.opening_balance, onChange: e => setFormData({ ...formData, opening_balance: Number(e.target.value) }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Balance Type" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: formData.opening_balance_type, onChange: e => setFormData({ ...formData, opening_balance_type: e.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "debit", children: "Debit (Dr) - They owe us" }), (0, jsx_runtime_1.jsx)("option", { value: "credit", children: "Credit (Cr) - We owe them" })] })] })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "card-header", style: { borderTop: '1px solid var(--border)', justifyContent: 'flex-end', background: '#F8FAFC' }, children: [(0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost", onClick: () => setIsModalOpen(false), children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-primary", onClick: handleSave, children: "Save Customer" })] })] }) }))] }));
}
