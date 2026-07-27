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
exports.default = AdminLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const lucide_react_1 = require("lucide-react");
const adminNavConfig = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: lucide_react_1.LayoutDashboard },
    { label: 'Company Management', path: '/admin/companies', icon: lucide_react_1.Building2 },
    { label: 'Reset Password', path: '/admin/reset-password', icon: lucide_react_1.Key },
    { label: 'Activity Logs', path: '/admin/activity-logs', icon: lucide_react_1.Activity },
    { label: 'Settings', path: '/admin/settings', icon: lucide_react_1.Settings },
];
function AdminSidebar({ collapsed }) {
    return ((0, jsx_runtime_1.jsxs)("aside", { className: `app-sidebar${collapsed ? ' collapsed' : ''}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "sidebar-logo", children: [(0, jsx_runtime_1.jsx)("div", { className: "sidebar-logo-icon", style: { background: 'var(--purple)' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Shield, { size: 18, color: "white" }) }), !collapsed && ((0, jsx_runtime_1.jsxs)("div", { className: "sidebar-logo-text", children: [(0, jsx_runtime_1.jsx)("span", { className: "sidebar-logo-name", children: "Admin Portal" }), (0, jsx_runtime_1.jsx)("span", { className: "sidebar-logo-sub", children: "Pharma ERP" })] }))] }), (0, jsx_runtime_1.jsx)("nav", { className: "sidebar-nav", children: (0, jsx_runtime_1.jsxs)("div", { className: "sidebar-section", children: [!collapsed && (0, jsx_runtime_1.jsx)("div", { className: "sidebar-section-label", children: "Super Admin" }), adminNavConfig.map((item) => ((0, jsx_runtime_1.jsxs)(react_router_dom_1.NavLink, { to: item.path, className: ({ isActive }) => `nav-single-item${isActive ? ' active' : ''}`, title: collapsed ? item.label : '', children: [(0, jsx_runtime_1.jsx)("span", { className: "sidebar-group-icon", children: (0, jsx_runtime_1.jsx)(item.icon, { size: 16 }) }), !collapsed && (0, jsx_runtime_1.jsx)("span", { className: "sidebar-group-label", children: item.label })] }, item.path)))] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "sidebar-footer", children: [(0, jsx_runtime_1.jsx)("div", { className: "sidebar-footer-avatar", style: { background: 'var(--purple)' }, children: "SA" }), !collapsed && ((0, jsx_runtime_1.jsxs)("div", { className: "sidebar-footer-info", children: [(0, jsx_runtime_1.jsx)("div", { className: "sidebar-footer-name", children: "System" }), (0, jsx_runtime_1.jsx)("div", { className: "sidebar-footer-role", children: "Super Admin" })] }))] })] }));
}
function AdminHeader({ collapsed, onToggle, pathname }) {
    const [profileOpen, setProfileOpen] = (0, react_1.useState)(false);
    const navigate = (0, react_router_dom_1.useNavigate)();
    const getPageTitle = () => {
        const route = adminNavConfig.find(r => pathname.startsWith(r.path));
        return route ? route.label : 'Admin Portal';
    };
    return ((0, jsx_runtime_1.jsxs)("header", { className: "app-header", children: [(0, jsx_runtime_1.jsx)("button", { className: "header-icon-btn", onClick: onToggle, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Menu, { size: 18 }) }), (0, jsx_runtime_1.jsxs)("div", { className: "header-breadcrumb", children: [(0, jsx_runtime_1.jsx)("div", { className: "header-title", children: getPageTitle() }), (0, jsx_runtime_1.jsx)("div", { className: "header-sub", children: "Super Admin Control Panel" })] }), (0, jsx_runtime_1.jsx)("div", { className: "header-search", style: { opacity: 0, pointerEvents: 'none' } }), (0, jsx_runtime_1.jsxs)("div", { className: "header-actions", children: [(0, jsx_runtime_1.jsxs)("button", { className: "header-icon-btn", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Bell, { size: 17 }), (0, jsx_runtime_1.jsx)("span", { className: "header-badge", style: { background: 'var(--purple)' } })] }), (0, jsx_runtime_1.jsxs)("div", { style: { position: 'relative' }, children: [(0, jsx_runtime_1.jsx)("div", { className: "header-avatar", style: { background: 'linear-gradient(135deg, var(--purple), #5B21B6)' }, onClick: () => setProfileOpen(!profileOpen), children: "SA" }), profileOpen && ((0, jsx_runtime_1.jsxs)("div", { style: {
                                    position: 'absolute', top: '40px', right: 0,
                                    background: 'white', border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
                                    minWidth: '180px', zIndex: 200, overflow: 'hidden',
                                }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 600, fontSize: '0.82rem' }, children: "Super Admin" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.72rem', color: 'var(--text-muted)' }, children: "System Manager" })] }), (0, jsx_runtime_1.jsx)("div", { style: { padding: '0.25rem 0' }, children: (0, jsx_runtime_1.jsxs)("div", { onClick: async () => {
                                                if (window.pharmaAPI?.auth) {
                                                    await window.pharmaAPI.auth.clearToken();
                                                }
                                                localStorage.removeItem('user');
                                                localStorage.removeItem('accessToken');
                                                localStorage.removeItem('refreshToken');
                                                setProfileOpen(false);
                                                navigate('/admin/login');
                                            }, style: {
                                                display: 'flex', alignItems: 'center', gap: '0.625rem',
                                                padding: '0.5rem 1rem', cursor: 'pointer',
                                                fontSize: '0.82rem', color: 'var(--danger)',
                                                transition: 'background 0.15s',
                                            }, onMouseEnter: e => e.currentTarget.style.background = 'var(--danger-light)', onMouseLeave: e => e.currentTarget.style.background = 'transparent', children: [(0, jsx_runtime_1.jsx)(lucide_react_1.LogOut, { size: 14 }), "Logout"] }) })] }))] })] })] }));
}
function AdminLayout({ children }) {
    const [collapsed, setCollapsed] = (0, react_1.useState)(false);
    const location = (0, react_router_dom_1.useLocation)();
    return ((0, jsx_runtime_1.jsxs)("div", { className: "app-shell", children: [(0, jsx_runtime_1.jsx)(AdminSidebar, { collapsed: collapsed }), (0, jsx_runtime_1.jsxs)("main", { className: `app-main${collapsed ? ' collapsed' : ''}`, children: [(0, jsx_runtime_1.jsx)(AdminHeader, { collapsed: collapsed, onToggle: () => setCollapsed(!collapsed), pathname: location.pathname }), (0, jsx_runtime_1.jsx)("div", { className: "app-content", children: children })] })] }));
}
