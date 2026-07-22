import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Building2, Calendar, ArrowRight } from 'lucide-react';

const companies = [
  { id: 1, name: 'Sharma Medical Distributors Pvt. Ltd.', fy: 'FY 2025-26', city: 'Mumbai', invoices: 1240 },
  { id: 2, name: 'Sharma Medical Distributors Pvt. Ltd.', fy: 'FY 2024-25', city: 'Mumbai', invoices: 3450 },
];

export default function CompanySelect() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #F0F7FF 0%, #F1F5F9 100%)',
      padding: '2rem',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          width: 52, height: 52, background: 'var(--primary)',
          borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem', boxShadow: '0 8px 24px rgba(37,99,235,0.3)',
        }}>
          <Pill size={26} color="white" />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          Select Company
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Choose the company and financial year to proceed
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: 480 }}>
        {companies.map((c) => (
          <div
            key={c.id}
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '1.25rem',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '1rem',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{
                width: 44, height: 44, background: 'var(--primary-50)',
                borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Building2 size={20} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {c.name}
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={11} /> {c.fy}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {c.city}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {c.invoices.toLocaleString()} invoices
                  </span>
                </div>
              </div>
            </div>
            <ArrowRight size={18} color="var(--primary)" />
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/login')}
        className="btn btn-ghost"
        style={{ marginTop: '1.5rem', fontSize: '0.8rem' }}
      >
        ← Back to Login
      </button>
    </div>
  );
}
