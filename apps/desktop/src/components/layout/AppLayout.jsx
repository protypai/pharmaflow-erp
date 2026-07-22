import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className={`app-main${collapsed ? ' collapsed' : ''}`}>
        <Header
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
