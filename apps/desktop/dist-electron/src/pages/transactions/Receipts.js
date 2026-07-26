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
exports.default = Receipts;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const dataService_1 = require("../../services/dataService");
function Receipts() {
    const [customers, set_customers] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchData = async () => {
            const res_customers = await window.pharmaAPI.db.query("SELECT * FROM customers");
            set_customers(res_customers?.data || []);
        };
        fetchData();
    }, []);
    const [customerId, setCustomerId] = (0, react_1.useState)('');
    const [amountReceived, setAmountReceived] = (0, react_1.useState)(0);
    const [payMode, setPayMode] = (0, react_1.useState)('bank');
    const [receiptDate, setReceiptDate] = (0, react_1.useState)(new Date().toISOString().split('T')[0]);
    const [chequeNo, setChequeNo] = (0, react_1.useState)('');
    const [bankName, setBankName] = (0, react_1.useState)('');
    // Mock pending bills for a selected customer
    const [bills, setBills] = (0, react_1.useState)([]);
    // State for total allocated
    const [allocatedTotal, setAllocatedTotal] = (0, react_1.useState)(0);
    (0, react_1.useEffect)(() => {
        const fetchPendingBills = async () => {
            if (customerId) {
                const res = await window.pharmaAPI.db.query("SELECT * FROM sales WHERE customer_id = ? AND (net_amount - paid_amount) > 0 ORDER BY date ASC", [customerId]);
                const dbBills = (res?.data || []).map(s => ({
                    id: s.invoice_no,
                    dbId: s.id,
                    date: s.date,
                    amount: s.net_amount,
                    pending: s.net_amount - s.paid_amount,
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
    }, [customerId]);
    (0, react_1.useEffect)(() => {
        const total = bills.reduce((sum, b) => sum + (Number(b.allocated) || 0) + (Number(b.discount) || 0), 0);
        setAllocatedTotal(total);
    }, [bills]);
    const updateBill = (id, field, value) => {
        setBills(bills.map(b => b.id === id ? { ...b, [field]: Number(value) } : b));
    };
    const autoAllocate = () => {
        let remaining = Number(amountReceived) || 0;
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
            if (!customerId)
                throw new Error("Please select a customer.");
            if (!amountReceived || Number(amountReceived) <= 0)
                throw new Error("Amount must be greater than 0.");
            if (allocatedTotal > Number(amountReceived))
                throw new Error("Allocation exceeds received amount!");
            const receiptNo = "REC-" + Date.now().toString().slice(-6);
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userRes = await window.pharmaAPI.db.query("SELECT company_id FROM users WHERE email = ?", [user.email]);
            if (!userRes?.data?.length)
                throw new Error("Admin user not found in local DB");
            const companyId = userRes.data[0].company_id;
            const receiptId = crypto.randomUUID();
            await window.pharmaAPI.db.run(`INSERT INTO receipts (
          id, company_id, receipt_no, customer_id, date, amount, payment_mode, cheque_no, bank_name
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?
        )`, [
                receiptId,
                companyId,
                receiptNo,
                customerId,
                receiptDate,
                Number(amountReceived),
                payMode,
                chequeNo,
                bankName
            ]);
            const mapPayMode = (m) => {
                if (m === 'cash')
                    return 'cash';
                return 'neft_rtgs';
            };
            await (0, dataService_1.syncEntity)('Receipt', 'create', {
                id: receiptId,
                companyId,
                receiptNo,
                customerId,
                date: new Date(receiptDate).toISOString(),
                amount: Number(amountReceived),
                paymentMode: mapPayMode(payMode),
                chequeNo,
                bankName
            });
            for (const b of bills) {
                if (b.allocated > 0 || b.discount > 0) {
                    const addAmount = Number(b.allocated || 0) + Number(b.discount || 0);
                    await window.pharmaAPI.db.run("UPDATE sales SET paid_amount = paid_amount + ? WHERE id = ?", [addAmount, b.dbId]);
                    const saleRes = await window.pharmaAPI.db.query("SELECT paid_amount FROM sales WHERE id = ?", [b.dbId]);
                    if (saleRes?.data?.length > 0) {
                        await (0, dataService_1.syncEntity)('Sale', 'update', {
                            id: b.dbId,
                            paidAmount: saleRes.data[0].paid_amount
                        });
                    }
                }
            }
            setCustomerId('');
            setAmountReceived(0);
            setChequeNo('');
            setBankName('');
            setBills([]);
            alert(`Receipt ${receiptNo} saved successfully!`);
        }
        catch (err) {
            alert(err.message || "Failed to save receipt.");
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "page-header", style: { marginBottom: 0 }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "page-title", children: "Receipts (Money Received)" }), (0, jsx_runtime_1.jsx)("div", { className: "page-sub", children: "Collect payments from customers and adjust against invoices" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "btn btn-outline", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { size: 16 }), " Print Receipt"] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-primary", onClick: handleSave, disabled: allocatedTotal > (Number(amountReceived) || 0), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Save, { size: 16 }), " Save Receipt"] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card", children: (0, jsx_runtime_1.jsx)("div", { className: "card-body", children: (0, jsx_runtime_1.jsxs)("div", { className: "form-row-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Customer ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: customerId, onChange: e => setCustomerId(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select Customer..." }), customers.map(c => (0, jsx_runtime_1.jsx)("option", { value: c.id, children: c.name }, c.id))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Receipt Date ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { type: "date", className: "form-input", value: receiptDate, onChange: e => setReceiptDate(e.target.value) })] }), (0, jsx_runtime_1.jsx)("div", { className: "form-group", style: { gridColumn: 'span 2' }, children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '1rem' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Total Amount Received (\u20B9) ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "search-input-wrap", style: { width: '100%' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.IndianRupee, { size: 16, className: "search-icon", color: "var(--success)" }), (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input", value: amountReceived || '', onChange: e => setAmountReceived(e.target.value), style: { fontWeight: 600, fontSize: '1.1rem' } })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: ["Payment Mode ", (0, jsx_runtime_1.jsx)("span", { className: "text-danger", children: "*" })] }), (0, jsx_runtime_1.jsxs)("select", { className: "form-select", value: payMode, onChange: e => setPayMode(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "bank", children: "Cheque / NEFT / RTGS" }), (0, jsx_runtime_1.jsx)("option", { value: "upi", children: "UPI" }), (0, jsx_runtime_1.jsx)("option", { value: "cash", children: "Cash" })] })] })] }) }), payMode !== 'cash' && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Instrument / Cheque No." }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", placeholder: "e.g. 123456", value: chequeNo, onChange: e => setChequeNo(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Bank Name" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", placeholder: "e.g. HDFC Bank", value: bankName, onChange: e => setBankName(e.target.value) })] })] }))] }) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "card", style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [(0, jsx_runtime_1.jsx)("h3", { className: "card-title", style: { fontSize: '1rem' }, children: "Pending Invoice Allocation" }), (0, jsx_runtime_1.jsx)("button", { className: "btn btn-outline btn-sm", onClick: autoAllocate, disabled: !customerId || !amountReceived, children: "Auto Allocate (FIFO)" })] }), (0, jsx_runtime_1.jsx)("div", { className: "card-body no-pad", style: { flex: 1, overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Invoice No" }), (0, jsx_runtime_1.jsx)("th", { children: "Date" }), (0, jsx_runtime_1.jsx)("th", { children: "Bill Amount (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { children: "Pending (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '150px' }, children: "Allocated (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { style: { width: '150px' }, children: "Cash Disc (\u20B9)" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: bills.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: "6", style: { textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }, children: "Select a customer to view pending invoices" }) })) : bills.map((b) => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 500 }, children: b.id }), (0, jsx_runtime_1.jsx)("td", { children: b.date }), (0, jsx_runtime_1.jsx)("td", { children: b.amount.toLocaleString('en-IN') }), (0, jsx_runtime_1.jsx)("td", { style: { color: 'var(--danger)', fontWeight: 600 }, children: b.pending.toLocaleString('en-IN') }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", max: b.pending, value: b.allocated || '', onChange: e => updateBill(b.id, 'allocated', e.target.value) }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("input", { type: "number", className: "form-input form-input-sm", max: b.pending - b.allocated, value: b.discount || '', onChange: e => updateBill(b.id, 'discount', e.target.value) }) })] }, b.id))) })] }) }), (0, jsx_runtime_1.jsx)("div", { style: { padding: '1rem', borderTop: '1px solid var(--border)', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end' }, children: (0, jsx_runtime_1.jsxs)("div", { style: { width: '300px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Received Amount:" }), " ", (0, jsx_runtime_1.jsxs)("span", { children: ["\u20B9 ", Number(amountReceived || 0).toLocaleString('en-IN')] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Total Allocated:" }), " ", (0, jsx_runtime_1.jsxs)("span", { children: ["- \u20B9 ", allocatedTotal.toLocaleString('en-IN')] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 600, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', color: (Number(amountReceived) - allocatedTotal) < 0 ? 'var(--danger)' : 'var(--primary)' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Unallocated (Advance):" }), " ", (0, jsx_runtime_1.jsxs)("span", { children: ["\u20B9 ", (Number(amountReceived) - allocatedTotal).toLocaleString('en-IN')] })] }), allocatedTotal > (Number(amountReceived) || 0) && ((0, jsx_runtime_1.jsx)("div", { style: { color: 'var(--danger)', fontSize: '0.8rem', textAlign: 'right' }, children: "Allocation exceeds received amount!" }))] }) })] })] }));
}
