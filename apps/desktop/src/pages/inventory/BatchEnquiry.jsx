import React, { useState } from 'react';
import { Search, History, Package } from 'lucide-react';
import { products, suppliers } from '../../data/mockData';

export default function BatchEnquiry() {
  const [selectedProductId, setSelectedProductId] = useState('');
  
  const selectedProduct = products.find(p => p.id === parseInt(selectedProductId));

  // Mock function to attach a random supplier to a batch for demonstration of the flow
  const enrichBatchWithSupplier = (batch) => {
    // Deterministic mock supplier based on batch string
    const charSum = batch.batch.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const mockSupplier = suppliers[charSum % suppliers.length] || suppliers[0];
    return {
      ...batch,
      supplierName: mockSupplier.name,
      inwardDate: '2025-06-15', // Mock inward date
      invoiceNo: `INV-${1000 + (charSum % 1000)}`
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
            {(selectedProductId ? [selectedProduct] : products).flatMap(p => 
              p.batches.map(batch => ({ ...batch, product: p }))
            ).length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No active batches found.</td></tr>
            ) : (
              (selectedProductId ? [selectedProduct] : products).flatMap(p => 
                p.batches.map(batch => ({ ...batch, product: p }))
              ).map(batch => {
                const enriched = enrichBatchWithSupplier(batch);
                return (
                  <tr key={`${batch.product.id}-${enriched.batch}`}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{batch.product.name}</td>
                    <td style={{ fontWeight: 600 }}>{enriched.batch}</td>
                    <td>{enriched.expiry}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: enriched.qty === 0 ? 'var(--danger)' : 'inherit' }}>
                        {enriched.qty}
                      </span>
                    </td>
                    <td>{enriched.mrp.toFixed(2)}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{enriched.supplierName}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{enriched.inwardDate}</td>
                    <td className="col-actions">
                      <button className="btn btn-outline btn-sm" title="View Transaction History" style={{ color: 'var(--info-dark)', borderColor: 'var(--info-dark)' }}>
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