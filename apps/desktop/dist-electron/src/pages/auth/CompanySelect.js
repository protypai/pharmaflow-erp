"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CompanySelect;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const lucide_react_1 = require("lucide-react");
const companies = [
    { id: 1, name: 'Sharma Medical Distributors Pvt. Ltd.', fy: 'FY 2025-26', city: 'Mumbai', invoices: 1240 },
    { id: 2, name: 'Sharma Medical Distributors Pvt. Ltd.', fy: 'FY 2024-25', city: 'Mumbai', invoices: 3450 },
];
function CompanySelect() {
    const navigate = (0, react_router_dom_1.useNavigate)();
    return ((0, jsx_runtime_1.jsxs)("div", { style: {
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #F0F7FF 0%, #F1F5F9 100%)',
            padding: '2rem',
        }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { textAlign: 'center', marginBottom: '2rem' }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                            width: 52, height: 52, background: 'var(--primary)',
                            borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1rem', boxShadow: '0 8px 24px rgba(37,99,235,0.3)',
                        }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Pill, { size: 26, color: "white" }) }), (0, jsx_runtime_1.jsx)("h2", { style: { fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }, children: "Select Company" }), (0, jsx_runtime_1.jsx)("p", { style: { fontSize: '0.85rem', color: 'var(--text-secondary)' }, children: "Choose the company and financial year to proceed" })] }), (0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: 480 }, children: companies.map((c) => ((0, jsx_runtime_1.jsxs)("div", { onClick: () => navigate('/dashboard'), style: {
                        background: 'white',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: '1.25rem',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: '1rem',
                        transition: 'all 0.15s ease',
                        boxShadow: 'var(--shadow-sm)',
                    }, onMouseEnter: e => {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
                    }, onMouseLeave: e => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '0.875rem' }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                                        width: 44, height: 44, background: 'var(--primary-50)',
                                        borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Building2, { size: 20, color: "var(--primary)" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }, children: c.name }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '1rem', marginTop: '0.25rem' }, children: [(0, jsx_runtime_1.jsxs)("span", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Calendar, { size: 11 }), " ", c.fy] }), (0, jsx_runtime_1.jsx)("span", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: c.city }), (0, jsx_runtime_1.jsxs)("span", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: [c.invoices.toLocaleString(), " invoices"] })] })] })] }), (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { size: 18, color: "var(--primary)" })] }, c.id))) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => navigate('/login'), className: "btn btn-ghost", style: { marginTop: '1.5rem', fontSize: '0.8rem' }, children: "\u2190 Back to Login" })] }));
}
