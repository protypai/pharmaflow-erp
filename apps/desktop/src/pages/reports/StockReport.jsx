import React, { useState, useEffect, useMemo } from 'react';
import { Search, Printer, Download, FileText, PackageSearch } from 'lucide-react';
import {
  exportCsv, exportExcel, exportPdf, printHtml, buildReportHtml, getCompanyProfile,
} from '../../utils/export';
import { formatStock } from '../../utils/units';


export default function StockReport() {
  const [products, set_products] = useState([]);
  const [categories, set_categories] = useState([]);
  const [manufacturers, set_manufacturers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res_products = await window.pharmaAPI.db.query(`
        SELECT p.*, 
               c.name as category, 
               m.name as manufacturer, 
               r.code as rack,
               IFNULL(b_agg.totalQty, 0) as totalQty,
               IFNULL(b_agg.avgPtr, 0) as avgPtr,
               IFNULL(b_agg.totalValuePTR, 0) as totalValuePTR
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
        LEFT JOIN racks r ON p.rack_id = r.id
        LEFT JOIN (
           SELECT product_id,
                  SUM(current_qty) as totalQty,
                  SUM(current_qty * ptr) / SUM(current_qty) as avgPtr,
                  SUM(current_qty * ptr) as totalValuePTR
           FROM batches
           WHERE current_qty > 0
           GROUP BY product_id
        ) b_agg ON b_agg.product_id = p.id
      `);
      set_products(res_products?.data || []);
      const res_categories = await window.pharmaAPI.db.query("SELECT * FROM categories");
      set_categories(res_categories?.data || []);
      const res_manufacturers = await window.pharmaAPI.db.query("SELECT * FROM manufacturers");
      set_manufacturers(res_manufacturers?.data || []);
    };
    fetchData();
  }, []);

  const [catFilter, setCatFilter] = useState('');
  const [mfgFilter, setMfgFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const stockData = useMemo(() => {
    let data = products.map(p => {
      const totalQty = p.totalQty || 0;
      const avgPtr = p.avgPtr || 0;
      const stockValue = p.totalValuePTR || 0;

      return {
        ...p,
        totalQty,
        avgPtr,
        stockValue,
        status: totalQty <= 0 ? 'Out of Stock' : (totalQty < (p.min_stock || 0) ? 'Low Stock' : 'In Stock')
      };
    });

    if (catFilter) data = data.filter(d => d.category_id === parseInt(catFilter));
    if (mfgFilter) data = data.filter(d => d.manufacturer_id === parseInt(mfgFilter));
    
    if (statusFilter === 'in_stock') data = data.filter(d => d.totalQty > 0);
    if (statusFilter === 'out_of_stock') data = data.filter(d => d.totalQty <= 0);
    if (statusFilter === 'low_stock') data = data.filter(d => d.status === 'Low Stock');

    return data;
  }, [catFilter, mfgFilter, statusFilter, products]);

  const totals = stockData.reduce((acc, curr) => {
    acc.qty += curr.totalQty;
    acc.value += curr.stockValue;
    return acc;
  }, { qty: 0, value: 0 });

  const columns = [
    { header: 'Item Code', key: 'code' },
    { header: 'Product Name', key: 'name' },
    { header: 'Category', key: 'category' },
    { header: 'Manufacturer', key: 'manufacturer' },
    { header: 'Rack', key: 'rack' },
    { header: 'Available Qty', key: 'totalQty', format: 'int' },
    { header: 'Avg Unit Cost (PTR)', key: 'avgPtr', format: 'number' },
    { header: 'Total Value (₹)', key: 'stockValue', format: 'number' },
  ];
  const footerTotals = { totalQty: totals.qty, stockValue: totals.value };
  const subtitle = 'Stock Valuation (PTR) as on ' + new Date().toLocaleDateString('en-IN');
  const fileBase = 'stock-statement';

  const handleCsv = () => exportCsv(fileBase, columns, stockData);
  const handleExcel = () => exportExcel(fileBase, columns, stockData, 'Stock');
  const buildSpec = async () => ({
    title: 'Stock Statement (Valuation Report)',
    company: await getCompanyProfile(),
    subtitle,
    columns,
    rows: stockData,
    totals: footerTotals,
  });
  const handlePdf = async () => exportPdf(fileBase, await buildSpec());
  const handlePrint = async () => printHtml(buildReportHtml(await buildSpec()));

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <div>
          <h2 className="card-title">Stock Statement (Valuation Report)</h2>
          <div className="page-sub">Audit physical vs system stock and total warehouse valuation</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={handlePrint}><Printer size={16} /> Print</button>
          <button className="btn btn-outline" onClick={handlePdf}><FileText size={16} /> PDF</button>
          <button className="btn btn-outline" onClick={handleCsv}><Download size={16} /> CSV</button>
          <button className="btn btn-outline" onClick={handleExcel}><Download size={16} /> Excel</button>
        </div>
      </div>

      <div className="filter-bar" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', background: '#F8FAFC' }}>
        <div style={{ flex: 1 }}>
          <label className="form-label">Category</label>
          <select className="form-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label className="form-label">Manufacturer</label>
          <select className="form-select" value={mfgFilter} onChange={e => setMfgFilter(e.target.value)}>
            <option value="">All Manufacturers</option>
            {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label className="form-label">Stock Status</label>
          <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Items</option>
            <option value="in_stock">In Stock (&gt; 0)</option>
            <option value="low_stock">Low Stock (Below Min)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>
        </div>
        <button className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>Generate</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.5rem 1.5rem', background: '#F1F5F9', borderBottom: '1px solid var(--border)', gap: '2rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total SKUs</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{stockData.length}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Physical Units</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{totals.qty.toLocaleString('en-IN')}</div>
        </div>
        <div style={{ textAlign: 'right', color: 'var(--primary)' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Total Godown Value</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>₹ {totals.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th>Item Code</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Manufacturer</th>
              <th>Rack</th>
              <th style={{ textAlign: 'center' }}>Available Qty</th>
              <th style={{ textAlign: 'right' }}>Avg Unit Cost (PTR)</th>
              <th style={{ textAlign: 'right' }}>Total Value (₹)</th>
            </tr>
          </thead>
          <tbody>
            {stockData.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No stock data matching filters.</td></tr>
            ) : stockData.map((row) => (
              <tr key={row.id}>
                <td style={{ color: 'var(--text-secondary)' }}>{row.code}</td>
                <td style={{ fontWeight: 600 }}>{row.name}</td>
                <td>{row.category}</td>
                <td style={{ fontSize: '0.85rem' }}>{row.manufacturer}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{row.rack}</td>
                <td style={{ textAlign: 'center', fontWeight: 700, color: row.totalQty === 0 ? 'var(--danger)' : 'inherit' }}>
                  {formatStock(row.totalQty, row.conversion_factor, row.sale_unit)}
                </td>
                <td style={{ textAlign: 'right' }}>{row.avgPtr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>
                  {row.stockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}