import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Printer, Calculator, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { syncEntity } from '../../services/dataService';
export default function Purchase() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([
    { id: 1, product: '', batch: '', expiry: '', qty: 0, free: 0, ptr: 0, mrp: 0, disc1: 0, disc2: 0, gst: 12, amount: 0 }
  ]);
  const [totals, setTotals] = useState({ sub: 0, disc: 0, gst: 0, net: 0 });
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [gstType, setGstType] = useState('Local (CGST + SGST) - Exclusive');
  const [paymentMode, setPaymentMode] = useState('Credit');
  
  const [suppliersList, setSuppliersList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const supRes = await window.pharmaAPI.db.query("SELECT id, name, city FROM suppliers ORDER BY name ASC");
        setSuppliersList(supRes?.data || []);

        const prodRes = await window.pharmaAPI.db.query("SELECT id, name, gst_rate FROM products ORDER BY name ASC");
        setProductsList(prodRes?.data || []);
      } catch (err) {
        console.error('Failed to load master data for purchase:', err);
        setErrorMsg('Failed to load suppliers/products from database.');
      }
    };
    fetchMasterData();
  }, []);

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

    const hasChanged = newRows.some((r, i) => Math.abs(r.amount - rows[i].amount) > 0.01);
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
    setRows(rows.map(r => {
      if (r.id === id) {
        let updated = { ...r, [field]: value };
        if (field === 'product') {
          const prod = productsList.find(p => p.id === value);
          if (prod) updated.gst = prod.gst_rate;
        }
        return updated;
      }
      return r;
    }));
  };

  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const handleSave = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!supplierId || !invoiceNo || !invoiceDate) {
      setErrorMsg("Supplier, Invoice No, and Invoice Date are required.");
      return;
    }

    const validRows = rows.filter(r => r.product && r.batch && r.qty > 0 && r.ptr > 0 && r.mrp > 0);
    if (validRows.length === 0) {
      setErrorMsg("Please add at least one valid product row with Batch, Qty, PTR, and MRP.");
      return;
    }

    setIsSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userRes = await window.pharmaAPI.db.query("SELECT company_id FROM users WHERE email = ?", [user.email]);
      if (!userRes?.data?.length) throw new Error("Admin user not found in local DB");
      const companyId = userRes.data[0].company_id;
      const purchaseId = 'PUR-' + Date.now();
      const entryNo = 'PE-' + Date.now().toString().slice(-6);

      const operations = [];

      // 1. Insert into purchases
      operations.push({
        sql: `INSERT INTO purchases (
          id, company_id, entry_no, supplier_id, invoice_no, invoice_date, gst_type,
          subtotal, discount_amount, taxable_amount, net_amount, payment_mode, paid_amount, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'saved', datetime('now'), datetime('now'))`,
        params: [
          purchaseId, companyId, entryNo, supplierId, invoiceNo, invoiceDate, gstType,
          totals.sub, totals.disc, totals.sub - totals.disc, totals.net, paymentMode, paymentMode === 'Credit' ? 0 : totals.net
        ]
      });

      // Insert payment if not credit
      let paymentId = null;
      let pModeNormalized = null;
      let paymentNo = null;
      if (paymentMode !== 'Credit') {
        pModeNormalized = paymentMode === 'Cash' ? 'cash' : 'bank';
        paymentId = 'PAY-' + Date.now();
        paymentNo = 'PMT-' + Date.now().toString().slice(-6);
        operations.push({
          sql: `INSERT INTO payments (
            id, company_id, payment_no, supplier_id, date, amount, payment_mode, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          params: [
            paymentId, companyId, paymentNo, supplierId, invoiceDate, totals.net, pModeNormalized, 'Against Purchase ' + invoiceNo
          ]
        });
      }

      const syncItems = [];
      // 2. Insert items and update batches
      for (const row of validRows) {
        const batchId = 'BCH-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        
        // Upsert Batch
        operations.push({
          sql: `INSERT INTO batches (
            id, product_id, batch_no, expiry_date, mrp, ptr, purchase_price, gst_rate, current_qty, free_qty, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          ON CONFLICT(product_id, batch_no) DO UPDATE SET 
            current_qty = current_qty + excluded.current_qty,
            free_qty = free_qty + excluded.free_qty,
            mrp = excluded.mrp,
            ptr = excluded.ptr,
            updated_at = datetime('now')`,
          params: [
            batchId, row.product, row.batch, row.expiry || '12/99', row.mrp, row.ptr, row.ptr, row.gst, row.qty, row.free
          ]
        });

        // We can't know the exact batch ID for sync update if it was an upsert, but we can just use the provided batchId for sync creation
        // Note: The cloud backend will just perform an upsert on batch as well if we pass 'create'
        syncItems.push({
          tableName: 'Batch',
          operation: 'create',
          payload: {
            id: batchId,
            productId: row.product,
            batchNo: row.batch,
            expiryDate: row.expiry || '12/99',
            mrp: row.mrp,
            ptr: row.ptr,
            purchasePrice: row.ptr,
            gstRate: row.gst,
            currentQty: row.qty,
            freeQty: row.free
          }
        });

        // Insert Purchase Item (Using a subquery to get the correct batch_id just in case it was updated, or we can use the batchId if it's new. 
        // To be safe, we resolve batch_id using SELECT inside the insert)
        const purchaseItemId = 'P-ITM-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        operations.push({
          sql: `INSERT INTO purchase_items (
            id, purchase_id, product_id, batch_id, qty, free_qty, purchase_price, ptr, mrp, disc_percent, gst_rate, net_amount
          ) VALUES (?, ?, ?, (SELECT id FROM batches WHERE product_id = ? AND batch_no = ?), ?, ?, ?, ?, ?, ?, ?, ?)`,
          params: [
            purchaseItemId,
            purchaseId,
            row.product,
            row.product, row.batch,
            row.qty, row.free, row.ptr, row.ptr, row.mrp, row.disc1, row.gst, row.amount
          ]
        });

        syncItems.push({
          tableName: 'PurchaseItem',
          operation: 'create',
          payload: {
            id: purchaseItemId,
            purchaseId,
            productId: row.product,
            batchId, // Close enough, we use the generated one
            qty: row.qty,
            freeQty: row.free,
            purchasePrice: row.ptr,
            ptr: row.ptr,
            mrp: row.mrp,
            discPercent: row.disc1,
            gstRate: row.gst,
            netAmount: row.amount
          }
        });
      }

      const res = await window.pharmaAPI.db.transaction(operations);
      
      if (!res.success) {
        throw new Error(res.error || 'Transaction failed');
      }

      const mapPaymentMode = (pm) => {
        if (pm === 'Cash') return 'cash';
        if (pm === 'Credit') return 'credit';
        return 'upi'; // For Bank / UPI
      };

      const mappedPm = mapPaymentMode(paymentMode);

      // Sync to cloud
      await syncEntity('Purchase', 'create', {
        id: purchaseId,
        companyId,
        entryNo,
        supplierId,
        invoiceNo,
        invoiceDate: new Date(invoiceDate).toISOString(),
        gstType: 'exclusive',
        subtotal: totals.sub,
        discountAmount: totals.disc,
        taxableAmount: totals.sub - totals.disc,
        netAmount: totals.net,
        paymentMode: mappedPm,
        paidAmount: paymentMode === 'Credit' ? 0 : totals.net,
        status: 'saved'
      });

      if (paymentMode !== 'Credit') {
        await syncEntity('Payment', 'create', {
          id: paymentId,
          companyId,
          paymentNo,
          supplierId,
          date: new Date(invoiceDate).toISOString(),
          amount: totals.net,
          paymentMode: mappedPm === 'cash' ? 'cash' : 'upi',
          notes: 'Against Purchase ' + invoiceNo
        });
      }

      for (const item of syncItems) {
        await syncEntity(item.tableName, item.operation, item.payload);
      }

      setSuccessMsg(`Purchase Invoice ${invoiceNo} saved successfully! Entry No: ${entryNo}`);
      
      // Reset form
      setSupplierId('');
      setInvoiceNo('');
      setPaymentMode('Credit');
      setRows([{ id: Date.now(), product: '', batch: '', expiry: '', qty: 0, free: 0, ptr: 0, mrp: 0, disc1: 0, disc2: 0, gst: 12, amount: 0 }]);
      
    } catch (err) {
      console.error("Purchase save error:", err);
      setErrorMsg("Failed to save purchase: " + err.message);
    } finally {
      setIsSaving(false);
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
          <button className="btn btn-outline" onClick={() => navigate('/transactions/purchases')}><ArrowLeft size={16} /> Back</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
            <Save size={16} /> {isSaving ? 'Saving...' : 'Save Purchase Bill'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} /> <strong>Error:</strong> {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '0.75rem 1rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <strong>Success:</strong> {successMsg}
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Supplier / Distributor <span className="text-danger">*</span></label>
              <select className="form-select" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                <option value="">Select Supplier...</option>
                {suppliersList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.city})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Supplier Invoice No <span className="text-danger">*</span></label>
              <input type="text" className="form-input" placeholder="e.g. INV-12345" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Invoice Date <span className="text-danger">*</span></label>
              <input type="date" className="form-input" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Mode</label>
              <select className="form-select" value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                <option value="Credit">Credit</option>
                <option value="Cash">Cash</option>
                <option value="Bank / UPI">Bank / UPI</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">GST Type</label>
              <select className="form-select" value={gstType} onChange={e => setGstType(e.target.value)}>
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
                <th style={{ width: '200px' }}>Product <span className="text-danger">*</span></th>
                <th style={{ width: '100px' }}>Batch <span className="text-danger">*</span></th>
                <th style={{ width: '80px' }}>Expiry</th>
                <th style={{ width: '70px' }}>Qty <span className="text-danger">*</span></th>
                <th style={{ width: '70px' }}>Free</th>
                <th style={{ width: '90px' }}>PTR (₹) <span className="text-danger">*</span></th>
                <th style={{ width: '90px' }}>MRP (₹) <span className="text-danger">*</span></th>
                <th style={{ width: '70px' }}>D1%</th>
                <th style={{ width: '70px' }}>D2%</th>
                <th style={{ width: '80px' }}>GST%</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Net (₹)</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <select className="form-select form-input-sm" value={r.product} onChange={e => updateRow(r.id, 'product', e.target.value)}>
                      <option value="">Search Product...</option>
                      {productsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </td>
                  <td><input type="text" className="form-input form-input-sm" placeholder="Batch No" value={r.batch} onChange={e => updateRow(r.id, 'batch', e.target.value.toUpperCase())} /></td>
                  <td><input type="text" className="form-input form-input-sm" placeholder="MM/YY" value={r.expiry} onChange={e => updateRow(r.id, 'expiry', e.target.value)} /></td>
                  <td><input type="number" className="form-input form-input-sm" min="0" value={r.qty === 0 ? '' : r.qty} onChange={e => updateRow(r.id, 'qty', e.target.value)} /></td>
                  <td><input type="number" className="form-input form-input-sm" min="0" value={r.free === 0 ? '' : r.free} onChange={e => updateRow(r.id, 'free', e.target.value)} /></td>
                  <td><input type="number" className="form-input form-input-sm" min="0" step="0.01" value={r.ptr === 0 ? '' : r.ptr} onChange={e => updateRow(r.id, 'ptr', e.target.value)} /></td>
                  <td><input type="number" className="form-input form-input-sm" min="0" step="0.01" value={r.mrp === 0 ? '' : r.mrp} onChange={e => updateRow(r.id, 'mrp', e.target.value)} /></td>
                  <td><input type="number" className="form-input form-input-sm" min="0" step="0.01" value={r.disc1 === 0 ? '' : r.disc1} onChange={e => updateRow(r.id, 'disc1', e.target.value)} /></td>
                  <td><input type="number" className="form-input form-input-sm" min="0" step="0.01" value={r.disc2 === 0 ? '' : r.disc2} onChange={e => updateRow(r.id, 'disc2', e.target.value)} /></td>
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