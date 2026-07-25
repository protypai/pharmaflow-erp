import React, { useState, useEffect } from 'react';
import { Save, User, Building2, FileText, Banknote, ShieldCheck } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function Profile() {
  const [activeTab, setActiveTab] = useState('company');
  const [company, setCompany] = useState({});
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const compRes = await window.pharmaAPI.db.query("SELECT * FROM companies LIMIT 1");
        if (compRes?.data?.length > 0) {
          // Convert database snake_case or whatever format to camelCase if needed, but since we are inserting directly, we map carefully.
          const c = compRes.data[0];
          setCompany({
            id: c.id,
            name: c.name || '',
            short_name: c.short_name || '',
            est_year: c.est_year || '',
            authorized_sign: c.authorized_sign || '',
            address: c.address || '',
            city: c.city || '',
            pincode: c.pincode || '',
            state: c.state || 'MH',
            state_code: c.state_code || '27',
            gstin: c.gstin || '',
            pan: c.pan || '',
            drug_license_20b: c.drug_license_20b || '',
            drug_license_21b: c.drug_license_21b || '',
            fssai_license: c.fssai_license || '',
            bank_name: c.bank_name || '',
            bank_account: c.bank_account || '',
            bank_ifsc: c.bank_ifsc || '',
            upi_id: c.upi_id || ''
          });
        }

        const userRes = await window.pharmaAPI.db.query("SELECT * FROM users LIMIT 1");
        if (userRes?.data?.length > 0) {
          const u = userRes.data[0];
          setUser({
            id: u.id,
            company_id: u.company_id,
            name: u.name || '',
            email: u.email || '',
            role: u.role || 'admin'
          });
        }
      } catch (err) {
        console.error("Failed to load profile data", err);
      }
    };
    fetchProfile();
  }, []);

  const handleCompanyChange = (e) => {
    setCompany({ ...company, [e.target.name]: e.target.value });
  };

  const handleUserChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. Update SQLite companies table
      const sql = `
        UPDATE companies SET 
          name = ?, short_name = ?, est_year = ?, authorized_sign = ?, 
          address = ?, city = ?, pincode = ?, state = ?, state_code = ?,
          gstin = ?, pan = ?, drug_license_20b = ?, drug_license_21b = ?, 
          fssai_license = ?, bank_name = ?, bank_account = ?, bank_ifsc = ?, upi_id = ?
        WHERE id = ?
      `;
      const params = [
        company.name, company.short_name, company.est_year, company.authorized_sign,
        company.address, company.city, company.pincode, company.state, company.state_code,
        company.gstin, company.pan, company.drug_license_20b, company.drug_license_21b,
        company.fssai_license, company.bank_name, company.bank_account, company.bank_ifsc, company.upi_id,
        company.id
      ];

      await window.pharmaAPI.db.run(sql, params);

      // 2. Add to sync queue to upload to cloud
      // Map back to camelCase for the cloud schema Prisma expects
      const cloudPayload = JSON.stringify({
        id: company.id,
        name: company.name,
        shortName: company.short_name,
        estYear: company.est_year ? parseInt(company.est_year) : null,
        authorizedSign: company.authorized_sign,
        address: company.address,
        city: company.city,
        pincode: company.pincode,
        state: company.state,
        stateCode: company.state_code,
        gstin: company.gstin,
        pan: company.pan,
        drugLicense20B: company.drug_license_20b,
        drugLicense21B: company.drug_license_21b,
        fssaiLicense: company.fssai_license,
        bankName: company.bank_name,
        bankAccount: company.bank_account,
        bankIfsc: company.bank_ifsc,
        upiId: company.upi_id
      });

      const syncSql = `
        INSERT INTO sync_queue (id, table_name, operation, payload, is_synced, app_version)
        VALUES (?, 'Company', 'update', ?, 0, ?)
      `;
      const currentVersion = import.meta.env.VITE_APP_VERSION || 'v1.0.30';
      await window.pharmaAPI.db.run(syncSql, [uuidv4(), cloudPayload, currentVersion]);

      // Update User if needed
      await window.pharmaAPI.db.run(`UPDATE users SET name = ? WHERE id = ?`, [user.name, user.id]);
      
      const userPayload = JSON.stringify({
        id: user.id,
        name: user.name
      });
      await window.pharmaAPI.db.run(syncSql.replace('Company', 'User'), [uuidv4(), userPayload, currentVersion]);

      alert('Profile updated and synced successfully!');
    } catch (err) {
      console.error('Failed to save profile', err);
      alert('Failed to save profile. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Company Profile</h1>
          <div className="page-sub">Manage legal, tax, and bank details</div>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
          <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar Tabs */}
        <div className="card" style={{ width: '250px', padding: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              className={`btn ${activeTab === 'company' ? 'btn-primary' : 'btn-ghost'}`} 
              style={{ justifyContent: 'flex-start' }}
              onClick={() => setActiveTab('company')}
            >
              <Building2 size={16} /> Basic Info
            </button>
            <button 
              className={`btn ${activeTab === 'legal' ? 'btn-primary' : 'btn-ghost'}`} 
              style={{ justifyContent: 'flex-start' }}
              onClick={() => setActiveTab('legal')}
            >
              <ShieldCheck size={16} /> Licenses & Tax
            </button>
            <button 
              className={`btn ${activeTab === 'bank' ? 'btn-primary' : 'btn-ghost'}`} 
              style={{ justifyContent: 'flex-start' }}
              onClick={() => setActiveTab('bank')}
            >
              <Banknote size={16} /> Bank Details
            </button>
            <button 
              className={`btn ${activeTab === 'user' ? 'btn-primary' : 'btn-ghost'}`} 
              style={{ justifyContent: 'flex-start' }}
              onClick={() => setActiveTab('user')}
            >
              <User size={16} /> My Account
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="card" style={{ flex: 1, overflowY: 'auto' }}>
          <div className="card-body">
            {activeTab === 'company' && (
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={18} color="var(--primary)" /> Company Information
                </h3>
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Legal Company Name <span className="text-danger">*</span></label>
                    <input className="form-input" name="name" value={company.name || ''} onChange={handleCompanyChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Trade Name (DBA)</label>
                    <input className="form-input" name="short_name" value={company.short_name || ''} onChange={handleCompanyChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year of Establishment</label>
                    <input className="form-input" type="number" name="est_year" value={company.est_year || ''} onChange={handleCompanyChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Authorized Signatory</label>
                    <input className="form-input" name="authorized_sign" value={company.authorized_sign || ''} onChange={handleCompanyChange} />
                  </div>
                </div>

                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: '1.5rem 0 1rem 0', color: 'var(--text-secondary)' }}>Registered Address</h4>
                <div className="form-row-2">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Address Line 1</label>
                    <input className="form-input" name="address" value={company.address || ''} onChange={handleCompanyChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-input" name="city" value={company.city || ''} onChange={handleCompanyChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pincode</label>
                    <input className="form-input" name="pincode" value={company.pincode || ''} onChange={handleCompanyChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <select className="form-select" name="state" value={company.state || 'MH'} onChange={handleCompanyChange}>
                      <option value="MH">Maharashtra</option>
                      <option value="GJ">Gujarat</option>
                      <option value="DL">Delhi</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">State Code (GST)</label>
                    <input className="form-input" name="state_code" value={company.state_code || ''} onChange={handleCompanyChange} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'legal' && (
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={18} color="var(--primary)" /> Licenses & Registration
                </h3>
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">GSTIN <span className="text-danger">*</span></label>
                    <input className="form-input" name="gstin" value={company.gstin || ''} onChange={handleCompanyChange} maxLength={15} style={{ textTransform: 'uppercase' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PAN Number</label>
                    <input className="form-input" name="pan" value={company.pan || ''} onChange={handleCompanyChange} maxLength={10} style={{ textTransform: 'uppercase' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Drug License No. (Form 20B)</label>
                    <input className="form-input" name="drug_license_20b" value={company.drug_license_20b || ''} onChange={handleCompanyChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Drug License No. (Form 21B)</label>
                    <input className="form-input" name="drug_license_21b" value={company.drug_license_21b || ''} onChange={handleCompanyChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">FSSAI License No</label>
                    <input className="form-input" name="fssai_license" value={company.fssai_license || ''} onChange={handleCompanyChange} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bank' && (
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Banknote size={18} color="var(--primary)" /> Bank Account Details
                </h3>
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Bank Name</label>
                    <input className="form-input" name="bank_name" value={company.bank_name || ''} onChange={handleCompanyChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Account Number</label>
                    <input className="form-input" name="bank_account" value={company.bank_account || ''} onChange={handleCompanyChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">IFSC Code</label>
                    <input className="form-input" name="bank_ifsc" value={company.bank_ifsc || ''} onChange={handleCompanyChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">UPI ID</label>
                    <input className="form-input" name="upi_id" value={company.upi_id || ''} onChange={handleCompanyChange} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'user' && (
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={18} color="var(--primary)" /> My Account
                </h3>
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" name="name" value={user.name || ''} onChange={handleUserChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input className="form-input" type="email" name="email" value={user.email || ''} disabled />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <input className="form-input" value={user.role || 'Administrator'} disabled />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}