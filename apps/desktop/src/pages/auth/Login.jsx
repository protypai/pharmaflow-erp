import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Eye, EyeOff, Lock, User, ArrowRight, Shield } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) { setError('Please enter username and password.'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/dashboard');
    }, 900);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #F0F7FF 0%, #EFF6FF 40%, #F1F5F9 100%)',
    }}>
      {/* Left Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'var(--sidebar-bg)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(37,99,235,0.15) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(37,99,235,0.1) 0%, transparent 40%),
                            radial-gradient(circle at 60% 80%, rgba(124,58,237,0.08) 0%, transparent 40%)`,
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 420, width: '100%' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
            <div style={{
              width: 52, height: 52,
              background: 'var(--primary)',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
            }}>
              <Pill size={26} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', lineHeight: 1.1 }}>
                Pharma ERP
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--sidebar-text)', marginTop: 2 }}>
                Pharmaceutical Distribution System
              </div>
            </div>
          </div>

          {/* Taglines */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.2 }}>
              Modern ERP for<br />Pharma Distributors
            </h1>
            <p style={{ color: 'var(--sidebar-text)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Replace your old software with a faster, smarter, and more modern solution. Same features. Better experience.
            </p>
          </div>

          {/* Feature Pills */}
          {['Purchase & Sales Management', 'Batch & Expiry Tracking', 'GST-Ready Reports', 'Customer Outstanding'].map(f => (
            <div key={f} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              marginBottom: '0.5rem',
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: 'rgba(37,99,235,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#60A5FA' }} />
              </div>
              <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>{f}</span>
            </div>
          ))}
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
              Welcome back
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Sign in to your Pharma ERP account
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            {/* Username */}
            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="input-wrapper">
                <span className="input-icon"><User size={15} /></span>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  id="login-username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <span className="input-icon"><Lock size={15} /></span>
                <input
                  className="form-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  id="login-password"
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

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="remember-me"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                style={{ width: 14, height: 14, accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <label htmlFor="remember-me" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Remember me on this device
              </label>
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

            {/* Login Button */}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              id="login-submit"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: 'white', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Demo credentials hint */}
            <div style={{
              background: 'var(--primary-50)', border: '1px solid var(--primary-light)',
              borderRadius: 'var(--radius-sm)', padding: '0.625rem 0.875rem',
              fontSize: '0.75rem', color: 'var(--primary-darker)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <Shield size={13} />
              <span><strong>Demo:</strong> Use any username & password to login</span>
            </div>
          </form>

          {/* Admin Link */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <a
              href="/admin/login"
              style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}
              onClick={(e) => { e.preventDefault(); navigate('/admin/login'); }}
            >
              Super Admin Portal →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
