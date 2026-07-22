import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Printer, Calculator } from 'lucide-react';
import { suppliers, products } from '../../data/mockData';

export default function Purchase() {
  const [rows, setRows] = useState([
    { id: 1, product: '', batch: '', expiry: '', qty: 0, free: 0, ptr: 0, mrp: 0, disc1: 0, disc2: 0, gst: 12, amount: 0 }
  ]);
  const [totals, setTotals] = useState({ sub: 0, disc: 0, gst: 0, net: 0 });
  const [supplierId, setSupplierId] = useState('');

  // Calculate row amounts and totals when rows change
  useEffect(() => {
    let sub = 0;
    let totalDisc = 0;
    let totalGst = 0;

    const newRows = rows.map(r => {
      const baseAmt = (Number(r.qty) || 0) * (Number(r.ptr) || 0);
      const d1Amt = baseAmt * ((Number(r.disc1) || 0) / 100);
      const d2Amt = (baseAmt - d1Amt) * ((Number(r.disc2) || 0) / 100);
      const rowDisc = d1Amt + d2Amt;
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
      net: Math.round(sub - totalDisc + totalGst) // Round off to nearest rupee
    });
  }, [rows]);

  const addRow = () => {
    setRows([...rows, { id: Date.now(), product: '', batch: '', expiry: '', qty: 0, free: 0, ptr: 0, mrp: 0, disc1: 0, disc2: 0, gst: 12, amount: 0 }]);
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
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
          <h1 className="page-title">Purchase Entry (Inward)</h1>
          <div className="page-sub">Record supplier invoices and update warehouse stock</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline"><Calculator size={16} /> GST Calc</button>
          <button className="btn btn-primary"><Save size={16} /> Save Purchase Bill</button>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Supplier / Distributor <span className="text-danger">*</span></label>
              <select className="form-select" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                <option value="">Select Supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.city})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Supplier Invoice No <span className="text-danger">*</span></label>
              <input type="text" className="form-input" placeholder="e.g. INV-12345" />
            </div>
            <div className="form-group">
              <label className="form-label">Invoice Date <span className="text-danger">*</span></label>
              <input type="date" className="form-input" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="form-group">
              <label className="form-label">GST Type</label>
              <select className="form-select">
                <option>Local (CGST + SGST) - Exclusive</option>
                <option>Interstate (IGST) - Exclusive</option>
                <option>Local (Inclusive of GST)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
          <table className="data-table" style={{ minWidth: '1200px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ width: '200px' }}>Product</th>
                <th style={{ width: '100px' }}>Batch</th>
                <th style={{ width: '80px' }}>Expiry</th>
                <th style={{ width: '70px' }}>Qty</th>
                <th style={{ width: '70px' }}>Free</th>
                <th style={{ width: '90px' }}>PTR (₹)</th>
                <th style={{ width: '90px' }}>MRP (₹)</th>
                <th style={{ width: '70px' }}>D1%</th>
                <th style={{ width: '70px' }}>D2%</th>
                <th style={{ width: '80px' }}>GST%</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Net (₹)</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td>
                    <select className="form-select form-input-sm" value={r.product} onChange={e => updateRow(r.id, 'product', e.target.value)}>
                      <option value="">Search Product...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </td>
                  <td><input type="text" className="form-input form-input-sm" placeholder="Batch No" value={r.batch} onChange={e => updateRow(r.id, 'batch', e.target.value)} /></td>
                  <td><input type="text" className="form-input form-input-sm" placeholder="MM/YY" value={r.expiry} onChange={e => updateRow(r.id, 'expiry', e.target.value)} /></td>
                  <td><input type="number" className="form-input form-input-sm" min="0" value={r.qty || ''} onChange={e => updateRow(r.id, 'qty', e.target.value)} /></td>
                  <td><input type="number" className="form-input form-input-sm" min="0" value={r.free || ''} onChange={e => updateRow(r.id, 'free', e.target.value)} /></td>
                  <td><input type="number" className="form-input form-input-sm" min="0" step="0.01" value={r.ptr || ''} onChange={e => updateRow(r.id, 'ptr', e.target.value)} /></td>
                  <td><input type="number" className="form-input form-input-sm" min="0" step="0.01" value={r.mrp || ''} onChange={e => updateRow(r.id, 'mrp', e.target.value)} /></td>
                  <td><input type="number" className="form-input form-input-sm" min="0" step="0.01" value={r.disc1 || ''} onChange={e => updateRow(r.id, 'disc1', e.target.value)} /></td>
                  <td><input type="number" className="form-input form-input-sm" min="0" step="0.01" value={r.disc2 || ''} onChange={e => updateRow(r.id, 'disc2', e.target.value)} /></td>
                  <td>
                    <select className="form-select form-input-sm" value={r.gst} onChange={e => updateRow(r.id, 'gst', e.target.value)}>
                      <option value="12">12%</option>
                      <option value="5">5%</option>
                      <option value="18">18%</option>
                      <option value="0">0%</option>
                      <option value="28">28%</option>
                    </select>
                  </td>
                  <td style={{ fontWeight: 600, textAlign: 'right' }}>{r.amount.toFixed(2)}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => removeRow(r.id)} style={{ color: 'var(--danger)', padding: '0.25rem' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan="12">
                  <button className="btn btn-ghost btn-sm" onClick={addRow} style={{ color: 'var(--primary)' }}>
                    <Plus size={16} /> Add Product Row
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Live Calculation Footer */}
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
              <span>Net Payable:</span> <span style={{ color: 'var(--primary)' }}>₹ {totals.net.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}