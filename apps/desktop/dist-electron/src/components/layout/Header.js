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
exports.default = Header;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const lucide_react_1 = require("lucide-react");
const pageTitles = {
    '/dashboard': { title: 'Dashboard', sub: 'Overview of today\'s business' },
    '/masters/products': { title: 'Product Master', sub: 'Manage medicines & batches' },
    '/masters/customers': { title: 'Customer Master', sub: 'Manage your customers' },
    '/masters/suppliers': { title: 'Supplier Master', sub: 'Manage your suppliers' },
    '/masters/companies': { title: 'Company Master', sub: 'Pharmaceutical manufacturers' },
    '/masters/categories': { title: 'Category Master', sub: 'Product categories' },
    '/masters/racks': { title: 'Rack Master', sub: 'Storage rack locations' },
    '/transactions/purchase': { title: 'Purchase Entry', sub: 'Record supplier invoices' },
    '/transactions/purchase-return': { title: 'Purchase Return', sub: 'Return goods to supplier' },
    '/transactions/sales': { title: 'Sales Invoice', sub: 'Create customer bills' },
    '/transactions/sales-return': { title: 'Sales Return', sub: 'Accept goods from customer' },
    '/transactions/receipts': { title: 'Receipts', sub: 'Record customer payments' },
    '/transactions/payments': { title: 'Payments', sub: 'Pay to suppliers' },
    '/transactions/stock-adjustment': { title: 'Stock Adjustment', sub: 'Physical count & corrections' },
    '/inventory/current-stock': { title: 'Current Stock', sub: 'Live stock position' },
    '/inventory/batch-enquiry': { title: 'Batch Enquiry', sub: 'Search by batch number' },
    '/inventory/near-expiry': { title: 'Near Expiry', sub: 'Medicines expiring soon' },
    '/inventory/expired': { title: 'Expired Stock', sub: 'Expired medicines' },
    '/inventory/dead-stock': { title: 'Dead Stock', sub: 'No movement for months' },
    '/inventory/low-stock': { title: 'Low Stock', sub: 'Below minimum level' },
    '/accounts/customer-ledger': { title: 'Customer Ledger', sub: 'Customer-wise accounts' },
    '/accounts/supplier-ledger': { title: 'Supplier Ledger', sub: 'Supplier-wise accounts' },
    '/accounts/cash-book': { title: 'Cash Book', sub: 'Cash transactions' },
    '/accounts/bank-book': { title: 'Bank Book', sub: 'Bank transactions' },
    '/accounts/journal': { title: 'Journal', sub: 'Accounting adjustments' },
    '/accounts/outstanding': { title: 'Outstanding', sub: 'Pending receivables & payables' },
    '/reports/sales': { title: 'Sales Report', sub: 'Sales analysis & trends' },
    '/reports/purchase': { title: 'Purchase Report', sub: 'Purchase analysis' },
    '/reports/stock': { title: 'Stock Report', sub: 'Inventory valuation' },
    '/reports/gst': { title: 'GST Report', sub: 'Tax summary for filing' },
    '/reports/customer': { title: 'Customer Report', sub: 'Customer-wise analysis' },
    '/reports/supplier': { title: 'Supplier Report', sub: 'Supplier-wise analysis' },
    '/reports/profit': { title: 'Profit Report', sub: 'Profitability analysis' },
    '/backup': { title: 'Backup & Restore', sub: 'Data backup management' },
    '/settings': { title: 'Settings', sub: 'Application configuration' },
    '/profile': { title: 'Company Profile', sub: 'Manage your company details' },
};
function Header({ collapsed, onToggle, pathname }) {
    const [searchOpen, setSearchOpen] = (0, react_1.useState)(false);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [profileOpen, setProfileOpen] = (0, react_1.useState)(false);
    const currentAppVersion = import.meta.env.VITE_APP_VERSION || 'v1.0.30';
    const [newVersion, setNewVersion] = (0, react_1.useState)(currentAppVersion);
    const [updateAvailable, setUpdateAvailable] = (0, react_1.useState)(false);
    const [updateOpen, setUpdateOpen] = (0, react_1.useState)(false);
    const [companyInfo, setCompanyInfo] = (0, react_1.useState)({ name: 'Company Name', shortName: 'CN' });
    const [userInfo, setUserInfo] = (0, react_1.useState)({ name: 'User', role: 'admin' });
    (0, react_1.useEffect)(() => {
        const fetchProfile = async () => {
            try {
                const compRes = await window.pharmaAPI.db.query("SELECT * FROM companies LIMIT 1");
                if (compRes?.data?.length > 0) {
                    setCompanyInfo(compRes.data[0]);
                }
                const userRes = await window.pharmaAPI.db.query("SELECT * FROM users LIMIT 1");
                if (userRes?.data?.length > 0) {
                    setUserInfo(userRes.data[0]);
                }
            }
            catch (err) {
                console.error("Failed to load profile data", err);
            }
        };
        fetchProfile();
    }, []);
    (0, react_1.useEffect)(() => {
        if (window.pharmaAPI?.update) {
            window.pharmaAPI.update.onAvailable((info) => {
                setUpdateAvailable(true);
                if (info?.version)
                    setNewVersion(info.version);
            });
            window.pharmaAPI.update.onDownloaded(() => {
                setUpdateAvailable(true);
            });
        }
    }, []);
    const handleTriggerUpdate = () => {
        if (window.pharmaAPI?.update?.check) {
            window.pharmaAPI.update.check();
            alert('Checking for latest software updates...');
        }
        else {
            alert(`You are running PharmaFlow ERP ${currentAppVersion}. Checking GitHub Releases for updates...`);
        }
    };
    const [highlighted, setHighlighted] = (0, react_1.useState)(0);
    const searchRef = (0, react_1.useRef)(null);
    const navigate = (0, react_router_dom_1.useNavigate)();
    const pageInfo = pageTitles[pathname] || { title: 'Pharma ERP', sub: '' };
    const [searchableData, setSearchableData] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchSearchData = async () => {
            try {
                const prodRes = await window.pharmaAPI.db.query("SELECT id, name, generic_name FROM products");
                const custRes = await window.pharmaAPI.db.query("SELECT id, name, area FROM customers");
                const supRes = await window.pharmaAPI.db.query("SELECT id, name, city FROM suppliers");
                const data = [
                    ...(prodRes?.data || []).map(p => ({ type: 'Medicine', icon: lucide_react_1.Pill, name: p.name, sub: p.generic_name, path: '/masters/products' })),
                    ...(custRes?.data || []).map(c => ({ type: 'Customer', icon: lucide_react_1.Users, name: c.name, sub: c.area, path: '/masters/customers' })),
                    ...(supRes?.data || []).map(s => ({ type: 'Supplier', icon: lucide_react_1.Truck, name: s.name, sub: s.city, path: '/masters/suppliers' })),
                ];
                setSearchableData(data);
            }
            catch (err) {
                console.error("Failed to load search data", err);
            }
        };
        fetchSearchData();
    }, []);
    const searchResults = searchQuery.length > 1
        ? searchableData.filter(d => d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (d.sub && d.sub.toLowerCase().includes(searchQuery.toLowerCase()))).slice(0, 8)
        : [];
    (0, react_1.useEffect)(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
                setTimeout(() => searchRef.current?.focus(), 50);
            }
            if (e.key === 'Escape') {
                setSearchOpen(false);
                setSearchQuery('');
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);
    const handleSearchSelect = (item) => {
        navigate(item.path);
        setSearchOpen(false);
        setSearchQuery('');
    };
    // Group results by type
    const grouped = searchResults.reduce((acc, item) => {
        if (!acc[item.type])
            acc[item.type] = [];
        acc[item.type].push(item);
        return acc;
    }, {});
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("header", { className: "app-header", children: [(0, jsx_runtime_1.jsx)("button", { className: "header-icon-btn", onClick: onToggle, id: "sidebar-toggle", children: collapsed ? (0, jsx_runtime_1.jsx)(lucide_react_1.Menu, { size: 18 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Menu, { size: 18 }) }), (0, jsx_runtime_1.jsxs)("div", { className: "header-breadcrumb", children: [(0, jsx_runtime_1.jsx)("div", { className: "header-title", children: pageInfo.title }), pageInfo.sub && (0, jsx_runtime_1.jsx)("div", { className: "header-sub", children: pageInfo.sub })] }), (0, jsx_runtime_1.jsxs)("div", { className: "header-search", onClick: () => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50); }, id: "global-search-trigger", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 14, color: "var(--text-muted)" }), (0, jsx_runtime_1.jsx)("span", { className: "header-search-text", children: "Search medicines, customers\u2026" }), (0, jsx_runtime_1.jsx)("span", { className: "header-search-kbd", children: "Ctrl K" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "header-actions", children: [(0, jsx_runtime_1.jsxs)("div", { style: { position: 'relative' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "header-icon-btn", onClick: () => setUpdateOpen(!updateOpen), title: "Software Updates", style: {
                                            background: updateAvailable ? '#EFF6FF' : 'transparent',
                                            borderColor: updateAvailable ? '#3B82F6' : 'transparent',
                                            color: updateAvailable ? '#2563EB' : 'var(--text-secondary)',
                                            position: 'relative',
                                        }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { size: 17 }), updateAvailable && ((0, jsx_runtime_1.jsx)("span", { style: {
                                                    position: 'absolute', top: 2, right: 2,
                                                    width: 8, height: 8, borderRadius: '50%',
                                                    background: '#2563EB', boxShadow: '0 0 8px #2563EB',
                                                    animation: 'pulse 1.5s infinite'
                                                } }))] }), updateOpen && ((0, jsx_runtime_1.jsxs)("div", { style: {
                                            position: 'absolute', top: '40px', right: 0,
                                            background: 'white', border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
                                            minWidth: '280px', padding: '1rem', zIndex: 210,
                                        }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.88rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Sparkles, { size: 16, color: "#2563EB" }), "Software Updates"] }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.75rem' }, children: updateAvailable
                                                    ? `New version ${newVersion} is ready to install!`
                                                    : `Your PharmaFlow ERP is up to date (${currentAppVersion}).` }), updateAvailable ? ((0, jsx_runtime_1.jsxs)("button", { className: "btn btn-primary btn-sm", style: { width: '100%', justifyContent: 'center' }, onClick: () => {
                                                    if (window.pharmaAPI?.update?.quitAndInstall) {
                                                        window.pharmaAPI.update.quitAndInstall();
                                                    }
                                                    else {
                                                        alert('Installing latest update...');
                                                        window.location.reload();
                                                    }
                                                }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { size: 14 }), " Install Update Now"] })) : ((0, jsx_runtime_1.jsx)("button", { className: "btn btn-outline btn-sm", style: { width: '100%', justifyContent: 'center' }, onClick: handleTriggerUpdate, children: "Check for Updates" }))] }))] }), (0, jsx_runtime_1.jsxs)("button", { className: "header-icon-btn", id: "notifications-btn", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Bell, { size: 17 }), (0, jsx_runtime_1.jsx)("span", { className: "header-badge" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { position: 'relative' }, children: [(0, jsx_runtime_1.jsx)("div", { className: "header-avatar", onClick: () => setProfileOpen(!profileOpen), id: "profile-avatar", children: (companyInfo.shortName || companyInfo.name || 'CN').substring(0, 2).toUpperCase() }), profileOpen && ((0, jsx_runtime_1.jsxs)("div", { style: {
                                            position: 'absolute', top: '40px', right: 0,
                                            background: 'white', border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
                                            minWidth: '180px', zIndex: 200,
                                            overflow: 'hidden',
                                        }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 600, fontSize: '0.82rem' }, children: companyInfo.name }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.72rem', color: 'var(--text-muted)' }, children: ["FY 2025-26 \u2022 ", userInfo.role] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { padding: '0.25rem 0' }, children: [[
                                                        { icon: lucide_react_1.User, label: 'Profile', path: '/profile' },
                                                        { icon: lucide_react_1.Settings, label: 'Settings', path: '/settings' },
                                                    ].map(({ icon: Icon, label, path }) => ((0, jsx_runtime_1.jsxs)("div", { onClick: () => { if (path)
                                                            navigate(path); setProfileOpen(false); }, style: {
                                                            display: 'flex', alignItems: 'center', gap: '0.625rem',
                                                            padding: '0.5rem 1rem', cursor: 'pointer',
                                                            fontSize: '0.82rem', color: 'var(--text-primary)',
                                                            transition: 'background 0.15s',
                                                        }, onMouseEnter: e => e.currentTarget.style.background = 'var(--content-bg)', onMouseLeave: e => e.currentTarget.style.background = 'transparent', children: [(0, jsx_runtime_1.jsx)(Icon, { size: 14 }), label] }, label))), (0, jsx_runtime_1.jsx)("div", { style: { borderTop: '1px solid var(--border)', marginTop: '0.25rem', paddingTop: '0.25rem' }, children: (0, jsx_runtime_1.jsxs)("div", { onClick: () => { navigate('/login'); setProfileOpen(false); }, style: {
                                                                display: 'flex', alignItems: 'center', gap: '0.625rem',
                                                                padding: '0.5rem 1rem', cursor: 'pointer',
                                                                fontSize: '0.82rem', color: 'var(--danger)',
                                                                transition: 'background 0.15s',
                                                            }, onMouseEnter: e => e.currentTarget.style.background = 'var(--danger-light)', onMouseLeave: e => e.currentTarget.style.background = 'transparent', children: [(0, jsx_runtime_1.jsx)(lucide_react_1.LogOut, { size: 14 }), "Logout"] }) })] })] }))] })] })] }), searchOpen && ((0, jsx_runtime_1.jsx)("div", { className: "search-modal-overlay", onClick: () => { setSearchOpen(false); setSearchQuery(''); }, children: (0, jsx_runtime_1.jsxs)("div", { className: "search-modal", onClick: e => e.stopPropagation(), children: [(0, jsx_runtime_1.jsxs)("div", { className: "search-modal-input", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 18, color: "var(--text-muted)" }), (0, jsx_runtime_1.jsx)("input", { ref: searchRef, type: "text", placeholder: "Search medicines, customers, suppliers, invoices\u2026", value: searchQuery, onChange: e => setSearchQuery(e.target.value), id: "global-search-input" }), searchQuery && ((0, jsx_runtime_1.jsx)("button", { onClick: () => setSearchQuery(''), style: { border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 16 }) }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "search-modal-results", children: [searchQuery.length < 2 && ((0, jsx_runtime_1.jsx)("div", { style: { padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }, children: "Type to search medicines, customers, suppliers\u2026" })), searchQuery.length >= 2 && Object.keys(grouped).length === 0 && ((0, jsx_runtime_1.jsxs)("div", { style: { padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }, children: ["No results for \"", searchQuery, "\""] })), Object.entries(grouped).map(([type, items]) => ((0, jsx_runtime_1.jsxs)("div", { className: "search-result-group", children: [(0, jsx_runtime_1.jsx)("div", { className: "search-result-label", children: type }), items.map((item, idx) => ((0, jsx_runtime_1.jsxs)("div", { className: "search-result-item", onClick: () => handleSearchSelect(item), children: [(0, jsx_runtime_1.jsx)("div", { className: "search-result-icon", children: (0, jsx_runtime_1.jsx)(item.icon, { size: 14 }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "search-result-name", children: item.name }), (0, jsx_runtime_1.jsx)("div", { className: "search-result-sub", children: item.sub })] })] }, idx)))] }, type)))] }), (0, jsx_runtime_1.jsxs)("div", { style: {
                                padding: '0.5rem 1rem', borderTop: '1px solid var(--border)',
                                display: 'flex', gap: '1rem', fontSize: '0.68rem', color: 'var(--text-muted)',
                            }, children: [(0, jsx_runtime_1.jsx)("span", { children: "\u2191\u2193 Navigate" }), (0, jsx_runtime_1.jsx)("span", { children: "\u21B5 Open" }), (0, jsx_runtime_1.jsx)("span", { children: "Esc Close" })] })] }) }))] }));
}
