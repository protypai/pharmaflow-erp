import React, { useState, useEffect } from 'react';

import { Search, Filter, Calendar } from 'lucide-react';

export default function ActivityLogs() {
  const [adminActivityLogs, set_adminActivityLogs] = useState([]);
  const [adminCompanies, set_adminCompanies] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      set_adminActivityLogs([]);
      set_adminCompanies([]);
    };
    fetchData();
  }, []);

  const [companyFilter, setCompanyFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filteredLogs = adminActivityLogs.filter(log => {
    if (companyFilter && log.company !== companyFilter) return false;
    if (typeFilter && log.type !== typeFilter) return false;
    return true;
  });

  const getBadgeColor = (type) => {
    switch (type) {
      case 'sale': return 'badge-success';
      case 'purchase': return 'badge-primary';
      case 'receipt': return 'badge-warning';
      case 'login': return 'badge-info';
      case 'backup': return 'badge-purple';
      case 'master': return 'badge-gray';
      default: return 'badge-gray';
    }
  };

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <h2 className="card-title" style={{ fontSize: '1.1rem' }}>Global Activity Audit Trail</h2>
        <div className="search-bar">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input type="text" className="form-input" placeholder="Search logs..." />
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <Filter size={16} /> Filters:
        </div>
        
        <select 
          className="form-select" 
          value={companyFilter} 
          onChange={e => setCompanyFilter(e.target.value)}
        >
          <option value="">All Companies</option>
          {adminCompanies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>

        <select 
          className="form-select" 
          value={typeFilter} 
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="">All Activity Types</option>
          <option value="sale">Sales</option>
          <option value="purchase">Purchases</option>
          <option value="receipt">Receipts / Payments</option>
          <option value="login">Logins</option>
          <option value="backup">Backups</option>
          <option value="master">Master Updates</option>
        </select>

        <div className="search-input-wrap" style={{ maxWidth: '220px' }}>
          <Calendar size={14} className="search-icon" />
          <input type="text" className="form-input" placeholder="Date Range" defaultValue="Today" />
        </div>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Company</th>
              <th>Action Category</th>
              <th>Activity Description</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <div style={{ fontWeight: 500 }}>{log.date}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{log.time}</div>
                </td>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{log.company}</td>
                <td>
                  <span className={`badge ${getBadgeColor(log.type)}`}>
                    {log.type.toUpperCase()}
                  </span>
                </td>
                <td style={{ fontWeight: 500 }}>{log.action}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
