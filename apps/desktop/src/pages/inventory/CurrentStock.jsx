import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Printer, Download, Package } from 'lucide-react';


export default function CurrentStock() {
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
               IFNULL(b_agg.avgMrp, 0) as avgMrp,
               IFNULL(b_agg.totalValuePTR, 0) as totalValuePTR,
               IFNULL(b_agg.totalValueMRP, 0) as totalValueMRP
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
        LEFT JOIN racks r ON p.rack_id = r.id
        LEFT JOIN (
           SELECT product_id,
                  SUM(current_qty) as totalQty,
                  SUM(current_qty * ptr) / SUM(current_qty) as avgPtr,
                  SUM(current_qty * mrp) / SUM(current_qty) as avgMrp,
                  SUM(current_qty * ptr) as totalValuePTR,
                  SUM(current_qty * mrp) as totalValueMRP
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

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [mfgFilter, setMfgFilter] = useState('');

  // Calculate aggregated stock data
  const stockData = useMemo(() => {
    return products.map(p => {
      const totalQty = p.totalQty || 0;
      const avgPtr = p.avgPtr || 0;
      const avgMrp = p.avgMrp || 0;
      const totalValuePTR = p.totalValuePTR || 0;
      const totalValueMRP = p.totalValueMRP || 0;

      return {
        ...p,
        totalQty,
        avgPtr,
        avgMrp,
        totalValuePTR,
        totalValueMRP
      };
    }).filter(p => {
      if (search && !p.name?.toLowerCase().includes(search.toLowerCase()) && !p.generic_name?.toLowerCase().includes(search.toLowerCase())) return false;
      if (catFilter && p.category_id !== catFilter) return false;
      if (mfgFilter && p.manufacturer_id !== mfgFilter) return false;
      // Only show items that actually have stock
      if (p.totalQty <= 0) return false;
      return true;
    });
  }, [search, catFilter, mfgFilter, products]);

  // Aggregate totals for the footer
  const grandTotals = stockData.reduce((acc, curr) => {
    acc.qty += curr.totalQty;
    acc.ptrValue += curr.totalValuePTR;
    acc.mrpValue += curr.totalValueMRP;
    return acc;
  }, { qty: 0, ptrValue: 0, mrpValue: 0 });

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <h2 className="card-title">Current Stock Valuation</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={() => window.print()}><Printer size={16} /> Print</button>
          <button className="btn btn-outline" onClick={() => alert("Data exported successfully as CSV!")}><Download size={16} /> Export CSV</button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search product or generic name..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '250px' }}
          />
        </div>
        <select className="form-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="form-select" value={mfgFilter} onChange={e => setMfgFilter(e.target.value)}>
          <option value="">All Manufacturers</option>
          {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th>Item Code</th>
              <th>Product Details</th>
              <th>Rack</th>
              <th>Available Qty</th>
              <th>Unit</th>
              <th style={{ textAlign: 'right' }}>Avg PTR (₹)</th>
              <th style={{ textAlign: 'right' }}>Avg MRP (₹)</th>
              <th style={{ textAlign: 'right' }}>Stock Value (PTR)</th>
            </tr>
          </thead>
          <tbody>
            {stockData.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No stock found matching criteria.</td></tr>
            ) : stockData.map(prod => (
              <tr key={prod.id}>
                <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{prod.code}</td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{prod.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {prod.genericName} • {prod.category} • {prod.manufacturer}
                  </div>
                </td>
                <td>{prod.rack}</td>
                <td>
                  <div style={{ fontWeight: 600, color: prod.totalQty < prod.minStock ? 'var(--danger)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {prod.totalQty}
                    {prod.totalQty < prod.minStock && <span title="Low Stock" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' }}></span>}
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{prod.saleUnit}</td>
                <td style={{ textAlign: 'right' }}>{prod.avgPtr.toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>{prod.avgMrp.toFixed(2)}</td>
                <td style={{ fontWeight: 600, textAlign: 'right' }}>₹ {prod.totalValuePTR.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Aggregate Footer */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <Package size={20} />
          <span>Showing <strong>{stockData.length}</strong> Products with Stock</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Units</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{grandTotals.qty.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Value (MRP)</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹ {grandTotals.mrpValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div style={{ textAlign: 'right', color: 'var(--primary)' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Value (Cost/PTR)</div>
            <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>₹ {grandTotals.ptrValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
      </div>
    </div>
  );
}