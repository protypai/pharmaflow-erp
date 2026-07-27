import React, { useState, useEffect } from 'react';
import { Building2, Users, Database, ShieldAlert, Activity, CheckCircle2, Clock } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function AdminDashboard() {
  const [adminCompanies, set_adminCompanies] = useState([]);
  const [adminActivityLogs, set_adminActivityLogs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/v1/admin/companies`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
          set_adminCompanies(data.data);
        }
        
        const logsRes = await fetch(`${API_BASE_URL}/api/v1/admin/activity-logs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const logsData = await logsRes.json();
        if (logsData.success && logsData.data) {
          set_adminActivityLogs(logsData.data);
        }
      } catch (err) {
        console.error('Failed to fetch admin dashboard data:', err);
      }
    };
    fetchData();
  }, []);

  const activeCompanies = adminCompanies.filter(c => c.isActive || c.subscriptionStatus === 'active').length;
  const inactiveCompanies = adminCompanies.filter(c => !c.isActive || c.subscriptionStatus === 'inactive').length;
  const trialCompanies = adminCompanies.filter(c => c.subscriptionStatus === 'trial').length;

  // Real backup metrics calculation
  let healthyBackups = 0;
  let overdueBackups = 0;
  let criticalBackups = 0;

  adminCompanies.forEach(c => {
    if (!c.lastBackup) {
      criticalBackups++;
    } else {
      const lastBackupDate = new Date(c.lastBackup);
      const timeDiffMs = new Date().getTime() - lastBackupDate.getTime();
      const hoursDiff = timeDiffMs / (1000 * 60 * 60);
      
      if (c.unsyncedCount > 0 || c.lastSyncError) {
        if (hoursDiff > 24) {
          criticalBackups++;
        } else {
          overdueBackups++;
        }
      } else {
        healthyBackups++;
      }
    }
  });

  const todayStr = new Date().toDateString();
  const todayActivityCount = adminActivityLogs.filter(log => new Date(log.createdAt).toDateString() === todayStr).length;
  const totalSyncRecords = adminCompanies.reduce((acc, c) => acc + (c.totalSyncCount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* KPIs */}
      <div className="grid-3">
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--purple)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Companies
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                {adminCompanies.length}
              </div>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--purple-light)', borderRadius: 'var(--radius)', color: 'var(--purple)' }}>
              <Building2 size={24} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--success)' }}>● {activeCompanies} Active</span>
            <span style={{ color: 'var(--warning)' }}>● {trialCompanies} Trial</span>
            <span style={{ color: 'var(--danger)' }}>● {inactiveCompanies} Inactive</span>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--info)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                System Activity Today
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                {todayActivityCount}
              </div>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--info-light)', borderRadius: 'var(--radius)', color: 'var(--info-dark)' }}>
              <Activity size={24} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Total Sync Records: {totalSyncRecords}</span>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                Backup Status
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                {healthyBackups} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>/ {adminCompanies.length}</span>
              </div>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--success-light)', borderRadius: 'var(--radius)', color: 'var(--success-dark)' }}>
              <Database size={24} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={14} /> {healthyBackups} Completed</span>
            <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldAlert size={14} /> {overdueBackups + criticalBackups} Issue</span>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Recent Activity Logs */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Cross-Company Activity Logs</h3>
            <button className="btn btn-ghost btn-sm">View All</button>
          </div>
          <div className="card-body no-pad">
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Company</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {adminActivityLogs.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        No recent activity.
                      </td>
                    </tr>
                  )}
                  {adminActivityLogs.slice(0, 6).map(log => {
                    const company = adminCompanies.find(c => c.id === log.companyId);
                    return (
                      <tr key={log.id}>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {log.createdAt ? new Date(log.createdAt).toLocaleTimeString('en-IN') : 'N/A'}
                        </td>
                        <td style={{ fontWeight: 500 }}>{company?.name || (log.companyId ? log.companyId : 'System')}</td>
                        <td>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{log.action || 'activity'}</span>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.detail || log.actorEmail || ''}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Backup Monitor Preview */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Backup Health Monitor</h3>
            <button className="btn btn-ghost btn-sm">View Details</button>
          </div>
          <div className="card-body no-pad">
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Last Backup</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {adminCompanies.map(c => {
                    const isCritical = !c.lastBackup || c.lastSyncError;
                    const isOverdue = c.unsyncedCount > 0;
                    return (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 500 }}>{c.name}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {c.lastBackup ? new Date(c.lastBackup).toLocaleString('en-IN') : 'Never'}
                          </div>
                        </td>
                        <td>
                          {isCritical ? (
                            <span className="badge badge-danger">Critical</span>
                          ) : isOverdue ? (
                            <span className="badge badge-warning">Overdue</span>
                          ) : (
                            <span className="badge badge-success">OK</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
