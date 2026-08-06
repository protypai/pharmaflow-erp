import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Printer, Edit, X } from 'lucide-react';
import { syncEntity } from '../../services/dataService';

export default function StockAdjustment() {
  const [products, set_products] = useState([]);
  const [adjustmentsList, setAdjustmentsList] = useState([]);
  // When set, we're editing an existing adjustment's DETAILS only (date/ref/reason/auth).
  // Counted quantities are locked — to re-count stock, make a NEW adjustment entry.
  const [editingAdjId, setEditingAdjId] = useState(null);

  const fetchAdjustments = async () => {
    const res = await window.pharmaAPI.db.query(`
      SELECT a.*, (SELECT COUNT(*) FROM stock_adjustment_items WHERE adjustment_id = a.id) as itemCount
      FROM stock_adjustments a
      ORDER BY a.created_at DESC LIMIT 50
    `);
    setAdjustmentsList(res?.data || []);
  };

  useEffect(() => {
    const fetchData = async () => {
      // Load products with their batches. current_qty is in STRIPS (base unit).
      const res_products = await window.pharmaAPI.db.query(`
        SELECT p.*,
        json_group_array(json_object(
          'id', b.id, 'batch', b.batch_no, 'expiry', b.expiry_date,
          'mrp', b.mrp, 'ptr', b.ptr, 'qty', b.current_qty
        )) as batches
        FROM products p
        LEFT JOIN batches b ON p.id = b.product_id
        GROUP BY p.id
      `);
      const formatted = (res_products?.data || []).map(p => ({
        ...p,
        batches: p.batches && typeof p.batches === 'string'
          ? JSON.parse(p.batches).filter(b => b.id)
          : []
      }));
      set_products(formatted);
      await fetchAdjustments();
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
        const prod = products.find(p => p.id.toString() === r.product.toString());
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
    setRows(rows.filter(r => r.id !== id));
  };

  const [adjDate, setAdjDate] = useState(new Date().toISOString().split('T')[0]);
  const [refNo, setRefNo] = useState('');
  const [reason, setReason] = useState('Physical Count Mismatch');
  const [authBy, setAuthBy] = useState('Admin User');

  const mapReason = (r) => {
    if (r.includes('Mismatch')) return 'physical_count';
    if (r.includes('Damage')) return 'damage';
    if (r.includes('Theft')) return 'lost_theft';
    if (r.includes('Expired')) return 'expired_destroyed';
    return 'other';
  };

  const resetForm = () => {
    setEditingAdjId(null);
    setRows([{ id: 1, product: '', batch: '', sysQty: 0, actualQty: '', diff: 0 }]);
    setRefNo('');
    setReason('Physical Count Mismatch');
    setAuthBy('Admin User');
    setAdjDate(new Date().toISOString().split('T')[0]);
  };

  const handleEditAdj = (a) => {
    setEditingAdjId(a.id);
    setAdjDate(String(a.date || '').slice(0, 10));
    setRefNo(a.entry_no && !a.entry_no.startsWith('ADJ-') ? a.entry_no : '');
    // Header stores the display reason text; if it was stored as an enum, keep as-is.
    setReason(a.reason || 'Physical Count Mismatch');
    setAuthBy(String(a.notes || '').replace(/^Authorized by:\s*/, '') || 'Admin User');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userRes = await window.pharmaAPI.db.query("SELECT company_id FROM users WHERE id = ? OR email = ?", [user.id || '', user.email || '']);
      if (!userRes?.data?.length) throw new Error("Admin user not found in local DB");
      const companyId = userRes.data[0].company_id;

      // Metadata-only edit of an existing adjustment (date/reference/reason/authorized-by).
      // Counted quantities are NOT changed here — a re-count should be a new adjustment.
      if (editingAdjId) {
        await window.pharmaAPI.db.run(
          `UPDATE stock_adjustments SET date = ?, entry_no = ?, reason = ?, notes = ? WHERE id = ?`,
          [adjDate, refNo || editingAdjId, reason, "Authorized by: " + authBy, editingAdjId]
        );
        await syncEntity('StockAdjustment', 'update', {
          id: editingAdjId,
          entryNo: refNo || editingAdjId,
          date: new Date(adjDate).toISOString(),
          reason: mapReason(reason),
          notes: "Authorized by: " + authBy,
        });
        resetForm();
        await fetchAdjustments();
        alert('Adjustment details updated!');
        return;
      }

      const validRows = rows.filter(r => r.product && r.batch && r.actualQty !== '');
      if (validRows.length === 0) return alert("Add at least one product to adjust.");
      const adjId = 'ADJ-' + Date.now();

      // Resolve & validate all rows first (before any write).
      const prepared = [];
      for (const row of validRows) {
        const prod = products.find(p => p.id.toString() === row.product.toString());
        const batchData = prod?.batches.find(b => b.batch === row.batch);
        if (!batchData) throw new Error("Batch not found for a product.");
        const actualStrips = Math.round(Number(row.actualQty) || 0);
        const sysStrips = Math.round(Number(batchData.qty) || 0);
        const itemId = 'ADJI-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
        prepared.push({ productId: row.product, batchData, actualStrips, sysStrips, diff: actualStrips - sysStrips, itemId });
      }

      // Atomic: header + items (audit: system vs physical) + set batch quantities.
      const operations = [];
      operations.push({
        sql: `INSERT INTO stock_adjustments (id, company_id, entry_no, date, reason, notes, created_at)
              VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        params: [adjId, companyId, refNo || adjId, adjDate, reason, "Authorized by: " + authBy],
      });
      for (const { productId, batchData, actualStrips, sysStrips, diff, itemId } of prepared) {
        operations.push({
          sql: `INSERT INTO stock_adjustment_items (id, adjustment_id, product_id, batch_id, system_qty, physical_qty, difference_qty, reason)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          params: [itemId, adjId, productId, batchData.id, sysStrips, actualStrips, diff, mapReason(reason)],
        });
        operations.push({
          sql: `UPDATE batches SET current_qty = ?, updated_at = datetime('now') WHERE id = ?`,
          params: [actualStrips, batchData.id],
        });
      }

      const txRes = await window.pharmaAPI.db.transaction(operations);
      if (!txRes?.success) throw new Error(txRes?.error || 'Failed to save adjustment');

      // Sync AFTER commit: header, items, and each affected batch.
      await syncEntity('StockAdjustment', 'create', {
        id: adjId,
        companyId,
        entryNo: refNo || adjId,
        date: new Date(adjDate).toISOString(),
        reason: mapReason(reason),
        notes: "Authorized by: " + authBy,
      });
      for (const { productId, batchData, actualStrips, sysStrips, diff, itemId } of prepared) {
        await syncEntity('StockAdjustmentItem', 'create', {
          id: itemId,
          adjustmentId: adjId,
          productId,
          batchId: batchData.id,
          systemQty: sysStrips,
          physicalQty: actualStrips,
          differenceQty: diff,
          reason: mapReason(reason),
        });
        await syncEntity('Batch', 'update', { id: batchData.id, currentQty: actualStrips });
      }

      alert("Stock Adjustment saved!");
      resetForm();
      await fetchAdjustments();
    } catch(err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 'calc(100vh - 120px)' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">{editingAdjId ? 'Edit Adjustment Details' : 'Stock Adjustment'}</h1>
          <div className="page-sub">Reconcile physical stock with system stock</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {editingAdjId && (
            <button className="btn btn-outline" onClick={resetForm}><X size={16} /> Cancel</button>
          )}
          <button className="btn btn-outline"><Printer size={16} /> Print Report</button>
          <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> {editingAdjId ? 'Update Details' : 'Save Adjustment'}</button>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {editingAdjId && (
            <div style={{ background: '#FEF3C7', color: '#92400E', padding: '0.6rem 0.85rem', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #FDE68A', fontSize: '0.85rem' }}>
              Editing adjustment details only — <b>counted quantities are locked</b>. To re-count stock, create a new adjustment.
            </div>
          )}
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

      {!editingAdjId && (
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="card-body no-pad" style={{ flex: 1, overflow: 'auto', minHeight: '300px' }}>
          <table className="data-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ width: '300px' }}>Product</th>
                <th style={{ width: '200px' }}>Batch</th>
                <th style={{ width: '150px' }}>System Qty (Strips)</th>
                <th style={{ width: '150px' }}>Actual Qty (Strips)</th>
                <th style={{ width: '150px' }}>Difference (+/-)</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const prod = products.find(p => p.id.toString() === r.product.toString());
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
                          <option key={b.id} value={b.batch}>{b.batch} ({b.qty} Strips in system)</option>
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
      )}

      {/* Recent adjustments — edit details (date/reference/reason/authorized-by) from here */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ fontSize: '1rem' }}>Recent Adjustments</h3>
        </div>
        <div className="card-body no-pad" style={{ maxHeight: '320px', overflow: 'auto' }}>
          <table className="data-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th>Reference</th>
                <th>Date</th>
                <th>Reason</th>
                <th style={{ textAlign: 'center' }}>Items</th>
                <th>Authorized By</th>
                <th style={{ width: '70px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {adjustmentsList.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>No adjustments yet.</td></tr>
              ) : adjustmentsList.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.entry_no}</td>
                  <td>{String(a.date || '').slice(0, 10)}</td>
                  <td>{a.reason}</td>
                  <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{a.itemCount}</td>
                  <td>{String(a.notes || '').replace(/^Authorized by:\s*/, '') || '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ padding: '3px 7px', minWidth: 0, color: '#D97706', borderColor: '#D97706' }}
                      title="Edit adjustment details"
                      onClick={() => handleEditAdj(a)}
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