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
const api_1 = require("../../config/api");
function CompanyManagement() {
    const [adminCompanies, setAdminCompanies] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)('');
    const [search, setSearch] = (0, react_1.useState)('');
    const [activeTab, setActiveTab] = (0, react_1.useState)('all'); // 'all' | 'pending' | 'active'
    const fetchCompanies = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${api_1.API_BASE_URL}/api/v1/admin/companies`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setAdminCompanies(data.data || []);
            }
            else {
                setError(data.message || 'Failed to fetch companies');
            }
        }
        catch (err) {
            console.error('Error fetching companies:', err);
            setError('Unable to connect to Cloud Backend.');
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchCompanies();
    }, []);
    const handleApprove = async (companyId) => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${api_1.API_BASE_URL}/api/v1/admin/companies/${companyId}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert('Company approved and activated successfully!');
                fetchCompanies();
            }
            else {
                alert(data.message || 'Failed to approve company');
            }
        }
        catch (err) {
            console.error('Approve error:', err);
            alert('Failed to connect to backend.');
        }
    };
    const handleToggle = async (companyId) => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${api_1.API_BASE_URL}/api/v1/admin/companies/${companyId}/toggle`, {
                method: 'PATCH',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = await res.json();
            if (res.ok && data.success) {
                fetchCompanies();
            }
            else {
                alert(data.message || 'Failed to toggle company status');
            }
        }
        catch (err) {
            console.error('Toggle error:', err);
        }
    };
    const filtered = adminCompanies.filter(c => {
        const matchesSearch = (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (c.city || '').toLowerCase().includes(search.toLowerCase());
        if (activeTab === 'pending') {
            return matchesSearch && (!c.isActive || c.subscriptionStatus === 'pending');
        }
        if (activeTab === 'active') {
            return matchesSearch && (c.isActive && c.subscriptionStatus !== 'pending');
        }
        return matchesSearch;
    });
    const pendingCount = adminCompanies.filter(c => !c.isActive || c.subscriptionStatus === 'pending').length;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", style: { flexWrap: 'wrap', gap: '1rem' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem' }, children: [(0, jsx_runtime_1.jsx)("h2", { className: "card-title", style: { fontSize: '1.1rem' }, children: "Client Companies" }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.25rem', background: 'var(--content-bg)', padding: '0.25rem', borderRadius: '6px' }, children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => setActiveTab('all'), style: {
                                            border: 'none', background: activeTab === 'all' ? 'white' : 'transparent',
                                            padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer',
                                            fontWeight: activeTab === 'all' ? 600 : 400,
                                        }, children: ["All (", adminCompanies.length, ")"] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => setActiveTab('pending'), style: {
                                            border: 'none', background: activeTab === 'pending' ? 'white' : 'transparent',
                                            padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer',
                                            fontWeight: activeTab === 'pending' ? 600 : 400,
                                            color: pendingCount > 0 ? '#D97706' : 'inherit'
                                        }, children: ["Pending Approval ", pendingCount > 0 && `(${pendingCount})`] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setActiveTab('active'), style: {
                                            border: 'none', background: activeTab === 'active' ? 'white' : 'transparent',
                                            padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer',
                                            fontWeight: activeTab === 'active' ? 600 : 400,
                                        }, children: "Active" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "search-bar", children: [(0, jsx_runtime_1.jsxs)("div", { className: "search-input-wrap", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 16, className: "search-icon" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", placeholder: "Search companies, cities...", value: search, onChange: e => setSearch(e.target.value) })] }), (0, jsx_runtime_1.jsx)("button", { onClick: fetchCompanies, className: "btn btn-outline btn-sm", children: "Refresh" })] })] }), error && ((0, jsx_runtime_1.jsx)("div", { style: { padding: '0.75rem 1.25rem', background: '#FEF2F2', color: '#991B1B', fontSize: '0.85rem' }, children: error })), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: loading ? ((0, jsx_runtime_1.jsx)("div", { style: { padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }, children: "Loading companies..." })) : filtered.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { style: { padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }, children: "No companies found." })) : ((0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Company Name & Location" }), (0, jsx_runtime_1.jsx)("th", { children: "Status & Subscription" }), (0, jsx_runtime_1.jsx)("th", { children: "Registered On" }), (0, jsx_runtime_1.jsx)("th", { children: "Activity Stats" }), (0, jsx_runtime_1.jsx)("th", { className: "col-actions", children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: filtered.map(company => {
                                const isPending = !company.isActive || company.subscriptionStatus === 'pending';
                                return ((0, jsx_runtime_1.jsxs)("tr", { style: { background: isPending ? '#FFFBEB' : 'transparent' }, children: [(0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem' }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                                                            width: 36, height: 36, borderRadius: '8px',
                                                            background: isPending ? '#FEF3C7' : 'var(--content-bg)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: isPending ? '#D97706' : 'var(--text-secondary)'
                                                        }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Building2, { size: 18 }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 600, color: 'var(--text-primary)' }, children: company.name }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: [company.city || 'N/A', ", ", company.state || 'N/A', " \u2022 ", company.gstin || 'No GSTIN'] })] })] }) }), (0, jsx_runtime_1.jsx)("td", { children: isPending ? ((0, jsx_runtime_1.jsxs)("span", { className: "chip chip-warning", style: { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#FEF3C7', color: '#B45309' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { size: 12 }), " Pending Approval"] })) : company.isActive ? ((0, jsx_runtime_1.jsxs)("span", { className: "chip chip-active", children: ["Active (", company.subscriptionStatus || 'active', ")"] })) : ((0, jsx_runtime_1.jsx)("span", { className: "chip chip-danger", children: "Inactive" })) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem' }, children: company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A' }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.8rem' }, children: ["Invoices: ", company._count?.sales || 0, " | Purchases: ", company._count?.purchases || 0] }) }), (0, jsx_runtime_1.jsx)("td", { className: "col-actions", children: (0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }, children: isPending ? ((0, jsx_runtime_1.jsxs)("button", { className: "btn btn-sm btn-primary", onClick: () => handleApprove(company.id), style: { background: '#16A34A', borderColor: '#16A34A', fontSize: '0.78rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { size: 14 }), " Approve & Activate"] })) : ((0, jsx_runtime_1.jsxs)("button", { className: `btn btn-outline btn-sm`, onClick: () => handleToggle(company.id), title: company.isActive ? 'Deactivate' : 'Activate', style: {
                                                        color: company.isActive ? 'var(--danger)' : 'var(--success)',
                                                        borderColor: company.isActive ? 'var(--danger)' : 'var(--success)',
                                                    }, children: [company.isActive ? (0, jsx_runtime_1.jsx)(lucide_react_1.XCircle, { size: 14 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { size: 14 }), company.isActive ? ' Deactivate' : ' Activate'] })) }) })] }, company.id));
                            }) })] })) })] }));
}
