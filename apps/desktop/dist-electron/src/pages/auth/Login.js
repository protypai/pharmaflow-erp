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
exports.default = Login;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const lucide_react_1 = require("lucide-react");
const api_1 = require("../../config/api");
function Login() {
    const [username, setUsername] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [showPass, setShowPass] = (0, react_1.useState)(false);
    const [remember, setRemember] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    const navigate = (0, react_router_dom_1.useNavigate)();
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (!username || !password) {
            setError('Please enter username and password.');
            return;
        }
        setLoading(true);
        try {
            // 1. Try Cloud Backend Auth first
            let cloudSuccess = false;
            try {
                const cloudRes = await fetch(`${api_1.API_BASE_URL}/api/v1/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: username, password }),
                });
                const cloudData = await cloudRes.json();
                if (cloudRes.status === 403 || (cloudData.message && cloudData.message.includes('pending'))) {
                    setError('Your account is pending Super Admin approval. Please contact administrator.');
                    setLoading(false);
                    return;
                }
                if (cloudRes.ok && cloudData.success && cloudData.data) {
                    const { accessToken, refreshToken, user } = cloudData.data;
                    localStorage.setItem('user', JSON.stringify(user));
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', refreshToken);
                    // Sync into local SQLite if window.pharmaAPI exists
                    if (window.pharmaAPI?.db) {
                        try {
                            if (user.company) {
                                await window.pharmaAPI.db.query('INSERT OR REPLACE INTO Company (id, name, shortName, email) VALUES (?, ?, ?, ?)', [user.company.id, user.company.name, user.company.shortName || user.company.name, user.email]);
                            }
                            await window.pharmaAPI.db.query('INSERT OR REPLACE INTO User (id, companyId, name, email, passwordHash, role, isActive) VALUES (?, ?, ?, ?, ?, ?, 1)', [user.id, user.companyId || user.company?.id || 'comp_001', user.name, user.email, password, user.role || 'admin']);
                        }
                        catch (sqErr) {
                            console.warn('Local SQLite sync warning:', sqErr);
                        }
                    }
                    cloudSuccess = true;
                    navigate('/dashboard');
                    return;
                }
            }
            catch (cloudErr) {
                console.warn('Cloud Backend unreachable, attempting local authentication...', cloudErr);
            }
            if (cloudSuccess)
                return;
            // 2. Fallback to local SQLite DB if cloud unavailable
            if (window.pharmaAPI?.db) {
                const response = await window.pharmaAPI.db.query('SELECT id, name, companyId, role FROM User WHERE email = ? AND passwordHash = ? AND isActive = 1', [username, password]);
                const users = response?.data;
                if (users && users.length > 0) {
                    localStorage.setItem('user', JSON.stringify(users[0]));
                    navigate('/dashboard');
                    return;
                }
            }
            setError('Invalid username or password, or account is pending approval.');
        }
        catch (err) {
            console.error('Login error:', err);
            setError('Login error: ' + (err.message || 'Failed to authenticate'));
        }
        finally {
            setLoading(false);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { style: {
            minHeight: '100vh',
            display: 'flex',
            background: 'linear-gradient(135deg, #F0F7FF 0%, #EFF6FF 40%, #F1F5F9 100%)',
        }, children: [(0, jsx_runtime_1.jsxs)("div", { style: {
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    background: 'var(--sidebar-bg)',
                    position: 'relative',
                    overflow: 'hidden',
                }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                            position: 'absolute', inset: 0,
                            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(37,99,235,0.15) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(37,99,235,0.1) 0%, transparent 40%),
                            radial-gradient(circle at 60% 80%, rgba(124,58,237,0.08) 0%, transparent 40%)`,
                        } }), (0, jsx_runtime_1.jsxs)("div", { style: { position: 'relative', zIndex: 1, maxWidth: 420, width: '100%' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                                            width: 52, height: 52,
                                            background: 'var(--primary)',
                                            borderRadius: 14,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
                                        }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Pill, { size: 26, color: "white" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '1.5rem', fontWeight: 800, color: 'white', lineHeight: 1.1 }, children: "Pharma ERP" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: 'var(--sidebar-text)', marginTop: 2 }, children: "Pharmaceutical Distribution System" })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '2rem' }, children: [(0, jsx_runtime_1.jsxs)("h1", { style: { color: 'white', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.2 }, children: ["Modern ERP for", (0, jsx_runtime_1.jsx)("br", {}), "Pharma Distributors"] }), (0, jsx_runtime_1.jsx)("p", { style: { color: 'var(--sidebar-text)', fontSize: '0.9rem', lineHeight: 1.6 }, children: "Replace your old software with a faster, smarter, and more modern solution. Same features. Better experience." })] }), ['Purchase & Sales Management', 'Batch & Expiry Tracking', 'GST-Ready Reports', 'Customer Outstanding'].map(f => ((0, jsx_runtime_1.jsxs)("div", { style: {
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    marginBottom: '0.5rem',
                                }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                                            width: 18, height: 18, borderRadius: '50%',
                                            background: 'rgba(37,99,235,0.3)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                        }, children: (0, jsx_runtime_1.jsx)("div", { style: { width: 6, height: 6, borderRadius: '50%', background: '#60A5FA' } }) }), (0, jsx_runtime_1.jsx)("span", { style: { fontSize: '0.82rem', color: '#94A3B8' }, children: f })] }, f)))] })] }), (0, jsx_runtime_1.jsx)("div", { style: {
                    width: '480px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    background: 'white',
                    boxShadow: '-8px 0 40px rgba(0,0,0,0.06)',
                }, children: (0, jsx_runtime_1.jsxs)("div", { style: { width: '100%', maxWidth: 380 }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '2.5rem' }, children: [(0, jsx_runtime_1.jsx)("h2", { style: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.375rem' }, children: "Welcome back" }), (0, jsx_runtime_1.jsx)("p", { style: { fontSize: '0.85rem', color: 'var(--text-secondary)' }, children: "Sign in to your Pharma ERP account" })] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleLogin, style: { display: 'flex', flexDirection: 'column', gap: '1.125rem' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Username" }), (0, jsx_runtime_1.jsxs)("div", { className: "input-wrapper", children: [(0, jsx_runtime_1.jsx)("span", { className: "input-icon", children: (0, jsx_runtime_1.jsx)(lucide_react_1.User, { size: 15 }) }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: "text", placeholder: "Enter your username", value: username, onChange: e => setUsername(e.target.value), id: "login-username", autoFocus: true })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Password" }), (0, jsx_runtime_1.jsxs)("div", { className: "input-wrapper", children: [(0, jsx_runtime_1.jsx)("span", { className: "input-icon", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Lock, { size: 15 }) }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: showPass ? 'text' : 'password', placeholder: "Enter your password", value: password, onChange: e => setPassword(e.target.value), id: "login-password", style: { paddingRight: '2.5rem' } }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowPass(!showPass), style: {
                                                        position: 'absolute', right: '0.625rem',
                                                        background: 'none', border: 'none', cursor: 'pointer',
                                                        color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                                                    }, children: showPass ? (0, jsx_runtime_1.jsx)(lucide_react_1.EyeOff, { size: 15 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { size: 15 }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", id: "remember-me", checked: remember, onChange: e => setRemember(e.target.checked), style: { width: 14, height: 14, accentColor: 'var(--primary)', cursor: 'pointer' } }), (0, jsx_runtime_1.jsx)("label", { htmlFor: "remember-me", style: { fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }, children: "Remember me on this device" })] }), error && ((0, jsx_runtime_1.jsx)("div", { style: {
                                        background: 'var(--danger-light)', border: '1px solid #FECACA',
                                        borderRadius: 'var(--radius-sm)', padding: '0.625rem 0.875rem',
                                        fontSize: '0.8rem', color: 'var(--danger)',
                                    }, children: error })), (0, jsx_runtime_1.jsx)("button", { type: "submit", className: "btn btn-primary btn-lg", disabled: loading, id: "login-submit", style: { width: '100%', justifyContent: 'center', marginTop: '0.25rem' }, children: loading ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { style: {
                                                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)',
                                                    borderTopColor: 'white', borderRadius: '50%',
                                                    animation: 'spin 0.8s linear infinite',
                                                } }), "Signing in\u2026"] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: ["Sign In", (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { size: 16 })] })) }), (0, jsx_runtime_1.jsx)("div", { style: {
                                        background: 'var(--primary-50)', border: '1px solid var(--primary-light)',
                                        borderRadius: 'var(--radius-sm)', padding: '0.625rem 0.875rem',
                                        fontSize: '0.75rem', color: 'var(--primary-darker)',
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    }, children: (0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Demo:" }), " Store Admin: demo@pharmaflow.in / Password@123"] }) })] }), (0, jsx_runtime_1.jsxs)("div", { style: { marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [(0, jsx_runtime_1.jsx)("a", { href: "/register", style: { fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }, onClick: (e) => { e.preventDefault(); navigate('/register'); }, children: "Register New Company" }), (0, jsx_runtime_1.jsx)("a", { href: "/admin/login", style: { fontSize: '0.78rem', color: 'var(--text-muted)' }, onClick: (e) => { e.preventDefault(); navigate('/admin/login'); }, children: "Super Admin Portal \u2192" })] })] }) })] }));
}
