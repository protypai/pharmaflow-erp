import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, User, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) { setError('Please enter username and password.'); return; }
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.data) {
        localStorage.setItem('adminToken', data.data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.data.admin));
        navigate('/admin/dashboard');
      } else {
        setError(data.message || 'Invalid Super Admin credentials.');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      // Fallback for dev mode
      if (username === 'admin@pharmaflow.in' && password === 'changeme_strong_password') {
        localStorage.setItem('adminToken', 'dev-token');
        navigate('/admin/dashboard');
      } else {
        setError('Failed to connect to Cloud Backend API.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--content-bg)',
    }}>
      {/* Left Panel - Darker for Admin */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: '#020617', // Very dark slate
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(124,58,237,0.15) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(124,58,237,0.1) 0%, transparent 40%)`,
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 420, width: '100%' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
            <div style={{
              width: 52, height: 52,
              background: 'var(--purple)',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
            }}>
              <Shield size={26} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', lineHeight: 1.1 }}>
                Super Admin
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: 2 }}>
                Platform Management
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.2 }}>
              Master Control Panel
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Manage all client companies, backups, system settings, and monitor platform activity in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div style={{
        width: '480px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'white',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.06)',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
              Admin Login
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Secure access for platform administrators
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="input-wrapper">
                <span className="input-icon"><User size={15} /></span>
                <input
                  className="form-input"
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <span className="input-icon"><Lock size={15} /></span>
                <input
                  className="form-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '0.625rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'var(--danger-light)', border: '1px solid #FECACA',
                borderRadius: 'var(--radius-sm)', padding: '0.625rem 0.875rem',
                fontSize: '0.8rem', color: 'var(--danger)',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem', background: 'var(--purple)', borderColor: 'var(--purple)' }}
            >
              {loading ? 'Authenticating…' : (
                <>
                  Enter Portal <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* User Link */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <a
              href="/login"
              style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}
              onClick={(e) => { e.preventDefault(); navigate('/login'); }}
            >
              ← Customer ERP Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
