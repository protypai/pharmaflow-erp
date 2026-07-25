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
exports.default = Payments;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
function Payments() {
    const [suppliers, set_suppliers] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchData = async () => {
            const res_suppliers = await window.pharmaAPI.db.query("SELECT * FROM suppliers");
            set_suppliers(res_suppliers?.data || []);
        };
        fetchData();
    }, []);
    const [supplierId, setSupplierId] = (0, react_1.useState)('');
    const [amountPaid, setAmountPaid] = (0, react_1.useState)(0);
    const [payMode, setPayMode] = (0, react_1.useState)('bank');
    const [paymentDate, setPaymentDate] = (0, react_1.useState)(new Date().toISOString().split('T')[0]);
    const [chequeNo, setChequeNo] = (0, react_1.useState)('');
    const [utrNo, setUtrNo] = (0, react_1.useState)('');
    // Mock pending bills for a selected supplier
    const [bills, setBills] = (0, react_1.useState)([]);
    // State for total allocated
    const [allocatedTotal, setAllocatedTotal] = (0, react_1.useState)(0);
    (0, react_1.useEffect)(() => {
        const fetchPendingBills = async () => {
            if (supplierId) {
                const res = await window.pharmaAPI.db.query("SELECT * FROM purchases WHERE supplier_id = ? AND (net_amount - paid_amount) > 0 ORDER BY invoice_date ASC", [supplierId]);
                const dbBills = (res?.data || []).map(p => ({
                    id: p.invoice_no,
                    dbId: p.id,
                    date: p.invoice_date,
                    amount: p.net_amount,
                    pending: p.net_amount - p.paid_amount,
                    allocated: 0,
                    discount: 0
                }));
                setBills(dbBills);
            }
            else {
                setBills([]);
            }
        };
        fetchPendingBills();
    }, [supplierId]);
    (0, react_1.useEffect)(() => {
        const total = bills.reduce((sum, b) => sum + (Number(b.allocated) || 0) + (Number(b.discount) || 0), 0);
        setAllocatedTotal(total);
    }, [bills]);
    const updateBill = (id, field, value) => {
        setBills(bills.map(b => b.id === id ? { ...b, [field]: Number(value) } : b));
    };
    const autoAllocate = () => {
        let remaining = Number(amountPaid) || 0;
        const newBills = bills.map(b => {
            let allocated = 0;
            if (remaining > 0) {
                allocated = Math.min(b.pending, remaining);
                remaining -= allocated;
            }
            return { ...b, allocated };
        });
        setBills(newBills);
    };
    const handleSave = async () => {
        try {
            if (!supplierId)
                throw new Error("Please select a supplier.");
            if (!amountPaid || Number(amountPaid) <= 0)
                throw new Error("Amount must be greater than 0.");
            if (allocatedTotal > Number(amountPaid))
                throw new Error("Allocation exceeds paid amount!");
            const paymentNo = "PAY-" + Date.now().toString().slice(-6);
            await window.pharmaAPI.db.run(`INSERT INTO payments (
          id, company_id, payment_no, supplier_id, date, amount, payment_mode, cheque_no, utr_no
        ) VALUES (
          ?, 'COMP-DEMO-001', ?, ?, ?, ?, ?, ?, ?
        )`, [
                crypto.randomUUID(),
                paymentNo,
                supplierId,
                paymentDate,
                Number(amountPaid),
                payMode,
                chequeNo,
                utrNo
            ]);
            for (const b of bills) {
                if (b.allocated > 0 || b.discount > 0) {
                    await window.pharmaAPI.db.run("UPDATE purchases SET paid_amount = paid_amount + ? WHERE id = ?", [Number(b.allocated || 0) + Number(b.discount || 0), b.dbId]);
                }
            }
            setSupplierId('');
            setAmountPaid(0);
            setChequeNo('');
            setUtrNo('');
            setBills([]);
            alert(`Payment ${paymentNo} saved successfully!`);
        }
        catch (err) {
            alert(err.message || "Failed to save payment.");
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "page-header", style: { marginBottom: 0 }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "page-title", children: "Payments (Money Paid)" }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", children: "Issue payments to suppliers and adjust against pending purchase bills" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { size: 16 }), " Print Voucher"] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-primary", onClick: handleSave, disabled: allocatedTotal > (Number(amountPaid) || 0), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Save, { size: 16 }), " Save Payment"] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card", children: (0, jsx_runtime_1.jsx)("div", { className: "card-body", children: (0, jsx_runtime_1.jsxs)("div", { className: "form-row-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Supplier ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: supplierId, onChange: e => setSupplierId(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select Supplier..." }), suppliers.map(s => (0, jsx_runtime_1.jsx)("option", { value: s.id, children: s.name }, s.id))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Payment Date ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { type: "date", className: "form-input", value: paymentDate, onChange: e => setPaymentDate(e.target.value) })] }), (0, jsx_runtime_1.jsx)("div", { className: "form-group", style: { gridColumn: 'span 2' }, children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '1rem' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Total Amount Paid (\u20B9) ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "search-input-wrap", style: { width: '100%' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.IndianRupee, { size: 16, className: "search-icon", color: "var(--danger)" }), (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input", value: amountPaid || '', onChange: e => setAmountPaid(e.target.value), style: { fontWeight: 600, fontSize: '1.1rem' } })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Paid From (Ledger) ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: payMode, onChange: e => setPayMode(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "bank", children: "HDFC Bank Current A/c" }), (0, jsx_runtime_1.jsx)("option", { value: "sbi", children: "SBI Current A/c" }), (0, jsx_runtime_1.jsx)("option", { value: "cash", children: "Main Cash Book" })] })] })] }) }), payMode !== 'cash' && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Instrument / Cheque No." }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", placeholder: "e.g. 998877", value: chequeNo, onChange: e => setChequeNo(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Reference / UTR" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", placeholder: "e.g. HDFC000ABC", value: utrNo, onChange: e => setUtrNo(e.target.value) })] })] }))] }) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [(0, jsx_runtime_1.jsx)("h3", { className: "card-title", style: { fontSize: '1rem' }, children: "Pending Purchase Invoice Allocation" }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-outline btn-sm", onClick: autoAllocate, disabled: !supplierId || !amountPaid, children: "Auto Allocate (FIFO)" })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Invoice No" }), (0, jsx_runtime_1.jsx)("th", { children: "Date" }), (0, jsx_runtime_1.jsx)("th", { children: "Bill Amount (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { children: "Pending (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '150px' }, children: "Allocated (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '150px' }, children: "Cash Disc (\u20B9)" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: bills.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: "6", style: { textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }, children: "Select a supplier to view pending invoices" }) })) : bills.map((b) => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 500 }, children: b.id }), (0, jsx_runtime_1.jsx)("td", { children: b.date }), (0, jsx_runtime_1.jsx)("td", { children: b.amount.toLocaleString('en-IN') }), (0, jsx_runtime_1.jsx)("td", { style: { color: 'var(--danger)', fontWeight: 600 }, children: b.pending.toLocaleString('en-IN') }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", max: b.pending, value: b.allocated || '', onChange: e => updateBill(b.id, 'allocated', e.target.value) }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", max: b.pending - b.allocated, value: b.discount || '', onChange: e => updateBill(b.id, 'discount', e.target.value) }) })] }, b.id))) })] }) }), (0, jsx_runtime_1.jsx)("div", { style: { padding: '1rem', borderTop: '1px solid var(--border)', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end' }, children: (0, jsx_runtime_1.jsxs)("div", { style: { width: '300px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Paid Amount:" }), " ", (0, jsx_runtime_1.jsxs)("span", { children: ["\u20B9 ", Number(amountPaid || 0).toLocaleString('en-IN')] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Total Allocated:" }), " ", (0, jsx_runtime_1.jsxs)("span", { children: ["- \u20B9 ", allocatedTotal.toLocaleString('en-IN')] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 600, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', color: (Number(amountPaid) - allocatedTotal) < 0 ? 'var(--danger)' : 'var(--primary)' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Unallocated (Advance):" }), " ", (0, jsx_runtime_1.jsxs)("span", { children: ["\u20B9 ", (Number(amountPaid) - allocatedTotal).toLocaleString('en-IN')] })] }), allocatedTotal > (Number(amountPaid) || 0) && ((0, jsx_runtime_1.jsx)("div", { style: { color: 'var(--danger)', fontSize: '0.8rem', textAlign: 'right' }, children: "Allocation exceeds paid amount!" }))] }) })] })] }));
}
