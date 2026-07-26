import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Printer } from 'lucide-react';
import { syncEntity } from '../../services/dataService';

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

  const [adjDate, setAdjDate] = useState(new Date().toISOString().split('T')[0]);
  const [refNo, setRefNo] = useState('');
  const [reason, setReason] = useState('Physical Count Mismatch');
  const [authBy, setAuthBy] = useState('Admin User');

  const handleSave = async () => {
    const validRows = rows.filter(r => r.product && r.batch && r.actualQty !== '');
    if (validRows.length === 0) return alert("Add at least one product to adjust.");
    
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userRes = await window.pharmaAPI.db.query("SELECT company_id FROM users WHERE email = ?", [user.email]);
      if (!userRes?.data?.length) throw new Error("Admin user not found in local DB");
      const companyId = userRes.data[0].company_id;
      const adjId = 'ADJ-' + Date.now();

      await window.pharmaAPI.db.run(`
        INSERT INTO stock_adjustments (id, company_id, date, reference_no, reason, authorized_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [adjId, companyId, adjDate, refNo, reason, authBy]);

      const mapReason = (r) => {
        if (r.includes('Mismatch')) return 'physical_count';
        if (r.includes('Damage')) return 'damage';
        if (r.includes('Theft')) return 'lost_theft';
        if (r.includes('Expired')) return 'expired_destroyed';
        return 'other';
      };

      await syncEntity('StockAdjustment', 'create', {
        id: adjId,
        companyId,
        entryNo: refNo || adjId,
        date: new Date(adjDate).toISOString(),
        reason: mapReason(reason),
        notes: "Authorized by: " + authBy
      });

      for (const row of validRows) {
        const prod = products.find(p => p.id === parseInt(row.product));
        const batchData = prod?.batches.find(b => b.batch === row.batch);
        
        if (batchData) {
          await window.pharmaAPI.db.run(`
            UPDATE batches SET current_qty = ? WHERE id = ?
          `, [Number(row.actualQty), batchData.id]);
          
          await syncEntity('Batch', 'update', {
            id: batchData.id,
            currentQty: Number(row.actualQty)
          });
        }
      }
      
      alert("Stock Adjustment saved!");
      setRows([{ id: 1, product: '', batch: '', sysQty: 0, actualQty: '', diff: 0 }]);
      setRefNo('');
    } catch(err) {
      alert("Error: " + err.message);
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
          <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> Save Adjustment</button>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Adjustment Date <span className="text-danger">*</span></label>
              <input type="date" className="form-input" value={adjDate} onChange={e => setAdjDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Reference No</label>
              <input type="text" className="form-input" placeholder="e.g. PHY-CNT-01" value={refNo} onChange={e => setRefNo(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Reason for Adjustment <span className="text-danger">*</span></label>
              <select className="form-select" value={reason} onChange={e => setReason(e.target.value)}>
                <option value="Physical Count Mismatch">Physical Count Mismatch</option>
                <option value="Damage / Breakage in Warehouse">Damage / Breakage in Warehouse</option>
                <option value="Theft / Loss">Theft / Loss</option>
                <option value="Expired & Destroyed">Expired & Destroyed</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Authorized By <span className="text-danger">*</span></label>
              <input type="text" className="form-input" value={authBy} onChange={e => setAuthBy(e.target.value)} />
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