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
exports.default = GSTReport;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
function GSTReport() {
    const [reportType, setReportType] = (0, react_1.useState)('gstr3b');
    const [period, setPeriod] = (0, react_1.useState)('july_2025');
    const [gstSummary, setGstSummary] = (0, react_1.useState)({
        salesValue: 0, purchaseValue: 0,
        outputCGST: 0, outputSGST: 0, outputIGST: 0,
        inputCGST: 0, inputSGST: 0, inputIGST: 0,
    });
    (0, react_1.useEffect)(() => {
        const fetchGST = async () => {
            try {
                const salesRes = await window.pharmaAPI.db.query("SELECT SUM(subtotal) as salesValue, SUM(cgst_amount) as outputCGST, SUM(sgst_amount) as outputSGST, SUM(igst_amount) as outputIGST FROM sales");
                const purchRes = await window.pharmaAPI.db.query("SELECT SUM(subtotal) as purchaseValue, SUM(cgst_amount) as inputCGST, SUM(sgst_amount) as inputSGST, SUM(igst_amount) as inputIGST FROM purchases");
                const s = salesRes?.data?.[0] || {};
                const p = purchRes?.data?.[0] || {};
                setGstSummary({
                    salesValue: s.salesValue || 0,
                    outputCGST: s.outputCGST || 0,
                    outputSGST: s.outputSGST || 0,
                    outputIGST: s.outputIGST || 0,
                    purchaseValue: p.purchaseValue || 0,
                    inputCGST: p.inputCGST || 0,
                    inputSGST: p.inputSGST || 0,
                    inputIGST: p.inputIGST || 0,
                });
            }
            catch (err) {
                console.error("Failed to fetch GST data:", err);
            }
        };
        fetchGST();
    }, [period]);
    const totalOutput = (gstSummary.outputCGST || 0) + (gstSummary.outputSGST || 0) + (gstSummary.outputIGST || 0);
    const totalInput = (gstSummary.inputCGST || 0) + (gstSummary.inputSGST || 0) + (gstSummary.inputIGST || 0);
    const netPayable = totalOutput - totalInput;
    // Mock HSN wise breakdown
    const hsnData = [
        { hsn: '3004 (Medicines)', slab: '12%', taxable: 150000, cgst: 9000, sgst: 9000, igst: 0, total: 18000 },
        { hsn: '3005 (Bandages)', slab: '5%', taxable: 45000, cgst: 1125, sgst: 1125, igst: 0, total: 2250 },
        { hsn: '3304 (Cosmetics)', slab: '18%', taxable: 20000, cgst: 1800, sgst: 1800, igst: 1500, total: 5100 },
        { hsn: '9018 (Instruments)', slab: '12%', taxable: 30000, cgst: 575, sgst: 575, igst: 1000, total: 2150 }
    ];
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card", style: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", style: { background: '#F0FDF4', borderBottom: '1px solid #BBF7D0' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h2", { className: "card-title", style: { color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { size: 20 }), " GST Compliance Report"] }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", style: { color: '#15803D' }, children: "Generate GSTR-1, GSTR-2, and GSTR-3B summaries for CA filing" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", style: { borderColor: '#166534', color: '#166534' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { size: 16 }), " Print Return"] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-primary", style: { background: '#166534' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { size: 16 }), " Export JSON for Portal"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "filter-bar", style: { display: 'flex', gap: '1rem', alignItems: 'flex-end', background: '#F8FAFC' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { width: '250px' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Return Type" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: reportType, onChange: e => setReportType(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "gstr1", children: "GSTR-1 (Outward / Sales)" }), (0, jsx_runtime_1.jsx)("option", { value: "gstr2", children: "GSTR-2 (Inward / Purchases)" }), (0, jsx_runtime_1.jsx)("option", { value: "gstr3b", children: "GSTR-3B (Summary)" }), (0, jsx_runtime_1.jsx)("option", { value: "hsn", children: "HSN Wise Summary" })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { width: '200px' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Filing Period" }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: period, onChange: e => setPeriod(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "july_2025", children: "July 2025" }), (0, jsx_runtime_1.jsx)("option", { value: "june_2025", children: "June 2025" }), (0, jsx_runtime_1.jsx)("option", { value: "q1_2025", children: "Q1 (Apr-Jun 2025)" })] })] }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-outline", style: { padding: '0.5rem 1.5rem' }, children: "Refresh" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: [reportType === 'gstr3b' && ((0, jsx_runtime_1.jsxs)("div", { style: { padding: '1.5rem' }, children: [(0, jsx_runtime_1.jsx)("h3", { style: { fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }, children: "3.1 Details of Outward Supplies and inward supplies liable to reverse charge" }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '1.5rem', marginBottom: '2rem' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, padding: '1.5rem', background: '#FEF2F2', border: '1px solid #FECACA' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }, children: [(0, jsx_runtime_1.jsx)("span", { style: { fontWeight: 600, color: '#991B1B' }, children: "Output Tax (Tax Collected on Sales)" }), (0, jsx_runtime_1.jsxs)("span", { style: { fontWeight: 700, fontSize: '1.2rem', color: '#B91C1C' }, children: ["\u20B9 ", totalOutput.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#7F1D1D', marginBottom: '0.25rem' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "CGST:" }), " ", (0, jsx_runtime_1.jsxs)("span", { children: ["\u20B9 ", gstSummary.outputCGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#7F1D1D', marginBottom: '0.25rem' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "SGST:" }), " ", (0, jsx_runtime_1.jsxs)("span", { children: ["\u20B9 ", gstSummary.outputSGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#7F1D1D' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "IGST:" }), " ", (0, jsx_runtime_1.jsxs)("span", { children: ["\u20B9 ", gstSummary.outputIGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, padding: '1.5rem', background: '#ECFDF5', border: '1px solid #A7F3D0' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }, children: [(0, jsx_runtime_1.jsx)("span", { style: { fontWeight: 600, color: '#065F46' }, children: "Input Tax Credit (ITC Available)" }), (0, jsx_runtime_1.jsxs)("span", { style: { fontWeight: 700, fontSize: '1.2rem', color: '#047857' }, children: ["\u20B9 ", totalInput.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#064E3B', marginBottom: '0.25rem' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "CGST:" }), " ", (0, jsx_runtime_1.jsxs)("span", { children: ["\u20B9 ", gstSummary.inputCGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#064E3B', marginBottom: '0.25rem' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "SGST:" }), " ", (0, jsx_runtime_1.jsxs)("span", { children: ["\u20B9 ", gstSummary.inputSGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#064E3B' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "IGST:" }), " ", (0, jsx_runtime_1.jsxs)("span", { children: ["\u20B9 ", gstSummary.inputIGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { padding: '1.5rem', background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { style: { margin: 0, color: '#1E40AF' }, children: "Net Tax Payable in Cash" }), (0, jsx_runtime_1.jsx)("p", { style: { margin: 0, fontSize: '0.9rem', color: '#1E3A8A', marginTop: '0.25rem' }, children: "Output Tax minus Input Tax Credit (ITC)" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '2rem', fontWeight: 800, color: '#1D4ED8' }, children: ["\u20B9 ", netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { marginTop: '1.5rem', display: 'flex', gap: '0.5rem', color: '#B45309', background: '#FEF3C7', padding: '1rem', borderRadius: 'var(--radius)' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { size: 20 }), (0, jsx_runtime_1.jsx)("span", { style: { fontSize: '0.9rem' }, children: "Please verify all purchase invoices are uploaded by suppliers in GSTR-2B to claim full ITC." })] })] })), reportType === 'hsn' && ((0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "HSN Code & Description" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'center' }, children: "Tax Slab" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Total Taxable Value (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Central Tax (CGST)" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "State Tax (SGST)" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Integrated Tax (IGST)" }), (0, jsx_runtime_1.jsx)("th", { style: { textAlign: 'right' }, children: "Total Tax Amount" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: hsnData.map((row, i) => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 600 }, children: row.hsn }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'center', fontWeight: 500 }, children: row.slab }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right' }, children: row.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right' }, children: row.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right' }, children: row.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right' }, children: row.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }), (0, jsx_runtime_1.jsx)("td", { style: { textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }, children: row.total.toLocaleString('en-IN', { minimumFractionDigits: 2 }) })] }, i))) })] })), (reportType === 'gstr1' || reportType === 'gstr2') && ((0, jsx_runtime_1.jsxs)("div", { style: { padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { size: 48, style: { opacity: 0.2, marginBottom: '1rem' } }), (0, jsx_runtime_1.jsx)("h3", { children: "B2B Invoice Details Ready" }), (0, jsx_runtime_1.jsx)("p", { children: "Select 'Export JSON for Portal' to download the Gov Offline Utility compatible file." })] }))] })] }));
}
