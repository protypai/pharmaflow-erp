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
exports.default = Settings;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
function Settings() {
    const [activeTab, setActiveTab] = (0, react_1.useState)('invoicing');
    const [appVersion, setAppVersion] = (0, react_1.useState)('1.0.18');
    const [checking, setChecking] = (0, react_1.useState)(false);
    const [updateStatus, setUpdateStatus] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        if (window.pharmaAPI && window.pharmaAPI.app) {
            window.pharmaAPI.app.getVersion()
                .then(ver => setAppVersion(ver))
                .catch(err => console.error('Failed to get app version:', err));
        }
    }, []);
    const handleCheckForUpdates = async () => {
        if (!window.pharmaAPI || !window.pharmaAPI.update) {
            alert('Update service not available in development server browser context.');
            return;
        }
        setChecking(true);
        setUpdateStatus('Checking for updates...');
        try {
            const result = await window.pharmaAPI.update.check();
            if (result && result.success) {
                setUpdateStatus('Checking finished.');
                // The update handler will trigger the global update prompt if update is found.
            }
            else {
                setUpdateStatus(result.error || 'Failed to check for updates.');
            }
        }
        catch (err) {
            setUpdateStatus('Error checking for updates.');
        }
        finally {
            setChecking(false);
            setTimeout(() => setUpdateStatus(''), 5000);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "page-header", style: { marginBottom: 0 }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "page-title", children: "System Settings" }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", children: "Configure billing rules and application preferences" })] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-primary", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Save, { size: 16 }), " Save Configuration"] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '1.5rem', flex: 1, overflow: 'hidden' }, children: [(0, jsx_runtime_1.jsx)("div", { className: "card", style: { width: '250px', padding: '1rem' }, children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: `btn ${activeTab === 'invoicing' ? 'btn-primary' : 'btn-ghost'}`, style: { justifyContent: 'flex-start' }, onClick: () => setActiveTab('invoicing'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { size: 16 }), " Invoicing Details"] }), (0, jsx_runtime_1.jsxs)("button", { className: `btn ${activeTab === 'rules' ? 'btn-primary' : 'btn-ghost'}`, style: { justifyContent: 'flex-start' }, onClick: () => setActiveTab('rules'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckSquare, { size: 16 }), " Inventory Rules"] }), (0, jsx_runtime_1.jsxs)("button", { className: `btn ${activeTab === 'system' ? 'btn-primary' : 'btn-ghost'}`, style: { justifyContent: 'flex-start' }, onClick: () => setActiveTab('system'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Settings, { size: 16 }), " System & Theme"] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "card", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("div", { className: "card-body", children: [activeTab === 'invoicing' && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h3", { style: { fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { size: 18, color: "var(--primary)" }), " Billing & Invoice Formatting"] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-row-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Invoice Prefix" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", defaultValue: "INV/25-26/" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Next Invoice Number" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: "number", defaultValue: "42" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Print Format" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", defaultValue: "A4", children: [(0, jsx_runtime_1.jsx)("option", { value: "A4", children: "A4 Full Page" }), (0, jsx_runtime_1.jsx)("option", { value: "A5", children: "A5 Half Page" }), (0, jsx_runtime_1.jsx)("option", { value: "Thermal", children: "Thermal 80mm" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Number of Print Copies" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", defaultValue: "2", children: [(0, jsx_runtime_1.jsx)("option", { value: "1", children: "1 (Original)" }), (0, jsx_runtime_1.jsx)("option", { value: "2", children: "2 (Original + Duplicate)" }), (0, jsx_runtime_1.jsx)("option", { value: "3", children: "3 (Original + Duplicate + Transport)" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", style: { gridColumn: 'span 2' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Terms and Conditions (Printed on Invoice)" }), (0, jsx_runtime_1.jsx)("textarea", { className: "form-input", rows: 4, defaultValue: "1. Goods once sold will not be taken back.\\n2. Interest @24% p.a. will be charged if payment is delayed beyond 30 days.\\n3. Subject to Mumbai Jurisdiction." })] })] })] })), activeTab === 'rules' && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h3", { style: { fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckSquare, { size: 18, color: "var(--primary)" }), " Inventory & Sales Rules"] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem' }, children: [(0, jsx_runtime_1.jsxs)("label", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", style: { width: '18px', height: '18px' } }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 600 }, children: "Allow Negative Stock Billing" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: 'var(--text-secondary)' }, children: "Allow creating sales invoices even if system stock is zero (fixes physical vs system mismatch instantly)." })] })] }), (0, jsx_runtime_1.jsxs)("label", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", defaultChecked: true, style: { width: '18px', height: '18px' } }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 600 }, children: "Warn on selling Near Expiry stock" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: 'var(--text-secondary)' }, children: "Show a warning popup if batch expires within 30 days." })] })] }), (0, jsx_runtime_1.jsxs)("label", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", defaultChecked: true, disabled: true, style: { width: '18px', height: '18px' } }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 600 }, children: "Block sale of Expired Medicines" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: 'var(--text-secondary)' }, children: "Legally mandatory. System will not allow adding expired batches to any sales invoice." })] })] }), (0, jsx_runtime_1.jsxs)("label", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", defaultChecked: true, style: { width: '18px', height: '18px' } }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 600 }, children: "Enforce FEFO (First Expire First Out)" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: 'var(--text-secondary)' }, children: "Automatically suggest the batch closest to expiry when generating sales." })] })] })] })] })), activeTab === 'system' && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h3", { style: { fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Settings, { size: 18, color: "var(--primary)" }), " System Utilities"] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-row-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Financial Year" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", defaultValue: "25-26", children: [(0, jsx_runtime_1.jsx)("option", { value: "25-26", children: "April 2025 - March 2026" }), (0, jsx_runtime_1.jsx)("option", { value: "24-25", children: "April 2024 - March 2025" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "UI Theme" }), (0, jsx_runtime_1.jsx)("select", { className: "form-select", defaultValue: "light", children: (0, jsx_runtime_1.jsx)("option", { value: "light", children: "Light Mode" }) }), (0, jsx_runtime_1.jsx)("span", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: "Dark mode restricted by admin." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Auto Backup Frequency" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", defaultValue: "daily", children: [(0, jsx_runtime_1.jsx)("option", { value: "daily", children: "Daily at 11:00 PM" }), (0, jsx_runtime_1.jsx)("option", { value: "close", children: "On Application Close" }), (0, jsx_runtime_1.jsx)("option", { value: "weekly", children: "Weekly" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }, children: [(0, jsx_runtime_1.jsx)("h4", { style: { fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }, children: "App Updates" }), (0, jsx_runtime_1.jsxs)("div", { style: {
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        background: 'var(--primary-50)',
                                                        border: '1px solid var(--primary-light)',
                                                        borderRadius: 'var(--radius-sm)',
                                                        padding: '1.25rem'
                                                    }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }, children: ["PharmaFlow ERP v", appVersion] }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', color: 'var(--text-secondary)' }, children: "Ensure you are running the latest version for updated GST compliance and security rules." }), updateStatus && ((0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.8rem', fontWeight: 500, color: 'var(--primary)', marginTop: '0.5rem' }, children: updateStatus }))] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-secondary", onClick: handleCheckForUpdates, disabled: checking, style: { display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { size: 14, className: checking ? 'spin' : '' }), checking ? 'Checking...' : 'Check for Updates'] })] })] })] }))] }) })] })] }));
}
