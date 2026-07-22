import React, { useState, useMemo } from 'react';
import { Search, Printer, Download, TrendingUp, BarChart3 } from 'lucide-react';
import { products, categories } from '../../data/mockData';

export default function ProfitReport() {
  const [groupBy, setGroupBy] = useState('product'); // 'product' or 'category'
  const [dateRange, setDateRange] = useState('this_month');

  // Mock Profit Data Calculation
  const profitData = useMemo(() => {
    let data = [];
    
    if (groupBy === 'product') {
      data = products.map(p => {
        // Mock sales volume for this period
        const qtySold = (p.id * 15) + 10;
        
        // Revenue is qty * MRP
        const salesRevenue = qtySold * p.mrp;
        
        // COGS (Cost of Goods Sold) is qty * PTR (we mocked PTR as 70% of MRP earlier)
        const ptr = p.mrp * 0.7;
        const cogs = qtySold * ptr;
        
        const grossProfit = salesRevenue - cogs;
        const marginPercent = salesRevenue > 0 ? (grossProfit / salesRevenue) * 100 : 0;

        return {
          id: p.id,
          entityName: p.name,
          details: `${p.genericName} • ${p.manufacturer}`,
          qtySold,
          salesRevenue,
          cogs,
          grossProfit,
          marginPercent
        };
      });
    } else if (groupBy === 'category') {
      data = categories.map(c => {
        // Find all products in this category to aggregate
        const catProducts = products.filter(p => p.categoryId === c.id);
        
        let totalQty = 0;
        let totalRevenue = 0;
        let totalCogs = 0;

        catProducts.forEach(p => {
          const qty = (p.id * 15) + 10;
          totalQty += qty;
          totalRevenue += qty * p.mrp;
          totalCogs += qty * (p.mrp * 0.7);
        });

        const grossProfit = totalRevenue - totalCogs;
        const marginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        return {
          id: c.id,
          entityName: c.name,
          details: `${catProducts.length} Products in category`,
          qtySold: totalQty,
          salesRevenue: totalRevenue,
          cogs: totalCogs,
          grossProfit,
          marginPercent
        };
      });
    }

    // Sort by highest Gross Profit
    return data.sort((a, b) => b.grossProfit - a.grossProfit);
  }, [groupBy, dateRange]);

  const totals = profitData.reduce((acc, curr) => {
    acc.revenue += curr.salesRevenue;
    acc.cogs += curr.cogs;
    acc.gp += curr.grossProfit;
    return acc;
  }, { revenue: 0, cogs: 0, gp: 0 });

  const averageMargin = totals.revenue > 0 ? (totals.gp / totals.revenue) * 100 : 0;

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
        <div>
          <h2 className="card-title" style={{ color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={20} /> Profit & Margin Analysis
          </h2>
          <div className="page-sub" style={{ color: '#475569' }}>Track Gross Profit (GP) and margins to identify your most lucrative items</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline"><Printer size={16} /> Print Report</button>
          <button className="btn btn-primary"><Download size={16} /> Export Excel</button>
        </div>
      </div>

      <div className="filter-bar" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', background: '#F8FAFC' }}>
        <div style={{ width: '200px' }}>
          <label className="form-label">Date Range</label>
          <select className="form-select" value={dateRange} onChange={e => setDateRange(e.target.value)}>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_quarter">This Quarter</option>
            <option value="this_year">This Financial Year</option>
          </select>
        </div>
        <div style={{ width: '250px' }}>
          <label className="form-label">Group By</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className={`btn ${groupBy === 'product' ? 'btn-primary' : 'btn-outline'}`} 
              style={{ flex: 1 }}
              onClick={() => setGroupBy('product')}
            >
              By Product
            </button>
            <button 
              className={`btn ${groupBy === 'category' ? 'btn-primary' : 'btn-outline'}`} 
              style={{ flex: 1 }}
              onClick={() => setGroupBy('category')}
            >
              By Category
            </button>
          </div>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'white', borderBottom: '1px solid var(--border)' }}>
        <div className="card" style={{ flex: 1, padding: '1rem', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <div style={{ fontSize: '0.8rem', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }}>Total Net Sales Revenue</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#15803D' }}>₹ {totals.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '1rem', background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <div style={{ fontSize: '0.8rem', color: '#991B1B', textTransform: 'uppercase', fontWeight: 600 }}>Cost of Goods Sold (COGS)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#B91C1C' }}>₹ {totals.cogs.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '1rem', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <div style={{ fontSize: '0.8rem', color: '#1E40AF', textTransform: 'uppercase', fontWeight: 600 }}>Total Gross Profit (GP)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ₹ {totals.gp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            <TrendingUp size={20} />
          </div>
        </div>
        <div className="card" style={{ flex: 1, padding: '1rem', background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
          <div style={{ fontSize: '0.8rem', color: '#5B21B6', textTransform: 'uppercase', fontWeight: 600 }}>Average Margin %</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4C1D95' }}>{averageMargin.toFixed(2)}%</div>
        </div>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th>{groupBy === 'product' ? 'Product Name' : 'Category Name'}</th>
              <th>Details</th>
              <th style={{ textAlign: 'center' }}>Qty Sold</th>
              <th style={{ textAlign: 'right' }}>Sales Revenue (₹)</th>
              <th style={{ textAlign: 'right' }}>COGS (₹)</th>
              <th style={{ textAlign: 'right' }}>Gross Profit (₹)</th>
              <th style={{ textAlign: 'right' }}>Margin %</th>
            </tr>
          </thead>
          <tbody>
            {profitData.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No profit data found for this period.</td></tr>
            ) : profitData.map((row, i) => (
              <tr key={row.id}>
                <td style={{ fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {i < 3 && <span title="Top Contributor" style={{ fontSize: '1rem' }}>🔥</span>}
                    {row.entityName}
                  </div>
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{row.details}</td>
                <td style={{ textAlign: 'center', fontWeight: 500 }}>{row.qtySold}</td>
                <td style={{ textAlign: 'right', color: '#15803D' }}>{row.salesRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ textAlign: 'right', color: 'var(--danger)' }}>{row.cogs.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#1D4ED8' }}>
                  {row.grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>
                  <span style={{ 
                    background: row.marginPercent >= 30 ? '#DCFCE7' : (row.marginPercent >= 15 ? '#FEF9C3' : '#FEE2E2'), 
                    color: row.marginPercent >= 30 ? '#166534' : (row.marginPercent >= 15 ? '#854D0E' : '#991B1B'),
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '12px', 
                    fontSize: '0.8rem'
                  }}>
                    {row.marginPercent.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}