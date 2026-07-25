import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, User, Lock, Mail, Building, Phone, MapPin, ArrowRight, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function Register() {
  const [formData, setFormData] = useState({
    companyName: '',
    shortName: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    state: '',
    gstin: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.companyName || !formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields (Company Name, Full Name, Email, Password).');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMsg('Registration submitted! Your account is now pending Super Admin approval.');
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err) {
      console.error('Registration API error:', err);
      setError('Unable to connect to Cloud Backend. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
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
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 420, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
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
                Company Registration
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.2 }}>
              Get Started with<br />PharmaFlow ERP
            </h1>
            <p style={{ color: 'var(--sidebar-text)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Register your pharmacy or distribution company. Super Admin will review and approve your account.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel — Registration Form */}
      <div style={{
        width: '520px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'white',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.06)',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Create an Account
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Fill in your details to submit an approval request
            </p>
          </div>

          {successMsg ? (
            <div style={{
              background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px',
              padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '0.75rem'
            }}>
              <CheckCircle size={40} color="#16A34A" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#15803D' }}>Registration Submitted</h3>
              <p style={{ fontSize: '0.85rem', color: '#166534', lineHeight: 1.5 }}>
                {successMsg}
              </p>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/login')}
                style={{ marginTop: '0.5rem' }}
              >
                Return to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Building size={15} /></span>
                  <input
                    className="form-input"
                    type="text"
                    name="companyName"
                    placeholder="e.g. Apex Pharma Distributors"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Short Name</label>
                  <input
                    className="form-input"
                    type="text"
                    name="shortName"
                    placeholder="e.g. Apex Pharma"
                    value={formData.shortName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">GSTIN</label>
                  <input
                    className="form-input"
                    type="text"
                    name="gstin"
                    placeholder="27AAAAA0000A1Z5"
                    value={formData.gstin}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <div className="input-wrapper">
                  <span className="input-icon"><User size={15} /></span>
                  <input
                    className="form-input"
                    type="text"
                    name="name"
                    placeholder="Your Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Mail size={15} /></span>
                  <input
                    className="form-input"
                    type="email"
                    name="email"
                    placeholder="admin@yourpharmacy.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password *</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Lock size={15} /></span>
                  <input
                    className="form-input"
                    type="password"
                    name="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Phone</label>
                  <div className="input-wrapper">
                    <span className="input-icon"><Phone size={15} /></span>
                    <input
                      className="form-input"
                      type="text"
                      name="phone"
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">City</label>
                  <div className="input-wrapper">
                    <span className="input-icon"><MapPin size={15} /></span>
                    <input
                      className="form-input"
                      type="text"
                      name="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>
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
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
              >
                {loading ? 'Submitting Registration...' : (
                  <>
                    Submit for Approval <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <a
                  href="/login"
                  style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}
                  onClick={(e) => { e.preventDefault(); navigate('/login'); }}
                >
                  Already registered? Sign In →
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
