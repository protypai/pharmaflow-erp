import React, { useState, useEffect } from 'react';
import { Key, ShieldAlert } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function ResetPassword() {
  const [adminCompanies, set_adminCompanies] = useState([]);
  const [companyId, setCompanyId] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successEmail, setSuccessEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${API_BASE_URL}/api/v1/admin/companies`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
          set_adminCompanies(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch admin companies for reset password:', err);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessEmail('');

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const body = { companyId, newPassword };
      const email = targetEmail.trim();
      if (email) body.email = email;
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessEmail(data.data?.email || email || 'the company admin');
        setNewPassword('');
        setConfirmPassword('');
        setTargetEmail('');
        setCompanyId('');
      } else {
        setErrorMsg(data.message || 'Password reset failed.');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setErrorMsg('Network error while resetting password.');
    } finally {
      setLoading(false);
    }
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
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reset the password of a single user in a client company</div>
            </div>
          </div>
        </div>

        <div className="card-body">
          <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem', background: 'var(--warning-light)', color: 'var(--warning-dark)', borderRadius: 'var(--radius)', marginBottom: '1.5rem', fontSize: '0.82rem' }}>
            <ShieldAlert size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>Security Warning:</strong> This resets the password for a single user only. Leave the email blank to reset the company's primary admin, or enter a specific user's email to target that account. Verify the identity of the requester first.
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
              <label className="form-label">User Email <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <input
                type="email"
                className="form-input"
                placeholder="Leave blank to reset the company admin"
                value={targetEmail}
                onChange={e => setTargetEmail(e.target.value)}
              />
              <div className="form-hint">Enter a specific user's email to reset that account, or leave blank to reset the company's primary admin.</div>
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

            {errorMsg && (
              <div style={{ padding: '0.75rem', background: 'var(--danger-light)', color: 'var(--danger-dark)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', textAlign: 'center', fontWeight: 500 }}>
                {errorMsg}
              </div>
            )}

            {successEmail && (
              <div style={{ padding: '0.75rem', background: 'var(--success-light)', color: 'var(--success-dark)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', textAlign: 'center', fontWeight: 500 }}>
                Password successfully reset for <strong>{successEmail}</strong>.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => {setCompanyId(''); setTargetEmail(''); setNewPassword(''); setConfirmPassword('');}}>
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
