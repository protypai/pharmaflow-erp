import React, { useState } from 'react';
import { Search, Plus, Edit2, X } from 'lucide-react';
import { manufacturers } from '../../data/mockData';

export default function CompanyMaster() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = manufacturers.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <h2 className="card-title">Company Master (Manufacturers)</h2>
        <div className="search-bar">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search companies..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Add Company
          </button>
        </div>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>ID</th>
              <th>Company Name</th>
              <th>Status</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(comp => (
              <tr key={comp.id}>
                <td style={{ color: 'var(--text-secondary)' }}>{comp.id}</td>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{comp.name}</td>
                <td><span className="badge badge-success">Active</span></td>
                <td className="col-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => setIsModalOpen(true)}>
                    <Edit2 size={14} /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h3 className="modal-title">Company Details</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group mb-3">
                <label className="form-label">Company Name <span className="required">*</span></label>
                <input type="text" className="form-input" placeholder="e.g. Sun Pharma" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setIsModalOpen(false)}>Save Company</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
