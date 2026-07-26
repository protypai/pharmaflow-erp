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
exports.default = Profile;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const uuid_1 = require("uuid");
function Profile() {
    const [activeTab, setActiveTab] = (0, react_1.useState)('company');
    const [company, setCompany] = (0, react_1.useState)({});
    const [user, setUser] = (0, react_1.useState)({});
    const [loading, setLoading] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const fetchProfile = async () => {
            try {
                const compRes = await window.pharmaAPI.db.query("SELECT * FROM companies LIMIT 1");
                if (compRes?.data?.length > 0) {
                    // Convert database snake_case or whatever format to camelCase if needed, but since we are inserting directly, we map carefully.
                    const c = compRes.data[0];
                    setCompany({
                        id: c.id,
                        name: c.name || '',
                        short_name: c.short_name || '',
                        est_year: c.est_year || '',
                        authorized_sign: c.authorized_sign || '',
                        address: c.address || '',
                        city: c.city || '',
                        pincode: c.pincode || '',
                        state: c.state || 'MH',
                        state_code: c.state_code || '27',
                        gstin: c.gstin || '',
                        pan: c.pan || '',
                        drug_license_20b: c.drug_license_20b || '',
                        drug_license_21b: c.drug_license_21b || '',
                        fssai_license: c.fssai_license || '',
                        bank_name: c.bank_name || '',
                        bank_account: c.bank_account || '',
                        bank_ifsc: c.bank_ifsc || '',
                        upi_id: c.upi_id || ''
                    });
                }
                const userRes = await window.pharmaAPI.db.query("SELECT * FROM users LIMIT 1");
                if (userRes?.data?.length > 0) {
                    const u = userRes.data[0];
                    setUser({
                        id: u.id,
                        company_id: u.company_id,
                        name: u.name || '',
                        email: u.email || '',
                        role: u.role || 'admin'
                    });
                }
            }
            catch (err) {
                console.error("Failed to load profile data", err);
            }
        };
        fetchProfile();
    }, []);
    const handleCompanyChange = (e) => {
        setCompany({ ...company, [e.target.name]: e.target.value });
    };
    const handleUserChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };
    const handleSave = async () => {
        setLoading(true);
        try {
            // 1. Update SQLite companies table
            const sql = `
        UPDATE companies SET 
          name = ?, short_name = ?, est_year = ?, authorized_sign = ?, 
          address = ?, city = ?, pincode = ?, state = ?, state_code = ?,
          gstin = ?, pan = ?, drug_license_20b = ?, drug_license_21b = ?, 
          fssai_license = ?, bank_name = ?, bank_account = ?, bank_ifsc = ?, upi_id = ?
        WHERE id = ?
      `;
            const params = [
                company.name, company.short_name, company.est_year, company.authorized_sign,
                company.address, company.city, company.pincode, company.state, company.state_code,
                company.gstin, company.pan, company.drug_license_20b, company.drug_license_21b,
                company.fssai_license, company.bank_name, company.bank_account, company.bank_ifsc, company.upi_id,
                company.id
            ];
            await window.pharmaAPI.db.run(sql, params);
            // 2. Add to sync queue to upload to cloud
            // Map back to camelCase for the cloud schema Prisma expects
            const cloudPayload = JSON.stringify({
                id: company.id,
                name: company.name,
                shortName: company.short_name,
                estYear: company.est_year ? parseInt(company.est_year) : null,
                authorizedSign: company.authorized_sign,
                address: company.address,
                city: company.city,
                pincode: company.pincode,
                state: company.state,
                stateCode: company.state_code,
                gstin: company.gstin,
                pan: company.pan,
                drugLicense20B: company.drug_license_20b,
                drugLicense21B: company.drug_license_21b,
                fssaiLicense: company.fssai_license,
                bankName: company.bank_name,
                bankAccount: company.bank_account,
                bankIfsc: company.bank_ifsc,
                upiId: company.upi_id
            });
            const syncSql = `
        INSERT INTO sync_queue (id, table_name, operation, payload, is_synced, app_version)
        VALUES (?, 'Company', 'update', ?, 0, ?)
      `;
            const currentVersion = import.meta.env.VITE_APP_VERSION || 'v1.0.30';
            await window.pharmaAPI.db.run(syncSql, [(0, uuid_1.v4)(), cloudPayload, currentVersion]);
            // Update User if needed
            await window.pharmaAPI.db.run(`UPDATE users SET name = ? WHERE id = ?`, [user.name, user.id]);
            const userPayload = JSON.stringify({
                id: user.id,
                name: user.name
            });
            await window.pharmaAPI.db.run(syncSql.replace('Company', 'User'), [(0, uuid_1.v4)(), userPayload, currentVersion]);
            alert('Profile updated and synced successfully!');
        }
        catch (err) {
            console.error('Failed to save profile', err);
            alert('Failed to save profile. Please check console for details.');
        }
        finally {
            setLoading(false);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "page-header", style: { marginBottom: 0 }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "page-title", children: "Company Profile" }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", children: "Manage legal, tax, and bank details" })] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-primary", onClick: handleSave, disabled: loading, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Save, { size: 16 }), " ", loading ? 'Saving...' : 'Save Changes'] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '1.5rem', flex: 1, overflow: 'hidden' }, children: [(0, jsx_runtime_1.jsx)("div", { className: "card", style: { width: '250px', padding: '1rem' }, children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: `btn ${activeTab === 'company' ? 'btn-primary' : 'btn-ghost'}`, style: { justifyContent: 'flex-start' }, onClick: () => setActiveTab('company'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Building2, { size: 16 }), " Basic Info"] }), (0, jsx_runtime_1.jsxs)("button", { className: `btn ${activeTab === 'legal' ? 'btn-primary' : 'btn-ghost'}`, style: { justifyContent: 'flex-start' }, onClick: () => setActiveTab('legal'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShieldCheck, { size: 16 }), " Licenses & Tax"] }), (0, jsx_runtime_1.jsxs)("button", { className: `btn ${activeTab === 'bank' ? 'btn-primary' : 'btn-ghost'}`, style: { justifyContent: 'flex-start' }, onClick: () => setActiveTab('bank'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Banknote, { size: 16 }), " Bank Details"] }), (0, jsx_runtime_1.jsxs)("button", { className: `btn ${activeTab === 'user' ? 'btn-primary' : 'btn-ghost'}`, style: { justifyContent: 'flex-start' }, onClick: () => setActiveTab('user'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.User, { size: 16 }), " My Account"] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "card", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("div", { className: "card-body", children: [activeTab === 'company' && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h3", { style: { fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Building2, { size: 18, color: "var(--primary)" }), " Company Information"] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-row-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Legal Company Name ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", name: "name", value: company.name || '', onChange: handleCompanyChange })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Trade Name (DBA)" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", name: "short_name", value: company.short_name || '', onChange: handleCompanyChange })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Year of Establishment" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: "number", name: "est_year", value: company.est_year || '', onChange: handleCompanyChange })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Authorized Signatory" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", name: "authorized_sign", value: company.authorized_sign || '', onChange: handleCompanyChange })] })] }), (0, jsx_runtime_1.jsx)("h4", { style: { fontSize: '0.9rem', fontWeight: 600, margin: '1.5rem 0 1rem 0', color: 'var(--text-secondary)' }, children: "Registered Address" }), (0, jsx_runtime_1.jsxs)("div", { className: "form-row-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", style: { gridColumn: 'span 2' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Address Line 1" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", name: "address", value: company.address || '', onChange: handleCompanyChange })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "City" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", name: "city", value: company.city || '', onChange: handleCompanyChange })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Pincode" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", name: "pincode", value: company.pincode || '', onChange: handleCompanyChange })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "State" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", name: "state", value: company.state || 'MH', onChange: handleCompanyChange, children: [(0, jsx_runtime_1.jsx)("option", { value: "MH", children: "Maharashtra" }), (0, jsx_runtime_1.jsx)("option", { value: "GJ", children: "Gujarat" }), (0, jsx_runtime_1.jsx)("option", { value: "DL", children: "Delhi" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "State Code (GST)" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", name: "state_code", value: company.state_code || '', onChange: handleCompanyChange })] })] })] })), activeTab === 'legal' && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h3", { style: { fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShieldCheck, { size: 18, color: "var(--primary)" }), " Licenses & Registration"] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-row-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["GSTIN ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", name: "gstin", value: company.gstin || '', onChange: handleCompanyChange, maxLength: 15, style: { textTransform: 'uppercase' } })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "PAN Number" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", name: "pan", value: company.pan || '', onChange: handleCompanyChange, maxLength: 10, style: { textTransform: 'uppercase' } })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Drug License No. (Form 20B)" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", name: "drug_license_20b", value: company.drug_license_20b || '', onChange: handleCompanyChange })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Drug License No. (Form 21B)" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", name: "drug_license_21b", value: company.drug_license_21b || '', onChange: handleCompanyChange })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "FSSAI License No" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", name: "fssai_license", value: company.fssai_license || '', onChange: handleCompanyChange })] })] })] })), activeTab === 'bank' && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h3", { style: { fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Banknote, { size: 18, color: "var(--primary)" }), " Bank Account Details"] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-row-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Bank Name" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", name: "bank_name", value: company.bank_name || '', onChange: handleCompanyChange })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Account Number" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", name: "bank_account", value: company.bank_account || '', onChange: handleCompanyChange })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "IFSC Code" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", name: "bank_ifsc", value: company.bank_ifsc || '', onChange: handleCompanyChange })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "UPI ID" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", name: "upi_id", value: company.upi_id || '', onChange: handleCompanyChange })] })] })] })), activeTab === 'user' && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h3", { style: { fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.User, { size: 18, color: "var(--primary)" }), " My Account"] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-row-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Full Name" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", name: "name", value: user.name || '', onChange: handleUserChange })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Email Address" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", type: "email", name: "email", value: user.email || '', disabled: true })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Role" }), (0, jsx_runtime_1.jsx)("input", { className: "form-input", value: user.role || 'Administrator', disabled: true })] })] })] }))] }) })] })] }));
}
