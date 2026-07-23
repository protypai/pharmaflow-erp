import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, X } from 'lucide-react';

export default function CompanyMaster() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [manufacturersList, setManufacturersList] = useState([]);
  
  const [formData, setFormData] = useState({ name: '', status: 'active' });
  const [errorMsg, setErrorMsg] = useState('');

  const fetchManufacturers = async () => {
    try {
      const res = await window.pharmaAPI.db.query("SELECT * FROM manufacturers ORDER BY name ASC");
      setManufacturersList(res?.data || []);
    } catch (err) {
      console.error('Failed to load manufacturers', err);
    }
  };

  useEffect(() => {
    fetchManufacturers();
  }, []);

  const handleSave = async () => {
    setErrorMsg('');
    if (!formData.name) {
      setErrorMsg("Company Name is required.");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const companyId = user.companyId || 'COMP-DEMO-001';
      const id = 'MFG-' + Date.now();

      const res = await window.pharmaAPI.db.run(`
        INSERT INTO manufacturers (id, company_id, name, status, created_at, updated_at) 
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [id, companyId, formData.name, formData.status]);

      if (!res.success) {
        setErrorMsg("Database error: " + res.error);
        return;
      }

      setIsModalOpen(false);
      setFormData({ name: '', status: 'active' });
      fetchManufacturers();
    } catch (err) {
      console.error("Save failed", err);
      setErrorMsg("Failed to save company: " + err.message);
    }
  };

  const filtered = manufacturersList.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

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
          <button className="btn btn-primary" onClick={() => { setErrorMsg(''); setIsModalOpen(true); }}>
            <Plus size={16} /> Add Company
          </button>
        </div>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '120px' }}>ID</th>
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
                <td>
                  <span className={`badge ${comp.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    {comp.status === 'active' ? 'Active' : 'Inactive'}
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
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h3 className="modal-title">Company Details</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            {errorMsg && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', margin: '1rem 1.5rem 0', borderRadius: '4px', border: '1px solid #f87171' }}>
                {errorMsg}
              </div>
            )}
            
            <div className="modal-body">
              <div className="form-group mb-3">
                <label className="form-label">Company Name <span className="text-danger">*</span></label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Sun Pharma" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  autoFocus 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select 
                  className="form-select"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save Company</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
