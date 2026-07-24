import React, { useState, useEffect, useMemo } from 'react';
import { TrendingDown, FilePlus2, Printer } from 'lucide-react';


export default function LowStock() {
  const [products, set_products] = useState([]);
  const [suppliers, set_suppliers] = useState([]);
  const [manufacturers, set_manufacturers] = useState([]);

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
      const res_manufacturers = await window.pharmaAPI.db.query("SELECT * FROM manufacturers");
      set_manufacturers(res_manufacturers?.data || []);
    };
    fetchData();
  }, []);

  const [mfgFilter, setMfgFilter] = useState('');

  // Calculate products that are below their minimum stock level
  const lowStockData = useMemo(() => {
    return products.map(p => {
      const totalQty = p.batches.reduce((acc, b) => acc + (b.qty || 0), 0);
      
      const deficit = (p.min_stock || 0) - totalQty;
      
      // Determine suggested order qty (usually deficit + buffer, or based on max_stock)
      const suggestedOrder = (p.max_stock && p.max_stock > totalQty) ? (p.max_stock - totalQty) : (deficit > 0 ? deficit * 2 : 0);
      
      // We don't have a direct primary supplier link on products table right now, 
      // but in a real app this would join from supplier_products. 
      // For now, we'll mark as N/A or derive from latest purchase.
      const primarySupplier = 'N/A';

      return {
        ...p,
        totalQty,
        deficit,
        suggestedOrder,
        primarySupplier
      };
    }).filter(p => p.deficit > 0)
      .filter(p => mfgFilter ? p.manufacturer_id === mfgFilter : true)
      .sort((a, b) => b.deficit - a.deficit); // Sort by highest deficit first
  }, [mfgFilter, products]);

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ background: '#EFF6FF', borderBottom: '1px solid #DBEAFE' }}>
        <div>
          <h2 className="card-title" style={{ color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingDown size={20} /> Low Stock (Re-Order Level)
          </h2>
          <div className="page-sub" style={{ color: '#1E3A8A' }}>Products running below minimum stock. Generate Purchase Orders instantly.</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" style={{ borderColor: '#1E40AF', color: '#1E40AF' }} onClick={() => alert("Printing Shortage List...")}><Printer size={16} /> Print Shortage List</button>
          <button className="btn btn-primary" onClick={() => alert("Generating POs for all low stock items...")}><FilePlus2 size={16} /> Generate PO for All</button>
        </div>
      </div>

      <div className="filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Filter by Manufacturer:</label>
          <select className="form-select" value={mfgFilter} onChange={e => setMfgFilter(e.target.value)} style={{ width: '250px' }}>
            <option value="">All Manufacturers</option>
            {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th>Item Code</th>
              <th>Product Details</th>
              <th>Min Stock</th>
              <th>Current Stock</th>
              <th style={{ background: '#FEF2F2' }}>Deficit Qty</th>
              <th style={{ background: '#F0FDF4' }}>Suggested Order</th>
              <th>Primary Supplier</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lowStockData.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>All products are adequately stocked!</td></tr>
            ) : lowStockData.map(p => (
              <tr key={p.id}>
                <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{p.code}</td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {p.genericName} • {p.manufacturer}
                  </div>
                </td>
                <td style={{ fontWeight: 500 }}>{p.minStock} {p.saleUnit}</td>
                <td style={{ fontWeight: 600, color: 'var(--danger)' }}>{p.totalQty} {p.saleUnit}</td>
                <td style={{ background: '#FEF2F2', fontWeight: 600, color: 'var(--danger)' }}>
                  -{p.deficit} {p.saleUnit}
                </td>
                <td style={{ background: '#F0FDF4', fontWeight: 700, color: 'var(--success)' }}>
                  {p.suggestedOrder} {p.saleUnit}
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{p.primarySupplier}</td>
                <td className="col-actions">
                  <button 
                    className="btn btn-outline btn-sm" 
                    title="Generate Purchase Order"
                    style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                    onClick={() => alert(`Drafting PO for ${p.name}`)}
                  >
                    <FilePlus2 size={14} /> Draft PO
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