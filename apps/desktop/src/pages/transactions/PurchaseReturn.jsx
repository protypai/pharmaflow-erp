import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Printer, Search } from 'lucide-react';
import { syncEntity } from '../../services/dataService';

export default function PurchaseReturn() {
  const [suppliers, set_suppliers] = useState([]);
  const [products, set_products] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res_suppliers = await window.pharmaAPI.db.query("SELECT * FROM suppliers");
      set_suppliers(res_suppliers?.data || []);
      const res_products = await window.pharmaAPI.db.query(`
        SELECT p.*, json_group_array(json_object('id', b.id, 'batch', b.batch_no, 'expiry', b.expiry_date, 'mrp', b.mrp, 'ptr', b.ptr, 'current_qty', b.current_qty)) as batches
        FROM products p
        LEFT JOIN batches b ON p.id = b.product_id
        GROUP BY p.id
      `);
      set_products(res_products?.data?.map(p => ({
        ...p,
        batches: p.batches ? JSON.parse(p.batches).filter(b => b.id) : []
      })) || []);
    };
    fetchData();
  }, []);

  const [lookupInvoiceNo, setLookupInvoiceNo] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnReason, setReturnReason] = useState('Expiry / Near Expiry');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [originalPurchaseId, setOriginalPurchaseId] = useState(null);

  const [supplierId, setSupplierId] = useState('');
  
  const [rows, setRows] = useState([
    { id: 1, product: '', batch: '', expiry: '', qty: 0, ptr: 0, gst: 12, amount: 0 }
  ]);
  const [totals, setTotals] = useState({ sub: 0, gst: 0, net: 0 });

  useEffect(() => {
    let sub = 0;
    let totalGst = 0;

    const newRows = rows.map(r => {
      const baseAmt = (Number(r.qty) || 0) * (Number(r.ptr) || 0);
      const gstAmt = baseAmt * ((Number(r.gst) || 0) / 100);
      const rowNet = baseAmt + gstAmt;

      sub += baseAmt;
      totalGst += gstAmt;

      return { ...r, amount: rowNet };
    });

    const hasChanged = newRows.some((r, i) => r.amount !== rows[i].amount);
    if (hasChanged) setRows(newRows);
    
    setTotals({
      sub,
      gst: totalGst,
      net: Math.round(sub + totalGst)
    });
  }, [rows]);

  const addRow = () => {
    setRows([...rows, { id: Date.now(), product: '', batch: '', expiry: '', qty: 0, ptr: 0, gst: 12, amount: 0 }]);
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(r => {
      if (r.id !== id) return r;
      
      let updated = { ...r, [field]: value };
      
      if (field === 'product') {
        updated.batch = '';
        updated.expiry = '';
        updated.ptr = 0;
        const prod = products.find(p => p.id.toString() === value.toString());
        if (prod) updated.gst = prod.gst;
      }
      
      if (field === 'batch' && r.product) {
        const prod = products.find(p => p.id.toString() === r.product.toString());
        if (prod) {
          const batchData = prod.batches.find(b => b.batch === value);
          if (batchData) {
            updated.expiry = batchData.expiry;
            updated.ptr = batchData.ptr || 0; 
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

  const handleFetchInvoice = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!lookupInvoiceNo) return;
    try {
      const purRes = await window.pharmaAPI.db.query("SELECT * FROM purchases WHERE invoice_no = ?", [lookupInvoiceNo]);
      if (!purRes.success || purRes.data.length === 0) {
        setErrorMsg("Invoice not found.");
        return;
      }
      const purchase = purRes.data[0];
      setSupplierId(purchase.supplier_id);
      setOriginalPurchaseId(purchase.id);

      const itemsRes = await window.pharmaAPI.db.query(`
        SELECT pi.*, b.batch_no, b.expiry_date, p.gst_rate as prod_gst
        FROM purchase_items pi
        JOIN batches b ON pi.batch_id = b.id
        JOIN products p ON pi.product_id = p.id
        WHERE pi.purchase_id = ?
      `, [purchase.id]);

      if (itemsRes.success && itemsRes.data.length > 0) {
        const newRows = itemsRes.data.map(item => ({
          id: Date.now() + Math.random(),
          product: item.product_id.toString(),
          batch_id: item.batch_id,
          batch: item.batch_no,
          expiry: item.expiry_date,
          qty: item.qty,
          ptr: item.ptr,
          gst: item.prod_gst || 12,
          amount: 0 // Will be calculated by useEffect
        }));
        setRows(newRows);
        setSuccessMsg("Invoice loaded successfully. Adjust quantities to return.");
      } else {
        setErrorMsg("No items found for this invoice.");
      }
    } catch (err) {
      setErrorMsg("Error fetching invoice: " + err.message);
    }
  };

  const handleSave = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!supplierId) { setErrorMsg("Please select a supplier."); return; }
    if (rows.length === 0 || !rows[0].product) { setErrorMsg("Please add at least one product to return."); return; }

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const companyId = user.companyId || 'COMP-DEMO-001';
      const returnId = 'PR-' + Date.now();
      const entryNo = 'RET-' + Date.now();

      const res = await window.pharmaAPI.db.run(`
        INSERT INTO purchase_returns (id, company_id, entry_no, purchase_id, supplier_id, return_date, reason, net_amount, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'saved', datetime('now'), datetime('now'))
      `, [returnId, companyId, entryNo, originalPurchaseId, supplierId, returnDate, returnReason, totals.net]);

      if (!res.success) throw new Error(res.error);

      await syncEntity('PurchaseReturn', 'create', {
        id: returnId,
        companyId,
        entryNo,
        purchaseId: originalPurchaseId,
        supplierId,
        returnDate: new Date(returnDate).toISOString(),
        reason: returnReason,
        netAmount: totals.net,
        status: 'saved'
      });

      for (const row of rows) {
        if (!row.product || !row.qty) continue;
        const prod = products.find(p => p.id.toString() === row.product.toString());
        const batchData = prod?.batches.find(b => b.batch === row.batch);
        if (!batchData) throw new Error("Batch not found for product.");

        const returnItemId = 'PRI-' + Date.now() + Math.random();
        await window.pharmaAPI.db.run(`
          INSERT INTO purchase_return_items (id, return_id, product_id, batch_id, qty, mrp, ptr, net_amount, reason)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [returnItemId, returnId, row.product, batchData.id, row.qty, batchData.mrp, row.ptr, row.amount, returnReason]);

        const mapReturnReason = (r) => {
          if (r.includes('Expiry')) return 'expired';
          if (r.includes('Damaged')) return 'damaged';
          if (r.includes('Rate')) return 'quality_issue';
          if (r.includes('Excess')) return 'excess_supply';
          return 'quality_issue';
        };

        await syncEntity('PurchaseReturnItem', 'create', {
          id: returnItemId,
          returnId,
          productId: row.product,
          batchId: batchData.id,
          qty: row.qty,
          mrp: batchData.mrp,
          ptr: row.ptr,
          netAmount: row.amount,
          reason: mapReturnReason(returnReason)
        });

        // Decrease stock
        await window.pharmaAPI.db.run(`
          UPDATE batches SET current_qty = current_qty - ? WHERE id = ?
        `, [row.qty, batchData.id]);
        
        await syncEntity('Batch', 'update', {
          id: batchData.id,
          currentQty: batchData.current_qty - Number(row.qty)
        });
      }

      setSuccessMsg("Purchase Return saved successfully!");
      setRows([{ id: 1, product: '', batch: '', expiry: '', qty: 0, ptr: 0, gst: 12, amount: 0 }]);
      setLookupInvoiceNo('');
      setOriginalPurchaseId(null);
    } catch (err) {
      setErrorMsg("Failed to save return: " + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Purchase Return (Debit Note)</h1>
          <div className="page-sub">Return goods to supplier and issue debit note</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline"><Printer size={16} /> Print Debit Note</button>
          <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> Save Return</button>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {errorMsg && (
            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #f87171' }}>
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #86efac' }}>
              {successMsg}
            </div>
          )}
          
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Supplier <span className="text-danger">*</span></label>
              <select className="form-select" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                <option value="">Select Supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Return Date <span className="text-danger">*</span></label>
              <input type="date" className="form-input" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Original Invoice No (Lookup)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div className="search-input-wrap" style={{ flex: 1 }}>
                  <Search size={16} className="search-icon" />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter invoice to auto-fill..." 
                    value={lookupInvoiceNo}
                    onChange={e => setLookupInvoiceNo(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleFetchInvoice()}
                  />
                </div>
                <button className="btn btn-secondary" onClick={handleFetchInvoice}>Fetch</button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Reason for Return</label>
              <select className="form-select" value={returnReason} onChange={e => setReturnReason(e.target.value)}>
                <option value="Expiry / Near Expiry">Expiry / Near Expiry</option>
                <option value="Damaged Goods">Damaged Goods</option>
                <option value="Rate Difference">Rate Difference</option>
                <option value="Excess Supply">Excess Supply</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
          <table className="data-table" style={{ minWidth: '1000px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ width: '250px' }}>Product</th>
                <th style={{ width: '150px' }}>Batch</th>
                <th style={{ width: '100px' }}>Expiry</th>
                <th style={{ width: '100px' }}>Return Qty</th>
                <th style={{ width: '120px' }}>Original PTR (₹)</th>
                <th style={{ width: '100px' }}>GST%</th>
                <th style={{ width: '150px', textAlign: 'right' }}>Amount (₹)</th>
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
                          <option key={b.id} value={b.batch}>{b.batch}</option>
                        ))}
                      </select>
                    </td>
                    <td><input type="text" className="form-input form-input-sm" value={r.expiry} readOnly style={{ background: '#F8FAFC' }} /></td>
                    <td><input type="number" className="form-input form-input-sm" min="1" value={r.qty || ''} onChange={e => updateRow(r.id, 'qty', e.target.value)} /></td>
                    <td><input type="number" className="form-input form-input-sm" value={r.ptr || ''} onChange={e => updateRow(r.id, 'ptr', e.target.value)} /></td>
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
                <td colSpan="8">
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
              <span>Gross Return:</span> <span>₹ {totals.sub.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>GST Reversed:</span> <span>+ ₹ {totals.gst.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
              <span>Net Debit Note:</span> <span style={{ color: 'var(--danger)' }}>₹ {totals.net.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}