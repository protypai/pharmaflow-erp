import React, { useState, useEffect } from 'react';
import { Save, Printer, IndianRupee, Edit, X } from 'lucide-react';
import { syncEntity } from '../../services/dataService';

export default function Receipts() {
  const [customers, set_customers] = useState([]);
  const [receiptsList, setReceiptsList] = useState([]);
  // When set, we're editing an existing receipt's DETAILS only (date/mode/cheque/bank).
  // Amount and invoice allocation stay locked to avoid desyncing invoice paid-status.
  const [editingReceiptId, setEditingReceiptId] = useState(null);

  const fetchReceipts = async () => {
    const res = await window.pharmaAPI.db.query(`
      SELECT r.*, c.name as customerName
      FROM receipts r LEFT JOIN customers c ON r.customer_id = c.id
      ORDER BY r.created_at DESC LIMIT 50
    `);
    setReceiptsList(res?.data || []);
  };

  useEffect(() => {
    const fetchData = async () => {
      const res_customers = await window.pharmaAPI.db.query("SELECT * FROM customers WHERE COALESCE(status, 'active') <> 'inactive'");
      set_customers(res_customers?.data || []);
      await fetchReceipts();
    };
    fetchData();
  }, []);

  const handleEditReceipt = (r) => {
    setEditingReceiptId(r.id);
    setCustomerId(r.customer_id || '');
    setReceiptDate(String(r.date || '').slice(0, 10));
    setPayMode(r.payment_mode === 'cash' ? 'cash' : (r.payment_mode === 'upi' ? 'upi' : 'bank'));
    setAmountReceived(r.amount);
    setChequeNo(r.cheque_no || '');
    setBankName(r.bank_name || '');
    setBills([]);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingReceiptId(null);
    setCustomerId('');
    setAmountReceived('');
    setChequeNo('');
    setBankName('');
    setBills([]);
  };

  const [customerId, setCustomerId] = useState('');
  const [amountReceived, setAmountReceived] = useState(0);
  const [payMode, setPayMode] = useState('bank');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [chequeNo, setChequeNo] = useState('');
  const [bankName, setBankName] = useState('');
  
  // Mock pending bills for a selected customer
  const [bills, setBills] = useState([]);
  
  // State for total allocated
  const [allocatedTotal, setAllocatedTotal] = useState(0);

  useEffect(() => {
    const fetchPendingBills = async () => {
      if (customerId) {
        const res = await window.pharmaAPI.db.query(`
          SELECT s.*, COALESCE((SELECT SUM(net_amount) FROM sale_returns sr WHERE sr.sale_id = s.id), 0) as returned_amount
          FROM sales s 
          WHERE s.customer_id = ? 
            AND (s.net_amount - s.paid_amount - COALESCE((SELECT SUM(net_amount) FROM sale_returns sr WHERE sr.sale_id = s.id), 0)) > 0 
          ORDER BY s.date ASC
        `, [customerId]);
        const dbBills = (res?.data || []).map(s => ({
          id: s.invoice_no,
          dbId: s.id,
          date: s.date,
          amount: s.net_amount,
          returned: s.returned_amount,
          pending: s.net_amount - s.paid_amount - s.returned_amount,
          allocated: 0,
          discount: 0
        }));
        setBills(dbBills);
      } else {
        setBills([]);
      }
    };
    fetchPendingBills();
  }, [customerId]);

  useEffect(() => {
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
      // Metadata-only edit of an existing receipt. Amount & allocation are NOT changed
      // (allocations aren't tracked per-receipt, so we never touch invoice paid-status here).
      if (editingReceiptId) {
        await window.pharmaAPI.db.run(
          `UPDATE receipts SET date = ?, payment_mode = ?, cheque_no = ?, bank_name = ?, updated_at = datetime('now') WHERE id = ?`,
          [receiptDate, payMode, chequeNo, bankName, editingReceiptId]
        );
        await syncEntity('Receipt', 'update', {
          id: editingReceiptId,
          date: new Date(receiptDate).toISOString(),
          paymentMode: payMode === 'cash' ? 'cash' : 'neft_rtgs',
          chequeNo,
          bankName,
        });
        resetForm();
        await fetchReceipts();
        alert('Receipt details updated!');
        return;
      }

      if (!customerId) throw new Error("Please select a customer.");
      if (!amountReceived || Number(amountReceived) <= 0) throw new Error("Amount must be greater than 0.");
      if (allocatedTotal > Number(amountReceived)) throw new Error("Allocation exceeds received amount!");
      
      const receiptNo = "REC-" + Date.now().toString().slice(-6);
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const compRes = await window.pharmaAPI.db.query("SELECT id FROM companies LIMIT 1");
      if (!compRes?.data?.length) throw new Error("Company profile not found in local DB");
      const companyId = compRes.data[0].id;
      const receiptId = crypto.randomUUID();

      await window.pharmaAPI.db.run(
        `INSERT INTO receipts (
          id, company_id, receipt_no, customer_id, date, amount, payment_mode, cheque_no, bank_name
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?
        )`,
        [
          receiptId,
          companyId,
          receiptNo,
          customerId,
          receiptDate,
          Number(amountReceived),
          payMode,
          chequeNo,
          bankName
        ]
      );

      const mapPayMode = (m) => {
        if (m === 'cash') return 'cash';
        return 'neft_rtgs';
      };

      await syncEntity('Receipt', 'create', {
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
          await window.pharmaAPI.db.run(
            "UPDATE sales SET paid_amount = paid_amount + ? WHERE id = ?", 
            [addAmount, b.dbId]
          );

          const saleRes = await window.pharmaAPI.db.query("SELECT paid_amount FROM sales WHERE id = ?", [b.dbId]);
          if (saleRes?.data?.length > 0) {
            await syncEntity('Sale', 'update', {
              id: b.dbId,
              paidAmount: saleRes.data[0].paid_amount
            });
          }
        }
      }
      setCustomerId('');
      setAmountReceived('');
      setChequeNo('');
      setBankName('');
      setBills([]);
      await fetchReceipts();
      alert(`Receipt ${receiptNo} saved successfully!`);
    } catch (err) {
      alert(err.message || "Failed to save receipt.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 'calc(100vh - 120px)' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">{editingReceiptId ? 'Edit Receipt Details' : 'Receipts (Money Received)'}</h1>
          <div className="page-sub">Collect payments from customers and adjust against invoices</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {editingReceiptId && (
            <button className="btn btn-outline" onClick={resetForm}><X size={16} /> Cancel</button>
          )}
          <button className="btn btn-outline"><Printer size={16} /> Print Receipt</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={editingReceiptId ? false : (!amountReceived || Number(amountReceived) <= 0 || allocatedTotal > (Number(amountReceived)||0))}><Save size={16} /> {editingReceiptId ? 'Update Details' : 'Save Receipt'}</button>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {editingReceiptId && (
            <div style={{ background: '#FEF3C7', color: '#92400E', padding: '0.6rem 0.85rem', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #FDE68A', fontSize: '0.85rem' }}>
              Editing receipt details only — <b>amount and invoice allocation are locked</b>. To correct an amount, add a new receipt instead.
            </div>
          )}
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Customer <span className="text-danger">*</span></label>
              <select className="form-select" value={customerId} onChange={e => setCustomerId(e.target.value)} disabled={!!editingReceiptId}>
                <option value="">Select Customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Receipt Date <span className="text-danger">*</span></label>
              <input type="date" className="form-input" value={receiptDate} onChange={e => setReceiptDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Total Amount Received (₹) <span className="text-danger">*</span></label>
                  <div className="search-input-wrap" style={{ width: '100%' }}>
                    <IndianRupee size={16} className="search-icon" color="var(--success)" />
                    <input type="number" className="form-input" value={amountReceived === 0 ? '' : amountReceived} onChange={e => setAmountReceived(e.target.value)} disabled={!!editingReceiptId} title={editingReceiptId ? 'Amount is locked while editing details' : ''} style={{ fontWeight: 600, fontSize: '1.1rem' }} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Payment Mode <span className="text-danger">*</span></label>
                  <select className="form-select" value={payMode} onChange={e => setPayMode(e.target.value)}>
                    <option value="bank">Cheque / NEFT / RTGS</option>
                    <option value="upi">UPI</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
              </div>
            </div>
            
            {payMode !== 'cash' && (
              <>
                <div className="form-group">
                  <label className="form-label">Instrument / Cheque No.</label>
                  <input type="text" className="form-input" placeholder="e.g. 123456" value={chequeNo} onChange={e => setChequeNo(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Bank Name</label>
                  <input type="text" className="form-input" placeholder="e.g. HDFC Bank" value={bankName} onChange={e => setBankName(e.target.value)} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {!editingReceiptId && (
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title" style={{ fontSize: '1rem' }}>Pending Invoice Allocation</h3>
          <button className="btn btn-outline btn-sm" onClick={autoAllocate} disabled={!customerId || !amountReceived}>
            Auto Allocate (FIFO)
          </button>
        </div>
        <div className="card-body no-pad" style={{ flex: 1, overflow: 'auto', minHeight: '300px' }}>
          <table className="data-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Bill Amount (₹)</th>
                <th>Pending (₹)</th>
                <th style={{ width: '150px' }}>Allocated (₹)</th>
                <th style={{ width: '150px' }}>Cash Disc (₹)</th>
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Select a customer to view pending invoices</td></tr>
              ) : bills.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 500 }}>{b.id}</td>
                  <td>{b.date}</td>
                  <td>{b.amount.toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{b.pending.toLocaleString('en-IN')}</td>
                  <td>
                    <input type="number" className="form-input form-input-sm" max={b.pending} value={b.allocated || ''} onChange={e => updateBill(b.id, 'allocated', e.target.value)} />
                  </td>
                  <td>
                    <input type="number" className="form-input form-input-sm" max={b.pending - b.allocated} value={b.discount || ''} onChange={e => updateBill(b.id, 'discount', e.target.value)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Received Amount:</span> <span>₹ {Number(amountReceived || 0).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Total Allocated:</span> <span>- ₹ {allocatedTotal.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 600, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', color: (Number(amountReceived) - allocatedTotal) < 0 ? 'var(--danger)' : 'var(--primary)' }}>
              <span>Unallocated (Advance):</span> <span>₹ {(Number(amountReceived) - allocatedTotal).toLocaleString('en-IN')}</span>
            </div>
            {allocatedTotal > (Number(amountReceived)||0) && (
              <div style={{ color: 'var(--danger)', fontSize: '0.8rem', textAlign: 'right' }}>Allocation exceeds received amount!</div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Recent receipts — edit details (date/mode/cheque/bank) from here */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ fontSize: '1rem' }}>Recent Receipts</h3>
        </div>
        <div className="card-body no-pad" style={{ maxHeight: '320px', overflow: 'auto' }}>
          <table className="data-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th>Receipt No</th>
                <th>Date</th>
                <th>Customer</th>
                <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                <th>Mode</th>
                <th style={{ width: '70px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {receiptsList.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>No receipts yet.</td></tr>
              ) : receiptsList.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.receipt_no}</td>
                  <td>{String(r.date || '').slice(0, 10)}</td>
                  <td>{r.customerName || '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>{Number(r.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ textTransform: 'capitalize' }}>{r.payment_mode}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ padding: '3px 7px', minWidth: 0, color: '#D97706', borderColor: '#D97706' }}
                      title="Edit receipt details"
                      onClick={() => handleEditReceipt(r)}
                    >
                      <Edit size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}