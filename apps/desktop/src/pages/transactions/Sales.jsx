import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Printer, AlertTriangle, ArrowLeft, Download } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { syncEntity } from '../../services/dataService';
import { buildInvoiceHtml, normalizeInvoiceNumbers } from '../../utils/invoiceTemplate';
import { packSize, toStrips, toBoxesFloat, perStripPrice, formatStock } from '../../utils/units';
export default function Sales() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalItems, setOriginalItems] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [customerWarning, setCustomerWarning] = useState(null);

  const [rows, setRows] = useState([
    { id: 1, product: '', productName: '', productSearch: '', batch: '', expiry: '', qty: 0, free: 0, unit: 'strip', boxSize: 10, available: 0, baseAvailable: 0, rate: 0, baseRate: 0, mrp: 0, baseMrp: 0, disc: 0, gst: 12, amount: 0, batchId: '' }
  ]);
  const [activeRowSearch, setActiveRowSearch] = useState(null);
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
  const [savedInvoice, setSavedInvoice] = useState(null); // { html, no }

  const fetchNextInvoiceNo = async () => {
    try {
      await normalizeInvoiceNumbers();
      const res = await window.pharmaAPI.db.query("SELECT invoice_no FROM sales");
      let maxNum = 0;
      if (res?.data && res.data.length > 0) {
        res.data.forEach(row => {
          if (!row.invoice_no) return;
          const match = row.invoice_no.match(/\d+$/);
          if (match) {
            const num = parseInt(match[0], 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        });
      }
      setInvoiceNo(`INV-${maxNum + 1}`);
    } catch (err) {
      console.error("Error fetching sequential invoice no:", err);
      setInvoiceNo('INV-1');
    }
  };

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        try { await window.pharmaAPI.db.run("ALTER TABLE sale_items ADD COLUMN free_qty REAL DEFAULT 0;"); } catch (e) { }
        const custRes = await window.pharmaAPI.db.query("SELECT id, name, area, credit_limit, opening_balance FROM customers WHERE COALESCE(status, 'active') <> 'inactive' ORDER BY name ASC");
        setCustomersList(custRes?.data || []);

        const prodRes = await window.pharmaAPI.db.query(`
          SELECT p.id as product_id, p.name as product_name, p.gst_rate, p.packing, p.conversion_factor,
                 b.id as batch_id, b.batch_no, b.expiry_date, b.mrp, b.ptr, b.current_qty as available
          FROM products p
          JOIN batches b ON p.id = b.product_id
          WHERE b.current_qty > 0 AND COALESCE(p.status, 'active') <> 'inactive'
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
                boxSize: (row.conversion_factor && Number(row.conversion_factor) > 0) ? Number(row.conversion_factor) : 10,
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
        
        const pList = Object.values(prodMap);
        setProductsList(pList);
        
        if (editId) {
           setIsEditMode(true);
           const saleRes = await window.pharmaAPI.db.query("SELECT * FROM sales WHERE id = ?", [editId]);
           if (saleRes?.data?.length) {
              const sale = saleRes.data[0];
              setCustomerId(sale.customer_id);
              setInvoiceNo(sale.invoice_no);
              setInvoiceDate(sale.date ? sale.date.split('T')[0] : '');
              setPaymentMode(sale.payment_mode === 'credit' ? 'Credit' : (sale.payment_mode === 'cash' ? 'Cash' : 'Bank / UPI'));
              if (sale.notes && sale.notes.startsWith('Doctor: ')) {
                 setDoctorName(sale.notes.replace('Doctor: ', ''));
              }
              
              const itemsRes = await window.pharmaAPI.db.query(`
                SELECT si.*, p.name as product_name, b.batch_no, b.expiry_date, p.conversion_factor, p.gst_rate
                FROM sale_items si
                LEFT JOIN products p ON si.product_id = p.id
                LEFT JOIN batches b ON si.batch_id = b.id
                WHERE si.sale_id = ?
              `, [editId]);
              
              if (itemsRes?.data?.length) {
                 setOriginalItems(itemsRes.data);
                 const loadedRows = itemsRes.data.map((item, index) => {
                    const boxSize = (item.conversion_factor && Number(item.conversion_factor) > 0) ? Number(item.conversion_factor) : 10;
                    let avail = 0;
                    const pData = prodMap[item.product_id];
                    if (pData) {
                      const bData = pData.batches.find(b => b.id === item.batch_id);
                      if (bData) {
                         avail = Number(bData.qty);
                      }
                    }
                    
                    return {
                       id: crypto.randomUUID(),
                       product: item.product_id || '',
                       productName: item.product_name || '',
                       productSearch: item.product_name || '',
                       batch: item.batch_no || '',
                       batchId: item.batch_id || '',
                       expiry: item.expiry_date || '',
                       qty: item.qty,
                       free: item.free_qty,
                       unit: 'strip',
                       boxSize: boxSize,
                       available: avail, 
                       baseAvailable: avail,
                       rate: item.sale_price,
                       baseRate: item.sale_price,
                       mrp: item.mrp,
                       baseMrp: item.mrp,
                       disc: item.disc_percent,
                       gst: item.gst_rate,
                       amount: item.net_amount
                    };
                 });
                 setRows(loadedRows);
              }
           }
        } else {
           fetchNextInvoiceNo();
        }

      } catch (err) {
        console.error('Failed to load master data for sales:', err);
        setErrorMsg('Failed to load customers/products from database.');
      }
    };
    fetchMasterData();
  }, [editId]);

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
    setRows([...rows, { id: crypto.randomUUID(), product: '', productName: '', productSearch: '', batch: '', expiry: '', qty: 0, free: 0, unit: 'strip', boxSize: 10, available: 0, baseAvailable: 0, rate: 0, baseRate: 0, mrp: 0, baseMrp: 0, disc: 0, gst: 12, amount: 0, batchId: '' }]);
  };

  const selectProduct = (id, prod) => {
    setRows(rows.map(r => {
      if (r.id === id) {
        return {
          ...r,
          product: prod.id,
          productName: prod.name,
          productSearch: prod.name,
          gst: prod.gst ?? 12,
          boxSize: prod.boxSize || 10,
          batch: '',
          batchId: '',
          expiry: '',
          available: 0,
          baseAvailable: 0,
          rate: 0,
          baseRate: 0,
          mrp: 0,
          baseMrp: 0
        };
      }
      return r;
    }));
    setActiveRowSearch(null);
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(r => {
      if (r.id !== id) return r;

      let updated = { ...r, [field]: value };

      if (field === 'productSearch') {
        updated.product = '';
        updated.productName = '';
        updated.batch = '';
        updated.batchId = '';
        updated.expiry = '';
        updated.available = 0;
        updated.baseAvailable = 0;
        updated.rate = 0;
        updated.mrp = 0;
      }

      if (field === 'batch' && r.product) {
        const prod = productsList.find(p => p.id === r.product);
        if (prod) {
          const batchData = prod.batches.find(b => b.batch === value);
          if (batchData) {
            updated.batchId = batchData.id;
            updated.expiry = batchData.expiry;
            // batchData.qty is now current_qty in STRIPS (base unit).
            updated.baseAvailable = Number(batchData.qty);
            updated.baseMrp = Number(batchData.mrp); // per strip
            updated.baseRate = Number(batchData.mrp); // per strip

            const factor = packSize(updated.boxSize);
            if (updated.unit === 'box') {
              updated.available = Number(toBoxesFloat(batchData.qty, factor).toFixed(2));
              updated.mrp = Number((batchData.mrp * factor).toFixed(2));
              updated.rate = Number((batchData.mrp * factor).toFixed(2));
            } else {
              updated.available = Number(batchData.qty);
              updated.mrp = Number(batchData.mrp);
              updated.rate = Number(batchData.mrp);
            }
          }
        }
      }

      if (field === 'unit') {
        const oldUnit = r.unit || 'strip';
        const newUnit = value;
        const factor = packSize(updated.boxSize);
        const baseStrips = r.baseAvailable ?? 0;
        if (oldUnit === 'box' && newUnit === 'strip') {
          updated.rate = Number((r.baseRate || 0).toFixed(2));
          updated.mrp = Number((r.baseMrp || 0).toFixed(2));
          updated.available = Number(baseStrips);
        } else if (oldUnit === 'strip' && newUnit === 'box') {
          updated.rate = Number(((r.baseRate || 0) * factor).toFixed(2));
          updated.mrp = Number(((r.baseMrp || 0) * factor).toFixed(2));
          updated.available = Number(toBoxesFloat(baseStrips, factor).toFixed(2));
        }
      }

      if (field === 'boxSize') {
        const newFactor = packSize(value);
        const baseStrips = r.baseAvailable ?? 0;
        if (r.unit === 'box') {
          updated.rate = Number(((r.baseRate || 0) * newFactor).toFixed(2));
          updated.mrp = Number(((r.baseMrp || 0) * newFactor).toFixed(2));
          updated.available = Number(toBoxesFloat(baseStrips, newFactor).toFixed(2));
        } else {
          updated.rate = Number(r.baseRate || 0);
          updated.mrp = Number(r.baseMrp || 0);
          updated.available = Number(baseStrips);
        }
      }

      return updated;
    }));
  };

  const removeRow = (id) => {
    setRows(rows.filter(r => r.id !== id));
  };

  const handleSave = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setSavedInvoice(null);

    if (!customerId || !invoiceNo || !invoiceDate) {
      setErrorMsg("Customer, Invoice No, and Invoice Date are required.");
      return;
    }

    const validRows = rows.filter(r => r.product && r.batch && Number(r.qty) > 0 && Number(r.rate) > 0);
    if (validRows.length === 0) {
      setErrorMsg("Please add at least one valid product row with Batch, Qty, and Rate.");
      return;
    }

    const batchStockDiff = {};
    if (isEditMode) {
      for (const item of originalItems) {
        if (!batchStockDiff[item.batch_id]) batchStockDiff[item.batch_id] = { oldStrips: 0, newStrips: 0 };
        batchStockDiff[item.batch_id].oldStrips += Number(item.qty || 0) + Number(item.free_qty || 0);
      }
    }
    
    for (const row of validRows) {
      const packMultiplier = packSize(row.boxSize);
      const newStrips = toStrips(row.qty, row.unit, packMultiplier) + toStrips(row.free, row.unit, packMultiplier);
      if (!batchStockDiff[row.batchId]) batchStockDiff[row.batchId] = { oldStrips: 0, newStrips: 0 };
      batchStockDiff[row.batchId].newStrips += newStrips;
    }
    
    for (const [batchId, diff] of Object.entries(batchStockDiff)) {
       const row = validRows.find(r => r.batchId === batchId);
       if (row) {
          const availStrips = Number(row.baseAvailable ?? 0);
          const hypotheticalStock = availStrips + diff.oldStrips;
          if (diff.newStrips > hypotheticalStock) {
             setErrorMsg(`Total quantity for batch ${row.batch} exceeds available stock (${hypotheticalStock} Strips).`);
             return;
          }
       }
    }

    setIsSaving(true);
    try {
      try { await window.pharmaAPI.db.run("ALTER TABLE sale_items ADD COLUMN free_qty REAL DEFAULT 0;"); } catch (e) { }
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userRes = await window.pharmaAPI.db.query("SELECT company_id FROM users WHERE id = ? OR email = ?", [user.id || '', user.email || '']);
      if (!userRes?.data?.length) throw new Error("Admin user not found in local DB");
      const companyId = userRes.data[0].company_id;
      const saleId = isEditMode ? editId : 'SAL-' + Date.now();

      const operations = [];

      if (isEditMode) {
         operations.push({
           sql: `UPDATE sales SET 
             customer_id = ?, invoice_no = ?, date = ?, salesman = ?, gst_type = ?,
             subtotal = ?, discount_amount = ?, taxable_amount = ?, net_amount = ?, payment_mode = ?, paid_amount = ?, notes = ?, updated_at = datetime('now')
             WHERE id = ?`,
           params: [
             customerId, invoiceNo, invoiceDate, user.name || 'Admin', 'exclusive',
             totals.sub, totals.disc, totals.sub - totals.disc, totals.net, paymentMode, paymentMode === 'Credit' ? 0 : totals.net, doctorName ? 'Doctor: ' + doctorName : null, saleId
           ]
         });
         
         operations.push({
            sql: `DELETE FROM receipts WHERE notes = ?`,
            params: ['Against Sale ' + invoiceNo]
         });
      } else {
         operations.push({
           sql: `INSERT INTO sales (
             id, company_id, invoice_no, customer_id, date, salesman, gst_type,
             subtotal, discount_amount, taxable_amount, net_amount, payment_mode, paid_amount, notes, status, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'saved', datetime('now'), datetime('now'))`,
           params: [
             saleId, companyId, invoiceNo, customerId, invoiceDate, user.name || 'Admin', 'exclusive',
             totals.sub, totals.disc, totals.sub - totals.disc, totals.net, paymentMode, paymentMode === 'Credit' ? 0 : totals.net, doctorName ? 'Doctor: ' + doctorName : null
           ]
         });
      }

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

      const syncItems = []; 
      
      if (isEditMode) {
         for (const item of originalItems) {
            syncItems.push({
               tableName: 'SaleItem',
               operation: 'delete',
               payload: { id: item.id }
            });
         }
         operations.push({ sql: `DELETE FROM sale_items WHERE sale_id = ?`, params: [saleId] });
      }

      for (const [batchId, diff] of Object.entries(batchStockDiff)) {
         const netDeduct = diff.newStrips - diff.oldStrips;
         if (netDeduct !== 0) {
             operations.push({
                sql: `UPDATE batches SET current_qty = current_qty - ?, updated_at = datetime('now') WHERE id = ?`,
                params: [netDeduct, batchId]
             });
         }
      }

      for (const row of validRows) {
        const packMultiplier = packSize(row.boxSize);
        const billedStrips = toStrips(row.qty, row.unit, packMultiplier);
        const freeStrips = toStrips(row.free, row.unit, packMultiplier);
        const stripRate = perStripPrice(row.rate, row.unit, packMultiplier);
        const stripMrp = perStripPrice(row.mrp, row.unit, packMultiplier);

        const saleItemId = 'S-ITM-' + crypto.randomUUID();
        operations.push({
          sql: `INSERT INTO sale_items (
            id, sale_id, product_id, batch_id, qty, free_qty, mrp, ptr, sale_price, disc_percent, gst_rate, net_amount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          params: [
            saleItemId,
            saleId, row.product, row.batchId, billedStrips, freeStrips, stripMrp, stripRate, stripRate, Number(row.disc || 0), Number(row.gst || 0), row.amount
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
            qty: billedStrips,
            freeQty: freeStrips,
            mrp: stripMrp,
            ptr: stripRate,
            salePrice: stripRate,
            discPercent: Number(row.disc || 0),
            gstRate: Number(row.gst || 0),
            netAmount: row.amount
          }
        });
      }

      const res = await window.pharmaAPI.db.transaction(operations);

      if (!res.success) {
        throw new Error(res.error || 'Transaction failed');
      }

      for (const [batchId, diff] of Object.entries(batchStockDiff)) {
         if (diff.newStrips - diff.oldStrips !== 0) {
            const bRes = await window.pharmaAPI.db.query("SELECT current_qty FROM batches WHERE id = ?", [batchId]);
            if (bRes?.data?.length) {
               syncItems.push({
                  tableName: 'Batch',
                  operation: 'update',
                  payload: { id: batchId, currentQty: bRes.data[0].current_qty }
               });
            }
         }
      }

      const mapPaymentMode = (pm) => {
        if (pm === 'Cash') return 'cash';
        if (pm === 'Credit') return 'credit';
        return 'upi';
      };

      const mappedPm = mapPaymentMode(paymentMode);

      await syncEntity('Sale', isEditMode ? 'update' : 'create', {
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
        status: 'saved'
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

      setSuccessMsg(`Sales Invoice ${invoiceNo} ${isEditMode ? 'updated' : 'saved'} successfully!`);

      try {
        const companyRes = await window.pharmaAPI.db.query("SELECT * FROM companies LIMIT 1");
        const company = companyRes?.data?.[0] || {};
        const partyRes = await window.pharmaAPI.db.query("SELECT * FROM customers WHERE id = ?", [customerId]);
        const party = partyRes?.data?.[0] || {};

        const prodIds = [...new Set(validRows.map(r => r.product))];
        const metaMap = {};
        if (prodIds.length) {
          const placeholders = prodIds.map(() => '?').join(',');
          const metaRes = await window.pharmaAPI.db.query(
            `SELECT p.id, p.hsn_code, p.packing, m.name AS mfg_name
             FROM products p
             LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
             WHERE p.id IN (${placeholders})`,
            prodIds
          );
          (metaRes?.data || []).forEach(m => { metaMap[m.id] = m; });
        }

        const invItems = validRows.map(r => {
          const meta = metaMap[r.product] || {};
          const pack = packSize(r.boxSize);
          return {
            mfg: meta.mfg_name || '',
            name: r.productName,
            hsn: meta.hsn_code || '',
            pack: meta.packing || `1x${pack}`,
            batch: r.batch,
            exp: r.expiry,
            qty: toStrips(r.qty, r.unit, pack),
            free: toStrips(r.free, r.unit, pack),
            mrp: perStripPrice(r.mrp, r.unit, pack),
            pts: '',
            ptr: perStripPrice(r.rate, r.unit, pack),
            amount: r.amount,
            gst: r.gst,
            disc: r.disc
          };
        });

        const html = buildInvoiceHtml({
          type: 'sales',
          company,
          party,
          invoice: {
            no: invoiceNo,
            date: invoiceDate,
            type: paymentMode,
            discount: totals.disc,
            netPayable: totals.net
          },
          items: invItems
        });
        setSavedInvoice({ html, no: invoiceNo });
      } catch (invErr) {
        console.error('Failed to build sales invoice for print/PDF:', invErr);
      }

      if (isEditMode) {
         setTimeout(() => { navigate('/reports/sales'); }, 1500);
      } else {
         setCustomerId('');
         fetchNextInvoiceNo();
         setDoctorName('');
         setRows([{ id: crypto.randomUUID(), product: '', productName: '', productSearch: '', batch: '', expiry: '', qty: 0, free: 0, unit: 'strip', boxSize: 10, available: 0, baseAvailable: 0, rate: 0, baseRate: 0, mrp: 0, baseMrp: 0, disc: 0, gst: 12, amount: 0, batchId: '' }]);
      }

      const prodRes = await window.pharmaAPI.db.query(`
        SELECT p.id as product_id, p.name as product_name, p.gst_rate, p.packing, p.conversion_factor,
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
             prodMap[row.product_id] = { id: row.product_id, name: row.product_name, gst: row.gst_rate, boxSize: (row.conversion_factor && Number(row.conversion_factor) > 0) ? Number(row.conversion_factor) : 10, batches: [] };
          }
          prodMap[row.product_id].batches.push({ id: row.batch_id, batch: row.batch_no, expiry: row.expiry_date, mrp: row.mrp, ptr: row.ptr, qty: row.available });
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 'calc(100vh - 120px)' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">{isEditMode ? 'Edit Sales Invoice' : 'Sales Invoice (Outward)'}</h1>
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
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '0.75rem 1rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <strong>Success:</strong> <span style={{ flex: 1 }}>{successMsg}</span>
          {savedInvoice && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-outline btn-sm" onClick={() => window.pharmaAPI.print.invoice(savedInvoice.html)}>
                <Printer size={14} /> Print
              </button>
              <button className="btn btn-primary btn-sm" onClick={async () => {
                const res = await window.pharmaAPI.export.pdf(savedInvoice.html, 'Invoice_' + savedInvoice.no);
                if (res && res.success === false && !res.canceled) {
                  setErrorMsg('Failed to export PDF.');
                }
              }}>
                <Download size={14} /> Download PDF
              </button>
            </div>
          )}
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
          <div className="form-row-4">
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
        <div className="card-body no-pad" style={{ flex: 1, overflow: 'auto', minHeight: '300px' }}>
          <table className="data-table" style={{ minWidth: '1100px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ width: '220px' }}>Product</th>
                <th style={{ width: '130px' }}>Batch (FEFO)</th>
                <th style={{ width: '75px' }}>Expiry</th>
                <th style={{ width: '110px' }}>Available</th>
                <th style={{ width: '130px' }}>Bill Qty & Unit</th>
                <th style={{ width: '70px' }}>Free</th>
                <th style={{ width: '85px' }}>Rate (₹)</th>
                <th style={{ width: '85px' }}>MRP (₹)</th>
                <th style={{ width: '65px' }}>Disc%</th>
                <th style={{ width: '70px' }}>GST%</th>
                <th style={{ width: '90px', textAlign: 'right' }}>Amount (₹)</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const prod = productsList.find(p => p.id === r.product);
                const packMultiplier = packSize(r.boxSize);
                const totalStripsNeeded = toStrips(r.qty, r.unit, packMultiplier) + toStrips(r.free, r.unit, packMultiplier);
                const availStrips = Number(r.baseAvailable ?? toStrips(r.available, r.unit, packMultiplier));
                const overStock = totalStripsNeeded > availStrips;
                const availText = formatStock(availStrips, packMultiplier, 'Strip');

                return (
                  <tr key={r.id} style={{ background: overStock ? '#FEF2F2' : 'transparent' }}>
                    <td style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input form-input-sm"
                        placeholder="Type to search product..."
                        value={r.productSearch ?? ''}
                        onFocus={() => setActiveRowSearch(r.id)}
                        onChange={e => updateRow(r.id, 'productSearch', e.target.value)}
                      />
                      {activeRowSearch === r.id && (
                        <div
                          style={{
                            position: 'absolute', top: '100%', left: 0, width: '300px',
                            background: '#fff', border: '1px solid var(--border)', borderRadius: '4px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 50, maxHeight: '200px', overflowY: 'auto'
                          }}
                        >
                          {productsList
                            .filter(p => !r.productSearch || p.name.toLowerCase().includes(r.productSearch.toLowerCase()))
                            .slice(0, 20)
                            .map(p => (
                              <div
                                key={p.id}
                                style={{ padding: '6px 10px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '13px' }}
                                onMouseDown={(e) => { e.preventDefault(); selectProduct(r.id, p); }}
                                onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                                onMouseLeave={(e) => e.target.style.background = '#fff'}
                              >
                                <div style={{ fontWeight: 500 }}>{p.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  In Stock: {p.batches.reduce((sum, b) => sum + Number(b.qty), 0)} Strips ({p.batches.length} batches)
                                </div>
                              </div>
                            ))}
                          {productsList.filter(p => !r.productSearch || p.name.toLowerCase().includes(r.productSearch.toLowerCase())).length === 0 && (
                            <div style={{ padding: '8px', color: '#94a3b8', fontSize: '12px', textAlign: 'center' }}>No available stock found</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <select className="form-select form-input-sm" value={r.batch} onChange={e => updateRow(r.id, 'batch', e.target.value)} disabled={!r.product}>
                        <option value="">Select Batch</option>
                        {prod && prod.batches.map(b => (
                          <option key={b.id} value={b.batch}>{b.batch} ({b.qty} Strips)</option>
                        ))}
                        {r.batch && (!prod || !prod.batches.some(b => b.batch === r.batch)) && (
                          <option key={r.batchId || r.batch} value={r.batch}>{r.batch} (Historical)</option>
                        )}
                      </select>
                    </td>
                    <td><input type="text" className="form-input form-input-sm" value={r.expiry} readOnly style={{ background: '#F8FAFC' }} /></td>
                    <td><input type="text" className="form-input form-input-sm" value={availText} readOnly style={{ background: '#F8FAFC', color: availStrips === 0 ? 'var(--danger)' : 'inherit', fontSize: '11px', fontWeight: 600 }} /></td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <input type="number" className="form-input form-input-sm" min="1" value={r.qty === 0 ? '' : r.qty} onChange={e => updateRow(r.id, 'qty', e.target.value)} style={{ borderColor: overStock ? 'var(--danger)' : 'var(--border)', fontWeight: 600 }} />
                        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                          <select className="form-select form-input-sm" value={r.unit || 'strip'} onChange={e => updateRow(r.id, 'unit', e.target.value)} style={{ padding: '1px 4px', height: '22px', fontSize: '11px', background: '#f8fafc', flex: 1 }}>
                            <option value="strip">Per Strip</option>
                            <option value="box">Per Box</option>
                          </select>
                          {r.unit === 'box' && (
                            <input type="number" className="form-input form-input-sm" min="1" title="Units per Box" value={r.boxSize || 10} onChange={e => updateRow(r.id, 'boxSize', e.target.value)} style={{ width: '40px', padding: '1px 2px', height: '22px', fontSize: '11px', textAlign: 'center' }} />
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <input type="number" className="form-input form-input-sm" min="0" placeholder="0" value={r.free === 0 ? '' : r.free} onChange={e => updateRow(r.id, 'free', e.target.value)} />
                        <span style={{ fontSize: '10px', color: '#64748b', textAlign: 'center' }}>{r.unit === 'box' ? 'Boxes' : 'Strips'}</span>
                      </div>
                    </td>
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
              <span>Net Bill Amount:</span> <span style={{ color: 'var(--primary)' }}>₹ {totals.net.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}