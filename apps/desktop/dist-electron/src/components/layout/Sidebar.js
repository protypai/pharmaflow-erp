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
exports.default = Sidebar;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const lucide_react_1 = require("lucide-react");
const navConfig = [
    {
        type: 'single',
        label: 'Dashboard',
        icon: lucide_react_1.LayoutDashboard,
        path: '/dashboard',
    },
    {
        type: 'group',
        label: 'Masters',
        icon: lucide_react_1.Layers,
        children: [
            { label: 'Product Master', path: '/masters/products', icon: lucide_react_1.Pill },
            { label: 'Customer Master', path: '/masters/customers', icon: lucide_react_1.Users },
            { label: 'Supplier Master', path: '/masters/suppliers', icon: lucide_react_1.Truck },
            { label: 'Company Master', path: '/masters/companies', icon: lucide_react_1.Building2 },
            { label: 'Category', path: '/masters/categories', icon: lucide_react_1.Tag },
            { label: 'Rack Master', path: '/masters/racks', icon: lucide_react_1.Grid3X3 },
        ],
    },
    {
        type: 'group',
        label: 'Transactions',
        icon: lucide_react_1.ArrowLeftRight,
        children: [
            { label: 'Purchase', path: '/transactions/purchase', icon: lucide_react_1.ShoppingCart },
            { label: 'Purchase Return', path: '/transactions/purchase-return', icon: lucide_react_1.ArrowLeftRight },
            { label: 'Sales', path: '/transactions/sales', icon: lucide_react_1.BadgeIndianRupee },
            { label: 'Sales Return', path: '/transactions/sales-return', icon: lucide_react_1.ArrowLeftRight },
            { label: 'Receipts', path: '/transactions/receipts', icon: lucide_react_1.Receipt },
            { label: 'Payments', path: '/transactions/payments', icon: lucide_react_1.Wallet },
            { label: 'Stock Adjustment', path: '/transactions/stock-adjustment', icon: lucide_react_1.Package },
        ],
    },
    {
        type: 'group',
        label: 'Inventory',
        icon: lucide_react_1.Archive,
        children: [
            { label: 'Current Stock', path: '/inventory/current-stock', icon: lucide_react_1.Archive },
            { label: 'Batch Enquiry', path: '/inventory/batch-enquiry', icon: lucide_react_1.FileText },
            { label: 'Near Expiry', path: '/inventory/near-expiry', icon: lucide_react_1.Package },
            { label: 'Expired Stock', path: '/inventory/expired', icon: lucide_react_1.Package },
            { label: 'Dead Stock', path: '/inventory/dead-stock', icon: lucide_react_1.Package },
            { label: 'Low Stock', path: '/inventory/low-stock', icon: lucide_react_1.Package },
        ],
    },
    {
        type: 'group',
        label: 'Accounts',
        icon: lucide_react_1.BadgeIndianRupee,
        children: [
            { label: 'Customer Ledger', path: '/accounts/customer-ledger', icon: lucide_react_1.Users },
            { label: 'Supplier Ledger', path: '/accounts/supplier-ledger', icon: lucide_react_1.Truck },
            { label: 'Cash Book', path: '/accounts/cash-book', icon: lucide_react_1.Wallet },
            { label: 'Bank Book', path: '/accounts/bank-book', icon: lucide_react_1.Building2 },
            { label: 'Journal', path: '/accounts/journal', icon: lucide_react_1.FileText },
            { label: 'Outstanding', path: '/accounts/outstanding', icon: lucide_react_1.BadgeIndianRupee },
        ],
    },
    {
        type: 'group',
        label: 'Reports',
        icon: lucide_react_1.BarChart3,
        children: [
            { label: 'Sales Report', path: '/reports/sales', icon: lucide_react_1.TrendingUp },
            { label: 'Purchase Report', path: '/reports/purchase', icon: lucide_react_1.ShoppingCart },
            { label: 'Stock Report', path: '/reports/stock', icon: lucide_react_1.Archive },
            { label: 'GST Report', path: '/reports/gst', icon: lucide_react_1.FileText },
            { label: 'Customer Report', path: '/reports/customer', icon: lucide_react_1.Users },
            { label: 'Supplier Report', path: '/reports/supplier', icon: lucide_react_1.Truck },
            { label: 'Profit Report', path: '/reports/profit', icon: lucide_react_1.TrendingUp },
        ],
    },
    {
        type: 'single',
        label: 'Settings',
        icon: lucide_react_1.Settings,
        path: '/settings',
    },
];
function Sidebar({ collapsed, onToggle }) {
    const location = (0, react_router_dom_1.useLocation)();
    const [companyInfo, setCompanyInfo] = (0, react_1.useState)({ name: 'Company Name', shortName: 'CN' });
    const [userInfo, setUserInfo] = (0, react_1.useState)({ name: 'User', role: 'admin' });
    (0, react_1.useEffect)(() => {
        const fetchProfile = async () => {
            try {
                const compRes = await window.pharmaAPI.db.query("SELECT * FROM companies LIMIT 1");
                if (compRes?.data?.length > 0)
                    setCompanyInfo(compRes.data[0]);
                const userRes = await window.pharmaAPI.db.query("SELECT * FROM users LIMIT 1");
                if (userRes?.data?.length > 0)
                    setUserInfo(userRes.data[0]);
            }
            catch (err) {
                console.error("Failed to load profile data", err);
            }
        };
        fetchProfile();
    }, []);
    const [openGroups, setOpenGroups] = (0, react_1.useState)(() => {
        // Auto-open the group that contains the active route
        const active = {};
        navConfig.forEach((item) => {
            if (item.type === 'group') {
                if (item.children.some((c) => location.pathname.startsWith(c.path))) {
                    active[item.label] = true;
                }
            }
        });
        return active;
    });
    const toggleGroup = (label) => {
        setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
    };
    const isGroupActive = (item) => item.type === 'group' && item.children.some((c) => location.pathname.startsWith(c.path));
    return ((0, jsx_runtime_1.jsxs)("aside", { className: `app-sidebar${collapsed ? ' collapsed' : ''}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "sidebar-logo", children: [(0, jsx_runtime_1.jsx)("div", { className: "sidebar-logo-icon", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Pill, { size: 18, color: "white" }) }), !collapsed && ((0, jsx_runtime_1.jsxs)("div", { className: "sidebar-logo-text", children: [(0, jsx_runtime_1.jsx)("span", { className: "sidebar-logo-name", children: "Pharma ERP" }), (0, jsx_runtime_1.jsx)("span", { className: "sidebar-logo-sub", children: "FY 2025-26" })] }))] }), (0, jsx_runtime_1.jsx)("nav", { className: "sidebar-nav", children: navConfig.map((item) => {
                    if (item.type === 'single') {
                        return ((0, jsx_runtime_1.jsxs)(react_router_dom_1.NavLink, { to: item.path, className: ({ isActive }) => `nav-single-item${isActive ? ' active' : ''}`, title: collapsed ? item.label : '', children: [(0, jsx_runtime_1.jsx)("span", { className: "sidebar-group-icon", children: (0, jsx_runtime_1.jsx)(item.icon, { size: 16 }) }), !collapsed && (0, jsx_runtime_1.jsx)("span", { className: "sidebar-group-label", children: item.label })] }, item.path));
                    }
                    const isOpen = openGroups[item.label];
                    const isActive = isGroupActive(item);
                    return ((0, jsx_runtime_1.jsxs)("div", { className: "sidebar-group", children: [(0, jsx_runtime_1.jsxs)("div", { className: `sidebar-group-header${isActive ? ' active' : ''}`, onClick: () => !collapsed && toggleGroup(item.label), title: collapsed ? item.label : '', children: [(0, jsx_runtime_1.jsx)("span", { className: "sidebar-group-icon", children: (0, jsx_runtime_1.jsx)(item.icon, { size: 16 }) }), !collapsed && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { className: "sidebar-group-label", children: item.label }), (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { size: 14, className: `sidebar-group-chevron${isOpen ? ' open' : ''}` })] }))] }), !collapsed && ((0, jsx_runtime_1.jsx)("div", { className: `sidebar-group-items${isOpen ? ' open' : ''}`, children: item.children.map((child) => ((0, jsx_runtime_1.jsxs)(react_router_dom_1.NavLink, { to: child.path, className: ({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`, children: [(0, jsx_runtime_1.jsx)("span", { className: "sidebar-item-dot" }), child.label] }, child.path))) }))] }, item.label));
                }) }), (0, jsx_runtime_1.jsxs)("div", { className: "sidebar-footer", onClick: () => {
                    if (typeof window !== 'undefined') {
                        window.location.href = '/profile';
                    }
                }, style: { cursor: 'pointer' }, children: [(0, jsx_runtime_1.jsx)("div", { className: "sidebar-footer-avatar", children: (companyInfo.shortName || companyInfo.name || 'CN').substring(0, 2).toUpperCase() }), !collapsed && ((0, jsx_runtime_1.jsxs)("div", { className: "sidebar-footer-info", children: [(0, jsx_runtime_1.jsx)("div", { className: "sidebar-footer-name", children: companyInfo.name }), (0, jsx_runtime_1.jsx)("div", { className: "sidebar-footer-role", children: userInfo.role })] }))] })] }));
}
