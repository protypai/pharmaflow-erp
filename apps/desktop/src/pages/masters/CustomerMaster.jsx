import React, { useState, useEffect } from 'react';
import { Search, Plus, MapPin, Edit2, ShieldAlert } from 'lucide-react';
import { syncEntity } from '../../services/dataService';

export default function CustomerMaster() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customersList, setCustomersList] = useState([]);
  
  // Form State
  const [formData, setFormData] = useState({
    id: null,
    name: '', type: 'Retail', salesman: '', phone: '', email: '',
    address: '', area: 'Dadar', pincode: '', drug_license: '', gstin: '',
    credit_limit: 50000, credit_days: 30, opening_balance: 0, opening_balance_type: 'debit'
  });
  const [errorMsg, setErrorMsg] = useState('');

  const fetchCustomers = async () => {
    try {
      const res = await window.pharmaAPI.db.query("SELECT * FROM customers ORDER BY name ASC");
      setCustomersList(res?.data || []);
    } catch (err) {
      console.error('Failed to load customers', err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSave = async () => {
    setErrorMsg('');
    if (!formData.name || !formData.phone) {
      setErrorMsg("Name and Phone are required.");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const companyId = user.companyId || 'COMP-DEMO-001';
      const isNew = !formData.id;
      const id = isNew ? 'CUST-' + Date.now() : formData.id;

      if (!isNew) {
        const res = await window.pharmaAPI.db.run(`
          UPDATE customers SET
            name = ?, type = ?, salesman = ?, phone = ?, email = ?, address = ?, area = ?, pincode = ?, 
            drug_license = ?, gstin = ?, credit_limit = ?, credit_days = ?, opening_balance = ?, opening_balance_type = ?,
            updated_at = datetime('now')
          WHERE id = ?
        `, [
          formData.name, formData.type, formData.salesman, formData.phone, formData.email,
          formData.address, formData.area, formData.pincode, formData.drug_license, formData.gstin,
          formData.credit_limit, formData.credit_days, formData.opening_balance, formData.opening_balance_type,
          formData.id
        ]);
        if (!res.success) { setErrorMsg("Database error: " + res.error); return; }
      } else {
        const res = await window.pharmaAPI.db.run(`
          INSERT INTO customers (
            id, company_id, name, type, salesman, phone, email, address, area, pincode, 
            drug_license, gstin, credit_limit, credit_days, opening_balance, opening_balance_type,
            status, created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now')
          )
        `, [
          id, companyId, formData.name, formData.type, formData.salesman, formData.phone, formData.email,
          formData.address, formData.area, formData.pincode, formData.drug_license, formData.gstin,
          formData.credit_limit, formData.credit_days, formData.opening_balance, formData.opening_balance_type
        ]);
        if (!res.success) { setErrorMsg("Database error: " + res.error); return; }
      }

      // Sync to cloud
      await syncEntity('Customer', isNew ? 'create' : 'update', {
        id,
        companyId,
        name: formData.name,
        type: formData.type.toLowerCase(),
        salesman: formData.salesman,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        area: formData.area,
        pincode: formData.pincode,
        drugLicense: formData.drug_license,
        gstin: formData.gstin,
        creditLimit: formData.credit_limit,
        creditDays: formData.credit_days,
        openingBalance: formData.opening_balance,
        openingBalanceType: formData.opening_balance_type,
        status: 'active'
      });

      setIsModalOpen(false);
      // Reset form
      setFormData({
        id: null,
        name: '', type: 'Retail', salesman: '', phone: '', email: '',
        address: '', area: 'Dadar', pincode: '', drug_license: '', gstin: '',
        credit_limit: 50000, credit_days: 30, opening_balance: 0, opening_balance_type: 'debit'
      });
      fetchCustomers();
    } catch (err) {
      console.error("Save failed", err);
      setErrorMsg("Failed to save customer: " + err.message);
    }
  };

  const handleEdit = (cust) => {
    setFormData({
      id: cust.id,
      name: cust.name || '', type: cust.type || 'Retail', salesman: cust.salesman || '', phone: cust.phone || '', email: cust.email || '',
      address: cust.address || '', area: cust.area || 'Dadar', pincode: cust.pincode || '', drug_license: cust.drug_license || '', gstin: cust.gstin || '',
      credit_limit: cust.credit_limit || 50000, credit_days: cust.credit_days || 30, opening_balance: cust.opening_balance || 0, opening_balance_type: cust.opening_balance_type || 'debit'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      await window.pharmaAPI.db.run("DELETE FROM customers WHERE id = ?", [id]);
      
      // Sync to cloud
      await syncEntity('Customer', 'delete', { id });

      fetchCustomers();
    } catch (err) {
      alert("Failed to delete customer: " + err.message);
    }
  };

  const filtered = customersList.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.area && c.area.toLowerCase().includes(search.toLowerCase()))
  );

  const formatCurr = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

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
          <button className="btn btn-primary" onClick={() => {
            setFormData({
              id: null,
              name: '', type: 'Retail', salesman: '', phone: '', email: '',
              address: '', area: 'Dadar', pincode: '', drug_license: '', gstin: '',
              credit_limit: 50000, credit_days: 30, opening_balance: 0, opening_balance_type: 'debit'
            });
            setIsModalOpen(true);
          }}>
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
              const outstanding = cust.opening_balance || 0; // TODO: Calculate actual outstanding from transactions
              const outstandingExceeds = outstanding > cust.credit_limit;
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
                    <div style={{ fontSize: '0.8rem' }}>DL: {cust.drug_license || '-'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {cust.gstin ? `GST: ${cust.gstin}` : 'Unregistered'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: outstandingExceeds ? 'var(--danger)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {formatCurr(outstanding)}
                      {outstandingExceeds && <ShieldAlert size={12} color="var(--danger)" title="Exceeds Credit Limit" />}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Limit: {formatCurr(cust.credit_limit)} • {cust.credit_days} days
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${cust.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {cust.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="col-actions">
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => handleEdit(cust)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm" title="Delete" onClick={() => handleDelete(cust.id)} style={{ color: 'var(--danger)' }}>
                        <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>&times;</span>
                      </button>
                    </div>
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
            
            {errorMsg && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', margin: '1rem 1.5rem 0', borderRadius: '4px', border: '1px solid #f87171' }}>
                {errorMsg}
              </div>
            )}
            
            <div className="card-body" style={{ overflowY: 'auto' }}>
              <div className="form-row-2">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Customer Name (Firm/Shop) <span className="text-danger">*</span></label>
                  <input className="form-input" placeholder="e.g. Balaji Medical Stores" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Type <span className="text-danger">*</span></label>
                  <select className="form-select" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option>Retail</option>
                    <option>Wholesale</option>
                    <option>Hospital / Clinic</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input className="form-input" placeholder="e.g. Ramesh" value={formData.salesman} onChange={e => setFormData({...formData, salesman: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number <span className="text-danger">*</span></label>
                  <input className="form-input" placeholder="e.g. 9876543210" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email ID</label>
                  <input className="form-input" type="email" placeholder="e.g. user@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Address</label>
                  <input className="form-input" placeholder="Full address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Area / Route</label>
                  <select className="form-select" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})}>
                    <option>Dadar</option>
                    <option>Parel</option>
                    <option>Bandra</option>
                    <option>Kurla</option>
                    <option>Ghatkopar</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input className="form-input" placeholder="e.g. 400028" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} />
                </div>
                
                {/* Licenses */}
                <h4 style={{ gridColumn: 'span 2', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  Licenses & Finance
                </h4>
                <div className="form-group">
                  <label className="form-label">Drug License No.</label>
                  <input className="form-input" placeholder="e.g. MH-MUM-..." value={formData.drug_license} onChange={e => setFormData({...formData, drug_license: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">GSTIN (Optional for Retail)</label>
                  <input className="form-input" placeholder="15-digit GSTIN" maxLength="15" value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Credit Limit (₹)</label>
                  <input className="form-input" type="number" placeholder="e.g. 50000" value={formData.credit_limit} onChange={e => setFormData({...formData, credit_limit: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Credit Days</label>
                  <input className="form-input" type="number" placeholder="e.g. 30" value={formData.credit_days} onChange={e => setFormData({...formData, credit_days: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Opening Balance (₹)</label>
                  <input className="form-input" type="number" placeholder="0" value={formData.opening_balance} onChange={e => setFormData({...formData, opening_balance: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Balance Type</label>
                  <select className="form-select" value={formData.opening_balance_type} onChange={e => setFormData({...formData, opening_balance_type: e.target.value})}>
                    <option value="debit">Debit (Dr) - They owe us</option>
                    <option value="credit">Credit (Cr) - We owe them</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card-header" style={{ borderTop: '1px solid var(--border)', justifyContent: 'flex-end', background: '#F8FAFC' }}>
              <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>
                Save Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
