import React, { useState, useEffect } from 'react';
import { Save, Printer, IndianRupee } from 'lucide-react';


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
  
  // Mock pending bills for a selected supplier
  const [bills, setBills] = useState([]);
  
  // State for total allocated
  const [allocatedTotal, setAllocatedTotal] = useState(0);

  useEffect(() => {
    if (supplierId) {
      setBills([
        { id: 'PUR-2024-551', date: '2025-07-02', amount: 45000, pending: 45000, allocated: 0, discount: 0 },
        { id: 'PUR-2024-602', date: '2025-07-15', amount: 12000, pending: 12000, allocated: 0, discount: 0 }
      ]);
    } else {
      setBills([]);
    }
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Payments (Money Paid)</h1>
          <div className="page-sub">Issue payments to suppliers and adjust against pending purchase bills</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline"><Printer size={16} /> Print Voucher</button>
          <button className="btn btn-primary" disabled={allocatedTotal > (Number(amountPaid)||0)}><Save size={16} /> Save Payment</button>
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
              <input type="date" className="form-input" defaultValue={new Date().toISOString().split('T')[0]} />
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
                  <input type="text" className="form-input" placeholder="e.g. 998877" />
                </div>
                <div className="form-group">
                  <label className="form-label">Reference / UTR</label>
                  <input type="text" className="form-input" placeholder="e.g. HDFC000ABC" />
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