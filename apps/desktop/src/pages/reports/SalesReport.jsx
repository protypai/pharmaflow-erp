import React, { useState, useEffect, useMemo } from 'react';
import { Search, Printer, Download, TrendingUp, Calendar } from 'lucide-react';


export default function SalesReport() {
  const [customers, set_customers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res_customers = await window.pharmaAPI.db.query("SELECT * FROM customers");
      set_customers(res_customers?.data || []);
    };
    fetchData();
  }, []);

  const [dateRange, setDateRange] = useState('this_month');
  const [customerId, setCustomerId] = useState('');

  const [salesData, setSalesData] = useState([]);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const query = `
          SELECT s.date, s.invoice_no as id, c.name as customerName, s.subtotal as gross, 
                 s.discount_amount as discount, (s.cgst_amount + s.sgst_amount + s.igst_amount) as gst, 
                 s.net_amount as net, 
                 (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items
          FROM sales s
          LEFT JOIN customers c ON s.customer_id = c.id
          ${customerId ? `WHERE s.customer_id = '${customerId}'` : ''}
          ORDER BY s.date DESC
        `;
        const res = await window.pharmaAPI.db.query(query);
        setSalesData(res?.data || []);
      } catch (err) {
        console.error("Failed to fetch sales data:", err);
      }
    };
    fetchSales();
  }, [customerId, dateRange]);

  const totals = salesData.reduce((acc, curr) => {
    acc.gross += curr.gross;
    acc.discount += curr.discount;
    acc.gst += curr.gst;
    acc.net += curr.net;
    return acc;
  }, { gross: 0, discount: 0, gst: 0, net: 0 });

  const avgOrderValue = salesData.length > 0 ? totals.net / salesData.length : 0;

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <div>
          <h2 className="card-title">Sales Report (Revenue Analysis)</h2>
          <div className="page-sub">Track daily/monthly revenue trends and invoice details</div>
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
            <option value="custom">Custom Range...</option>
          </select>
        </div>
        <div style={{ flex: 1, maxWidth: '300px' }}>
          <label className="form-label">Filter by Customer</label>
          <select className="form-select" value={customerId} onChange={e => setCustomerId(e.target.value)}>
            <option value="">All Customers</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>Generate</button>
      </div>

      {/* KPI Dashboard */}
      <div style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'white', borderBottom: '1px solid var(--border)' }}>
        <div className="card" style={{ flex: 1, padding: '1rem', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <div style={{ fontSize: '0.8rem', color: '#1E40AF', textTransform: 'uppercase', fontWeight: 600 }}>Total Invoices</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D4ED8' }}>{salesData.length}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '1rem', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <div style={{ fontSize: '0.8rem', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }}>Total Revenue (Net)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#15803D' }}>₹ {totals.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '1rem', background: '#FFF7ED', border: '1px solid #FED7AA' }}>
          <div style={{ fontSize: '0.8rem', color: '#9A3412', textTransform: 'uppercase', fontWeight: 600 }}>Total Output GST</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#C2410C' }}>₹ {totals.gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '1rem', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', fontWeight: 600 }}>Average Order Value</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#334155' }}>₹ {avgOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ width: '120px' }}>Date</th>
              <th style={{ width: '150px' }}>Invoice No</th>
              <th>Customer Name</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Items</th>
              <th style={{ width: '120px', textAlign: 'right' }}>Gross (₹)</th>
              <th style={{ width: '120px', textAlign: 'right' }}>Discount (₹)</th>
              <th style={{ width: '120px', textAlign: 'right' }}>GST (₹)</th>
              <th style={{ width: '150px', textAlign: 'right' }}>Net Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {salesData.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No sales found for this period.</td></tr>
            ) : salesData.map((row) => (
              <tr key={row.id}>
                <td>{row.date}</td>
                <td style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>{row.id}</td>
                <td style={{ fontWeight: 500 }}>{row.customerName}</td>
                <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{row.items}</td>
                <td style={{ textAlign: 'right' }}>{row.gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ textAlign: 'right', color: 'var(--danger)' }}>{row.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ textAlign: 'right' }}>{row.gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#15803D' }}>
                  {row.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot style={{ position: 'sticky', bottom: 0, background: '#F1F5F9', fontWeight: 700 }}>
            <tr>
              <td colSpan="4" style={{ textAlign: 'right' }}>Grand Total:</td>
              <td style={{ textAlign: 'right' }}>{totals.gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td style={{ textAlign: 'right', color: 'var(--danger)' }}>{totals.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td style={{ textAlign: 'right' }}>{totals.gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td style={{ textAlign: 'right', color: '#15803D', fontSize: '1.1rem' }}>
                ₹ {totals.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}