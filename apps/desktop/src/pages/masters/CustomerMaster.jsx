import React, { useState } from 'react';
import { Search, Plus, MapPin, Edit2, ShieldAlert } from 'lucide-react';
import { customers } from '../../data/mockData';

export default function CustomerMaster() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.area.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurr = (val) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <h2 className="card-title">Customer Master</h2>
        <div className="search-bar">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search customers by name or area..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '250px' }}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> New Customer
          </button>
        </div>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer Info</th>
              <th>Contact & Area</th>
              <th>License Details</th>
              <th>Financials</th>
              <th>Status</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(cust => {
              const outstandingExceeds = cust.outstanding > cust.creditLimit;
              return (
                <tr key={cust.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cust.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className={`badge ${cust.type === 'Retail' ? 'badge-info' : 'badge-purple'}`} style={{ padding: '0 4px', fontSize: '0.65rem' }}>
                        {cust.type}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>{cust.phone}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <MapPin size={10} /> {cust.area}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>DL: {cust.drugLicense}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {cust.gstin ? `GST: ${cust.gstin}` : 'Unregistered'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: outstandingExceeds ? 'var(--danger)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {formatCurr(cust.outstanding)}
                      {outstandingExceeds && <ShieldAlert size={12} color="var(--danger)" title="Exceeds Credit Limit" />}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Limit: {formatCurr(cust.creditLimit)} • {cust.creditDays} days
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${cust.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {cust.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="col-actions">
                    <button className="btn btn-ghost btn-sm" title="Edit">
                      <Edit2 size={14} /> Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '700px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border)', background: '#F8FAFC' }}>
              <h3 className="card-title">Add New Customer</h3>
              <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)} style={{ padding: '0.25rem' }}>
                &times;
              </button>
            </div>
            
            <div className="card-body" style={{ overflowY: 'auto' }}>
              <div className="form-row-2">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Customer Name (Firm/Shop) <span className="text-danger">*</span></label>
                  <input className="form-input" placeholder="e.g. Balaji Medical Stores" />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Type <span className="text-danger">*</span></label>
                  <select className="form-select">
                    <option>Retail</option>
                    <option>Wholesale</option>
                    <option>Hospital / Clinic</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input className="form-input" placeholder="e.g. Ramesh" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number <span className="text-danger">*</span></label>
                  <input className="form-input" placeholder="e.g. 9876543210" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email ID</label>
                  <input className="form-input" type="email" placeholder="e.g. user@email.com" />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Address</label>
                  <input className="form-input" placeholder="Full address" />
                </div>
                <div className="form-group">
                  <label className="form-label">Area / Route</label>
                  <select className="form-select">
                    <option>Dadar</option>
                    <option>Parel</option>
                    <option>Bandra</option>
                    <option>Kurla</option>
                    <option>Ghatkopar</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input className="form-input" placeholder="e.g. 400028" />
                </div>
                
                {/* Licenses */}
                <h4 style={{ gridColumn: 'span 2', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  Licenses & Finance
                </h4>
                <div className="form-group">
                  <label className="form-label">Drug License No.</label>
                  <input className="form-input" placeholder="e.g. MH-MUM-..." />
                </div>
                <div className="form-group">
                  <label className="form-label">GSTIN (Optional for Retail)</label>
                  <input className="form-input" placeholder="15-digit GSTIN" maxLength="15" />
                </div>
                <div className="form-group">
                  <label className="form-label">Credit Limit (₹)</label>
                  <input className="form-input" type="number" placeholder="e.g. 50000" defaultValue="50000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Credit Days</label>
                  <input className="form-input" type="number" placeholder="e.g. 30" defaultValue="30" />
                </div>
                <div className="form-group">
                  <label className="form-label">Opening Balance (₹)</label>
                  <input className="form-input" type="number" placeholder="0" defaultValue="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Balance Type</label>
                  <select className="form-select">
                    <option>Debit (Dr) - They owe us</option>
                    <option>Credit (Cr) - We owe them</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card-header" style={{ borderTop: '1px solid var(--border)', justifyContent: 'flex-end', background: '#F8FAFC' }}>
              <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setIsModalOpen(false)}>
                Save Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
