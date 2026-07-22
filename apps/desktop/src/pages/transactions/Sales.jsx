import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Printer, AlertTriangle } from 'lucide-react';
import { customers, products } from '../../data/mockData';

export default function Sales() {
  const [customerId, setCustomerId] = useState('');
  const [customerWarning, setCustomerWarning] = useState(null);
  
  const [rows, setRows] = useState([
    { id: 1, product: '', batch: '', expiry: '', qty: 0, available: 0, rate: 0, mrp: 0, disc: 0, gst: 12, amount: 0 }
  ]);
  const [totals, setTotals] = useState({ sub: 0, disc: 0, gst: 0, net: 0 });

  // Handle Customer Selection
  useEffect(() => {
    if (customerId) {
      const cust = customers.find(c => c.id === parseInt(customerId));
      if (cust && cust.outstanding > cust.creditLimit) {
        setCustomerWarning(`Credit Limit Exceeded! Outstanding: ₹${cust.outstanding.toLocaleString('en-IN')} (Limit: ₹${cust.creditLimit.toLocaleString('en-IN')})`);
      } else {
        setCustomerWarning(null);
      }
    } else {
      setCustomerWarning(null);
    }
  }, [customerId]);

  // Handle Row Calculations
  useEffect(() => {
    let sub = 0;
    let totalDisc = 0;
    let totalGst = 0;

    const newRows = rows.map(r => {
      const baseAmt = (Number(r.qty) || 0) * (Number(r.rate) || 0);
      const rowDisc = baseAmt * ((Number(r.disc) || 0) / 100);
      const taxable = baseAmt - rowDisc;
      const gstAmt = taxable * ((Number(r.gst) || 0) / 100);
      const rowNet = taxable + gstAmt;

      sub += baseAmt;
      totalDisc += rowDisc;
      totalGst += gstAmt;

      return { ...r, amount: rowNet };
    });

    const hasChanged = newRows.some((r, i) => r.amount !== rows[i].amount);
    if (hasChanged) setRows(newRows);
    
    setTotals({
      sub,
      disc: totalDisc,
      gst: totalGst,
      net: Math.round(sub - totalDisc + totalGst)
    });
  }, [rows]);

  const addRow = () => {
    setRows([...rows, { id: Date.now(), product: '', batch: '', expiry: '', qty: 0, available: 0, rate: 0, mrp: 0, disc: 0, gst: 12, amount: 0 }]);
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(r => {
      if (r.id !== id) return r;
      
      let updated = { ...r, [field]: value };
      
      // Auto-populate batch dropdown when product changes
      if (field === 'product') {
        updated.batch = '';
        updated.expiry = '';
        updated.available = 0;
        updated.rate = 0;
        updated.mrp = 0;
        const prod = products.find(p => p.id === parseInt(value));
        if (prod) {
          updated.gst = prod.gst;
        }
      }
      
      // Auto-populate details when batch changes
      if (field === 'batch' && r.product) {
        const prod = products.find(p => p.id === parseInt(r.product));
        if (prod) {
          const batchData = prod.batches.find(b => b.batch === value);
          if (batchData) {
            updated.expiry = batchData.expiry;
            updated.available = batchData.qty;
            updated.mrp = batchData.mrp;
            // Example margin logic to derive PTS/PTR for rate
            updated.rate = batchData.mrp * 0.8; 
          }
        }
      }
      
      return updated;
    }));
  };

  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Sales Invoice (Outward)</h1>
          <div className="page-sub">Generate bills for medical shops and clinics</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={() => window.print()}><Printer size={16} /> Print</button>
          <button className="btn btn-primary"><Save size={16} /> Save & Generate Bill</button>
        </div>
      </div>

      {customerWarning && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} />
          <span style={{ fontWeight: 600 }}>{customerWarning}</span> - Proceed with caution.
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Customer <span className="text-danger">*</span></label>
              <select className="form-select" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">Select Customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.area})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Invoice Date</label>
              <input type="date" className="form-input" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="form-group">
              <label className="form-label">Doctor Name (Optional)</label>
              <input type="text" className="form-input" placeholder="Prescribing doctor..." />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Mode</label>
              <select className="form-select">
                <option>Credit</option>
                <option>Cash</option>
                <option>Bank / UPI</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
          <table className="data-table" style={{ minWidth: '1100px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ width: '250px' }}>Product</th>
                <th style={{ width: '150px' }}>Batch (FEFO)</th>
                <th style={{ width: '80px' }}>Expiry</th>
                <th style={{ width: '80px' }}>Available</th>
                <th style={{ width: '80px' }}>Bill Qty</th>
                <th style={{ width: '90px' }}>Rate (₹)</th>
                <th style={{ width: '90px' }}>MRP (₹)</th>
                <th style={{ width: '70px' }}>Disc%</th>
                <th style={{ width: '80px' }}>GST%</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Amount (₹)</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const prod = products.find(p => p.id === parseInt(r.product));
                const overStock = r.qty > r.available;
                return (
                  <tr key={r.id} style={{ background: overStock ? '#FEF2F2' : 'transparent' }}>
                    <td>
                      <select className="form-select form-input-sm" value={r.product} onChange={e => updateRow(r.id, 'product', e.target.value)}>
                        <option value="">Search Product...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <select className="form-select form-input-sm" value={r.batch} onChange={e => updateRow(r.id, 'batch', e.target.value)} disabled={!r.product}>
                        <option value="">Select Batch</option>
                        {prod && prod.batches.map(b => (
                          <option key={b.id} value={b.batch}>{b.batch} ({b.qty} in stock)</option>
                        ))}
                      </select>
                    </td>
                    <td><input type="text" className="form-input form-input-sm" value={r.expiry} readOnly style={{ background: '#F8FAFC' }} /></td>
                    <td><input type="number" className="form-input form-input-sm" value={r.available} readOnly style={{ background: '#F8FAFC', color: r.available === 0 ? 'var(--danger)' : 'inherit' }} /></td>
                    <td><input type="number" className="form-input form-input-sm" min="1" value={r.qty || ''} onChange={e => updateRow(r.id, 'qty', e.target.value)} style={{ borderColor: overStock ? 'var(--danger)' : 'var(--border)' }} /></td>
                    <td><input type="number" className="form-input form-input-sm" min="0" step="0.01" value={r.rate || ''} onChange={e => updateRow(r.id, 'rate', e.target.value)} /></td>
                    <td><input type="number" className="form-input form-input-sm" value={r.mrp || ''} readOnly style={{ background: '#F8FAFC' }} /></td>
                    <td><input type="number" className="form-input form-input-sm" min="0" step="0.01" value={r.disc || ''} onChange={e => updateRow(r.id, 'disc', e.target.value)} /></td>
                    <td>
                      <input type="number" className="form-input form-input-sm" value={r.gst} readOnly style={{ background: '#F8FAFC' }} />
                    </td>
                    <td style={{ fontWeight: 600, textAlign: 'right' }}>{r.amount.toFixed(2)}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => removeRow(r.id)} style={{ color: 'var(--danger)', padding: '0.25rem' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan="11">
                  <button className="btn btn-ghost btn-sm" onClick={addRow} style={{ color: 'var(--primary)' }}>
                    <Plus size={16} /> Add Product Row
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Gross Total:</span> <span>₹ {totals.sub.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
              <span>Total Discount:</span> <span>- ₹ {totals.disc.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Total Tax (GST):</span> <span>+ ₹ {totals.gst.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
              <span>Net Bill Amount:</span> <span style={{ color: 'var(--primary)' }}>₹ {totals.net.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}