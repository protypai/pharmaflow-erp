import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Printer, Search } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { syncEntity } from '../../services/dataService';
import { toIsoExpiry } from '../../utils/dates';

export default function SalesReturn() {
  const { id: editId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!editId;
  const [customers, set_customers] = useState([]);
  const [products, set_products] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res_customers = await window.pharmaAPI.db.query("SELECT * FROM customers WHERE COALESCE(status, 'active') <> 'inactive'");
      set_customers(res_customers?.data || []);
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

  // Edit mode: load the existing return (header + items) into the form.
  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const hdrRes = await window.pharmaAPI.db.query("SELECT * FROM sale_returns WHERE id = ?", [editId]);
        const hdr = hdrRes?.data?.[0];
        if (!hdr) { setErrorMsg("Return not found."); return; }
        setCustomerId(hdr.customer_id);
        setOriginalSaleId(hdr.sale_id || null);
        setReturnDate(String(hdr.return_date || '').slice(0, 10) || new Date().toISOString().split('T')[0]);
        setReturnReason(hdr.reason || 'Salable Return (Add back to active stock)');
        setOriginalIsSalable(String(hdr.reason || '').includes('Salable'));
        setExistingEntryNo(hdr.entry_no || null);

        const itRes = await window.pharmaAPI.db.query(`
          SELECT sri.*, b.batch_no, b.expiry_date, p.gst_rate as prod_gst
          FROM sale_return_items sri
          JOIN batches b ON sri.batch_id = b.id
          JOIN products p ON sri.product_id = p.id
          WHERE sri.return_id = ?
        `, [editId]);
        const items = itRes?.data || [];
        setOriginalItems(items.map(i => ({ id: i.id, batch_id: i.batch_id, qty: Number(i.qty) || 0, free_qty: Number(i.free_qty) || 0 })));
        if (items.length > 0) {
          setRows(items.map(i => {
            const qty = Number(i.qty) || 0;
            const rate = Number(i.sale_price || i.mrp) || 0;
            const gst = Number(i.prod_gst || 12);
            const net = Number(i.net_amount) || 0;
            const gross = qty * rate * (1 + gst / 100);
            // sale_return_items doesn't persist discount; recover the effective %
            // from the stored net so re-saving keeps the original credit-note value.
            const disc = gross > 0 ? Math.max(0, Math.min(100, (1 - net / gross) * 100)) : 0;
            return {
              id: Date.now() + Math.random(),
              product: i.product_id.toString(),
              batch_id: i.batch_id,
              batch: i.batch_no,
              expiry: i.expiry_date,
              qty: i.qty,
              free_qty: i.free_qty || 0,
              rate,
              disc,
              gst,
              amount: 0,
            };
          }));
        }
      } catch (err) {
        setErrorMsg("Failed to load return: " + err.message);
      }
    })();
  }, [editId]);

  const [lookupInvoiceNo, setLookupInvoiceNo] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnReason, setReturnReason] = useState('Salable Return (Add back to active stock)');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [originalSaleId, setOriginalSaleId] = useState(null);
  // Edit-mode context: the return's original items (to reverse stock + delete on save),
  // whether the original return was salable (added stock), and its existing entry number.
  const [originalItems, setOriginalItems] = useState([]);
  const [originalIsSalable, setOriginalIsSalable] = useState(false);
  const [existingEntryNo, setExistingEntryNo] = useState(null);

  const [customerId, setCustomerId] = useState('');
  
  const [rows, setRows] = useState([
    { id: 1, product: '', batch: '', expiry: '', qty: 0, free_qty: 0, rate: 0, disc: 0, gst: 12, amount: 0 }
  ]);
  const [totals, setTotals] = useState({ sub: 0, disc: 0, gst: 0, net: 0 });

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
    setRows([...rows, { id: Date.now(), product: '', batch: '', expiry: '', qty: 0, free_qty: 0, rate: 0, disc: 0, gst: 12, amount: 0 }]);
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(r => {
      if (r.id !== id) return r;
      
      let updated = { ...r, [field]: value };
      
      if (field === 'product') {
        updated.batch = '';
        updated.expiry = '';
        updated.rate = 0;
        const prod = products.find(p => p.id.toString() === value.toString());
        if (prod) updated.gst = prod.gst_rate ?? 12;
      }
      
      if (field === 'batch' && r.product) {
        const prod = products.find(p => p.id.toString() === r.product.toString());
        if (prod) {
          const batchData = prod.batches.find(b => b.batch === value);
          if (batchData) {
            updated.expiry = batchData.expiry;
            updated.rate = batchData.ptr || batchData.sale_price || batchData.mrp; 
          }
        }
      }
      return updated;
    }));
  };

  const removeRow = (id) => {
    setRows(rows.filter(r => r.id !== id));
  };

  const handleFetchInvoice = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!lookupInvoiceNo) return;
    try {
      const saleRes = await window.pharmaAPI.db.query("SELECT * FROM sales WHERE invoice_no = ?", [lookupInvoiceNo]);
      if (!saleRes.success || saleRes.data.length === 0) {
        setErrorMsg("Invoice not found.");
        return;
      }
      const sale = saleRes.data[0];
      setCustomerId(sale.customer_id);
      setOriginalSaleId(sale.id);

      const itemsRes = await window.pharmaAPI.db.query(`
        SELECT si.*, b.batch_no, b.expiry_date, p.gst_rate as prod_gst
        FROM sale_items si
        JOIN batches b ON si.batch_id = b.id
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
      `, [sale.id]);

      if (itemsRes.success && itemsRes.data.length > 0) {
        const newRows = itemsRes.data.map(item => ({
          id: Date.now() + Math.random(),
          product: item.product_id.toString(),
          batch_id: item.batch_id,
          batch: item.batch_no,
          expiry: item.expiry_date,
          qty: item.qty,
          free_qty: item.free_qty || 0,
          rate: item.sale_price || item.ptr || item.mrp, 
          disc: item.disc_percent || 0,
          gst: item.gst_rate || item.prod_gst || 12,
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
    if (!customerId) { setErrorMsg("Please select a customer."); return; }
    if (rows.length === 0 || !rows[0].product) { setErrorMsg("Please add at least one product to return."); return; }

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const compRes = await window.pharmaAPI.db.query("SELECT id FROM companies LIMIT 1");
      if (!compRes?.data?.length) throw new Error("Company profile not found in local DB");
      const companyId = compRes.data[0].id;
      const returnId = isEditMode ? editId : 'SR-' + Date.now();
      const entryNo = isEditMode ? (existingEntryNo || 'SRET-' + Date.now()) : 'SRET-' + Date.now();

      const mapReturnReason = (r) => {
        if (r.includes('Salable')) return 'excess_supply';
        if (r.includes('Expired')) return 'expired';
        if (r.includes('Breakage')) return 'damaged';
        return 'quality_issue';
      };
      const mappedReason = mapReturnReason(returnReason);
      const isSalable = returnReason.includes('Salable');

      // 1) Resolve & validate every row BEFORE writing anything (no ghost-header state).
      const prepared = [];
      for (const row of rows) {
        if (!row.product || !row.qty) continue;
        const prod = products.find(p => p.id.toString() === row.product.toString());
        const batchData = prod?.batches.find(b => b.batch === row.batch);
        if (!batchData) throw new Error("Batch not found for product.");
        
        // Defensive validation fallback to prevent SQLite NOT NULL/NaN constraint crashes
        const finalRate = row.rate !== undefined && row.rate !== '' && !isNaN(Number(row.rate)) 
          ? Number(row.rate) 
          : (batchData.ptr || batchData.sale_price || batchData.mrp || 0);

        const returnItemId = 'SRI-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
        prepared.push({ row: { ...row, rate: finalRate }, batchData, returnItemId });
      }
      if (prepared.length === 0) throw new Error("Please add at least one product to return.");

      const operations = [];

      // Net stock change per batch. A salable return ADDS stock back. On EDIT we reverse
      // the OLD return's stock effect first, then apply the NEW one — net delta per batch.
      const batchDelta = {};
      if (isEditMode && originalIsSalable) {
        for (const it of originalItems) {
          batchDelta[it.batch_id] = (batchDelta[it.batch_id] || 0) - Math.round(Number(it.qty) || 0) - Math.round(Number(it.free_qty) || 0);
        }
      }
      if (isSalable) {
        for (const { row, batchData } of prepared) {
          batchDelta[batchData.id] = (batchDelta[batchData.id] || 0) + Math.round(Number(row.qty) || 0) + Math.round(Number(row.free_qty) || 0);
        }
      }

      // Negative-stock guard for any batch whose net change is a reduction.
      for (const [bId, delta] of Object.entries(batchDelta)) {
        if (delta < 0) {
          const cur = await window.pharmaAPI.db.query("SELECT current_qty FROM batches WHERE id = ?", [bId]);
          const currentQty = Number(cur?.data?.[0]?.current_qty ?? 0);
          if (currentQty + delta < 0) {
            throw new Error(`This edit would make stock negative for a returned batch (only ${currentQty} strip(s) in stock).`);
          }
        }
      }

      // 2) Header: UPDATE on edit (clearing old items first), INSERT on create.
      if (isEditMode) {
        operations.push({ sql: `DELETE FROM sale_return_items WHERE return_id = ?`, params: [returnId] });
        operations.push({
          sql: `UPDATE sale_returns SET sale_id = ?, customer_id = ?, return_date = ?, reason = ?, net_amount = ?, updated_at = datetime('now') WHERE id = ?`,
          params: [originalSaleId, customerId, returnDate, returnReason, totals.net, returnId],
        });
      } else {
        operations.push({
          sql: `INSERT INTO sale_returns (id, company_id, entry_no, sale_id, customer_id, return_date, reason, net_amount, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'saved', datetime('now'), datetime('now'))`,
          params: [returnId, companyId, entryNo, originalSaleId, customerId, returnDate, returnReason, totals.net],
        });
      }

      // 3) (Re)insert items — columns match the sale_return_items schema (mrp, sale_price).
      for (const { row, batchData, returnItemId } of prepared) {
        operations.push({
          sql: `INSERT INTO sale_return_items (id, return_id, product_id, batch_id, qty, free_qty, mrp, sale_price, net_amount, reason)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          params: [returnItemId, returnId, row.product, batchData.id, row.qty, row.free_qty || 0, batchData.mrp, row.rate, row.amount, mappedReason],
        });
      }

      // 4) Apply the net stock change per batch (one statement each).
      for (const [bId, delta] of Object.entries(batchDelta)) {
        if (delta === 0) continue;
        operations.push({
          sql: `UPDATE batches SET current_qty = current_qty + ?, updated_at = datetime('now') WHERE id = ?`,
          params: [delta, bId],
        });
      }

      const txRes = await window.pharmaAPI.db.transaction(operations);
      if (!txRes?.success) throw new Error(txRes?.error || 'Failed to save return');

      // 5) Sync AFTER the local write is committed.
      await syncEntity('SaleReturn', isEditMode ? 'update' : 'create', {
        id: returnId,
        companyId,
        entryNo,
        saleId: originalSaleId,
        customerId,
        returnDate: new Date(returnDate).toISOString(),
        reason: returnReason,
        netAmount: totals.net,
        status: 'saved'
      });

      if (isEditMode) {
        for (const it of originalItems) {
          await syncEntity('SaleReturnItem', 'delete', { id: it.id });
        }
      }

      for (const { row, batchData, returnItemId } of prepared) {
        await syncEntity('SaleReturnItem', 'create', {
          id: returnItemId,
          returnId,
          productId: row.product,
          batchId: batchData.id,
          qty: Number(row.qty),
          freeQty: Number(row.free_qty) || 0,
          mrp: Number(batchData.mrp),
          salePrice: Number(row.rate),
          netAmount: Number(row.amount),
          reason: mappedReason
        });
      }

      // Sync each affected batch with its live absolute quantity (post-commit).
      for (const bId of Object.keys(batchDelta)) {
        const cur = await window.pharmaAPI.db.query("SELECT * FROM batches WHERE id = ?", [bId]);
        if (cur?.data?.length) {
          const b = cur.data[0];
          await syncEntity('Batch', 'update', {
            id: b.id,
            productId: b.product_id,
            batchNo: b.batch_no,
            expiryDate: b.expiry_date ? toIsoExpiry(b.expiry_date) : null,
            mrp: b.mrp,
            ptr: b.ptr,
            pts: b.pts || 0,
            purchasePrice: b.purchase_price,
            gstRate: b.gst_rate,
            currentQty: b.current_qty,
            freeQty: b.free_qty || 0
          });
        }
      }

      if (isEditMode) {
        setSuccessMsg("Sales Return updated successfully!");
        setTimeout(() => navigate('/reports/sales-return'), 800);
      } else {
        setSuccessMsg("Sales Return saved successfully!");
        setRows([{ id: 1, product: '', batch: '', expiry: '', qty: 0, free_qty: 0, rate: 0, disc: 0, gst: 12, amount: 0 }]);
        setLookupInvoiceNo('');
        setOriginalSaleId(null);
      }
    } catch (err) {
      setErrorMsg("Failed to save return: " + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 'calc(100vh - 120px)' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">{isEditMode ? 'Edit Sales Return (Credit Note)' : 'Sales Return (Credit Note)'}</h1>
          <div className="page-sub">Receive returns from customer and issue credit note</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline"><Printer size={16} /> Print Credit Note</button>
          <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> {isEditMode ? 'Update Return' : 'Save Return'}</button>
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
          <div className="form-row-4">
            <div className="form-group">
              <label className="form-label">Customer <span className="text-danger">*</span></label>
              <select className="form-select" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">Select Customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Return Date <span className="text-danger">*</span></label>
              <input type="date" className="form-input" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Original Sales Bill No (Lookup)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div className="search-input-wrap" style={{ flex: 1 }}>
                  <Search size={16} className="search-icon" />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter bill to auto-fill..." 
                    value={lookupInvoiceNo}
                    onChange={e => setLookupInvoiceNo(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleFetchInvoice()}
                  />
                </div>
                <button className="btn btn-secondary" onClick={handleFetchInvoice}>Fetch</button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Stock Status / Reason</label>
              <select className="form-select" value={returnReason} onChange={e => setReturnReason(e.target.value)}>
                <option value="Salable Return (Add back to active stock)">Salable Return (Add back to active stock)</option>
                <option value="Expired Return (Move to damage Godown)">Expired Return (Move to damage Godown)</option>
                <option value="Breakage / Damaged (Write-off)">Breakage / Damaged (Write-off)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="card-body no-pad" style={{ flex: 1, overflow: 'auto', minHeight: '300px' }}>
          <table className="data-table" style={{ minWidth: '1000px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ width: '250px' }}>Product</th>
                <th style={{ width: '150px' }}>Batch</th>
                <th style={{ width: '100px' }}>Expiry</th>
                <th style={{ width: '100px' }}>Return Qty (Strips)</th>
                <th style={{ width: '100px' }}>Free Qty</th>
                <th style={{ width: '120px' }}>Billed Rate (₹)</th>
                <th style={{ width: '100px' }}>Disc %</th>
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
                    <td><input type="number" className="form-input form-input-sm" min="0" value={r.free_qty || ''} onChange={e => updateRow(r.id, 'free_qty', e.target.value)} /></td>
                    <td><input type="number" className="form-input form-input-sm" value={r.rate || ''} onChange={e => updateRow(r.id, 'rate', e.target.value)} /></td>
                    <td><input type="number" className="form-input form-input-sm" value={r.disc || ''} onChange={e => updateRow(r.id, 'disc', e.target.value)} /></td>
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
                <td colSpan="9">
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
              <span>Discount Reversed:</span> <span>- ₹ {totals.disc.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>GST Reversed:</span> <span>+ ₹ {totals.gst.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
              <span>Net Credit Note:</span> <span style={{ color: 'var(--success)' }}>₹ {totals.net.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}