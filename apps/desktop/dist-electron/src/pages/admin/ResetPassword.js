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
exports.default = ResetPassword;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const mockData_1 = require("../../data/mockData");
function ResetPassword() {
    const [companyId, setCompanyId] = (0, react_1.useState)('');
    const [newPassword, setNewPassword] = (0, react_1.useState)('');
    const [confirmPassword, setConfirmPassword] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [success, setSuccess] = (0, react_1.useState)(false);
    const handleSubmit = (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("Passwords don't match");
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setSuccess(true);
            setNewPassword('');
            setConfirmPassword('');
            setCompanyId('');
            setTimeout(() => setSuccess(false), 3000);
        }, 1000);
    };
    return ((0, jsx_runtime_1.jsx)("div", { style: { maxWidth: '560px', margin: '0 auto', paddingTop: '2rem' }, children: (0, jsx_runtime_1.jsxs)("div", { className: "card", children: [(0, jsx_runtime_1.jsx)("div", { className: "card-header", style: { borderBottom: '1px solid var(--border)', background: '#FAFAFA' }, children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { padding: '0.5rem', background: 'var(--purple-light)', color: 'var(--purple)', borderRadius: '8px' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Key, { size: 20 }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "card-title", style: { fontSize: '1.1rem' }, children: "Force Password Reset" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: 'var(--text-secondary)' }, children: "Reset admin password for any client company" })] })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "card-body", children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.75rem', padding: '1rem', background: 'var(--warning-light)', color: 'var(--warning-dark)', borderRadius: 'var(--radius)', marginBottom: '1.5rem', fontSize: '0.82rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShieldAlert, { size: 20, style: { flexShrink: 0 } }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Security Warning:" }), " Forcing a password reset will immediately invalidate all active sessions for the selected company. Ensure you have verified the identity of the requester."] })] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, style: { display: 'flex', flexDirection: 'column', gap: '1.25rem' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Select Company ", (0, jsx_runtime_1.jsx)("span", { className: "required", children: "*" })] }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: companyId, onChange: e => setCompanyId(e.target.value), required: true, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "-- Choose a company --" }), mockData_1.adminCompanies.map(c => ((0, jsx_runtime_1.jsxs)("option", { value: c.id, children: [c.name, " (", c.city, ")"] }, c.id)))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["New Password ", (0, jsx_runtime_1.jsx)("span", { className: "required", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { type: "password", className: "form-input", placeholder: "Enter new strong password", value: newPassword, onChange: e => setNewPassword(e.target.value), required: true, minLength: 8 }), (0, jsx_runtime_1.jsx)("div", { className: "form-hint", children: "Minimum 8 characters, include numbers and symbols." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Confirm New Password ", (0, jsx_runtime_1.jsx)("span", { className: "required", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { type: "password", className: "form-input", placeholder: "Confirm password", value: confirmPassword, onChange: e => setConfirmPassword(e.target.value), required: true })] }), success && ((0, jsx_runtime_1.jsx)("div", { style: { padding: '0.75rem', background: 'var(--success-light)', color: 'var(--success-dark)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', textAlign: 'center', fontWeight: 500 }, children: "Password successfully reset and temporary credentials generated." })), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }, children: [(0, jsx_runtime_1.jsx)("button", { type: "button", className: "btn btn-secondary", onClick: () => { setCompanyId(''); setNewPassword(''); setConfirmPassword(''); }, children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { type: "submit", className: "btn btn-primary", style: { background: 'var(--purple)', borderColor: 'var(--purple)' }, disabled: loading, children: loading ? 'Processing...' : 'Reset Password' })] })] })] })] }) }));
}
