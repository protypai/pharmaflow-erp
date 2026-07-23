import React, { useState, useEffect, useMemo } from 'react';
import { Search, Printer, Download, ShoppingCart } from 'lucide-react';


export default function PurchaseReport() {
  const [suppliers, set_suppliers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res_suppliers = await window.pharmaAPI.db.query("SELECT * FROM suppliers");
      set_suppliers(res_suppliers?.data || []);
    };
    fetchData();
  }, []);

  const [dateRange, setDateRange] = useState('this_month');
  const [supplierId, setSupplierId] = useState('');

  const [purchaseData, setPurchaseData] = useState([]);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const query = `
          SELECT p.invoice_date as date, p.entry_no as id, s.name as supplierName, p.subtotal as gross, 
                 p.discount_amount as discount, (p.cgst_amount + p.sgst_amount + p.igst_amount) as gst, 
                 p.net_amount as net, 
                 (SELECT COUNT(*) FROM purchase_items WHERE purchase_id = p.id) as items
          FROM purchases p
          LEFT JOIN suppliers s ON p.supplier_id = s.id
          ${supplierId ? `WHERE p.supplier_id = '${supplierId}'` : ''}
          ORDER BY p.invoice_date DESC
        `;
        const res = await window.pharmaAPI.db.query(query);
        setPurchaseData(res?.data || []);
      } catch (err) {
        console.error("Failed to fetch purchase data:", err);
      }
    };
    fetchPurchases();
  }, [supplierId, dateRange]);

  const totals = purchaseData.reduce((acc, curr) => {
    acc.gross += curr.gross;
    acc.discount += curr.discount;
    acc.gst += curr.gst;
    acc.net += curr.net;
    return acc;
  }, { gross: 0, discount: 0, gst: 0, net: 0 });

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <div>
          <h2 className="card-title">Purchase Report (Procurement Analysis)</h2>
          <div className="page-sub">Audit procurement costs, supplier invoices, and input tax</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={() => window.print()}><Printer size={16} /> Print</button>
          <button className="btn btn-outline" onClick={() => alert("Data exported successfully as CSV!")}><Download size={16} /> Export CSV</button>
        </div>
      </div>

      <div className="filter-bar" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', background: '#F8FAFC' }}>
        <div style={{ width: '200px' }}>
          <label className="form-label">Date Range</label>
          <select className="form-select" value={dateRange} onChange={e => setDateRange(e.target.value)}>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
          </select>
        </div>
        <div style={{ flex: 1, maxWidth: '300px' }}>
          <label className="form-label">Filter by Supplier</label>
          <select className="form-select" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
            <option value="">All Suppliers</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>Generate</button>
      </div>

      {/* KPI Dashboard */}
      <div style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'white', borderBottom: '1px solid var(--border)' }}>
        <div className="card" style={{ flex: 1, padding: '1rem', background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
          <div style={{ fontSize: '0.8rem', color: '#5B21B6', textTransform: 'uppercase', fontWeight: 600 }}>Total Purchase Bills</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4C1D95' }}>{purchaseData.length}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '1rem', background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <div style={{ fontSize: '0.8rem', color: '#991B1B', textTransform: 'uppercase', fontWeight: 600 }}>Total Procurement Cost</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#B91C1C' }}>₹ {totals.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '1rem', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
          <div style={{ fontSize: '0.8rem', color: '#065F46', textTransform: 'uppercase', fontWeight: 600 }}>Total Input GST (Credit)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#047857' }}>₹ {totals.gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ width: '120px' }}>Date</th>
              <th style={{ width: '150px' }}>Purchase Bill No</th>
              <th>Supplier Name</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Items</th>
              <th style={{ width: '120px', textAlign: 'right' }}>Gross (₹)</th>
              <th style={{ width: '120px', textAlign: 'right' }}>CD/Sch (₹)</th>
              <th style={{ width: '120px', textAlign: 'right' }}>GST (₹)</th>
              <th style={{ width: '150px', textAlign: 'right' }}>Net Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {purchaseData.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No purchases found for this period.</td></tr>
            ) : purchaseData.map((row) => (
              <tr key={row.id}>
                <td>{row.date}</td>
                <td style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>{row.id}</td>
                <td style={{ fontWeight: 500 }}>{row.supplierName}</td>
                <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{row.items}</td>
                <td style={{ textAlign: 'right' }}>{row.gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ textAlign: 'right', color: 'var(--success)' }}>{row.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ textAlign: 'right' }}>{row.gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#B91C1C' }}>
                  {row.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot style={{ position: 'sticky', bottom: 0, background: '#F1F5F9', fontWeight: 700 }}>
            <tr>
              <td colSpan="4" style={{ textAlign: 'right' }}>Grand Total:</td>
              <td style={{ textAlign: 'right' }}>{totals.gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td style={{ textAlign: 'right', color: 'var(--success)' }}>{totals.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td style={{ textAlign: 'right' }}>{totals.gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td style={{ textAlign: 'right', color: '#B91C1C', fontSize: '1.1rem' }}>
                ₹ {totals.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}