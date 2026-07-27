import React, { useState, useEffect } from 'react';
import { Database, Search, RefreshCw, AlertTriangle, CheckCircle, ShieldAlert, ChevronDown, ChevronRight, Laptop } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';


export default function BackupMonitor() {
  const [adminCompanies, set_adminCompanies] = useState([]);
  const [expandedCompanies, setExpandedCompanies] = useState({});

  const toggleExpand = (id) => {
    setExpandedCompanies(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/companies`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        set_adminCompanies(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch backup statuses:', err);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

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

  let healthyCount = 0;
  let overdueCount = 0;
  let criticalCount = 0;

  adminCompanies.forEach(c => {
    if (!c.lastBackup) {
      criticalCount++;
    } else {
      const lastBackupDate = new Date(c.lastBackup);
      const hoursDiff = (new Date().getTime() - lastBackupDate.getTime()) / (1000 * 60 * 60);
      
      if (c.unsyncedCount > 0 || c.lastSyncError) {
        if (hoursDiff > 24) {
          criticalCount++;
        } else {
          overdueCount++;
        }
      } else {
        healthyCount++;
      }
    }
  });

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
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{healthyCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Healthy Backups</div>
          </div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--warning-light)', color: 'var(--warning-dark)', borderRadius: '50%' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{overdueCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Overdue (&gt; 10 mins)</div>
          </div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '50%' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{criticalCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Critical / Failing</div>
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
              const lastBackupDate = company.lastBackup ? new Date(company.lastBackup) : null;
              const hoursDiff = lastBackupDate ? (new Date().getTime() - lastBackupDate.getTime()) / (1000 * 60 * 60) : Infinity;
              
              const critical = !company.lastBackup || company.lastSyncError || hoursDiff > 24;
              const overdue = company.unsyncedCount > 0 && hoursDiff <= 24;
              const isExpanded = !!expandedCompanies[company.id];

              return (
                <React.Fragment key={company.id}>
                  <tr 
                    style={{ background: critical ? 'var(--danger-light)' : overdue ? 'var(--warning-light)' : 'transparent', cursor: 'pointer' }}
                    onClick={() => toggleExpand(company.id)}
                  >
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        <div>{company.name}</div>
                      </div>
                      {company.lastSyncError && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--danger)', marginTop: '2px', fontWeight: 500, paddingLeft: '1.25rem' }}>
                          ⚠️ {company.lastSyncError}
                        </div>
                      )}
                    </td>
                    <td>{company.city}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{lastBackupDate ? lastBackupDate.toLocaleDateString('en-IN') : 'Never'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{lastBackupDate ? lastBackupDate.toLocaleTimeString('en-IN') : ''}</div>
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
                    <td style={{ fontWeight: 500 }}>{company.unsyncedCount > 0 ? `${company.unsyncedCount} pending` : 'All synced'}</td>
                    <td className="col-actions">
                      <button 
                        className={`btn btn-sm ${triggering === company.id ? 'btn-success' : 'btn-outline'}`}
                        onClick={(e) => { e.stopPropagation(); handleTrigger(company.id); }}
                        disabled={triggering === company.id}
                        style={triggering === company.id ? {} : { color: 'var(--purple)', borderColor: 'var(--purple)' }}
                      >
                        <Database size={14} /> 
                        {triggering === company.id ? 'Triggered!' : 'Force Backup'}
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr>
                      <td colSpan={6} style={{ background: '#F8FAFC', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Laptop size={14} /> Connected Devices / Laptops ({company.devices?.length || 0})
                        </div>
                        {(!company.devices || company.devices.length === 0) ? (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                            No active laptop connections recorded yet.
                          </div>
                        ) : (
                          <table style={{ width: '100%', background: 'white', borderRadius: '6px', border: '1px solid var(--border)', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                            <thead>
                              <tr style={{ background: '#F1F5F9', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '6px 12px', fontWeight: 600 }}>Device ID</th>
                                <th style={{ padding: '6px 12px', fontWeight: 600 }}>OS</th>
                                <th style={{ padding: '6px 12px', fontWeight: 600 }}>App Version</th>
                                <th style={{ padding: '6px 12px', fontWeight: 600 }}>Sync Status</th>
                                <th style={{ padding: '6px 12px', fontWeight: 600 }}>Last Attempt</th>
                                <th style={{ padding: '6px 12px', fontWeight: 600 }}>Last Success</th>
                              </tr>
                            </thead>
                            <tbody>
                              {company.devices.map(device => {
                                const lastAttempt = new Date(device.lastSyncTime);
                                const lastSuccess = device.lastSuccessSync ? new Date(device.lastSuccessSync) : null;
                                return (
                                  <tr key={device.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: 'var(--text-primary)' }} title={device.deviceId}>
                                      {device.deviceId.substring(0, 8)}...
                                    </td>
                                    <td style={{ padding: '8px 12px', textTransform: 'capitalize' }}>
                                      {device.osPlatform || 'Windows'}
                                    </td>
                                    <td style={{ padding: '8px 12px' }}>
                                      v{device.appVersion}
                                    </td>
                                    <td style={{ padding: '8px 12px' }}>
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ height: '7px', width: '7px', borderRadius: '50%', background: device.status === 'Success' ? 'var(--success-dark)' : device.status === 'Syncing' ? 'var(--warning-dark)' : 'var(--danger)' }} />
                                        <span style={{ fontWeight: 600, color: device.status === 'Success' ? 'var(--success-dark)' : device.status === 'Syncing' ? 'var(--warning-dark)' : 'var(--danger)' }}>
                                          {device.status}
                                        </span>
                                      </span>
                                      {device.errorMessage && (
                                        <div style={{ fontSize: '0.72rem', color: 'var(--danger)', marginTop: '2px', fontFamily: 'monospace' }}>
                                          Error: {device.errorMessage}
                                        </div>
                                      )}
                                    </td>
                                    <td style={{ padding: '8px 12px' }}>
                                      {lastAttempt.toLocaleString('en-IN')}
                                    </td>
                                    <td style={{ padding: '8px 12px' }}>
                                      {lastSuccess ? lastSuccess.toLocaleString('en-IN') : 'Never'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
