import React from 'react';
import { Save, Server, Shield, Mail } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Settings</h1>
          <div className="page-sub">Configure global ERP platform preferences</div>
        </div>
        <button className="btn btn-primary" style={{ background: 'var(--purple)', borderColor: 'var(--purple)' }}>
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* General Info */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Server size={18} color="var(--purple)" />
              <h3 className="card-title">Platform Information</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Platform Name</label>
                <input type="text" className="form-input" defaultValue="PharmaFlow ERP" />
              </div>
              <div className="form-group">
                <label className="form-label">Support Email</label>
                <input type="email" className="form-input" defaultValue="support@pharmaflow.com" />
              </div>
            </div>
          </div>
        </div>

        {/* Security & Backup */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Shield size={18} color="var(--purple)" />
              <h3 className="card-title">Security & Backup Defaults</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Global Auto-Backup Time</label>
                <select className="form-select" defaultValue="06:00">
                  <option value="00:00">12:00 AM (Midnight)</option>
                  <option value="03:00">03:00 AM</option>
                  <option value="06:00">06:00 AM</option>
                  <option value="23:00">11:00 PM</option>
                </select>
                <div className="form-hint">Time when automated backups trigger for all active companies.</div>
              </div>
              <div className="form-group">
                <label className="form-label">Session Timeout (Minutes)</label>
                <input type="number" className="form-input" defaultValue={120} />
                <div className="form-hint">Idle time before forcing re-login across the platform.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Mail size={18} color="var(--purple)" />
              <h3 className="card-title">SMTP Settings (System Emails)</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">SMTP Host</label>
                <input type="text" className="form-input" defaultValue="smtp.sendgrid.net" />
              </div>
              <div className="form-group">
                <label className="form-label">SMTP Port</label>
                <input type="text" className="form-input" defaultValue="587" />
              </div>
              <div className="form-group">
                <label className="form-label">SMTP Username</label>
                <input type="text" className="form-input" defaultValue="apikey" />
              </div>
              <div className="form-group">
                <label className="form-label">SMTP Password</label>
                <input type="password" className="form-input" defaultValue="********" />
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
          PharmaFlow ERP • Version 1.0.0 • React/Electron Build
        </div>
      </div>
    </div>
  );
}
