import React, { useState, useEffect } from 'react';
import { Search, Plus, MapPin, Edit2 } from 'lucide-react';

export default function SupplierMaster() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [suppliersList, setSuppliersList] = useState([]);
  
  // Form State
  const [formData, setFormData] = useState({
    id: null,
    name: '', contact_person: '', phone: '', email: '', city: '',
    address: '', pincode: '', drug_license: '', gstin: '',
    credit_limit: 500000, credit_days: 45, opening_balance: 0, opening_balance_type: 'credit'
  });
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSuppliers = async () => {
    try {
      const res = await window.pharmaAPI.db.query("SELECT * FROM suppliers ORDER BY name ASC");
      setSuppliersList(res?.data || []);
    } catch (err) {
      console.error('Failed to load suppliers', err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSave = async () => {
    setErrorMsg('');
    if (!formData.name || !formData.phone || !formData.drug_license || !formData.gstin) {
      setErrorMsg("Name, Phone, Drug License, and GSTIN are required.");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const companyId = user.companyId || 'COMP-DEMO-001';

      if (formData.id) {
        const res = await window.pharmaAPI.db.run(`
          UPDATE suppliers SET
            name = ?, phone = ?, email = ?, address = ?, city = ?, pincode = ?, 
            drug_license = ?, gstin = ?, credit_limit = ?, credit_days = ?, opening_balance = ?, opening_balance_type = ?,
            updated_at = datetime('now')
          WHERE id = ?
        `, [
          formData.name, formData.phone, formData.email,
          formData.address, formData.city, formData.pincode, formData.drug_license, formData.gstin,
          formData.credit_limit, formData.credit_days, formData.opening_balance, formData.opening_balance_type,
          formData.id
        ]);
        if (!res.success) { setErrorMsg("Database error: " + res.error); return; }
      } else {
        const id = 'SUPP-' + Date.now();
        const res = await window.pharmaAPI.db.run(`
          INSERT INTO suppliers (
            id, company_id, name, phone, email, address, city, pincode, 
            drug_license, gstin, credit_limit, credit_days, opening_balance, opening_balance_type,
            status, created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now')
          )
        `, [
          id, companyId, formData.name, formData.phone, formData.email,
          formData.address, formData.city, formData.pincode, formData.drug_license, formData.gstin,
          formData.credit_limit, formData.credit_days, formData.opening_balance, formData.opening_balance_type
        ]);
        if (!res.success) { setErrorMsg("Database error: " + res.error); return; }
      }

      setIsModalOpen(false);
      setFormData({
        id: null,
        name: '', contact_person: '', phone: '', email: '', city: '',
        address: '', pincode: '', drug_license: '', gstin: '',
        credit_limit: 500000, credit_days: 45, opening_balance: 0, opening_balance_type: 'credit'
      });
      fetchSuppliers();
    } catch (err) {
      console.error("Save failed", err);
      setErrorMsg("Failed to save supplier: " + err.message);
    }
  };

  const handleEdit = (supp) => {
    setFormData({
      id: supp.id,
      name: supp.name || '', contact_person: supp.contact_person || '', phone: supp.phone || '', email: supp.email || '', city: supp.city || '',
      address: supp.address || '', pincode: supp.pincode || '', drug_license: supp.drug_license || '', gstin: supp.gstin || '',
      credit_limit: supp.credit_limit || 500000, credit_days: supp.credit_days || 45, opening_balance: supp.opening_balance || 0, opening_balance_type: supp.opening_balance_type || 'credit'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return;
    try {
      await window.pharmaAPI.db.run("DELETE FROM suppliers WHERE id = ?", [id]);
      fetchSuppliers();
    } catch (err) {
      alert("Failed to delete supplier: " + err.message);
    }
  };

  const filtered = suppliersList.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.city && s.city.toLowerCase().includes(search.toLowerCase()))
  );

  const formatCurr = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

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
          <button className="btn btn-primary" onClick={() => {
            setFormData({
              id: null,
              name: '', contact_person: '', phone: '', email: '', city: '',
              address: '', pincode: '', drug_license: '', gstin: '',
              credit_limit: 500000, credit_days: 45, opening_balance: 0, opening_balance_type: 'credit'
            });
            setIsModalOpen(true);
          }}>
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
                  <div style={{ fontSize: '0.8rem' }}>DL: {supp.drug_license}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>GST: {supp.gstin}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    Limit: {formatCurr(supp.credit_limit)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {supp.credit_days} days credit
                  </div>
                </td>
                <td>
                  <span className={`badge ${supp.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    {supp.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="col-actions">
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => handleEdit(supp)}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn btn-ghost btn-sm" title="Delete" onClick={() => handleDelete(supp.id)} style={{ color: 'var(--danger)' }}>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '700px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border)', background: '#F8FAFC' }}>
              <h3 className="card-title">Add New Supplier (Vendor)</h3>
              <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)} style={{ padding: '0.25rem' }}>
                &times;
              </button>
            </div>
            
            {errorMsg && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', margin: '1rem 1.5rem 0', borderRadius: '4px', border: '1px solid #f87171' }}>
                {errorMsg}
              </div>
            )}
            
            <div className="card-body" style={{ overflowY: 'auto' }}>
              <div className="form-row-2">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Supplier Name (Agency) <span className="text-danger">*</span></label>
                  <input className="form-input" placeholder="e.g. Sun Pharma CFA" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input className="form-input" placeholder="e.g. Supplier Contact" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number <span className="text-danger">*</span></label>
                  <input className="form-input" placeholder="e.g. 022-40398000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email ID</label>
                  <input className="form-input" type="email" placeholder="e.g. orders@supplier.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-input" placeholder="e.g. Mumbai" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Address</label>
                  <input className="form-input" placeholder="Full address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                
                {/* Licenses */}
                <h4 style={{ gridColumn: 'span 2', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  Licenses & Procurement Terms
                </h4>
                <div className="form-group">
                  <label className="form-label">Drug License No. <span className="text-danger">*</span></label>
                  <input className="form-input" placeholder="e.g. MH-CFA-..." value={formData.drug_license} onChange={e => setFormData({...formData, drug_license: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">GSTIN <span className="text-danger">*</span></label>
                  <input className="form-input" placeholder="15-digit GSTIN" maxLength="15" value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Credit Limit (₹)</label>
                  <input className="form-input" type="number" placeholder="e.g. 500000" value={formData.credit_limit} onChange={e => setFormData({...formData, credit_limit: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Credit Days</label>
                  <input className="form-input" type="number" placeholder="e.g. 45" value={formData.credit_days} onChange={e => setFormData({...formData, credit_days: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Opening Balance (₹)</label>
                  <input className="form-input" type="number" placeholder="0" value={formData.opening_balance} onChange={e => setFormData({...formData, opening_balance: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Balance Type</label>
                  <select className="form-select" value={formData.opening_balance_type} onChange={e => setFormData({...formData, opening_balance_type: e.target.value})}>
                    <option value="credit">Credit (Cr) - We owe them</option>
                    <option value="debit">Debit (Dr) - They owe us</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card-header" style={{ borderTop: '1px solid var(--border)', justifyContent: 'flex-end', background: '#F8FAFC' }}>
              <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>
                Save Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
