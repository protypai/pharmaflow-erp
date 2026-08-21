import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, X } from 'lucide-react';
import { syncEntity } from '../../services/dataService';

export default function RackMaster() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [racksList, setRacksList] = useState([]);
  
  const [formData, setFormData] = useState({ id: null, name: '', status: 'active' });
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRacks = async () => {
    try {
      const res = await window.pharmaAPI.db.query("SELECT * FROM racks WHERE COALESCE(status, 'active') <> 'inactive' ORDER BY code ASC");
      setRacksList(res?.data || []);
    } catch (err) {
      console.error('Failed to load racks', err);
    }
  };

  useEffect(() => {
    fetchRacks();
  }, []);

  const handleSave = async () => {
    setErrorMsg('');
    if (!formData.name) {
      setErrorMsg("Rack Code is required.");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const compRes = await window.pharmaAPI.db.query("SELECT id FROM companies LIMIT 1");
      if (!compRes?.data?.length) throw new Error("Company profile not found in local DB");
      const companyId = compRes.data[0].id;
      const isNew = !formData.id;
      const id = isNew ? 'RACK-' + Date.now() : formData.id;

      if (!isNew) {
        const res = await window.pharmaAPI.db.run(`
          UPDATE racks SET code = ?, status = ?, updated_at = datetime('now') WHERE id = ?
        `, [formData.name, formData.status, formData.id]);
        if (!res.success) { setErrorMsg("Database error: " + res.error); return; }
      } else {
        const res = await window.pharmaAPI.db.run(`
          INSERT INTO racks (id, company_id, code, status, created_at, updated_at) 
          VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [id, companyId, formData.name, formData.status]);
        if (!res.success) { setErrorMsg("Database error: " + res.error); return; }
      }

      // Sync to cloud
      await syncEntity('Rack', isNew ? 'create' : 'update', {
        id,
        companyId,
        code: formData.name, // The backend expects 'code'
        status: formData.status
      });

      setIsModalOpen(false);
      setFormData({ id: null, name: '', status: 'active' });
      fetchRacks();
    } catch (err) {
      console.error("Save failed", err);
      setErrorMsg("Failed to save rack: " + err.message);
    }
  };

  const handleEdit = (rack) => {
    setFormData({ id: rack.id, name: rack.code, status: rack.status });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this rack?")) return;
    try {
      // Soft-delete: retire the rack (hide from active list) but keep the row so
      // products that reference it still resolve. Matches the cloud, so the delta
      // pull never re-creates a hard-deleted row.
      await window.pharmaAPI.db.run("UPDATE racks SET status = 'inactive' WHERE id = ?", [id]);

      // Sync to cloud (server maps 'delete' -> status='inactive' for masters)
      await syncEntity('Rack', 'delete', { id });
      
      fetchRacks();
    } catch (err) {
      alert("Failed to delete rack: " + err.message);
    }
  };

  const filtered = racksList.filter(r => r.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <h2 className="card-title">Rack Master</h2>
        <div className="search-bar">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search racks..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => { setErrorMsg(''); setFormData({ id: null, name: '', status: 'active' }); setIsModalOpen(true); }}>
            <Plus size={16} /> Add Rack
          </button>
        </div>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '120px' }}>ID</th>
              <th>Rack Code</th>
              <th>Status</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(rack => (
              <tr key={rack.id}>
                <td style={{ color: 'var(--text-secondary)' }}>{rack.id}</td>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{rack.code}</td>
                <td>
                  <span className={`badge ${rack.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    {rack.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="col-actions">
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => handleEdit(rack)}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn btn-ghost btn-sm" title="Delete" onClick={() => handleDelete(rack.id)} style={{ color: 'var(--danger)' }}>
                      <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>&times;</span>
                    </button>
                  </div>
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
              <h3 className="modal-title">Rack Details</h3>
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
                <label className="form-label">Rack Code <span className="text-danger">*</span></label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. A-1, FRIDGE" 
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
              <button className="btn btn-primary" onClick={handleSave}>Save Rack</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
