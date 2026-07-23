import React, { useState, useEffect } from 'react';
import { Building2, Users, Database, ShieldAlert, Activity, CheckCircle2, Clock } from 'lucide-react';


export default function AdminDashboard() {
  const [adminCompanies, set_adminCompanies] = useState([]);
  const [adminActivityLogs, set_adminActivityLogs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      set_adminCompanies([]);
      set_adminActivityLogs([]);
    };
    fetchData();
  }, []);

  const activeCompanies = adminCompanies.filter(c => c.status === 'active').length;
  const inactiveCompanies = adminCompanies.filter(c => c.status === 'inactive').length;
  const trialCompanies = adminCompanies.filter(c => c.plan === 'Trial').length;

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
                142
              </div>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--info-light)', borderRadius: 'var(--radius)', color: 'var(--info-dark)' }}>
              <Activity size={24} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Logins: 45</span>
            <span>API Calls: 12.4k</span>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                Backup Status
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                5 <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>/ 6</span>
              </div>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--success-light)', borderRadius: 'var(--radius)', color: 'var(--success-dark)' }}>
              <Database size={24} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={14} /> 5 Completed</span>
            <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldAlert size={14} /> 1 Overdue</span>
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
                  {adminActivityLogs.slice(0, 6).map(log => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{log.time}</td>
                      <td style={{ fontWeight: 500 }}>{log.company}</td>
                      <td>
                        <span style={{ fontSize: '0.8rem' }}>{log.action}</span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.details}</div>
                      </td>
                    </tr>
                  ))}
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
                    const isOverdue = c.lastBackup.includes('2025-06') || c.lastBackup.includes('2025-07-18');
                    return (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 500 }}>{c.name}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {c.lastBackup}
                          </div>
                        </td>
                        <td>
                          {isOverdue ? (
                            <span className="badge badge-danger">Overdue</span>
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
