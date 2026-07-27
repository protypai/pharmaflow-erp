import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function ActivityLogs() {
  const [adminActivityLogs, set_adminActivityLogs] = useState([]);
  const [adminCompanies, set_adminCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const [logsRes, compRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/admin/activity-logs`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/v1/admin/companies`, { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);
        const logsData = await logsRes.json();
        const compData = await compRes.json();
        if (logsData.success && logsData.data) set_adminActivityLogs(logsData.data);
        if (compData.success && compData.data) set_adminCompanies(compData.data);
      } catch (err) {
        console.error('Failed to fetch activity logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [companyFilter, setCompanyFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const formatLog = (log) => {
    const dateObj = new Date(log.createdAt);
    const date = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const company = log.company?.name || log.companyId || 'Unknown';
    
    let type = 'master';
    const table = (log.tableName || '').toLowerCase();
    if (table.includes('sale')) type = 'sale';
    else if (table.includes('purchase')) type = 'purchase';
    else if (table.includes('receipt') || table.includes('payment')) type = 'receipt';
    else if (table.includes('login')) type = 'login';
    
    const action = `${(log.operation || 'SYNC').toUpperCase()} ${log.tableName || 'Record'}`;
    const details = `Device: ${log.deviceId || 'N/A'} (v${log.appVersion || '1.0.0'})`;
    
    return {
      id: log.id,
      date,
      time,
      company,
      type,
      action,
      details
    };
  };

  const formattedLogs = adminActivityLogs.map(formatLog);

  const filteredLogs = formattedLogs.filter(log => {
    if (companyFilter && log.company !== companyFilter) return false;
    if (typeFilter && log.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return log.company.toLowerCase().includes(q) || log.action.toLowerCase().includes(q) || log.details.toLowerCase().includes(q);
    }
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
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search logs..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
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
