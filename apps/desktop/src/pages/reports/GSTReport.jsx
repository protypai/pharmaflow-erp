import React, { useState, useEffect } from 'react';
import { Search, Printer, Download, FileText, AlertCircle } from 'lucide-react';
import {
  exportCsv, exportExcel, exportPdf, printHtml, buildReportHtml,
  getCompanyProfile, periodBounds,
} from '../../utils/export';

export default function GSTReport() {
  const [reportType, setReportType] = useState('gstr3b');
  const [period, setPeriod] = useState('july_2025');

  const [gstSummary, setGstSummary] = useState({
    salesValue: 0, purchaseValue: 0,
    outputCGST: 0, outputSGST: 0, outputIGST: 0,
    inputCGST: 0, inputSGST: 0, inputIGST: 0,
  });
  const [hsnData, setHsnData] = useState([]);

  const fetchGST = async () => {
    try {
      const { start, end } = periodBounds(period);
      const saleWhere = (start && end) ? 'WHERE date BETWEEN ? AND ?' : '';
      const purchWhere = (start && end) ? 'WHERE invoice_date BETWEEN ? AND ?' : '';
      const dateParams = (start && end) ? [start, end] : [];

      const salesRes = await window.pharmaAPI.db.query(
        `SELECT SUM(subtotal) as salesValue, 
                SUM(net_amount - taxable_amount)/2 as outputCGST, 
                SUM(net_amount - taxable_amount)/2 as outputSGST, 
                0 as outputIGST 
         FROM sales ${saleWhere}`,
        dateParams
      );
      const purchRes = await window.pharmaAPI.db.query(
        `SELECT SUM(subtotal) as purchaseValue, 
                SUM(net_amount - taxable_amount)/2 as inputCGST, 
                SUM(net_amount - taxable_amount)/2 as inputSGST, 
                0 as inputIGST 
         FROM purchases ${purchWhere}`,
        dateParams
      );

      const s = salesRes?.data?.[0] || {};
      const p = purchRes?.data?.[0] || {};

      setGstSummary({
        salesValue: s.salesValue || 0,
        outputCGST: s.outputCGST || 0,
        outputSGST: s.outputSGST || 0,
        outputIGST: s.outputIGST || 0,
        purchaseValue: p.purchaseValue || 0,
        inputCGST: p.inputCGST || 0,
        inputSGST: p.inputSGST || 0,
        inputIGST: p.inputIGST || 0,
      });

      const hsnFilter = (start && end)
        ? 'WHERE si.sale_id IN (SELECT id FROM sales WHERE date BETWEEN ? AND ?)'
        : '';
      const hsnRes = await window.pharmaAPI.db.query(`
        SELECT p.hsn_code as hsn, p.gst_rate || '%' as slab,
               SUM(si.net_amount / (1 + (si.gst_rate / 100.0))) as taxable,
               SUM((si.net_amount - (si.net_amount / (1 + (si.gst_rate / 100.0)))) / 2) as cgst,
               SUM((si.net_amount - (si.net_amount / (1 + (si.gst_rate / 100.0)))) / 2) as sgst,
               0 as igst,
               SUM(si.net_amount - (si.net_amount / (1 + (si.gst_rate / 100.0)))) as total
        FROM products p
        JOIN sale_items si ON p.id = si.product_id
        ${hsnFilter}
        GROUP BY p.hsn_code, p.gst_rate
      `, dateParams);
      setHsnData(hsnRes?.data || []);
    } catch (err) {
      console.error("Failed to fetch GST data:", err);
    }
  };

  useEffect(() => {
    fetchGST();
  }, [period]);

  const totalOutput = (gstSummary.outputCGST || 0) + (gstSummary.outputSGST || 0) + (gstSummary.outputIGST || 0);
  const totalInput = (gstSummary.inputCGST || 0) + (gstSummary.inputSGST || 0) + (gstSummary.inputIGST || 0);
  const netPayable = totalOutput - totalInput;

  const hsnColumns = [
    { header: 'HSN Code', key: 'hsn' },
    { header: 'Tax Slab', key: 'slab' },
    { header: 'Total Taxable Value (₹)', key: 'taxable', format: 'number' },
    { header: 'Central Tax (CGST)', key: 'cgst', format: 'number' },
    { header: 'State Tax (SGST)', key: 'sgst', format: 'number' },
    { header: 'Integrated Tax (IGST)', key: 'igst', format: 'number' },
    { header: 'Total Tax Amount', key: 'total', format: 'number' },
  ];
  const hsnTotals = hsnData.reduce((acc, r) => {
    acc.taxable += (r.taxable || 0);
    acc.cgst += (r.cgst || 0);
    acc.sgst += (r.sgst || 0);
    acc.igst += (r.igst || 0);
    acc.total += (r.total || 0);
    return acc;
  }, { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });
  const subtitle = `GST HSN-wise Slab Summary • Period: ${period}`;
  const fileBase = `gst-hsn-summary-${period}`;

  const handleCsv = () => exportCsv(fileBase, hsnColumns, hsnData);
  const handleExcel = () => exportExcel(fileBase, hsnColumns, hsnData, 'HSN Summary');
  const buildSpec = async () => ({
    title: 'GST Compliance Report (HSN Summary)',
    company: await getCompanyProfile(),
    subtitle,
    columns: hsnColumns,
    rows: hsnData,
    totals: hsnTotals,
  });
  const handlePdf = async () => exportPdf(fileBase, await buildSpec());
  const handlePrint = async () => printHtml(buildReportHtml(await buildSpec()));

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ background: '#F0FDF4', borderBottom: '1px solid #BBF7D0' }}>
        <div>
          <h2 className="card-title" style={{ color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} /> GST Compliance Report
          </h2>
          <div className="page-sub" style={{ color: '#15803D' }}>Generate GSTR-1, GSTR-2, and GSTR-3B summaries for CA filing</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" style={{ borderColor: '#166534', color: '#166534' }} onClick={handlePrint}><Printer size={16} /> Print</button>
          <button className="btn btn-outline" style={{ borderColor: '#166534', color: '#166534' }} onClick={handlePdf}><FileText size={16} /> PDF</button>
          <button className="btn btn-outline" style={{ borderColor: '#166534', color: '#166534' }} onClick={handleCsv}><Download size={16} /> CSV</button>
          <button className="btn btn-primary" style={{ background: '#166534' }} onClick={handleExcel}><Download size={16} /> Excel</button>
        </div>
      </div>

      <div className="filter-bar" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', background: '#F8FAFC' }}>
        <div style={{ width: '250px' }}>
          <label className="form-label">Return Type</label>
          <select className="form-select" value={reportType} onChange={e => setReportType(e.target.value)}>
            <option value="gstr1">GSTR-1 (Outward / Sales)</option>
            <option value="gstr2">GSTR-2 (Inward / Purchases)</option>
            <option value="gstr3b">GSTR-3B (Summary)</option>
            <option value="hsn">HSN Wise Summary</option>
          </select>
        </div>
        <div style={{ width: '200px' }}>
          <label className="form-label">Filing Period</label>
          <select className="form-select" value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="july_2025">July 2025</option>
            <option value="june_2025">June 2025</option>
            <option value="q1_2025">Q1 (Apr-Jun 2025)</option>
          </select>
        </div>
        <button className="btn btn-outline" style={{ padding: '0.5rem 1.5rem' }} onClick={fetchGST}>Refresh</button>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        
        {reportType === 'gstr3b' && (
          <div style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>
              3.1 Details of Outward Supplies and inward supplies liable to reverse charge
            </h3>
            
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="card" style={{ flex: 1, padding: '1.5rem', background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 600, color: '#991B1B' }}>Output Tax (Tax Collected on Sales)</span>
                  <span style={{ fontWeight: 700, fontSize: '1.2rem', color: '#B91C1C' }}>₹ {totalOutput.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#7F1D1D', marginBottom: '0.25rem' }}>
                  <span>CGST:</span> <span>₹ {gstSummary.outputCGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#7F1D1D', marginBottom: '0.25rem' }}>
                  <span>SGST:</span> <span>₹ {gstSummary.outputSGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#7F1D1D' }}>
                  <span>IGST:</span> <span>₹ {gstSummary.outputIGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="card" style={{ flex: 1, padding: '1.5rem', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 600, color: '#065F46' }}>Input Tax Credit (ITC Available)</span>
                  <span style={{ fontWeight: 700, fontSize: '1.2rem', color: '#047857' }}>₹ {totalInput.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#064E3B', marginBottom: '0.25rem' }}>
                  <span>CGST:</span> <span>₹ {gstSummary.inputCGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#064E3B', marginBottom: '0.25rem' }}>
                  <span>SGST:</span> <span>₹ {gstSummary.inputSGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#064E3B' }}>
                  <span>IGST:</span> <span>₹ {gstSummary.inputIGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: '#1E40AF' }}>Net Tax Payable in Cash</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#1E3A8A', marginTop: '0.25rem' }}>Output Tax minus Input Tax Credit (ITC)</p>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1D4ED8' }}>
                ₹ {netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', color: '#B45309', background: '#FEF3C7', padding: '1rem', borderRadius: 'var(--radius)' }}>
              <AlertCircle size={20} />
              <span style={{ fontSize: '0.9rem' }}>Please verify all purchase invoices are uploaded by suppliers in GSTR-2B to claim full ITC.</span>
            </div>
          </div>
        )}

        {reportType === 'hsn' && (
          <table className="data-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th>HSN Code & Description</th>
                <th style={{ textAlign: 'center' }}>Tax Slab</th>
                <th style={{ textAlign: 'right' }}>Total Taxable Value (₹)</th>
                <th style={{ textAlign: 'right' }}>Central Tax (CGST)</th>
                <th style={{ textAlign: 'right' }}>State Tax (SGST)</th>
                <th style={{ textAlign: 'right' }}>Integrated Tax (IGST)</th>
                <th style={{ textAlign: 'right' }}>Total Tax Amount</th>
              </tr>
            </thead>
            <tbody>
              {hsnData.map((row, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{row.hsn}</td>
                  <td style={{ textAlign: 'center', fontWeight: 500 }}>{row.slab}</td>
                  <td style={{ textAlign: 'right' }}>{row.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'right' }}>{row.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'right' }}>{row.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'right' }}>{row.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                    {row.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {(reportType === 'gstr1' || reportType === 'gstr2') && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <h3>B2B Invoice Details Ready</h3>
            <p>Select 'Export JSON for Portal' to download the Gov Offline Utility compatible file.</p>
          </div>
        )}
      </div>
    </div>
  );
}