import React, { useState, useEffect } from 'react';
import { Save, Printer, IndianRupee } from 'lucide-react';
import { syncEntity } from '../../services/dataService';

export default function Payments() {
  const [suppliers, set_suppliers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res_suppliers = await window.pharmaAPI.db.query("SELECT * FROM suppliers");
      set_suppliers(res_suppliers?.data || []);
    };
    fetchData();
  }, []);

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
      setAmountPaid(0);
      setChequeNo('');
      setUtrNo('');
      setBills([]);
      alert(`Payment ${paymentNo} saved successfully!`);
    } catch (err) {
      alert(err.message || "Failed to save payment.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Payments (Money Paid)</h1>
          <div className="page-sub">Issue payments to suppliers and adjust against pending purchase bills</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline"><Printer size={16} /> Print Voucher</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={allocatedTotal > (Number(amountPaid)||0)}><Save size={16} /> Save Payment</button>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Supplier <span className="text-danger">*</span></label>
              <select className="form-select" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
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
                    <input type="number" className="form-input" value={amountPaid || ''} onChange={e => setAmountPaid(e.target.value)} style={{ fontWeight: 600, fontSize: '1.1rem' }} />
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

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title" style={{ fontSize: '1rem' }}>Pending Purchase Invoice Allocation</h3>
          <button className="btn btn-outline btn-sm" onClick={autoAllocate} disabled={!supplierId || !amountPaid}>
            Auto Allocate (FIFO)
          </button>
        </div>
        <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
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
    </div>
  );
}