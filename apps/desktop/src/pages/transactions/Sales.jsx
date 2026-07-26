import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Printer, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { syncEntity } from '../../services/dataService';
export default function Sales() {
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState('');
  const [customerWarning, setCustomerWarning] = useState(null);
  
  const [rows, setRows] = useState([
    { id: 1, product: '', batch: '', expiry: '', qty: 0, available: 0, rate: 0, mrp: 0, disc: 0, gst: 12, amount: 0, batchId: '' }
  ]);
  const [totals, setTotals] = useState({ sub: 0, disc: 0, gst: 0, net: 0 });

  const [customersList, setCustomersList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [doctorName, setDoctorName] = useState('');
  const [paymentMode, setPaymentMode] = useState('Credit');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const custRes = await window.pharmaAPI.db.query("SELECT id, name, area, credit_limit, opening_balance FROM customers ORDER BY name ASC");
        setCustomersList(custRes?.data || []);

        const prodRes = await window.pharmaAPI.db.query(`
          SELECT p.id as product_id, p.name as product_name, p.gst_rate,
                 b.id as batch_id, b.batch_no, b.expiry_date, b.mrp, b.ptr, b.current_qty as available
          FROM products p
          JOIN batches b ON p.id = b.product_id
          WHERE b.current_qty > 0
          ORDER BY p.name ASC, b.expiry_date ASC
        `);
        
        const prodMap = {};
        if (prodRes?.data) {
          prodRes.data.forEach(row => {
            if (!prodMap[row.product_id]) {
              prodMap[row.product_id] = {
                id: row.product_id,
                name: row.product_name,
                gst: row.gst_rate,
                batches: []
              };
            }
            prodMap[row.product_id].batches.push({
              id: row.batch_id,
              batch: row.batch_no,
              expiry: row.expiry_date,
              mrp: row.mrp,
              ptr: row.ptr,
              qty: row.available
            });
          });
        }
        setProductsList(Object.values(prodMap));
      } catch (err) {
        console.error('Failed to load master data for sales:', err);
        setErrorMsg('Failed to load customers/products from database.');
      }
    };
    fetchMasterData();
    
    // Auto-generate invoice number based on timestamp for simplicity
    setInvoiceNo('INV-' + Date.now().toString().slice(-6));
  }, []);

  // Handle Customer Selection
  useEffect(() => {
    if (customerId) {
      const cust = customersList.find(c => c.id === customerId);
      if (cust) {
        // In a real app we'd calculate current outstanding via queries, using opening balance here roughly
        if (cust.opening_balance > cust.credit_limit) {
          setCustomerWarning(`Credit Limit Exceeded! Outstanding: ₹${cust.opening_balance} (Limit: ₹${cust.credit_limit})`);
        } else {
          setCustomerWarning(null);
        }
      }
    } else {
      setCustomerWarning(null);
    }
  }, [customerId, customersList]);

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

    const hasChanged = newRows.some((r, i) => Math.abs(r.amount - rows[i].amount) > 0.01);
    if (hasChanged) setRows(newRows);
    
    setTotals({
      sub,
      disc: totalDisc,
      gst: totalGst,
      net: Math.round(sub - totalDisc + totalGst)
    });
  }, [rows]);

  const addRow = () => {
    setRows([...rows, { id: Date.now(), product: '', batch: '', expiry: '', qty: 0, available: 0, rate: 0, mrp: 0, disc: 0, gst: 12, amount: 0, batchId: '' }]);
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(r => {
      if (r.id !== id) return r;
      
      let updated = { ...r, [field]: value };
      
      if (field === 'product') {
        updated.batch = '';
        updated.batchId = '';
        updated.expiry = '';
        updated.available = 0;
        updated.rate = 0;
        updated.mrp = 0;
        const prod = productsList.find(p => p.id === value);
        if (prod) {
          updated.gst = prod.gst;
        }
      }
      
      if (field === 'batch' && r.product) {
        const prod = productsList.find(p => p.id === r.product);
        if (prod) {
          const batchData = prod.batches.find(b => b.batch === value);
          if (batchData) {
            updated.batchId = batchData.id;
            updated.expiry = batchData.expiry;
            updated.available = batchData.qty;
            updated.mrp = batchData.mrp;
            // E.g. default rate = ptr * 1.1 or similar, here we just use mrp
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

  const handleSave = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!customerId || !invoiceNo || !invoiceDate) {
      setErrorMsg("Customer, Invoice No, and Invoice Date are required.");
      return;
    }

    const validRows = rows.filter(r => r.product && r.batch && r.qty > 0 && r.rate > 0);
    if (validRows.length === 0) {
      setErrorMsg("Please add at least one valid product row with Batch, Qty, and Rate.");
      return;
    }

    // Validate overstock
    for (const row of validRows) {
      if (row.qty > row.available) {
        setErrorMsg(`Quantity for batch ${row.batch} exceeds available stock (${row.available}).`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userRes = await window.pharmaAPI.db.query("SELECT company_id FROM users WHERE email = ?", [user.email]);
      if (!userRes?.data?.length) throw new Error("Admin user not found in local DB");
      const companyId = userRes.data[0].company_id;
      const saleId = 'SAL-' + Date.now();

      const operations = [];

      // 1. Insert into sales
      operations.push({
        sql: `INSERT INTO sales (
          id, company_id, invoice_no, customer_id, date, salesman, gst_type,
          subtotal, discount_amount, taxable_amount, net_amount, payment_mode, paid_amount, notes, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', datetime('now'), datetime('now'))`,
        params: [
          saleId, companyId, invoiceNo, customerId, invoiceDate, user.name || 'Admin', 'exclusive',
          totals.sub, totals.disc, totals.sub - totals.disc, totals.net, paymentMode, paymentMode === 'Credit' ? 0 : totals.net, doctorName ? 'Doctor: ' + doctorName : null
        ]
      });

      // Insert receipt if not credit
      let receiptId = null;
      let pModeNormalized = null;
      let receiptNo = null;
      if (paymentMode !== 'Credit') {
        pModeNormalized = paymentMode === 'Cash' ? 'cash' : 'bank';
        receiptId = 'REC-' + Date.now();
        receiptNo = 'RCT-' + Date.now().toString().slice(-6);
        operations.push({
          sql: `INSERT INTO receipts (
            id, company_id, receipt_no, customer_id, date, amount, payment_mode, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          params: [
            receiptId, companyId, receiptNo, customerId, invoiceDate, totals.net, pModeNormalized, 'Against Sale ' + invoiceNo
          ]
        });
      }

      // 2. Insert items and update batches
      const syncItems = []; // Collect sync payloads to run after db transaction
      for (const row of validRows) {
        // Deduct from Batch
        operations.push({
          sql: `UPDATE batches SET 
            current_qty = current_qty - ?, 
            updated_at = datetime('now') 
            WHERE id = ?`,
          params: [row.qty, row.batchId]
        });

        syncItems.push({
          tableName: 'Batch',
          operation: 'update',
          payload: { id: row.batchId, currentQty: row.available - row.qty }
        });

        // Insert Sale Item
        const saleItemId = 'S-ITM-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        operations.push({
          sql: `INSERT INTO sale_items (
            id, sale_id, product_id, batch_id, qty, mrp, ptr, sale_price, disc_percent, gst_rate, net_amount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          params: [
            saleItemId,
            saleId, row.product, row.batchId, row.qty, row.mrp, row.rate, row.rate, row.disc, row.gst, row.amount
          ]
        });

        syncItems.push({
          tableName: 'SaleItem',
          operation: 'create',
          payload: {
            id: saleItemId,
            saleId,
            productId: row.product,
            batchId: row.batchId,
            qty: row.qty,
            mrp: row.mrp,
            ptr: row.rate,
            salePrice: row.rate,
            discPercent: row.disc,
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

      // Sync to cloud after successful transaction
      await syncEntity('Sale', 'create', {
        id: saleId,
        companyId,
        invoiceNo,
        customerId,
        date: new Date(invoiceDate).toISOString(),
        salesman: user.name || 'Admin',
        gstType: 'exclusive',
        subtotal: totals.sub,
        discountAmount: totals.disc,
        taxableAmount: totals.sub - totals.disc,
        netAmount: totals.net,
        paymentMode: mappedPm,
        paidAmount: paymentMode === 'Credit' ? 0 : totals.net,
        notes: doctorName ? 'Doctor: ' + doctorName : null,
        status: 'completed'
      });

      if (paymentMode !== 'Credit') {
        await syncEntity('Receipt', 'create', {
          id: receiptId,
          companyId,
          receiptNo,
          customerId,
          date: new Date(invoiceDate).toISOString(),
          amount: totals.net,
          paymentMode: mappedPm === 'cash' ? 'cash' : 'upi',
          notes: 'Against Sale ' + invoiceNo
        });
      }

      for (const item of syncItems) {
        await syncEntity(item.tableName, item.operation, item.payload);
      }

      setSuccessMsg(`Sales Invoice ${invoiceNo} saved successfully!`);
      
      // Reset form
      setCustomerId('');
      setInvoiceNo('INV-' + Date.now().toString().slice(-6));
      setDoctorName('');
      setRows([{ id: Date.now(), product: '', batch: '', expiry: '', qty: 0, available: 0, rate: 0, mrp: 0, disc: 0, gst: 12, amount: 0, batchId: '' }]);
      
      // Re-fetch master data to update available stock levels
      const prodRes = await window.pharmaAPI.db.query(`
        SELECT p.id as product_id, p.name as product_name, p.gst_rate,
               b.id as batch_id, b.batch_no, b.expiry_date, b.mrp, b.ptr, b.current_qty as available
        FROM products p
        JOIN batches b ON p.id = b.product_id
        WHERE b.current_qty > 0
        ORDER BY p.name ASC, b.expiry_date ASC
      `);
      
      const prodMap = {};
      if (prodRes?.data) {
        prodRes.data.forEach(row => {
          if (!prodMap[row.product_id]) {
            prodMap[row.product_id] = { id: row.product_id, name: row.product_name, gst: row.gst_rate, batches: [] };
          }
          prodMap[row.product_id].batches.push({
            id: row.batch_id, batch: row.batch_no, expiry: row.expiry_date, mrp: row.mrp, ptr: row.ptr, qty: row.available
          });
        });
      }
      setProductsList(Object.values(prodMap));

    } catch (err) {
      console.error("Sales save error:", err);
      setErrorMsg("Failed to save sales invoice: " + err.message);
    } finally {
      setIsSaving(false);
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
          <button className="btn btn-outline" onClick={() => navigate('/transactions/sales')}><ArrowLeft size={16} /> Back</button>
          <button className="btn btn-outline" onClick={() => window.print()}><Printer size={16} /> Print</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
            <Save size={16} /> {isSaving ? 'Saving...' : 'Save & Generate Bill'}
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

      {customerWarning && !errorMsg && !successMsg && (
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
                {customersList.map(c => <option key={c.id} value={c.id}>{c.name} ({c.area})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Invoice Date</label>
              <input type="date" className="form-input" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Doctor Name (Optional)</label>
              <input type="text" className="form-input" placeholder="Prescribing doctor..." value={doctorName} onChange={e => setDoctorName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Mode</label>
              <select className="form-select" value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                <option value="Credit">Credit</option>
                <option value="Cash">Cash</option>
                <option value="Bank / UPI">Bank / UPI</option>
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
              {rows.map((r) => {
                const prod = productsList.find(p => p.id === r.product);
                const overStock = r.qty > r.available;
                return (
                  <tr key={r.id} style={{ background: overStock ? '#FEF2F2' : 'transparent' }}>
                    <td>
                      <select className="form-select form-input-sm" value={r.product} onChange={e => updateRow(r.id, 'product', e.target.value)}>
                        <option value="">Search Product...</option>
                        {productsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
                    <td><input type="number" className="form-input form-input-sm" min="1" value={r.qty === 0 ? '' : r.qty} onChange={e => updateRow(r.id, 'qty', e.target.value)} style={{ borderColor: overStock ? 'var(--danger)' : 'var(--border)' }} /></td>
                    <td><input type="number" className="form-input form-input-sm" min="0" step="0.01" value={r.rate === 0 ? '' : r.rate} onChange={e => updateRow(r.id, 'rate', e.target.value)} /></td>
                    <td><input type="number" className="form-input form-input-sm" value={r.mrp === 0 ? '' : r.mrp} readOnly style={{ background: '#F8FAFC' }} /></td>
                    <td><input type="number" className="form-input form-input-sm" min="0" step="0.01" value={r.disc === 0 ? '' : r.disc} onChange={e => updateRow(r.id, 'disc', e.target.value)} /></td>
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