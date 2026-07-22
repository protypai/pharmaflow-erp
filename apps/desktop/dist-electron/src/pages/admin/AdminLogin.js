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
exports.default = AdminLogin;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const lucide_react_1 = require("lucide-react");
function AdminLogin() {
    const [username, setUsername] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [showPass, setShowPass] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    const navigate = (0, react_router_dom_1.useNavigate)();
    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        if (!username || !password) {
            setError('Please enter username and password.');
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            navigate('/admin/dashboard');
        }, 800);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { style: {
            minHeight: '100vh',
            display: 'flex',
            background: 'var(--content-bg)',
        }, children: [(0, jsx_runtime_1.jsxs)("div", { style: {
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    background: '#020617', // Very dark slate
                    position: 'relative',
                    overflow: 'hidden',
                }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                            position: 'absolute', inset: 0,
                            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(124,58,237,0.15) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(124,58,237,0.1) 0%, transparent 40%)`,
                        } }), (0, jsx_runtime_1.jsxs)("div", { style: { position: 'relative', zIndex: 1, maxWidth: 420, width: '100%' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                                            width: 52, height: 52,
                                            background: 'var(--purple)',
                                            borderRadius: 14,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
                                        }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Shield, { size: 26, color: "white" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '1.5rem', fontWeight: 800, color: 'white', lineHeight: 1.1 }, children: "Super Admin" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: '#94A3B8', marginTop: 2 }, children: "Platform Management" })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '2rem' }, children: [(0, jsx_runtime_1.jsx)("h1", { style: { color: 'white', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.2 }, children: "Master Control Panel" }), (0, jsx_runtime_1.jsx)("p", { style: { color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.6 }, children: "Manage all client companies, backups, system settings, and monitor platform activity in real-time." })] })] })] }), (0, jsx_runtime_1.jsx)("div", { style: {
                    width: '480px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    background: 'white',
                    boxShadow: '-8px 0 40px rgba(0,0,0,0.06)',
                }, children: (0, jsx_runtime_1.jsxs)("div", { style: { width: '100%', maxWidth: 380 }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '2.5rem' }, children: [(0, jsx_runtime_1.jsx)("h2", { style: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.375rem' }, children: "Admin Login" }), (0, jsx_runtime_1.jsx)("p", { style: { fontSize: '0.85rem', color: 'var(--text-secondary)' }, children: "Secure access for platform administrators" })] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleLogin, style: { display: 'flex', flexDirection: 'column', gap: '1.125rem' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Username" }), (0, jsx_runtime_1.jsxs)("div", { className: "input-wrapper", children: [(0, jsx_runtime_1.jsx)("span", { className: "input-icon", children: (0, jsx_runtime_1.jsx)(lucide_react_1.User, { size: 15 }) }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: "text", placeholder: "admin", value: username, onChange: e => setUsername(e.target.value), autoFocus: true })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Password" }), (0, jsx_runtime_1.jsxs)("div", { className: "input-wrapper", children: [(0, jsx_runtime_1.jsx)("span", { className: "input-icon", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Lock, { size: 15 }) }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: showPass ? 'text' : 'password', placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: password, onChange: e => setPassword(e.target.value), style: { paddingRight: '2.5rem' } }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowPass(!showPass), style: {
                                                        position: 'absolute', right: '0.625rem',
                                                        background: 'none', border: 'none', cursor: 'pointer',
                                                        color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                                                    }, children: showPass ? (0, jsx_runtime_1.jsx)(lucide_react_1.EyeOff, { size: 15 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { size: 15 }) })] })] }), error && ((0, jsx_runtime_1.jsx)("div", { style: {
                                        background: 'var(--danger-light)', border: '1px solid #FECACA',
                                        borderRadius: 'var(--radius-sm)', padding: '0.625rem 0.875rem',
                                        fontSize: '0.8rem', color: 'var(--danger)',
                                    }, children: error })), (0, jsx_runtime_1.jsx)("button", { type: "submit", className: "btn btn-primary btn-lg", disabled: loading, style: { width: '100%', justifyContent: 'center', marginTop: '0.25rem', background: 'var(--purple)', borderColor: 'var(--purple)' }, children: loading ? 'Authenticating…' : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: ["Enter Portal ", (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { size: 16 })] })) })] }), (0, jsx_runtime_1.jsx)("div", { style: { marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', textAlign: 'center' }, children: (0, jsx_runtime_1.jsx)("a", { href: "/login", style: { fontSize: '0.78rem', color: 'var(--text-muted)' }, onClick: (e) => { e.preventDefault(); navigate('/login'); }, children: "\u2190 Customer ERP Login" }) })] }) })] }));
}
