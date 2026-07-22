import React, { useState } from 'react';
import { Search, Building2, Key, CheckCircle, XCircle, MoreVertical } from 'lucide-react';
import { adminCompanies } from '../../data/mockData';

export default function CompanyManagement() {
  const [search, setSearch] = useState('');

  const filtered = adminCompanies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <h2 className="card-title" style={{ fontSize: '1.1rem' }}>Client Companies</h2>
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
          <button className="btn btn-primary" style={{ background: 'var(--purple)', borderColor: 'var(--purple)' }}>
            + Register Company
          </button>
        </div>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Company Name & Location</th>
              <th>Plan & Reg. Date</th>
              <th>Usage Stats</th>
              <th>Last Activity</th>
              <th>Status</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(company => (
              <tr key={company.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: 36, height: 36, borderRadius: '8px', 
                      background: 'var(--content-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-secondary)'
                    }}>
                      <Building2 size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{company.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {company.city}, {company.state} • {company.gstin}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 500 }}>{company.plan}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{company.registeredOn}</div>
                </td>
                <td>
                  <div style={{ fontSize: '0.8rem' }}>{company.totalInvoices.toLocaleString()} Invoices</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>DB: {company.dbSize}</div>
                </td>
                <td>
                  <div style={{ fontSize: '0.8rem' }}>Login: {company.lastLogin}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Backup: {company.lastBackup}</div>
                </td>
                <td>
                  {company.status === 'active' ? (
                    <span className="chip chip-active">Active</span>
                  ) : company.status === 'inactive' ? (
                    <span className="chip chip-danger">Inactive</span>
                  ) : (
                    <span className="chip chip-warning">Trial</span>
                  )}
                </td>
                <td className="col-actions">
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline btn-sm" title="Reset Password" style={{ color: 'var(--purple)', borderColor: 'var(--purple)' }}>
                      <Key size={14} />
                    </button>
                    {company.status === 'active' ? (
                      <button className="btn btn-outline btn-sm" title="Deactivate" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                        <XCircle size={14} />
                      </button>
                    ) : (
                      <button className="btn btn-outline btn-sm" title="Activate" style={{ color: 'var(--success)', borderColor: 'var(--success)' }}>
                        <CheckCircle size={14} />
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
