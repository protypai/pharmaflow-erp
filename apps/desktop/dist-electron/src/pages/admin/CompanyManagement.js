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
exports.default = CompanyManagement;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
function CompanyManagement() {
    const [adminCompanies, set_adminCompanies] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchData = async () => {
            set_adminCompanies([]);
        };
        fetchData();
    }, []);
    const [search, setSearch] = (0, react_1.useState)('');
    const filtered = adminCompanies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.city.toLowerCase().includes(search.toLowerCase()));
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsx)("h2", { className: "card-title", style: { fontSize: '1.1rem' }, children: "Client Companies" }), (0, jsx_runtime_1.jsxs)("div", { className: "search-bar", children: [(0, jsx_runtime_1.jsxs)("div", { className: "search-input-wrap", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 16, className: "search-icon" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", placeholder: "Search companies, cities...", value: search, onChange: e => setSearch(e.target.value) })] }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-primary", style: { background: 'var(--purple)', borderColor: 'var(--purple)' }, children: "+ Register Company" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Company Name & Location" }), (0, jsx_runtime_1.jsx)("th", { children: "Plan & Reg. Date" }), (0, jsx_runtime_1.jsx)("th", { children: "Usage Stats" }), (0, jsx_runtime_1.jsx)("th", { children: "Last Activity" }), (0, jsx_runtime_1.jsx)("th", { children: "Status" }), (0, jsx_runtime_1.jsx)("th", { className: "col-actions", children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: filtered.map(company => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem' }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                                                        width: 36, height: 36, borderRadius: '8px',
                                                        background: 'var(--content-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: 'var(--text-secondary)'
                                                    }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Building2, { size: 18 }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 600, color: 'var(--text-primary)' }, children: company.name }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: [company.city, ", ", company.state, " \u2022 ", company.gstin] })] })] }) }), (0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 500 }, children: company.plan }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: company.registeredOn })] }), (0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.8rem' }, children: [company.totalInvoices.toLocaleString(), " Invoices"] }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: ["DB: ", company.dbSize] })] }), (0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.8rem' }, children: ["Login: ", company.lastLogin] }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: ["Backup: ", company.lastBackup] })] }), (0, jsx_runtime_1.jsx)("td", { children: company.status === 'active' ? ((0, jsx_runtime_1.jsx)("span", { className: "chip chip-active", children: "Active" })) : company.status === 'inactive' ? ((0, jsx_runtime_1.jsx)("span", { className: "chip chip-danger", children: "Inactive" })) : ((0, jsx_runtime_1.jsx)("span", { className: "chip chip-warning", children: "Trial" })) }), (0, jsx_runtime_1.jsx)("td", { className: "col-actions", children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }, children: [(0, jsx_runtime_1.jsx)("button", { className: "btn btn-outline btn-sm", title: "Reset Password", style: { color: 'var(--purple)', borderColor: 'var(--purple)' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Key, { size: 14 }) }), company.status === 'active' ? ((0, jsx_runtime_1.jsx)("button", { className: "btn btn-outline btn-sm", title: "Deactivate", style: { color: 'var(--danger)', borderColor: 'var(--danger)' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.XCircle, { size: 14 }) })) : ((0, jsx_runtime_1.jsx)("button", { className: "btn btn-outline btn-sm", title: "Activate", style: { color: 'var(--success)', borderColor: 'var(--success)' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { size: 14 }) })), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-ghost btn-sm", children: (0, jsx_runtime_1.jsx)(lucide_react_1.MoreVertical, { size: 16 }) })] }) })] }, company.id))) })] }) })] }));
}
