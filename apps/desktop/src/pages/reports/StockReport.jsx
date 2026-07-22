import React, { useState, useMemo } from 'react';
import { Search, Printer, Download, PackageSearch } from 'lucide-react';
import { products, categories, manufacturers } from '../../data/mockData';

export default function StockReport() {
  const [catFilter, setCatFilter] = useState('');
  const [mfgFilter, setMfgFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const stockData = useMemo(() => {
    let data = products.map(p => {
      let totalQty = 0;
      p.batches.forEach(b => { totalQty += b.qty; });
      
      const avgPtr = 150; // Mock PTR for demo
      const stockValue = totalQty * avgPtr;

      return {
        ...p,
        totalQty,
        avgPtr,
        stockValue,
        status: totalQty <= 0 ? 'Out of Stock' : (totalQty < p.minStock ? 'Low Stock' : 'In Stock')
      };
    });

    if (catFilter) data = data.filter(d => d.categoryId === parseInt(catFilter));
    if (mfgFilter) data = data.filter(d => d.manufacturerId === parseInt(mfgFilter));
    
    if (statusFilter === 'in_stock') data = data.filter(d => d.totalQty > 0);
    if (statusFilter === 'out_of_stock') data = data.filter(d => d.totalQty <= 0);
    if (statusFilter === 'low_stock') data = data.filter(d => d.status === 'Low Stock');

    return data;
  }, [catFilter, mfgFilter, statusFilter]);

  const totals = stockData.reduce((acc, curr) => {
    acc.qty += curr.totalQty;
    acc.value += curr.stockValue;
    return acc;
  }, { qty: 0, value: 0 });

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <div>
          <h2 className="card-title">Stock Statement (Valuation Report)</h2>
          <div className="page-sub">Audit physical vs system stock and total warehouse valuation</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={() => window.print()}><Printer size={16} /> Print</button>
          <button className="btn btn-outline"><Download size={16} /> Export Excel</button>
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
                  {row.totalQty} {row.saleUnit}
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