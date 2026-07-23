import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Printer } from 'lucide-react';


export default function StockAdjustment() {
  const [products, set_products] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res_products = await window.pharmaAPI.db.query("SELECT * FROM products");
      set_products(res_products?.data || []);
    };
    fetchData();
  }, []);

  const [rows, setRows] = useState([
    { id: 1, product: '', batch: '', sysQty: 0, actualQty: '', diff: 0 }
  ]);

  const addRow = () => {
    setRows([...rows, { id: Date.now(), product: '', batch: '', sysQty: 0, actualQty: '', diff: 0 }]);
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(r => {
      if (r.id !== id) return r;
      
      let updated = { ...r, [field]: value };
      
      if (field === 'product') {
        updated.batch = '';
        updated.sysQty = 0;
        updated.actualQty = '';
        updated.diff = 0;
      }
      
      if (field === 'batch' && r.product) {
        const prod = products.find(p => p.id === parseInt(r.product));
        if (prod) {
          const batchData = prod.batches.find(b => b.batch === value);
          if (batchData) {
            updated.sysQty = batchData.qty;
            if (updated.actualQty !== '') {
              updated.diff = Number(updated.actualQty) - batchData.qty;
            }
          }
        }
      }

      if (field === 'actualQty') {
        if (value === '') {
          updated.diff = 0;
        } else {
          updated.diff = Number(value) - updated.sysQty;
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
          <h1 className="page-title">Stock Adjustment</h1>
          <div className="page-sub">Reconcile physical stock with system stock</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline"><Printer size={16} /> Print Report</button>
          <button className="btn btn-primary"><Save size={16} /> Save Adjustment</button>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Adjustment Date <span className="text-danger">*</span></label>
              <input type="date" className="form-input" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="form-group">
              <label className="form-label">Reference No</label>
              <input type="text" className="form-input" placeholder="e.g. PHY-CNT-01" />
            </div>
            <div className="form-group">
              <label className="form-label">Reason for Adjustment <span className="text-danger">*</span></label>
              <select className="form-select">
                <option>Physical Count Mismatch</option>
                <option>Damage / Breakage in Warehouse</option>
                <option>Theft / Loss</option>
                <option>Expired & Destroyed</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Authorized By <span className="text-danger">*</span></label>
              <input type="text" className="form-input" defaultValue="Admin User" />
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
          <table className="data-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ width: '300px' }}>Product</th>
                <th style={{ width: '200px' }}>Batch</th>
                <th style={{ width: '150px' }}>System Qty</th>
                <th style={{ width: '150px' }}>Actual Qty (Input)</th>
                <th style={{ width: '150px' }}>Difference (+/-)</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const prod = products.find(p => p.id === parseInt(r.product));
                return (
                  <tr key={r.id}>
                    <td>
                      <select className="form-select form-input-sm" value={r.product} onChange={e => updateRow(r.id, 'product', e.target.value)}>
                        <option value="">Select Product...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <select className="form-select form-input-sm" value={r.batch} onChange={e => updateRow(r.id, 'batch', e.target.value)} disabled={!r.product}>
                        <option value="">Select Batch</option>
                        {prod && prod.batches.map(b => (
                          <option key={b.id} value={b.batch}>{b.batch} ({b.qty} in system)</option>
                        ))}
                      </select>
                    </td>
                    <td><input type="number" className="form-input form-input-sm" value={r.sysQty} readOnly style={{ background: '#F8FAFC' }} /></td>
                    <td><input type="number" className="form-input form-input-sm" value={r.actualQty} onChange={e => updateRow(r.id, 'actualQty', e.target.value)} placeholder="Counted Qty" /></td>
                    <td>
                      <div style={{ 
                        fontWeight: 600, 
                        color: r.diff > 0 ? 'var(--success)' : r.diff < 0 ? 'var(--danger)' : 'var(--text-primary)',
                        padding: '0.25rem 0.5rem'
                      }}>
                        {r.diff > 0 ? `+${r.diff}` : r.diff}
                      </div>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => removeRow(r.id)} style={{ color: 'var(--danger)', padding: '0.25rem' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan="6">
                  <button className="btn btn-ghost btn-sm" onClick={addRow} style={{ color: 'var(--primary)' }}>
                    <Plus size={16} /> Add Product Row
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}