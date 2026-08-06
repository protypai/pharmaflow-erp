import React, { useState, useEffect } from 'react';
import { Save, Printer, IndianRupee, Edit, X } from 'lucide-react';
import { syncEntity } from '../../services/dataService';

export default function Payments() {
  const [suppliers, set_suppliers] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  // When set, we're editing an existing payment's DETAILS only (date/mode/cheque/UTR).
  // Amount and bill allocation stay locked to avoid desyncing invoice paid-status.
  const [editingPaymentId, setEditingPaymentId] = useState(null);

  const fetchPayments = async () => {
    const res = await window.pharmaAPI.db.query(`
      SELECT p.*, s.name as supplierName
      FROM payments p LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.created_at DESC LIMIT 50
    `);
    setPaymentsList(res?.data || []);
  };

  useEffect(() => {
    const fetchData = async () => {
      const res_suppliers = await window.pharmaAPI.db.query("SELECT * FROM suppliers WHERE COALESCE(status, 'active') <> 'inactive'");
      set_suppliers(res_suppliers?.data || []);
      await fetchPayments();
    };
    fetchData();
  }, []);

  const handleEditPayment = (p) => {
    setEditingPaymentId(p.id);
    setSupplierId(p.supplier_id || '');
    setPaymentDate(String(p.date || '').slice(0, 10));
    // Preserve the exact stored ledger (bank/sbi/cash) so editing details never
    // silently moves a payment from e.g. SBI to HDFC.
    setPayMode(['bank', 'sbi', 'cash'].includes(p.payment_mode) ? p.payment_mode : 'bank');
    setAmountPaid(p.amount);
    setChequeNo(p.cheque_no || '');
    setUtrNo(p.utr_no || '');
    setBills([]);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingPaymentId(null);
    setSupplierId('');
    setAmountPaid('');
    setChequeNo('');
    setUtrNo('');
    setBills([]);
  };

  const [supplierId, setSupplierId] = useState('');
  const [amountPaid, setAmountPaid] = useState(0);
  const [payMode, setPayMode] = useState('bank');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [chequeNo, setChequeNo] = useState('');
  const [utrNo, setUtrNo] = useState('');
  
  // Mock pending bills for a selected supplier
  const [bills, setBills] = useState([]);
  
  // State for total allocated
  const [allocatedTotal, setAllocatedTotal] = useState(0);

  useEffect(() => {
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
      } else {
        setBills([]);
      }
    };
    fetchPendingBills();
  }, [supplierId]);

  useEffect(() => {
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
      // Metadata-only edit of an existing payment. Amount & allocation are NOT changed
      // (allocations aren't tracked per-payment, so we never touch invoice paid-status here).
      if (editingPaymentId) {
        await window.pharmaAPI.db.run(
          `UPDATE payments SET date = ?, payment_mode = ?, cheque_no = ?, utr_no = ?, updated_at = datetime('now') WHERE id = ?`,
          [paymentDate, payMode, chequeNo, utrNo, editingPaymentId]
        );
        await syncEntity('Payment', 'update', {
          id: editingPaymentId,
          date: new Date(paymentDate).toISOString(),
          paymentMode: payMode === 'cash' ? 'cash' : 'neft_rtgs',
          chequeNo,
          utrNo,
        });
        resetForm();
        await fetchPayments();
        alert('Payment details updated!');
        return;
      }

      if (!supplierId) throw new Error("Please select a supplier.");
      if (!amountPaid || Number(amountPaid) <= 0) throw new Error("Amount must be greater than 0.");
      if (allocatedTotal > Number(amountPaid)) throw new Error("Allocation exceeds paid amount!");
      
      const paymentNo = "PAY-" + Date.now().toString().slice(-6);
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userRes = await window.pharmaAPI.db.query("SELECT company_id FROM users WHERE id = ? OR email = ?", [user.id || '', user.email || '']);
      if (!userRes?.data?.length) throw new Error("Admin user not found in local DB");
      const companyId = userRes.data[0].company_id;
      const paymentId = crypto.randomUUID();

      await window.pharmaAPI.db.run(
        `INSERT INTO payments (
          id, company_id, payment_no, supplier_id, date, amount, payment_mode, cheque_no, utr_no
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?
        )`,
        [
          paymentId,
          companyId,
          paymentNo,
          supplierId,
          paymentDate,
          Number(amountPaid),
          payMode,
          chequeNo,
          utrNo
        ]
      );

      const mapPayMode = (m) => {
        if (m === 'cash') return 'cash';
        return 'neft_rtgs';
      };

      await syncEntity('Payment', 'create', {
        id: paymentId,
        companyId,
        paymentNo,
        supplierId,
        date: new Date(paymentDate).toISOString(),
        amount: Number(amountPaid),
        paymentMode: mapPayMode(payMode),
        chequeNo,
        utrNo
      });

      for (const b of bills) {
        if (b.allocated > 0 || b.discount > 0) {
          const addAmount = Number(b.allocated || 0) + Number(b.discount || 0);
          await window.pharmaAPI.db.run(
            "UPDATE purchases SET paid_amount = paid_amount + ? WHERE id = ?", 
            [addAmount, b.dbId]
          );

          const purRes = await window.pharmaAPI.db.query("SELECT paid_amount FROM purchases WHERE id = ?", [b.dbId]);
          if (purRes?.data?.length > 0) {
            await syncEntity('Purchase', 'update', {
              id: b.dbId,
              paidAmount: purRes.data[0].paid_amount
            });
          }
        }
      }
      setSupplierId('');
      setAmountPaid('');
      setChequeNo('');
      setUtrNo('');
      setBills([]);
      await fetchPayments();
      alert(`Payment ${paymentNo} saved successfully!`);
    } catch (err) {
      alert(err.message || "Failed to save payment.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 'calc(100vh - 120px)' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">{editingPaymentId ? 'Edit Payment Details' : 'Payments (Money Paid)'}</h1>
          <div className="page-sub">Issue payments to suppliers and adjust against pending purchase bills</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {editingPaymentId && (
            <button className="btn btn-outline" onClick={resetForm}><X size={16} /> Cancel</button>
          )}
          <button className="btn btn-outline"><Printer size={16} /> Print Voucher</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={editingPaymentId ? false : (!amountPaid || Number(amountPaid) <= 0 || allocatedTotal > (Number(amountPaid)||0))}><Save size={16} /> {editingPaymentId ? 'Update Details' : 'Save Payment'}</button>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {editingPaymentId && (
            <div style={{ background: '#FEF3C7', color: '#92400E', padding: '0.6rem 0.85rem', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #FDE68A', fontSize: '0.85rem' }}>
              Editing payment details only — <b>amount and bill allocation are locked</b>. To correct an amount, add a new payment instead.
            </div>
          )}
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Supplier <span className="text-danger">*</span></label>
              <select className="form-select" value={supplierId} onChange={e => setSupplierId(e.target.value)} disabled={!!editingPaymentId}>
                <option value="">Select Supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Date <span className="text-danger">*</span></label>
              <input type="date" className="form-input" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Total Amount Paid (₹) <span className="text-danger">*</span></label>
                  <div className="search-input-wrap" style={{ width: '100%' }}>
                    <IndianRupee size={16} className="search-icon" color="var(--danger)" />
                    <input type="number" className="form-input" value={amountPaid === 0 ? '' : amountPaid} onChange={e => setAmountPaid(e.target.value)} disabled={!!editingPaymentId} title={editingPaymentId ? 'Amount is locked while editing details' : ''} style={{ fontWeight: 600, fontSize: '1.1rem' }} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Paid From (Ledger) <span className="text-danger">*</span></label>
                  <select className="form-select" value={payMode} onChange={e => setPayMode(e.target.value)}>
                    <option value="bank">HDFC Bank Current A/c</option>
                    <option value="sbi">SBI Current A/c</option>
                    <option value="cash">Main Cash Book</option>
                  </select>
                </div>
              </div>
            </div>
            
            {payMode !== 'cash' && (
              <>
                <div className="form-group">
                  <label className="form-label">Instrument / Cheque No.</label>
                  <input type="text" className="form-input" placeholder="e.g. 998877" value={chequeNo} onChange={e => setChequeNo(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Reference / UTR</label>
                  <input type="text" className="form-input" placeholder="e.g. HDFC000ABC" value={utrNo} onChange={e => setUtrNo(e.target.value)} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {!editingPaymentId && (
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title" style={{ fontSize: '1rem' }}>Pending Purchase Invoice Allocation</h3>
          <button className="btn btn-outline btn-sm" onClick={autoAllocate} disabled={!supplierId || !amountPaid}>
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
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Select a supplier to view pending invoices</td></tr>
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
              <span>Paid Amount:</span> <span>₹ {Number(amountPaid || 0).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Total Allocated:</span> <span>- ₹ {allocatedTotal.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 600, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', color: (Number(amountPaid) - allocatedTotal) < 0 ? 'var(--danger)' : 'var(--primary)' }}>
              <span>Unallocated (Advance):</span> <span>₹ {(Number(amountPaid) - allocatedTotal).toLocaleString('en-IN')}</span>
            </div>
            {allocatedTotal > (Number(amountPaid)||0) && (
              <div style={{ color: 'var(--danger)', fontSize: '0.8rem', textAlign: 'right' }}>Allocation exceeds paid amount!</div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Recent payments — edit details (date/mode/cheque/UTR) from here */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ fontSize: '1rem' }}>Recent Payments</h3>
        </div>
        <div className="card-body no-pad" style={{ maxHeight: '320px', overflow: 'auto' }}>
          <table className="data-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th>Payment No</th>
                <th>Date</th>
                <th>Supplier</th>
                <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                <th>Mode</th>
                <th style={{ width: '70px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paymentsList.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>No payments yet.</td></tr>
              ) : paymentsList.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.payment_no}</td>
                  <td>{String(p.date || '').slice(0, 10)}</td>
                  <td>{p.supplierName || '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--danger)' }}>{Number(p.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ textTransform: 'capitalize' }}>{p.payment_mode}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ padding: '3px 7px', minWidth: 0, color: '#D97706', borderColor: '#D97706' }}
                      title="Edit payment details"
                      onClick={() => handleEditPayment(p)}
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