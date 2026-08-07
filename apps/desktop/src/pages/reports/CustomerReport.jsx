import React, { useState, useEffect, useMemo } from 'react';
import { Search, Printer, Download, FileText, Users } from 'lucide-react';
import {
  exportCsv, exportExcel, exportPdf, printHtml, buildReportHtml, getCompanyProfile,
} from '../../utils/export';


export default function CustomerReport() {
  const [customers, set_customers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res_customers = await window.pharmaAPI.db.query(`
        SELECT c.*, 
               COUNT(s.id) as totalOrders,
               (SELECT SUM(net_amount) FROM sales WHERE customer_id = c.id) as totalRevenue,
               (SELECT SUM(net_amount) FROM sale_returns WHERE customer_id = c.id) as totalReturned,
               (SELECT SUM(amount) FROM receipts WHERE customer_id = c.id) as totalReceipts
        FROM customers c
        LEFT JOIN sales s ON c.id = s.customer_id
        GROUP BY c.id
      `);
      set_customers(res_customers?.data || []);
    };
    fetchData();
  }, []);

  const [minOrderFilter, setMinOrderFilter] = useState('');

  // Mock Customer Analysis Data
  const customerData = useMemo(() => {
    return customers.map(c => {
      const totalOrders = c.totalOrders || 0;
      const netRevenue = c.totalRevenue || 0;
      const totalReturned = c.totalReturned || 0;
      const avgOrderValue = totalOrders > 0 ? (netRevenue / totalOrders) : 0;
      
      const outstandingBalance = (c.opening_balance || 0) + netRevenue - totalReturned - (c.totalReceipts || 0);
      
      return {
        ...c,
        totalOrders,
        totalRevenue: netRevenue,
        avgOrderValue,
        outstandingBalance
      };
    }).filter(c => {
      if (!minOrderFilter) return true;
      return c.totalRevenue >= parseInt(minOrderFilter);
    }).sort((a, b) => b.totalRevenue - a.totalRevenue); // Sort by highest revenue
  }, [minOrderFilter, customers]);

  const totals = customerData.reduce((acc, curr) => {
    acc.revenue += curr.totalRevenue;
    acc.outstanding += curr.outstandingBalance;
    return acc;
  }, { revenue: 0, outstanding: 0 });

  const columns = [
    { header: 'Customer Name', key: 'name' },
    { header: 'Contact', key: 'phone' },
    { header: 'Area', key: 'area' },
    { header: 'Total Orders', key: 'totalOrders', format: 'int' },
    { header: 'Avg Order Value (₹)', key: 'avgOrderValue', format: 'number' },
    { header: 'Total Revenue (₹)', key: 'totalRevenue', format: 'number' },
    { header: 'Current Outstanding (₹)', key: 'outstandingBalance', format: 'number' },
  ];
  const footerTotals = { totalRevenue: totals.revenue, outstandingBalance: totals.outstanding };
  const subtitle = `Customer Sales Analysis${minOrderFilter ? ` • Min revenue ₹${minOrderFilter}` : ''}`;
  const fileBase = 'customer-report';

  const handleCsv = () => exportCsv(fileBase, columns, customerData);
  const handleExcel = () => exportExcel(fileBase, columns, customerData, 'Customers');
  const buildSpec = async () => ({
    title: 'Customer Report (Sales by Client)',
    company: await getCompanyProfile(),
    subtitle,
    columns,
    rows: customerData,
    totals: footerTotals,
  });
  const handlePdf = async () => exportPdf(fileBase, await buildSpec());
  const handlePrint = async () => printHtml(buildReportHtml(await buildSpec()));

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <div>
          <h2 className="card-title">Customer Report (Sales by Client)</h2>
          <div className="page-sub">Identify top buyers, revenue concentration, and credit risks</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={handlePrint}><Printer size={16} /> Print</button>
          <button className="btn btn-outline" onClick={handlePdf}><FileText size={16} /> PDF</button>
          <button className="btn btn-outline" onClick={handleCsv}><Download size={16} /> CSV</button>
          <button className="btn btn-outline" onClick={handleExcel}><Download size={16} /> Excel</button>
        </div>
      </div>

      <div className="filter-bar" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', background: '#F8FAFC' }}>
        <div style={{ flex: 1, maxWidth: '250px' }}>
          <label className="form-label">Minimum Total Revenue (₹)</label>
          <select className="form-select" value={minOrderFilter} onChange={e => setMinOrderFilter(e.target.value)}>
            <option value="">All Customers</option>
            <option value="10000">Above ₹ 10,000</option>
            <option value="50000">Above ₹ 50,000</option>
            <option value="100000">Above ₹ 1,00,000</option>
          </select>
        </div>
        <button className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>Generate</button>
      </div>

      {/* KPI Dashboard */}
      <div style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'white', borderBottom: '1px solid var(--border)' }}>
        <div className="card" style={{ flex: 1, padding: '1rem', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <div style={{ fontSize: '0.8rem', color: '#1E40AF', textTransform: 'uppercase', fontWeight: 600 }}>Total Active Customers</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D4ED8' }}>{customerData.length}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '1rem', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <div style={{ fontSize: '0.8rem', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }}>Total Revenue from Base</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#15803D' }}>₹ {totals.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '1rem', background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <div style={{ fontSize: '0.8rem', color: '#991B1B', textTransform: 'uppercase', fontWeight: 600 }}>Total Credit Outstanding</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#B91C1C' }}>₹ {totals.outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th>Customer Name</th>
              <th>Contact & Area</th>
              <th style={{ textAlign: 'center' }}>Total Orders</th>
              <th style={{ textAlign: 'right' }}>Avg Order Value (₹)</th>
              <th style={{ textAlign: 'right' }}>Total Revenue (₹)</th>
              <th style={{ textAlign: 'right' }}>Current Outstanding (₹)</th>
            </tr>
          </thead>
          <tbody>
            {customerData.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No customers found matching criteria.</td></tr>
            ) : customerData.map((row, i) => (
              <tr key={row.id}>
                <td style={{ fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {i < 3 && <span title="Top Buyer" style={{ fontSize: '1rem' }}>⭐</span>}
                    {row.name}
                  </div>
                </td>
                <td>
                  <div>{row.phone || 'N/A'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.area}</div>
                </td>
                <td style={{ textAlign: 'center', fontWeight: 500 }}>{row.totalOrders}</td>
                <td style={{ textAlign: 'right' }}>{row.avgOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#15803D' }}>
                  {row.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right', color: row.outstandingBalance > 0 ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: row.outstandingBalance > 0 ? 600 : 400 }}>
                  {row.outstandingBalance > 0 ? row.outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}