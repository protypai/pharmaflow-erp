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
exports.default = Register;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const lucide_react_1 = require("lucide-react");
const api_1 = require("../../config/api");
function Register() {
    const [formData, setFormData] = (0, react_1.useState)({
        companyName: '',
        shortName: '',
        name: '',
        email: '',
        password: '',
        phone: '',
        city: '',
        state: '',
        gstin: '',
    });
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    const [successMsg, setSuccessMsg] = (0, react_1.useState)('');
    const navigate = (0, react_router_dom_1.useNavigate)();
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        if (!formData.companyName || !formData.name || !formData.email || !formData.password) {
            setError('Please fill in all required fields (Company Name, Full Name, Email, Password).');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${api_1.API_BASE_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setSuccessMsg('Registration submitted! Your account is now pending Super Admin approval.');
            }
            else {
                setError(data.message || 'Registration failed.');
            }
        }
        catch (err) {
            console.error('Registration API error:', err);
            setError('Unable to connect to Cloud Backend. Please ensure backend is running.');
        }
        finally {
            setLoading(false);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { style: {
            minHeight: '100vh',
            display: 'flex',
            background: 'linear-gradient(135deg, #F0F7FF 0%, #EFF6FF 40%, #F1F5F9 100%)',
        }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    background: 'var(--sidebar-bg)',
                    position: 'relative',
                    overflow: 'hidden',
                }, children: (0, jsx_runtime_1.jsxs)("div", { style: { position: 'relative', zIndex: 1, maxWidth: 420, width: '100%' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                                        width: 52, height: 52,
                                        background: 'var(--primary)',
                                        borderRadius: 14,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
                                    }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Pill, { size: 26, color: "white" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '1.5rem', fontWeight: 800, color: 'white', lineHeight: 1.1 }, children: "Pharma ERP" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: 'var(--sidebar-text)', marginTop: 2 }, children: "Company Registration" })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '2rem' }, children: [(0, jsx_runtime_1.jsxs)("h1", { style: { color: 'white', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.2 }, children: ["Get Started with", (0, jsx_runtime_1.jsx)("br", {}), "PharmaFlow ERP"] }), (0, jsx_runtime_1.jsx)("p", { style: { color: 'var(--sidebar-text)', fontSize: '0.9rem', lineHeight: 1.6 }, children: "Register your pharmacy or distribution company. Super Admin will review and approve your account." })] })] }) }), (0, jsx_runtime_1.jsx)("div", { style: {
                    width: '520px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    background: 'white',
                    boxShadow: '-8px 0 40px rgba(0,0,0,0.06)',
                    overflowY: 'auto',
                }, children: (0, jsx_runtime_1.jsxs)("div", { style: { width: '100%', maxWidth: 420 }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '1.5rem' }, children: [(0, jsx_runtime_1.jsx)("h2", { style: { fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }, children: "Create an Account" }), (0, jsx_runtime_1.jsx)("p", { style: { fontSize: '0.85rem', color: 'var(--text-secondary)' }, children: "Fill in your details to submit an approval request" })] }), successMsg ? ((0, jsx_runtime_1.jsxs)("div", { style: {
                                background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px',
                                padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column',
                                alignItems: 'center', gap: '0.75rem'
                            }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { size: 40, color: "#16A34A" }), (0, jsx_runtime_1.jsx)("h3", { style: { fontSize: '1.1rem', fontWeight: 700, color: '#15803D' }, children: "Registration Submitted" }), (0, jsx_runtime_1.jsx)("p", { style: { fontSize: '0.85rem', color: '#166534', lineHeight: 1.5 }, children: successMsg }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-primary", onClick: () => navigate('/login'), style: { marginTop: '0.5rem' }, children: "Return to Sign In" })] })) : ((0, jsx_runtime_1.jsxs)("form", { onSubmit: handleRegister, style: { display: 'flex', flexDirection: 'column', gap: '0.875rem' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Company Name *" }), (0, jsx_runtime_1.jsxs)("div", { className: "input-wrapper", children: [(0, jsx_runtime_1.jsx)("span", { className: "input-icon", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Building, { size: 15 }) }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: "text", name: "companyName", placeholder: "e.g. Apex Pharma Distributors", value: formData.companyName, onChange: handleChange, required: true })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.75rem' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Short Name" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: "text", name: "shortName", placeholder: "e.g. Apex Pharma", value: formData.shortName, onChange: handleChange })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "GSTIN" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: "text", name: "gstin", placeholder: "27AAAAA0000A1Z5", value: formData.gstin, onChange: handleChange })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Full Name *" }), (0, jsx_runtime_1.jsxs)("div", { className: "input-wrapper", children: [(0, jsx_runtime_1.jsx)("span", { className: "input-icon", children: (0, jsx_runtime_1.jsx)(lucide_react_1.User, { size: 15 }) }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: "text", name: "name", placeholder: "Your Full Name", value: formData.name, onChange: handleChange, required: true })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Email Address *" }), (0, jsx_runtime_1.jsxs)("div", { className: "input-wrapper", children: [(0, jsx_runtime_1.jsx)("span", { className: "input-icon", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { size: 15 }) }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: "email", name: "email", placeholder: "admin@yourpharmacy.com", value: formData.email, onChange: handleChange, required: true })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Password *" }), (0, jsx_runtime_1.jsxs)("div", { className: "input-wrapper", children: [(0, jsx_runtime_1.jsx)("span", { className: "input-icon", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Lock, { size: 15 }) }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: "password", name: "password", placeholder: "Create a strong password", value: formData.password, onChange: handleChange, required: true })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.75rem' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Phone" }), (0, jsx_runtime_1.jsxs)("div", { className: "input-wrapper", children: [(0, jsx_runtime_1.jsx)("span", { className: "input-icon", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Phone, { size: 15 }) }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: "text", name: "phone", placeholder: "9876543210", value: formData.phone, onChange: handleChange })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "City" }), (0, jsx_runtime_1.jsxs)("div", { className: "input-wrapper", children: [(0, jsx_runtime_1.jsx)("span", { className: "input-icon", children: (0, jsx_runtime_1.jsx)(lucide_react_1.MapPin, { size: 15 }) }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: "text", name: "city", placeholder: "City", value: formData.city, onChange: handleChange })] })] })] }), error && ((0, jsx_runtime_1.jsx)("div", { style: {
                                        background: 'var(--danger-light)', border: '1px solid #FECACA',
                                        borderRadius: 'var(--radius-sm)', padding: '0.625rem 0.875rem',
                                        fontSize: '0.8rem', color: 'var(--danger)',
                                    }, children: error })), (0, jsx_runtime_1.jsx)("button", { type: "submit", className: "btn btn-primary btn-lg", disabled: loading, style: { width: '100%', justifyContent: 'center', marginTop: '0.5rem' }, children: loading ? 'Submitting Registration...' : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: ["Submit for Approval ", (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { size: 16 })] })) }), (0, jsx_runtime_1.jsx)("div", { style: { marginTop: '1rem', textAlign: 'center' }, children: (0, jsx_runtime_1.jsx)("a", { href: "/login", style: { fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }, onClick: (e) => { e.preventDefault(); navigate('/login'); }, children: "Already registered? Sign In \u2192" }) })] }))] }) })] }));
}
