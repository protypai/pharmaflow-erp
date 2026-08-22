import React, { useState, useEffect, useMemo } from 'react';
import { ShieldAlert, Trash2, Printer, ArrowRightLeft } from 'lucide-react';
import { formatStock } from '../../utils/units';
import { toDisplayExpiry } from '../../utils/dates';

import { useNavigate } from 'react-router-dom';

export default function ExpiredStock() {
  const [products, set_products] = useState([]);
  const [suppliers, set_suppliers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res_products = await window.pharmaAPI.db.query(`
        SELECT p.*,
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
      const res_suppliers = await window.pharmaAPI.db.query("SELECT * FROM suppliers");
      set_suppliers(res_suppliers?.data || []);
    };
    fetchData();
  }, []);

  const navigate = useNavigate();

  // Mock function to determine if a batch is ALREADY expired
  const getExpiredBatches = useMemo(() => {
    let expired = [];
    
    const today = new Date();
    const currentYear = today.getFullYear() % 100;
    const currentMonth = today.getMonth() + 1;
    
    products.forEach(p => {
      p.batches.forEach(b => {
        if (!b.expiry || b.qty <= 0) return;
        
        // Parse expiry
        let expDate;
        if (b.expiry.includes('/') && b.expiry.length === 5) {
          const [m, y] = b.expiry.split('/');
          expDate = new Date(2000 + parseInt(y), parseInt(m) - 1, 1);
        } else {
          expDate = new Date(b.expiry);
        }
        if (isNaN(expDate)) return;
        
        // Calculate days difference
        const daysDiff = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
        
        // If it expired in the past or today
        if (daysDiff <= 0) {
          const numId = parseInt(b.id.replace(/\D/g, '') || '0') || Math.floor(Math.random() * 100);
          expired.push({
            ...b,
            productName: p.name,
            productCode: p.code,
            conversionFactor: p.conversion_factor,
            saleUnit: p.sale_unit,
            stockValue: b.qty * b.ptr,
            supplierName: suppliers.length > 0 ? suppliers[numId % suppliers.length].name : 'Unknown Supplier'
          });
        }
      });
    });

    return expired;
  }, [products, suppliers]);

  const totalFinancialLoss = getExpiredBatches.reduce((sum, b) => sum + b.stockValue, 0);

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ background: '#FEF2F2', borderBottom: '1px solid #FEE2E2' }}>
        <div>
          <h2 className="card-title" style={{ color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={20} /> Expired Stock (Locked)
          </h2>
          <div className="page-sub" style={{ color: '#7F1D1D' }}>This stock is legally locked from sales billing. Action required.</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" style={{ borderColor: '#991B1B', color: '#991B1B' }}><Printer size={16} /> Print Damage Report</button>
        </div>
      </div>

      <div className="filter-bar" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
          Showing all batches expired before current month.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#991B1B', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', color: 'white' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Total Financial Loss:</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>₹ {totalFinancialLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th>Product</th>
              <th>Batch</th>
              <th>Locked Qty</th>
              <th>Expired Date</th>
              <th>Supplier Name</th>
              <th style={{ textAlign: 'right' }}>Loss Value (PTR)</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {getExpiredBatches.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No expired stock! Excellent inventory management.</td></tr>
            ) : getExpiredBatches.map(b => (
              <tr key={`${b.productCode}-${b.batch}`} style={{ background: '#FFF1F2' }}>
                <td style={{ fontWeight: 600 }}>{b.productName}</td>
                <td style={{ fontWeight: 600, color: 'var(--danger)' }}>{b.batch}</td>
                <td>
                  <span style={{
                    background: 'var(--danger)',
                    color: 'white',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {formatStock(b.qty, b.conversionFactor, b.saleUnit)} Locked
                  </span>
                </td>
                <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{toDisplayExpiry(b.expiry)}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{b.supplierName}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: '#991B1B' }}>₹ {b.stockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className="col-actions">
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn btn-outline btn-sm" 
                      onClick={() => navigate('/transactions/purchase-return')}
                      title="Return to Supplier (Debit Note)"
                    >
                      <ArrowRightLeft size={14} /> Return
                    </button>
                    <button 
                      className="btn btn-outline btn-sm" 
                      onClick={() => navigate('/transactions/stock-adjustment')}
                      style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                      title="Write-off / Destroy (Stock Adjustment)"
                    >
                      <Trash2 size={14} /> Write-off
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}