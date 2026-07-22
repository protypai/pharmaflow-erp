import React, { useState, useMemo } from 'react';
import { Search, Filter, Printer, Download, Package } from 'lucide-react';
import { products, categories, manufacturers } from '../../data/mockData';

export default function CurrentStock() {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [mfgFilter, setMfgFilter] = useState('');

  // Calculate aggregated stock data
  const stockData = useMemo(() => {
    return products.map(p => {
      let totalQty = 0;
      let totalValuePTR = 0;
      let totalValueMRP = 0;

      p.batches.forEach(b => {
        totalQty += b.qty;
        // Mock PTR as 70% of MRP for valuation purposes
        const ptr = b.mrp * 0.7;
        totalValuePTR += b.qty * ptr;
        totalValueMRP += b.qty * b.mrp;
      });

      const avgPtr = totalQty > 0 ? (totalValuePTR / totalQty) : 0;
      const avgMrp = totalQty > 0 ? (totalValueMRP / totalQty) : 0;

      return {
        ...p,
        totalQty,
        avgPtr,
        avgMrp,
        totalValuePTR,
        totalValueMRP
      };
    }).filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.genericName.toLowerCase().includes(search.toLowerCase())) return false;
      if (catFilter && p.categoryId !== parseInt(catFilter)) return false;
      if (mfgFilter && p.manufacturerId !== parseInt(mfgFilter)) return false;
      // Only show items that actually have stock
      if (p.totalQty <= 0) return false;
      return true;
    });
  }, [search, catFilter, mfgFilter]);

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