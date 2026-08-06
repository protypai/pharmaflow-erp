import React, { useState, useEffect } from 'react';
import { Printer, Download, FileText, Undo2, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  exportCsv, exportExcel, exportPdf, printHtml, buildReportHtml,
  getCompanyProfile, dateRangeBounds,
} from '../../utils/export';

// Purchase Returns register — history + date-range + CSV/Excel/PDF export.
// Mirrors the other reports for a consistent UX (returns TO suppliers = debit notes).
export default function PurchaseReturnReport() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [dateRange, setDateRange] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      const res = await window.pharmaAPI.db.query(
        "SELECT id, name FROM suppliers ORDER BY name ASC"
      );
      setSuppliers(res?.data || []);
    })();
  }, []);

  const fetchReturns = async () => {
    try {
      const where = [];
      const params = [];
      const { start, end } = dateRangeBounds(dateRange, customStart, customEnd);
      if (start && end) { where.push('pr.return_date BETWEEN ? AND ?'); params.push(start, end); }
      if (supplierId) { where.push('pr.supplier_id = ?'); params.push(supplierId); }

      const query = `
        SELECT pr.id            as returnId,
               pr.return_date   as date,
               pr.entry_no      as returnNo,
               pr.debit_note_no as debitNote,
               p.invoice_no     as refInvoice,
               s.name           as partyName,
               pr.reason        as reason,
               pr.net_amount    as net,
               (SELECT COUNT(*) FROM purchase_return_items WHERE return_id = pr.id) as items
        FROM purchase_returns pr
        LEFT JOIN suppliers s ON pr.supplier_id = s.id
        LEFT JOIN purchases p ON pr.purchase_id = p.id
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY pr.return_date DESC, pr.created_at DESC
      `;
      const res = await window.pharmaAPI.db.query(query, params);
      setRows(res?.data || []);
    } catch (err) {
      console.error('Failed to fetch purchase returns:', err);
    }
  };

  useEffect(() => { fetchReturns(); }, [supplierId, dateRange, customStart, customEnd]);

  const totals = rows.reduce((acc, r) => {
    acc.items += Number(r.items) || 0;
    acc.net += Number(r.net) || 0;
    return acc;
  }, { items: 0, net: 0 });

  const avgReturn = rows.length > 0 ? totals.net / rows.length : 0;

  const dateFmt = (v) => String(v || '').slice(0, 10);

  const columns = [
    { header: 'Date', key: 'date', format: dateFmt },
    { header: 'Return No', key: 'returnNo' },
    { header: 'Debit Note', key: 'debitNote' },
    { header: 'Ref Invoice', key: 'refInvoice' },
    { header: 'Supplier', key: 'partyName' },
    { header: 'Reason', key: 'reason' },
    { header: 'Items', key: 'items', format: 'int' },
    { header: 'Net Amount (₹)', key: 'net', format: 'number' },
  ];

  const subtitle = `Purchase Returns • Range: ${dateRange}${supplierId ? ' • Filtered by supplier' : ''}`;
  const fileBase = 'purchase-return-report';

  const handleCsv = () => exportCsv(fileBase, columns, rows);
  const handleExcel = () => exportExcel(fileBase, columns, rows, 'Purchase Returns');
  const buildSpec = async () => ({
    title: 'Purchase Return Report',
    company: await getCompanyProfile(),
    subtitle,
    columns,
    rows,
    totals: { items: totals.items, net: totals.net },
  });
  const handlePdf = async () => exportPdf(fileBase, await buildSpec());
  const handlePrint = async () => printHtml(buildReportHtml(await buildSpec()));

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <div>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Undo2 size={20} /> Purchase Return Report
          </h2>
          <div className="page-sub">Goods returned to suppliers (debit notes) with full history</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={handlePrint}><Printer size={16} /> Print</button>
          <button className="btn btn-outline" onClick={handlePdf}><FileText size={16} /> PDF</button>
          <button className="btn btn-outline" onClick={handleCsv}><Download size={16} /> CSV</button>
          <button className="btn btn-outline" onClick={handleExcel}><Download size={16} /> Excel</button>
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
        {dateRange === 'custom' && (
          <>
            <div style={{ width: '160px' }}>
              <label className="form-label">From</label>
              <input type="date" className="form-input" value={customStart} onChange={e => setCustomStart(e.target.value)} />
            </div>
            <div style={{ width: '160px' }}>
              <label className="form-label">To</label>
              <input type="date" className="form-input" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
            </div>
          </>
        )}
        <div style={{ flex: 1, maxWidth: '300px' }}>
          <label className="form-label">Filter by Supplier</label>
          <select className="form-select" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
            <option value="">All Suppliers</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }} onClick={fetchReturns}>Generate</button>
      </div>

      {/* KPI tiles */}
      <div style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'white', borderBottom: '1px solid var(--border)' }}>
        <div className="card" style={{ flex: 1, padding: '1rem', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <div style={{ fontSize: '0.8rem', color: '#1E40AF', textTransform: 'uppercase', fontWeight: 600 }}>Total Returns</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D4ED8' }}>{rows.length}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '1rem', background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <div style={{ fontSize: '0.8rem', color: '#991B1B', textTransform: 'uppercase', fontWeight: 600 }}>Total Return Value</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#B91C1C' }}>₹ {totals.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '1rem', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', fontWeight: 600 }}>Avg Return Value</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#334155' }}>₹ {avgReturn.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ width: '110px' }}>Date</th>
              <th style={{ width: '150px' }}>Return No</th>
              <th style={{ width: '130px' }}>Debit Note</th>
              <th style={{ width: '130px' }}>Ref Invoice</th>
              <th>Supplier</th>
              <th>Reason</th>
              <th style={{ width: '70px', textAlign: 'center' }}>Items</th>
              <th style={{ width: '150px', textAlign: 'right' }}>Net Amount (₹)</th>
              <th style={{ width: '70px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>No purchase returns found for this period.</td></tr>
            ) : rows.map((row) => (
              <tr key={row.returnId}>
                <td>{dateFmt(row.date)}</td>
                <td style={{ fontWeight: 600 }}>{row.returnNo}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{row.debitNote || '—'}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{row.refInvoice || '—'}</td>
                <td style={{ fontWeight: 500 }}>{row.partyName || '—'}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{row.reason || '—'}</td>
                <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{row.items}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#B91C1C' }}>
                  {(Number(row.net) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ padding: '3px 7px', minWidth: 0, color: '#D97706', borderColor: '#D97706' }}
                    title="Edit Return"
                    onClick={() => navigate(`/transactions/purchase-return/edit/${row.returnId}`)}
                  >
                    <Edit size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot style={{ position: 'sticky', bottom: 0, background: '#F1F5F9', fontWeight: 700 }}>
            <tr>
              <td colSpan="6" style={{ textAlign: 'right' }}>Grand Total:</td>
              <td style={{ textAlign: 'center' }}>{totals.items}</td>
              <td style={{ textAlign: 'right', color: '#B91C1C', fontSize: '1.1rem' }}>
                ₹ {totals.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
