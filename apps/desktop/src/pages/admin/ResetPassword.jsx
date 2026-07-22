import React, { useState } from 'react';
import { Key, ShieldAlert } from 'lucide-react';
import { adminCompanies } from '../../data/mockData';

export default function ResetPassword() {
  const [companyId, setCompanyId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords don't match");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setCompanyId('');
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', paddingTop: '2rem' }}>
      <div className="card">
        <div className="card-header" style={{ borderBottom: '1px solid var(--border)', background: '#FAFAFA' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: 'var(--purple-light)', color: 'var(--purple)', borderRadius: '8px' }}>
              <Key size={20} />
            </div>
            <div>
              <h2 className="card-title" style={{ fontSize: '1.1rem' }}>Force Password Reset</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reset admin password for any client company</div>
            </div>
          </div>
        </div>

        <div className="card-body">
          <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem', background: 'var(--warning-light)', color: 'var(--warning-dark)', borderRadius: 'var(--radius)', marginBottom: '1.5rem', fontSize: '0.82rem' }}>
            <ShieldAlert size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>Security Warning:</strong> Forcing a password reset will immediately invalidate all active sessions for the selected company. Ensure you have verified the identity of the requester.
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Select Company <span className="required">*</span></label>
              <select 
                className="form-select" 
                value={companyId} 
                onChange={e => setCompanyId(e.target.value)}
                required
              >
                <option value="">-- Choose a company --</option>
                {adminCompanies.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">New Password <span className="required">*</span></label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Enter new strong password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
              <div className="form-hint">Minimum 8 characters, include numbers and symbols.</div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password <span className="required">*</span></label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {success && (
              <div style={{ padding: '0.75rem', background: 'var(--success-light)', color: 'var(--success-dark)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', textAlign: 'center', fontWeight: 500 }}>
                Password successfully reset and temporary credentials generated.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => {setCompanyId(''); setNewPassword(''); setConfirmPassword('');}}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ background: 'var(--purple)', borderColor: 'var(--purple)' }} disabled={loading}>
                {loading ? 'Processing...' : 'Reset Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
