import React, { useState } from 'react';
import { Save, User, Building2, FileText, Banknote, ShieldCheck } from 'lucide-react';

export default function Profile() {
  const [activeTab, setActiveTab] = useState('company');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Company Profile</h1>
          <div className="page-sub">Manage legal, tax, and bank details</div>
        </div>
        <button className="btn btn-primary" onClick={() => alert('Profile updated successfully!')}><Save size={16} /> Save Changes</button>
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
                    <input className="form-input" defaultValue="Sharma Medicals Pvt Ltd" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Trade Name (DBA)</label>
                    <input className="form-input" defaultValue="Sharma Distributors" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year of Establishment</label>
                    <input className="form-input" type="number" defaultValue="2015" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Authorized Signatory</label>
                    <input className="form-input" defaultValue="Rajesh Sharma" />
                  </div>
                </div>

                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: '1.5rem 0 1rem 0', color: 'var(--text-secondary)' }}>Registered Address</h4>
                <div className="form-row-2">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Address Line 1</label>
                    <input className="form-input" defaultValue="14, Ground Floor, Medicine Market" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-input" defaultValue="Mumbai" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pincode</label>
                    <input className="form-input" defaultValue="400001" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <select className="form-select" defaultValue="MH">
                      <option value="MH">Maharashtra</option>
                      <option value="GJ">Gujarat</option>
                      <option value="DL">Delhi</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">State Code (GST)</label>
                    <input className="form-input" defaultValue="27" disabled />
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
                    <input className="form-input" defaultValue="27AADCS1234F1Z5" maxLength={15} style={{ textTransform: 'uppercase' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PAN Number</label>
                    <input className="form-input" defaultValue="AADCS1234F" maxLength={10} style={{ textTransform: 'uppercase' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Drug License No. (Form 20B)</label>
                    <input className="form-input" defaultValue="MH-MUM-20B-123456" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Drug License No. (Form 21B)</label>
                    <input className="form-input" defaultValue="MH-MUM-21B-123457" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">FSSAI License No</label>
                    <input className="form-input" defaultValue="11520000000000" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">MSME / Udyam No</label>
                    <input className="form-input" placeholder="Optional" />
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
                    <label className="form-label">Account Name</label>
                    <input className="form-input" defaultValue="Sharma Medicals Pvt Ltd" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Account Number</label>
                    <input className="form-input" defaultValue="50200012345678" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bank Name</label>
                    <input className="form-input" defaultValue="HDFC Bank" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">IFSC Code</label>
                    <input className="form-input" defaultValue="HDFC0001234" />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">UPI ID</label>
                    <input className="form-input" defaultValue="sharmamedicals@hdfcbank" />
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
                    <input className="form-input" defaultValue="Admin User" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input className="form-input" type="email" defaultValue="admin@sharmamedicals.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input className="form-input" defaultValue="+91 9876543210" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <input className="form-input" defaultValue="Administrator" disabled />
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