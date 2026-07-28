import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

// Frontend filter value -> backend action category (see ACTIVITY_FILTER_MAP on the server).
const TYPE_FILTERS = [
  { value: '', label: 'All Activity Types' },
  { value: 'login', label: 'Logins' },
  { value: 'company', label: 'Company Actions' },
  { value: 'password', label: 'Password Resets' },
  { value: 'backups', label: 'Backups' },
  { value: 'errors', label: 'Errors & Failures' },
];

// Map a concrete action to a badge category + human label.
const actionMeta = (action) => {
  // Failures / errors — highlight in red.
  if (action && (action.endsWith('_failed') || action === 'sync.partial' || action === 'sync.rejected')) {
    return { type: 'error', badge: 'badge-danger' };
  }
  if (action === 'admin.login' || action === 'auth.login') return { type: 'login', badge: 'badge-info' };
  if (action === 'user.password_reset') return { type: 'password', badge: 'badge-warning' };
  if (action === 'backup.synced' || action === 'backup.completed') return { type: 'backup', badge: 'badge-success' };
  if (action && action.startsWith('company.')) return { type: 'company', badge: 'badge-primary' };
  return { type: 'other', badge: 'badge-gray' };
};

export default function ActivityLogs() {
  const [adminActivityLogs, set_adminActivityLogs] = useState([]);
  const [adminCompanies, set_adminCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [companyFilter, setCompanyFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Refetch whenever the action-type filter changes (backend honours ?action=).
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('adminToken');
        const logsUrl = `${API_BASE_URL}/api/v1/admin/activity-logs${typeFilter ? `?action=${typeFilter}` : ''}`;
        const [logsRes, compRes] = await Promise.all([
          fetch(logsUrl, { headers: { 'Authorization': `Bearer ${token}` } }),
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
  }, [typeFilter]);

  const companyName = (companyId) => {
    if (!companyId) return 'System / Global';
    const match = adminCompanies.find(c => c.id === companyId);
    return match ? match.name : companyId;
  };

  const formatLog = (log) => {
    const dateObj = new Date(log.createdAt);
    const meta = actionMeta(log.action);
    return {
      id: log.id,
      date: dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      company: companyName(log.companyId),
      type: meta.type,
      badge: meta.badge,
      action: log.action || 'unknown',
      actor: log.actorEmail || log.actorId || 'System',
      detail: log.detail || '',
      ip: log.ipAddress || '',
    };
  };

  const formattedLogs = adminActivityLogs.map(formatLog);

  const filteredLogs = formattedLogs.filter(log => {
    if (companyFilter && log.company !== companyFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.company.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q) ||
        log.detail.toLowerCase().includes(q)
      );
    }
    return true;
  });

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
          {TYPE_FILTERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Company</th>
              <th>Action</th>
              <th>Actor</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filteredLogs.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No audit events found.
                </td>
              </tr>
            )}
            {filteredLogs.map(log => (
              <tr key={log.id}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <div style={{ fontWeight: 500 }}>{log.date}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{log.time}</div>
                </td>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{log.company}</td>
                <td>
                  <span className={`badge ${log.badge}`}>{log.action}</span>
                </td>
                <td style={{ fontSize: '0.82rem' }}>
                  <div style={{ fontWeight: 500 }}>{log.actor}</div>
                  {log.ip && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.ip}</div>}
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{log.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
