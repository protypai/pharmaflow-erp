import React, { useState } from 'react';
import { Database, Search, RefreshCw, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { adminCompanies } from '../../data/mockData';

export default function BackupMonitor() {
  const [search, setSearch] = useState('');
  const [triggering, setTriggering] = useState(null);

  const filtered = adminCompanies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  const handleTrigger = (id) => {
    setTriggering(id);
    setTimeout(() => setTriggering(null), 1500);
  };

  const isOverdue = (dateStr) => {
    return dateStr.includes('2025-06') || dateStr.includes('2025-07-18') || dateStr.includes('2025-07-20');
  };

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <h2 className="card-title" style={{ fontSize: '1.1rem' }}>Global Backup Monitor</h2>
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
          <button className="btn btn-outline" style={{ color: 'var(--purple)', borderColor: 'var(--purple)' }}>
            <RefreshCw size={16} /> Refresh Status
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', padding: '1.25rem', borderBottom: '1px solid var(--border)', background: '#FAFAFA' }}>
        <div style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--success-light)', color: 'var(--success-dark)', borderRadius: '50%' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>3</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Healthy Backups Today</div>
          </div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--warning-light)', color: 'var(--warning-dark)', borderRadius: '50%' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>2</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Overdue (&gt; 24 hours)</div>
          </div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '50%' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>1</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Critical (&gt; 3 days)</div>
          </div>
        </div>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Location</th>
              <th>Last Backup Time</th>
              <th>Status</th>
              <th>DB Size</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(company => {
              const overdue = isOverdue(company.lastBackup);
              const critical = company.lastBackup.includes('2025-06');
              return (
                <tr key={company.id} style={{ background: critical ? 'var(--danger-light)' : overdue ? 'var(--warning-light)' : 'transparent' }}>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                    {company.name}
                  </td>
                  <td>{company.city}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{company.lastBackup.split(' ')[0]}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{company.lastBackup.split(' ').slice(1).join(' ')}</div>
                  </td>
                  <td>
                    {critical ? (
                      <span className="badge badge-danger">Critical</span>
                    ) : overdue ? (
                      <span className="badge badge-warning">Overdue</span>
                    ) : (
                      <span className="badge badge-success">Healthy</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 500 }}>{company.dbSize}</td>
                  <td className="col-actions">
                    <button 
                      className={`btn btn-sm ${triggering === company.id ? 'btn-success' : 'btn-outline'}`}
                      onClick={() => handleTrigger(company.id)}
                      disabled={triggering === company.id}
                      style={triggering === company.id ? {} : { color: 'var(--purple)', borderColor: 'var(--purple)' }}
                    >
                      <Database size={14} /> 
                      {triggering === company.id ? 'Triggered!' : 'Force Backup'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
