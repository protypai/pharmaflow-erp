import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Key, Activity,
  Shield, Menu, Bell, LogOut
} from 'lucide-react';

const adminNavConfig = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Company Management', path: '/admin/companies', icon: Building2 },
  { label: 'Reset Password', path: '/admin/reset-password', icon: Key },
  { label: 'Activity Logs', path: '/admin/activity-logs', icon: Activity },
];

function AdminSidebar({ collapsed }) {
  return (
    <aside className={`app-sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" style={{ background: 'var(--purple)' }}>
          <Shield size={18} color="white" />
        </div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">Admin Portal</span>
            <span className="sidebar-logo-sub">Pharma ERP</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          {!collapsed && <div className="sidebar-section-label">Super Admin</div>}
          {adminNavConfig.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-single-item${isActive ? ' active' : ''}`
              }
              title={collapsed ? item.label : ''}
            >
              <span className="sidebar-group-icon">
                <item.icon size={16} />
              </span>
              {!collapsed && <span className="sidebar-group-label">{item.label}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-avatar" style={{ background: 'var(--purple)' }}>SA</div>
        {!collapsed && (
          <div className="sidebar-footer-info">
            <div className="sidebar-footer-name">System</div>
            <div className="sidebar-footer-role">Super Admin</div>
          </div>
        )}
      </div>
    </aside>
  );
}

function AdminHeader({ collapsed, onToggle, pathname }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const getPageTitle = () => {
    const route = adminNavConfig.find(r => pathname.startsWith(r.path));
    return route ? route.label : 'Admin Portal';
  };

  return (
    <header className="app-header">
      <button className="header-icon-btn" onClick={onToggle}>
        <Menu size={18} />
      </button>

      <div className="header-breadcrumb">
        <div className="header-title">{getPageTitle()}</div>
        <div className="header-sub">Super Admin Control Panel</div>
      </div>

      <div className="header-search" style={{ opacity: 0, pointerEvents: 'none' }}>
        {/* Placeholder to keep layout balanced */}
      </div>

      <div className="header-actions">
        <button className="header-icon-btn">
          <Bell size={17} />
          <span className="header-badge" style={{ background: 'var(--purple)' }} />
        </button>

        <div style={{ position: 'relative' }}>
          <div
            className="header-avatar"
            style={{ background: 'linear-gradient(135deg, var(--purple), #5B21B6)' }}
            onClick={() => setProfileOpen(!profileOpen)}
          >
            SA
          </div>
          {profileOpen && (
            <div style={{
              position: 'absolute', top: '40px', right: 0,
              background: 'white', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
              minWidth: '180px', zIndex: 200, overflow: 'hidden',
            }}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>Super Admin</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>System Manager</div>
              </div>
              <div style={{ padding: '0.25rem 0' }}>
                <div
                  onClick={async () => {
                    if (window.pharmaAPI?.auth) {
                      await window.pharmaAPI.auth.clearToken();
                    }
                    // Clear the super-admin session (the real admin credentials)…
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUser');
                    // …and any lingering ERP session tokens for good measure.
                    localStorage.removeItem('user');
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    setProfileOpen(false);
                    navigate('/admin/login');
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    padding: '0.5rem 1rem', cursor: 'pointer',
                    fontSize: '0.82rem', color: 'var(--danger)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-light)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={14} />
                  Logout
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="app-shell">
      <AdminSidebar collapsed={collapsed} />
      <main className={`app-main${collapsed ? ' collapsed' : ''}`}>
        <AdminHeader
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          pathname={location.pathname}
        />
        <div className="app-content">
          {children}
        </div>
      </main>
    </div>
  );
}
