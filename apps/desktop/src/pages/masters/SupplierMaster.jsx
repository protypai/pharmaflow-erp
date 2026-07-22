import React, { useState } from 'react';
import { Search, Plus, MapPin, Edit2 } from 'lucide-react';
import { suppliers } from '../../data/mockData';

export default function SupplierMaster() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.city.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurr = (val) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <h2 className="card-title">Supplier Master</h2>
        <div className="search-bar">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search suppliers by name or city..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '250px' }}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> New Supplier
          </button>
        </div>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Supplier Info</th>
              <th>Contact & City</th>
              <th>License Details</th>
              <th>Credit Terms</th>
              <th>Status</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(supp => (
              <tr key={supp.id}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{supp.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    CFA / Distributor
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '0.8rem' }}>{supp.phone}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <MapPin size={10} /> {supp.city}
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '0.8rem' }}>DL: {supp.drugLicense}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>GST: {supp.gstin}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    Limit: {formatCurr(supp.creditLimit)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {supp.creditDays} days credit
                  </div>
                </td>
                <td>
                  <span className={`badge ${supp.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    {supp.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="col-actions">
                  <button className="btn btn-ghost btn-sm" title="Edit">
                    <Edit2 size={14} /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '700px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border)', background: '#F8FAFC' }}>
              <h3 className="card-title">Add New Supplier (Vendor)</h3>
              <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)} style={{ padding: '0.25rem' }}>
                &times;
              </button>
            </div>
            
            <div className="card-body" style={{ overflowY: 'auto' }}>
              <div className="form-row-2">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Supplier Name (Agency) <span className="text-danger">*</span></label>
                  <input className="form-input" placeholder="e.g. Sun Pharma CFA" />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input className="form-input" placeholder="e.g. Supplier Contact" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number <span className="text-danger">*</span></label>
                  <input className="form-input" placeholder="e.g. 022-40398000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email ID</label>
                  <input className="form-input" type="email" placeholder="e.g. orders@supplier.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-input" placeholder="e.g. Mumbai" />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Address</label>
                  <input className="form-input" placeholder="Full address" />
                </div>
                
                {/* Licenses */}
                <h4 style={{ gridColumn: 'span 2', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  Licenses & Procurement Terms
                </h4>
                <div className="form-group">
                  <label className="form-label">Drug License No. <span className="text-danger">*</span></label>
                  <input className="form-input" placeholder="e.g. MH-CFA-..." />
                </div>
                <div className="form-group">
                  <label className="form-label">GSTIN <span className="text-danger">*</span></label>
                  <input className="form-input" placeholder="15-digit GSTIN" maxLength="15" />
                </div>
                <div className="form-group">
                  <label className="form-label">Credit Limit (₹)</label>
                  <input className="form-input" type="number" placeholder="e.g. 500000" defaultValue="500000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Credit Days</label>
                  <input className="form-input" type="number" placeholder="e.g. 45" defaultValue="45" />
                </div>
                <div className="form-group">
                  <label className="form-label">Opening Balance (₹)</label>
                  <input className="form-input" type="number" placeholder="0" defaultValue="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Balance Type</label>
                  <select className="form-select">
                    <option>Credit (Cr) - We owe them</option>
                    <option>Debit (Dr) - They owe us</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card-header" style={{ borderTop: '1px solid var(--border)', justifyContent: 'flex-end', background: '#F8FAFC' }}>
              <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setIsModalOpen(false)}>
                Save Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
