import React, { useState, useEffect } from 'react';
import { Search, History, Package } from 'lucide-react';
import { formatStock } from '../../utils/units';


export default function BatchEnquiry() {
  const [products, set_products] = useState([]);
  const [suppliers, set_suppliers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res_products = await window.pharmaAPI.db.query(`
        SELECT p.id as p_id, p.name, p.code, p.conversion_factor, p.sale_unit,
               b.id as b_id, b.batch_no as batch, b.expiry_date as expiry, b.mrp, b.current_qty as qty, b.created_at as inwardDate
        FROM products p
        LEFT JOIN batches b ON p.id = b.product_id
      `);

      const prodMap = {};
      (res_products?.data || []).forEach(row => {
        if (!prodMap[row.p_id]) prodMap[row.p_id] = { id: row.p_id, name: row.name, code: row.code, conversion_factor: row.conversion_factor, sale_unit: row.sale_unit, batches: [] };
        if (row.b_id) {
          prodMap[row.p_id].batches.push({
            id: row.b_id, batch: row.batch, expiry: row.expiry, mrp: row.mrp, qty: row.qty, inwardDate: row.inwardDate
          });
        }
      });
      set_products(Object.values(prodMap));
      
      const res_suppliers = await window.pharmaAPI.db.query("SELECT * FROM suppliers");
      set_suppliers(res_suppliers?.data || []);
    };
    fetchData();
  }, []);

  const [selectedProductId, setSelectedProductId] = useState('');
  
  const selectedProduct = products.find(p => p.id.toString() === selectedProductId.toString());

  // Mock function to attach a random supplier to a batch for demonstration of the flow
  const enrichBatchWithSupplier = (batch) => {
    // If supplier logic is complex, just mock for now or use real inwardDate from batch
    return {
      ...batch,
      supplierName: 'Local Supplier', 
      inwardDate: batch.inwardDate ? batch.inwardDate.split(' ')[0] : 'N/A',
      invoiceNo: `INV-BATCH`
    };
  };

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <div>
          <h2 className="card-title">Batch Enquiry</h2>
          <div className="page-sub">Track granular batch details, inward history, and supplier sources</div>
        </div>
      </div>

      <div className="filter-bar" style={{ padding: '1.5rem', background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', maxWidth: '600px' }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">Search & Select Product <span className="text-danger">*</span></label>
            <div className="search-input-wrap" style={{ width: '100%' }}>
              <Search size={16} className="search-icon" />
              <select 
                className="form-input" 
                style={{ paddingLeft: '2.5rem', appearance: 'none' }}
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
              >
                <option value="">Select a product to view batches...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th>Product</th>
              <th>Batch Number</th>
              <th>Expiry Date</th>
              <th>Available Qty</th>
              <th>MRP (₹)</th>
              <th>Supplied By (Vendor)</th>
              <th>Inward Date</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(selectedProductId && selectedProduct ? [selectedProduct] : products).flatMap(p => 
              (p?.batches || []).map(batch => ({ ...batch, product: p }))
            ).length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No active batches found.</td></tr>
            ) : (
              (selectedProductId && selectedProduct ? [selectedProduct] : products).flatMap(p => 
                (p?.batches || []).map(batch => ({ ...batch, product: p }))
              ).map(batch => {
                const enriched = enrichBatchWithSupplier(batch);
                return (
                  <tr key={`${batch.product.id}-${enriched.batch}`}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{batch.product.name}</td>
                    <td style={{ fontWeight: 600 }}>{enriched.batch}</td>
                    <td>{enriched.expiry}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: enriched.qty === 0 ? 'var(--danger)' : 'inherit' }}>
                        {formatStock(enriched.qty, batch.product.conversion_factor, batch.product.sale_unit)}
                      </span>
                    </td>
                    <td>{enriched.mrp.toFixed(2)}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{enriched.supplierName}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{enriched.inwardDate}</td>
                    <td className="col-actions">
                      <button 
                        className="btn btn-outline btn-sm" 
                        title="View Transaction History" 
                        style={{ color: 'var(--info-dark)', borderColor: 'var(--info-dark)' }}
                        onClick={() => alert(`Full trace history for Batch ${enriched.batch} will be available in the next update.`)}
                      >
                        <History size={14} /> Trace
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}