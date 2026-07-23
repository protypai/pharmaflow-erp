import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, ArrowRightLeft, Printer } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

export default function NearExpiry() {
  const [products, set_products] = useState([]);
  const [suppliers, set_suppliers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res_products = await window.pharmaAPI.db.query("SELECT * FROM products");
      set_products(res_products?.data || []);
      const res_suppliers = await window.pharmaAPI.db.query("SELECT * FROM suppliers");
      set_suppliers(res_suppliers?.data || []);
    };
    fetchData();
  }, []);

  const navigate = useNavigate();
  const [daysFilter, setDaysFilter] = useState('90'); // Default to 90 days

  // Mock function to determine if a batch is expiring within X days
  // Since mockData uses MM/YY, we'll simulate logic
  const getExpiringBatches = useMemo(() => {
    let expiring = [];
    
    const today = new Date();
    const currentYear = today.getFullYear() % 100;
    const currentMonth = today.getMonth() + 1;
    
    products.forEach(p => {
      p.batches.forEach(b => {
        if (!b.expiry || b.qty <= 0) return;
        
        // Parse MM/YY
        const [mStr, yStr] = b.expiry.split('/');
        const expMonth = parseInt(mStr);
        const expYear = parseInt(yStr);
        
        // Calculate months difference
        const monthsDiff = ((expYear - currentYear) * 12) + (expMonth - currentMonth);
        const daysDiff = monthsDiff * 30; // rough estimation
        
        const filterDays = parseInt(daysFilter);
        
        // If it expires in the future but within our filter range
        if (daysDiff > 0 && daysDiff <= filterDays) {
          expiring.push({
            ...b,
            productName: p.name,
            productCode: p.code,
            daysRemaining: daysDiff,
            stockValue: b.qty * b.mrp * 0.7, // Mock PTR value
            supplierName: suppliers[b.id % suppliers.length].name // Mock supplier
          });
        }
      });
    });
    
    // Sort by most urgent (fewest days remaining)
    return expiring.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [daysFilter]);

  const totalValueAtRisk = getExpiringBatches.reduce((sum, b) => sum + b.stockValue, 0);

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ background: '#FFF7ED', borderBottom: '1px solid #FFEDD5' }}>
        <div>
          <h2 className="card-title" style={{ color: '#C2410C', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} /> Near Expiry Alert
          </h2>
          <div className="page-sub" style={{ color: '#9A3412' }}>Monitor and return stock before it becomes dead capital</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" style={{ borderColor: '#C2410C', color: '#C2410C' }}><Printer size={16} /> Print Report</button>
        </div>
      </div>

      <div className="filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Expires Within:</label>
          <select className="form-select" value={daysFilter} onChange={e => setDaysFilter(e.target.value)} style={{ width: '200px' }}>
            <option value="30">Next 30 Days (Urgent)</option>
            <option value="60">Next 60 Days</option>
            <option value="90">Next 90 Days</option>
            <option value="180">Next 6 Months</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#FEF2F2', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', color: 'var(--danger)' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Value at Risk:</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>₹ {totalValueAtRisk.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th>Product</th>
              <th>Batch</th>
              <th>Available Qty</th>
              <th>Expiry Date</th>
              <th>Days Remaining</th>
              <th>Supplier Name</th>
              <th style={{ textAlign: 'right' }}>Stock Value (PTR)</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {getExpiringBatches.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No stock expiring within {daysFilter} days!</td></tr>
            ) : getExpiringBatches.map(b => (
              <tr key={`${b.productCode}-${b.batch}`} style={{ background: b.daysRemaining <= 30 ? '#FEF2F2' : 'transparent' }}>
                <td style={{ fontWeight: 600 }}>{b.productName}</td>
                <td>{b.batch}</td>
                <td style={{ fontWeight: 600 }}>{b.qty}</td>
                <td style={{ color: 'var(--danger)', fontWeight: 500 }}>{b.expiry}</td>
                <td>
                  <span style={{ 
                    background: b.daysRemaining <= 30 ? 'var(--danger)' : '#EA580C', 
                    color: 'white', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '12px', 
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    ~{b.daysRemaining} days
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{b.supplierName}</td>
                <td style={{ textAlign: 'right', fontWeight: 500 }}>₹ {b.stockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className="col-actions">
                  <button 
                    className="btn btn-outline btn-sm" 
                    onClick={() => navigate('/transactions/purchase-return')}
                    style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                    title="Return to Supplier (Debit Note)"
                  >
                    <ArrowRightLeft size={14} /> Return
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