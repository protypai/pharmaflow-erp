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
exports.default = ActivityLogs;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
function ActivityLogs() {
    const [adminActivityLogs, set_adminActivityLogs] = (0, react_1.useState)([]);
    const [adminCompanies, set_adminCompanies] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchData = async () => {
            set_adminActivityLogs([]);
            set_adminCompanies([]);
        };
        fetchData();
    }, []);
    const [companyFilter, setCompanyFilter] = (0, react_1.useState)('');
    const [typeFilter, setTypeFilter] = (0, react_1.useState)('');
    const filteredLogs = adminActivityLogs.filter(log => {
        if (companyFilter && log.company !== companyFilter)
            return false;
        if (typeFilter && log.type !== typeFilter)
            return false;
        return true;
    });
    const getBadgeColor = (type) => {
        switch (type) {
            case 'sale': return 'badge-success';
            case 'purchase': return 'badge-primary';
            case 'receipt': return 'badge-warning';
            case 'login': return 'badge-info';
            case 'backup': return 'badge-purple';
            case 'master': return 'badge-gray';
            default: return 'badge-gray';
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsx)("h2", { className: "card-title", style: { fontSize: '1.1rem' }, children: "Global Activity Audit Trail" }), (0, jsx_runtime_1.jsx)("div", { className: "search-bar", children: (0, jsx_runtime_1.jsxs)("div", { className: "search-input-wrap", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 16, className: "search-icon" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", placeholder: "Search logs..." })] }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "filter-bar", children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Filter, { size: 16 }), " Filters:"] }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: companyFilter, onChange: e => setCompanyFilter(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "All Companies" }), adminCompanies.map(c => (0, jsx_runtime_1.jsx)("option", { value: c.name, children: c.name }, c.id))] }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: typeFilter, onChange: e => setTypeFilter(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "All Activity Types" }), (0, jsx_runtime_1.jsx)("option", { value: "sale", children: "Sales" }), (0, jsx_runtime_1.jsx)("option", { value: "purchase", children: "Purchases" }), (0, jsx_runtime_1.jsx)("option", { value: "receipt", children: "Receipts / Payments" }), (0, jsx_runtime_1.jsx)("option", { value: "login", children: "Logins" }), (0, jsx_runtime_1.jsx)("option", { value: "backup", children: "Backups" }), (0, jsx_runtime_1.jsx)("option", { value: "master", children: "Master Updates" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "search-input-wrap", style: { maxWidth: '220px' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Calendar, { size: 14, className: "search-icon" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", placeholder: "Date Range", defaultValue: "Today" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Date & Time" }), (0, jsx_runtime_1.jsx)("th", { children: "Company" }), (0, jsx_runtime_1.jsx)("th", { children: "Action Category" }), (0, jsx_runtime_1.jsx)("th", { children: "Activity Description" }), (0, jsx_runtime_1.jsx)("th", { children: "Details" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: filteredLogs.map(log => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsxs)("td", { style: { whiteSpace: 'nowrap' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 500 }, children: log.date }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: log.time })] }), (0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 500, color: 'var(--text-primary)' }, children: log.company }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("span", { className: `badge ${getBadgeColor(log.type)}`, children: log.type.toUpperCase() }) }), (0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 500 }, children: log.action }), (0, jsx_runtime_1.jsx)("td", { style: { color: 'var(--text-secondary)' }, children: log.details })] }, log.id))) })] }) })] }));
}
