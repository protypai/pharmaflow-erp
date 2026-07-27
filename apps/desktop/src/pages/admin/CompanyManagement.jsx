import React, { useState, useEffect } from 'react';
import { Search, Building2, Key, CheckCircle, XCircle, Clock } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function CompanyManagement() {
  const [adminCompanies, setAdminCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'active'
  const [selectedCompany, setSelectedCompany] = useState(null);

  const fetchCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/companies`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminCompanies(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch companies');
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError('Unable to connect to Cloud Backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleApprove = async (companyId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/companies/${companyId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Company approved and activated successfully!');
        fetchCompanies();
      } else {
        alert(data.message || 'Failed to approve company');
      }
    } catch (err) {
      console.error('Approve error:', err);
      alert('Failed to connect to backend.');
    }
  };

  const handleToggle = async (companyId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/companies/${companyId}/toggle`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchCompanies();
      } else {
        alert(data.message || 'Failed to toggle company status');
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const filtered = adminCompanies.filter(c => {
    const matchesSearch = (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (c.city || '').toLowerCase().includes(search.toLowerCase());

    if (activeTab === 'pending') {
      return matchesSearch && (!c.isActive || c.subscriptionStatus === 'pending');
    }
    if (activeTab === 'active') {
      return matchesSearch && (c.isActive && c.subscriptionStatus !== 'pending');
    }
    return matchesSearch;
  });

  const pendingCount = adminCompanies.filter(c => !c.isActive || c.subscriptionStatus === 'pending').length;

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 className="card-title" style={{ fontSize: '1.1rem' }}>Client Companies</h2>
          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--content-bg)', padding: '0.25rem', borderRadius: '6px' }}>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                border: 'none', background: activeTab === 'all' ? 'white' : 'transparent',
                padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer',
                fontWeight: activeTab === 'all' ? 600 : 400,
              }}
            >
              All ({adminCompanies.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              style={{
                border: 'none', background: activeTab === 'pending' ? 'white' : 'transparent',
                padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer',
                fontWeight: activeTab === 'pending' ? 600 : 400,
                color: pendingCount > 0 ? '#D97706' : 'inherit'
              }}
            >
              Pending Approval {pendingCount > 0 && `(${pendingCount})`}
            </button>
            <button
              onClick={() => setActiveTab('active')}
              style={{
                border: 'none', background: activeTab === 'active' ? 'white' : 'transparent',
                padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer',
                fontWeight: activeTab === 'active' ? 600 : 400,
              }}
            >
              Active
            </button>
          </div>
        </div>

        <div className="search-bar">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search companies, cities..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button onClick={fetchCompanies} className="btn btn-outline btn-sm">
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1.25rem', background: '#FEF2F2', color: '#991B1B', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading companies...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No companies found.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Company Name & Location</th>
                <th>Status & Subscription</th>
                <th>Registered On</th>
                <th>Activity Stats</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(company => {
                const isPending = !company.isActive || company.subscriptionStatus === 'pending';
                return (
                  <tr key={company.id} style={{ background: isPending ? '#FFFBEB' : 'transparent' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '8px',
                          background: isPending ? '#FEF3C7' : 'var(--content-bg)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: isPending ? '#D97706' : 'var(--text-secondary)'
                        }}>
                          <Building2 size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {company.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {company.city || 'N/A'}, {company.state || 'N/A'} • {company.gstin || 'No GSTIN'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {isPending ? (
                        <span className="chip chip-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#FEF3C7', color: '#B45309' }}>
                          <Clock size={12} /> Pending Approval
                        </span>
                      ) : company.isActive ? (
                        <span className="chip chip-active">Active</span>
                      ) : (
                        <span className="chip chip-danger">Inactive</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>
                        {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>
                        Invoices: {company._count?.sales || 0} | Purchases: {company._count?.purchases || 0}
                      </div>
                    </td>
                    <td className="col-actions">
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {isPending ? (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleApprove(company.id)}
                            style={{ background: '#16A34A', borderColor: '#16A34A', fontSize: '0.78rem' }}
                          >
                            <CheckCircle size={14} /> Approve & Activate
                          </button>
                        ) : (
                          <button
                            className={`btn btn-outline btn-sm`}
                            onClick={() => handleToggle(company.id)}
                            title={company.isActive ? 'Deactivate' : 'Activate'}
                            style={{
                              color: company.isActive ? 'var(--danger)' : 'var(--success)',
                              borderColor: company.isActive ? 'var(--danger)' : 'var(--success)',
                            }}
                          >
                            {company.isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
                            {company.isActive ? ' Deactivate' : ' Activate'}
                          </button>
                        )}
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setSelectedCompany(company)}
                          style={{ fontSize: '0.78rem' }}
                        >
                          <Building2 size={14} /> Profile
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Company Details Modal */}
      {selectedCompany && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '600px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Company Profile Details</h3>
              <button onClick={() => setSelectedCompany(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><XCircle size={20} /></button>
            </div>
            <div className="card-body">
              <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', marginTop: 0 }}>Basic Info</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div><strong>Legal Name:</strong> {selectedCompany.name}</div>
                <div><strong>Trade Name:</strong> {selectedCompany.shortName || 'N/A'}</div>
                <div><strong>Est. Year:</strong> {selectedCompany.estYear || 'N/A'}</div>
                <div><strong>Authorized Signatory:</strong> {selectedCompany.authorizedSign || 'N/A'}</div>
              </div>

              <h4 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Contact & Address</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div><strong>Address:</strong> {selectedCompany.address || 'N/A'}, {selectedCompany.city || 'N/A'}, {selectedCompany.state || 'N/A'} - {selectedCompany.pincode || 'N/A'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div><strong>Phone:</strong> {selectedCompany.phone || 'N/A'}</div>
                  <div><strong>Email:</strong> {selectedCompany.email || 'N/A'}</div>
                </div>
              </div>

              <h4 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Licenses & Tax</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div><strong>GSTIN:</strong> {selectedCompany.gstin || 'N/A'}</div>
                <div><strong>PAN:</strong> {selectedCompany.pan || 'N/A'}</div>
                <div><strong>Drug License (20B):</strong> {selectedCompany.drugLicense20B || 'N/A'}</div>
                <div><strong>Drug License (21B):</strong> {selectedCompany.drugLicense21B || 'N/A'}</div>
                <div><strong>FSSAI License:</strong> {selectedCompany.fssaiLicense || 'N/A'}</div>
              </div>

              <h4 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Bank Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div><strong>Bank Name:</strong> {selectedCompany.bankName || 'N/A'}</div>
                <div><strong>Account No:</strong> {selectedCompany.bankAccount || 'N/A'}</div>
                <div><strong>IFSC Code:</strong> {selectedCompany.bankIfsc || 'N/A'}</div>
                <div><strong>UPI ID:</strong> {selectedCompany.upiId || 'N/A'}</div>
              </div>
            </div>
            <div className="card-footer" style={{ textAlign: 'right' }}>
              <button className="btn btn-outline" onClick={() => setSelectedCompany(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
