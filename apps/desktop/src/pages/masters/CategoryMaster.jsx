import React, { useState } from 'react';
import { Search, Plus, Edit2, X } from 'lucide-react';
import { categories } from '../../data/mockData';

export default function CategoryMaster() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <h2 className="card-title">Category Master</h2>
        <div className="search-bar">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search categories..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Add Category
          </button>
        </div>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>ID</th>
              <th>Category Name</th>
              <th>Status</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(cat => (
              <tr key={cat.id}>
                <td style={{ color: 'var(--text-secondary)' }}>{cat.id}</td>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{cat.name}</td>
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
              <h3 className="modal-title">Category Details</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group mb-3">
                <label className="form-label">Category Name <span className="required">*</span></label>
                <input type="text" className="form-input" placeholder="e.g. Tablet, Syrup" autoFocus />
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
              <button className="btn btn-primary" onClick={() => setIsModalOpen(false)}>Save Category</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
