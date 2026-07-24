import React, { useState, useEffect, useMemo } from 'react';
import { Ghost, ArrowDownToLine, Printer } from 'lucide-react';


export default function DeadStock() {
  const [products, set_products] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res_products = await window.pharmaAPI.db.query(`
        SELECT p.*,
        (SELECT MAX(s.date) FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE si.product_id = p.id) as lastSaleDate,
        json_group_array(json_object(
          'id', b.id, 'batch', b.batch_no, 'expiry', b.expiry_date,
          'mrp', b.mrp, 'ptr', b.ptr, 'qty', b.current_qty
        )) as batches
        FROM products p
        LEFT JOIN batches b ON p.id = b.product_id
        GROUP BY p.id
      `);
      
      const formattedProducts = (res_products?.data || []).map(p => ({
        ...p,
        batches: p.batches && typeof p.batches === 'string' 
          ? JSON.parse(p.batches).filter(b => b.id) 
          : []
      }));
      set_products(formattedProducts);
    };
    fetchData();
  }, []);

  const [daysFilter, setDaysFilter] = useState('180');

  const deadStockData = useMemo(() => {
    return products.map(p => {
      const totalQty = p.batches.reduce((acc, b) => acc + (b.qty || 0), 0);
      
      let daysSinceLastSale = 9999; // Fallback if never sold
      let lastSaleDateStr = 'Never Sold';
      
      if (p.lastSaleDate) {
        lastSaleDateStr = p.lastSaleDate;
        daysSinceLastSale = Math.floor((new Date() - new Date(p.lastSaleDate)) / (1000 * 60 * 60 * 24));
      }
      
      // Calculate locked capital (PTR * Qty)
      const lockedCapital = p.batches.reduce((acc, b) => acc + ((b.qty || 0) * (b.ptr || 0)), 0);

      return {
        ...p,
        totalQty,
        daysSinceLastSale,
        lastSaleDateStr,
        lockedCapital
      };
    }).filter(p => p.totalQty > 0 && p.daysSinceLastSale >= parseInt(daysFilter))
      .sort((a, b) => b.lockedCapital - a.lockedCapital); // Sort by highest locked capital first
  }, [daysFilter, products]);

  const totalLockedCapital = deadStockData.reduce((sum, p) => sum + p.lockedCapital, 0);

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ background: '#F3F4F6', borderBottom: '1px solid #E5E7EB' }}>
        <div>
          <h2 className="card-title" style={{ color: '#4B5563', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Ghost size={20} /> Dead Stock (Non-Moving)
          </h2>
          <div className="page-sub" style={{ color: '#6B7280' }}>Identify inventory that isn't selling to free up locked capital</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline"><Printer size={16} /> Print Report</button>
        </div>
      </div>

      <div className="filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>No sales in last:</label>
          <select className="form-select" value={daysFilter} onChange={e => setDaysFilter(e.target.value)} style={{ width: '200px' }}>
            <option value="60">60 Days</option>
            <option value="90">90 Days</option>
            <option value="180">6 Months</option>
            <option value="365">1 Year</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#F3F4F6', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', color: '#374151' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Total Locked Capital:</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>₹ {totalLockedCapital.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th>Item Code</th>
              <th>Product Details</th>
              <th>Available Qty</th>
              <th>Last Sale Date</th>
              <th>Days Idle</th>
              <th style={{ textAlign: 'right' }}>Locked Capital (₹)</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deadStockData.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No dead stock found for this timeframe!</td></tr>
            ) : deadStockData.map(p => (
              <tr key={p.id}>
                <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{p.code}</td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {p.genericName} • {p.manufacturer}
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>{p.totalQty} {p.saleUnit}</td>
                <td>{p.lastSaleDateStr}</td>
                <td>
                  <span style={{ 
                    background: p.daysSinceLastSale > 365 ? 'var(--danger)' : '#6B7280', 
                    color: 'white', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '12px', 
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {p.daysSinceLastSale === 9999 ? 'No Sales' : `${p.daysSinceLastSale} days`}
                  </span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: '#374151' }}>
                  ₹ {p.lockedCapital.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="col-actions">
                  <button 
                    className="btn btn-outline btn-sm" 
                    title="Apply Discount / Push Sale"
                    onClick={() => alert(`Pushing sale for ${p.name}`)}
                  >
                    <ArrowDownToLine size={14} /> Push Sale
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}