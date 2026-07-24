import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Printer, Search } from 'lucide-react';


export default function SalesReturn() {
  const [customers, set_customers] = useState([]);
  const [products, set_products] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res_customers = await window.pharmaAPI.db.query("SELECT * FROM customers");
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

  const [lookupInvoiceNo, setLookupInvoiceNo] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnReason, setReturnReason] = useState('Salable Return (Add back to active stock)');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [originalSaleId, setOriginalSaleId] = useState(null);

  const [customerId, setCustomerId] = useState('');
  
  const [rows, setRows] = useState([
    { id: 1, product: '', batch: '', expiry: '', qty: 0, rate: 0, disc: 0, gst: 12, amount: 0 }
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
    setRows([...rows, { id: Date.now(), product: '', batch: '', expiry: '', qty: 0, rate: 0, disc: 0, gst: 12, amount: 0 }]);
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
        if (prod) updated.gst = prod.gst;
      }
      
      if (field === 'batch' && r.product) {
        const prod = products.find(p => p.id.toString() === r.product.toString());
        if (prod) {
          const batchData = prod.batches.find(b => b.batch === value);
          if (batchData) {
            updated.expiry = batchData.expiry;
            updated.rate = batchData.mrp; 
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
          rate: item.mrp, 
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
      const companyId = user.companyId || 'COMP-DEMO-001';
      const returnId = 'SR-' + Date.now();
      const entryNo = 'SRET-' + Date.now();

      const res = await window.pharmaAPI.db.run(`
        INSERT INTO sale_returns (id, company_id, entry_no, sale_id, customer_id, return_date, reason, net_amount, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'saved', datetime('now'), datetime('now'))
      `, [returnId, companyId, entryNo, originalSaleId, customerId, returnDate, returnReason, totals.net]);

      if (!res.success) throw new Error(res.error);

      for (const row of rows) {
        if (!row.product || !row.qty) continue;
        const prod = products.find(p => p.id.toString() === row.product.toString());
        const batchData = prod?.batches.find(b => b.batch === row.batch);
        if (!batchData) throw new Error("Batch not found for product.");

        await window.pharmaAPI.db.run(`
          INSERT INTO sale_return_items (id, return_id, product_id, batch_id, qty, rate, disc_percent, gst_rate, net_amount, reason)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, ['SRI-' + Date.now() + Math.random(), returnId, row.product, batchData.id, row.qty, row.rate, row.disc, row.gst, row.amount, returnReason]);

        // Increase stock if salable return
        if (returnReason.includes("Salable")) {
          await window.pharmaAPI.db.run(`
            UPDATE batches SET current_qty = current_qty + ? WHERE id = ?
          `, [row.qty, batchData.id]);
        }
      }

      setSuccessMsg("Sales Return saved successfully!");
      setRows([{ id: 1, product: '', batch: '', expiry: '', qty: 0, rate: 0, disc: 0, gst: 12, amount: 0 }]);
      setLookupInvoiceNo('');
      setOriginalSaleId(null);
    } catch (err) {
      setErrorMsg("Failed to save return: " + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Sales Return (Credit Note)</h1>
          <div className="page-sub">Receive returns from customer and issue credit note</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline"><Printer size={16} /> Print Credit Note</button>
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
        <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
          <table className="data-table" style={{ minWidth: '1000px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ width: '250px' }}>Product</th>
                <th style={{ width: '150px' }}>Batch</th>
                <th style={{ width: '100px' }}>Expiry</th>
                <th style={{ width: '100px' }}>Return Qty</th>
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