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
exports.default = CompanyMaster;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const dataService_1 = require("../../services/dataService");
function CompanyMaster() {
    const [search, setSearch] = (0, react_1.useState)('');
    const [isModalOpen, setIsModalOpen] = (0, react_1.useState)(false);
    const [manufacturersList, setManufacturersList] = (0, react_1.useState)([]);
    const [formData, setFormData] = (0, react_1.useState)({ id: null, name: '', status: 'active' });
    const [errorMsg, setErrorMsg] = (0, react_1.useState)('');
    const fetchManufacturers = async () => {
        try {
            const res = await window.pharmaAPI.db.query("SELECT * FROM manufacturers ORDER BY name ASC");
            setManufacturersList(res?.data || []);
        }
        catch (err) {
            console.error('Failed to load manufacturers', err);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchManufacturers();
    }, []);
    const handleSave = async () => {
        setErrorMsg('');
        if (!formData.name) {
            setErrorMsg("Company Name is required.");
            return;
        }
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userRes = await window.pharmaAPI.db.query("SELECT company_id FROM users WHERE id = ? OR email = ?", [user.id || '', user.email || '']);
            if (!userRes?.data?.length)
                throw new Error("Admin user not found in local DB");
            const companyId = userRes.data[0].company_id;
            const isNew = !formData.id;
            const id = isNew ? 'MFG-' + Date.now() : formData.id;
            if (!isNew) {
                const res = await window.pharmaAPI.db.run(`
          UPDATE manufacturers SET name = ?, status = ?, updated_at = datetime('now') WHERE id = ?
        `, [formData.name, formData.status, formData.id]);
                if (!res.success) {
                    setErrorMsg("Database error: " + res.error);
                    return;
                }
            }
            else {
                const res = await window.pharmaAPI.db.run(`
          INSERT INTO manufacturers (id, company_id, name, status, created_at, updated_at) 
          VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [id, companyId, formData.name, formData.status]);
                if (!res.success) {
                    setErrorMsg("Database error: " + res.error);
                    return;
                }
            }
            // Sync to cloud
            await (0, dataService_1.syncEntity)('Manufacturer', isNew ? 'create' : 'update', {
                id,
                companyId,
                name: formData.name,
                status: formData.status
            });
            setIsModalOpen(false);
            setFormData({ id: null, name: '', status: 'active' });
            fetchManufacturers();
        }
        catch (err) {
            console.error("Save failed", err);
            setErrorMsg("Failed to save company: " + err.message);
        }
    };
    const handleEdit = (comp) => {
        setFormData({ id: comp.id, name: comp.name, status: comp.status });
        setIsModalOpen(true);
    };
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this company?"))
            return;
        try {
            await window.pharmaAPI.db.run("DELETE FROM manufacturers WHERE id = ?", [id]);
            // Sync to cloud
            await (0, dataService_1.syncEntity)('Manufacturer', 'delete', { id });
            fetchManufacturers();
        }
        catch (err) {
            alert("Failed to delete company: " + err.message);
        }
    };
    const filtered = manufacturersList.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsx)("h2", { className: "card-title", children: "Company Master (Manufacturers)" }), (0, jsx_runtime_1.jsxs)("div", { className: "search-bar", children: [(0, jsx_runtime_1.jsxs)("div", { className: "search-input-wrap", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 16, className: "search-icon" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", placeholder: "Search companies...", value: search, onChange: e => setSearch(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-primary", onClick: () => { setErrorMsg(''); setFormData({ id: null, name: '', status: 'active' }); setIsModalOpen(true); }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { size: 16 }), " Add Company"] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { style: { width: '120px' }, children: "ID" }), (0, jsx_runtime_1.jsx)("th", { children: "Company Name" }), (0, jsx_runtime_1.jsx)("th", { children: "Status" }), (0, jsx_runtime_1.jsx)("th", { className: "col-actions", children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: filtered.map(comp => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { style: { color: 'var(--text-secondary)' }, children: comp.id }), (0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 500, color: 'var(--text-primary)' }, children: comp.name }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("span", { className: `badge ${comp.status === 'active' ? 'badge-success' : 'badge-danger'}`, children: comp.status === 'active' ? 'Active' : 'Inactive' }) }), (0, jsx_runtime_1.jsx)("td", { className: "col-actions", children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }, children: [(0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost btn-sm", title: "Edit", onClick: () => handleEdit(comp), children: (0, jsx_runtime_1.jsx)(lucide_react_1.Edit2, { size: 14 }) }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost btn-sm", title: "Delete", onClick: () => handleDelete(comp.id), style: { color: 'var(--danger)' }, children: (0, jsx_runtime_1.jsx)("span", { style: { fontSize: '1.2rem', lineHeight: 1 }, children: "\u00D7" }) })] }) })] }, comp.id))) })] }) }), isModalOpen && ((0, jsx_runtime_1.jsx)("div", { className: "modal-overlay", children: (0, jsx_runtime_1.jsxs)("div", { className: "modal modal-sm", children: [(0, jsx_runtime_1.jsxs)("div", { className: "modal-header", children: [(0, jsx_runtime_1.jsx)("h3", { className: "modal-title", children: "Company Details" }), (0, jsx_runtime_1.jsx)("button", { className: "modal-close", onClick: () => setIsModalOpen(false), children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 18 }) })] }), errorMsg && ((0, jsx_runtime_1.jsx)("div", { style: { background: '#fee2e2', color: '#dc2626', padding: '0.75rem', margin: '1rem 1.5rem 0', borderRadius: '4px', border: '1px solid #f87171' }, children: errorMsg })), (0, jsx_runtime_1.jsxs)("div", { className: "modal-body", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group mb-3", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Company Name ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", placeholder: "e.g. Sun Pharma", value: formData.name, onChange: e => setFormData({ ...formData, name: e.target.value }), autoFocus: true })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Status" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: formData.status, onChange: e => setFormData({ ...formData, status: e.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "active", children: "Active" }), (0, jsx_runtime_1.jsx)("option", { value: "inactive", children: "Inactive" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "modal-footer", children: [(0, jsx_runtime_1.jsx)("button", { className: "btn btn-secondary", onClick: () => setIsModalOpen(false), children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-primary", onClick: handleSave, children: "Save Company" })] })] }) }))] }));
}
