import React, { useState, useEffect, useMemo } from 'react';
import { Search, Printer, Download, FileText, Truck } from 'lucide-react';
import {
  exportCsv, exportExcel, exportPdf, printHtml, buildReportHtml,
  getCompanyProfile, dateRangeBounds,
} from '../../utils/export';


export default function SupplierReport() {
  const [suppliers, set_suppliers] = useState([]);
  const [dateRange, setDateRange] = useState('this_year');

  const fetchData = async () => {
    const where = [];
    const params = [];
    const { start, end } = dateRangeBounds(dateRange);
    // Filter procurement by period in the JOIN so suppliers with no activity
    // in the range still appear (with zero totals).
    let joinCond = 's.id = p.supplier_id';
    if (start && end) { joinCond += ' AND p.invoice_date BETWEEN ? AND ?'; params.push(start, end); }

    const res_suppliers = await window.pharmaAPI.db.query(`
      SELECT s.*,
             COUNT(p.id) as totalInvoices,
             SUM(p.net_amount) as totalProcurement,
             (SELECT SUM(amount) FROM payments WHERE supplier_id = s.id) as totalPaid,
             (SELECT SUM(net_amount) FROM purchase_returns WHERE supplier_id = s.id) as totalReturns
      FROM suppliers s
      LEFT JOIN purchases p ON ${joinCond}
      GROUP BY s.id
    `, params);
    set_suppliers(res_suppliers?.data || []);
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const supplierData = useMemo(() => {
    return suppliers.map(s => {
      const totalInvoices = s.totalInvoices || 0;
      const totalProcurement = s.totalProcurement || 0;
      const returnVolume = s.totalReturns || 0;
      const netProcurement = totalProcurement - returnVolume;
      const outstandingBalance = (s.opening_balance || 0) + netProcurement - (s.totalPaid || 0);

      return {
        ...s,
        totalInvoices,
        totalProcurement,
        returnVolume,
        netProcurement,
        outstandingBalance
      };
    }).sort((a, b) => b.netProcurement - a.netProcurement); // Sort by highest dependency
  }, [suppliers]);

  const totals = supplierData.reduce((acc, curr) => {
    acc.net += curr.netProcurement;
    acc.returns += curr.returnVolume;
    return acc;
  }, { net: 0, returns: 0 });

  const columns = [
    { header: 'Supplier Name', key: 'name' },
    { header: 'City', key: 'city' },
    { header: 'Total Invoices', key: 'totalInvoices', format: 'int' },
    { header: 'Gross Procurement (₹)', key: 'totalProcurement', format: 'number' },
    { header: 'Return/Debit Note Vol (₹)', key: 'returnVolume', format: 'number' },
    { header: 'Net Procurement (₹)', key: 'netProcurement', format: 'number' },
    { header: 'Pending Payable (₹)', key: 'outstandingBalance', format: 'number' },
  ];
  const footerTotals = { netProcurement: totals.net, returnVolume: totals.returns };
  const subtitle = `Vendor Procurement Analysis • Range: ${dateRange}`;
  const fileBase = 'supplier-report';

  const handleCsv = () => exportCsv(fileBase, columns, supplierData);
  const handleExcel = () => exportExcel(fileBase, columns, supplierData, 'Suppliers');
  const buildSpec = async () => ({
    title: 'Supplier Report (Procurement by Vendor)',
    company: await getCompanyProfile(),
    subtitle,
    columns,
    rows: supplierData,
    totals: footerTotals,
  });
  const handlePdf = async () => exportPdf(fileBase, await buildSpec());
  const handlePrint = async () => printHtml(buildReportHtml(await buildSpec()));

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <div>
          <h2 className="card-title">Supplier Report (Procurement by Vendor)</h2>
          <div className="page-sub">Evaluate vendor dependency, procurement volume, and return rates</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={handlePrint}><Printer size={16} /> Print</button>
          <button className="btn btn-outline" onClick={handlePdf}><FileText size={16} /> PDF</button>
          <button className="btn btn-outline" onClick={handleCsv}><Download size={16} /> CSV</button>
          <button className="btn btn-outline" onClick={handleExcel}><Download size={16} /> Excel</button>
        </div>
      </div>

      <div className="filter-bar" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', background: '#F8FAFC' }}>
        <div style={{ width: '250px' }}>
          <label className="form-label">Date Range</label>
          <select className="form-select" value={dateRange} onChange={e => setDateRange(e.target.value)}>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Financial Year</option>
          </select>
        </div>
        <button className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }} onClick={fetchData}>Generate</button>
      </div>

      {/* KPI Dashboard */}
      <div style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'white', borderBottom: '1px solid var(--border)' }}>
        <div className="card" style={{ flex: 1, padding: '1rem', background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
          <div style={{ fontSize: '0.8rem', color: '#5B21B6', textTransform: 'uppercase', fontWeight: 600 }}>Active Suppliers</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4C1D95' }}>{supplierData.length}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '1rem', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <div style={{ fontSize: '0.8rem', color: '#1E40AF', textTransform: 'uppercase', fontWeight: 600 }}>Total Net Procurement</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D4ED8' }}>₹ {totals.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '1rem', background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <div style={{ fontSize: '0.8rem', color: '#991B1B', textTransform: 'uppercase', fontWeight: 600 }}>Total Return Volume (Damage/Expiry)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#B91C1C' }}>₹ {totals.returns.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th>Supplier Name</th>
              <th>City</th>
              <th style={{ textAlign: 'center' }}>Total Invoices</th>
              <th style={{ textAlign: 'right' }}>Gross Procurement (₹)</th>
              <th style={{ textAlign: 'right' }}>Return/Debit Note Vol (₹)</th>
              <th style={{ textAlign: 'right' }}>Net Procurement (₹)</th>
              <th style={{ textAlign: 'right' }}>Pending Payable (₹)</th>
            </tr>
          </thead>
          <tbody>
            {supplierData.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No supplier data found.</td></tr>
            ) : supplierData.map((row, i) => (
              <tr key={row.id}>
                <td style={{ fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {i === 0 && <span title="Top Supplier" style={{ fontSize: '1rem' }}>🏆</span>}
                    {row.name}
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{row.city}</td>
                <td style={{ textAlign: 'center', fontWeight: 500 }}>{row.totalInvoices}</td>
                <td style={{ textAlign: 'right' }}>{row.totalProcurement.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ textAlign: 'right', color: 'var(--danger)' }}>
                  {row.returnVolume > 0 ? `-${row.returnVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#1D4ED8' }}>
                  {row.netProcurement.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
