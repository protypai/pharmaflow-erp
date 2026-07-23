import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, X, ChevronDown, LogOut, Settings, User, Pill, Users, Truck, Package, FileText } from 'lucide-react';

const pageTitles = {
  '/dashboard': { title: 'Dashboard', sub: 'Overview of today\'s business' },
  '/masters/products': { title: 'Product Master', sub: 'Manage medicines & batches' },
  '/masters/customers': { title: 'Customer Master', sub: 'Manage your customers' },
  '/masters/suppliers': { title: 'Supplier Master', sub: 'Manage your suppliers' },
  '/masters/companies': { title: 'Company Master', sub: 'Pharmaceutical manufacturers' },
  '/masters/categories': { title: 'Category Master', sub: 'Product categories' },
  '/masters/racks': { title: 'Rack Master', sub: 'Storage rack locations' },
  '/transactions/purchase': { title: 'Purchase Entry', sub: 'Record supplier invoices' },
  '/transactions/purchase-return': { title: 'Purchase Return', sub: 'Return goods to supplier' },
  '/transactions/sales': { title: 'Sales Invoice', sub: 'Create customer bills' },
  '/transactions/sales-return': { title: 'Sales Return', sub: 'Accept goods from customer' },
  '/transactions/receipts': { title: 'Receipts', sub: 'Record customer payments' },
  '/transactions/payments': { title: 'Payments', sub: 'Pay to suppliers' },
  '/transactions/stock-adjustment': { title: 'Stock Adjustment', sub: 'Physical count & corrections' },
  '/inventory/current-stock': { title: 'Current Stock', sub: 'Live stock position' },
  '/inventory/batch-enquiry': { title: 'Batch Enquiry', sub: 'Search by batch number' },
  '/inventory/near-expiry': { title: 'Near Expiry', sub: 'Medicines expiring soon' },
  '/inventory/expired': { title: 'Expired Stock', sub: 'Expired medicines' },
  '/inventory/dead-stock': { title: 'Dead Stock', sub: 'No movement for months' },
  '/inventory/low-stock': { title: 'Low Stock', sub: 'Below minimum level' },
  '/accounts/customer-ledger': { title: 'Customer Ledger', sub: 'Customer-wise accounts' },
  '/accounts/supplier-ledger': { title: 'Supplier Ledger', sub: 'Supplier-wise accounts' },
  '/accounts/cash-book': { title: 'Cash Book', sub: 'Cash transactions' },
  '/accounts/bank-book': { title: 'Bank Book', sub: 'Bank transactions' },
  '/accounts/journal': { title: 'Journal', sub: 'Accounting adjustments' },
  '/accounts/outstanding': { title: 'Outstanding', sub: 'Pending receivables & payables' },
  '/reports/sales': { title: 'Sales Report', sub: 'Sales analysis & trends' },
  '/reports/purchase': { title: 'Purchase Report', sub: 'Purchase analysis' },
  '/reports/stock': { title: 'Stock Report', sub: 'Inventory valuation' },
  '/reports/gst': { title: 'GST Report', sub: 'Tax summary for filing' },
  '/reports/customer': { title: 'Customer Report', sub: 'Customer-wise analysis' },
  '/reports/supplier': { title: 'Supplier Report', sub: 'Supplier-wise analysis' },
  '/reports/profit': { title: 'Profit Report', sub: 'Profitability analysis' },
  '/backup': { title: 'Backup & Restore', sub: 'Data backup management' },
  '/settings': { title: 'Settings', sub: 'Application configuration' },
  '/profile': { title: 'Company Profile', sub: 'Manage your company details' },
};



export default function Header({ collapsed, onToggle, pathname }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  const pageInfo = pageTitles[pathname] || { title: 'Pharma ERP', sub: '' };

  const [searchableData, setSearchableData] = useState([]);

  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        const prodRes = await window.pharmaAPI.db.query("SELECT id, name, generic_name FROM products");
        const custRes = await window.pharmaAPI.db.query("SELECT id, name, area FROM customers");
        const supRes = await window.pharmaAPI.db.query("SELECT id, name, city FROM suppliers");

        const data = [
          ...(prodRes?.data || []).map(p => ({ type: 'Medicine', icon: Pill, name: p.name, sub: p.generic_name, path: '/masters/products' })),
          ...(custRes?.data || []).map(c => ({ type: 'Customer', icon: Users, name: c.name, sub: c.area, path: '/masters/customers' })),
          ...(supRes?.data || []).map(s => ({ type: 'Supplier', icon: Truck, name: s.name, sub: s.city, path: '/masters/suppliers' })),
        ];
        setSearchableData(data);
      } catch (err) {
        console.error("Failed to load search data", err);
      }
    };
    fetchSearchData();
  }, []);

  const searchResults = searchQuery.length > 1
    ? searchableData.filter(d =>
        d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.sub && d.sub.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 8)
    : [];

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSearchSelect = (item) => {
    navigate(item.path);
    setSearchOpen(false);
    setSearchQuery('');
  };

  // Group results by type
  const grouped = searchResults.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {});

  return (
    <>
      <header className="app-header">
        {/* Collapse Toggle */}
        <button className="header-icon-btn" onClick={onToggle} id="sidebar-toggle">
          {collapsed ? <Menu size={18} /> : <Menu size={18} />}
        </button>

        {/* Page Title */}
        <div className="header-breadcrumb">
          <div className="header-title">{pageInfo.title}</div>
          {pageInfo.sub && <div className="header-sub">{pageInfo.sub}</div>}
        </div>

        {/* Global Search */}
        <div
          className="header-search"
          onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50); }}
          id="global-search-trigger"
        >
          <Search size={14} color="var(--text-muted)" />
          <span className="header-search-text">Search medicines, customers…</span>
          <span className="header-search-kbd">Ctrl K</span>
        </div>

        {/* Actions */}
        <div className="header-actions">
          <button className="header-icon-btn" id="notifications-btn">
            <Bell size={17} />
            <span className="header-badge" />
          </button>

          <div style={{ position: 'relative' }}>
            <div
              className="header-avatar"
              onClick={() => setProfileOpen(!profileOpen)}
              id="profile-avatar"
            >
              SM
            </div>
            {profileOpen && (
              <div style={{
                position: 'absolute', top: '40px', right: 0,
                background: 'white', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
                minWidth: '180px', zIndex: 200,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>Sharma Medicals</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>FY 2025-26 • Admin</div>
                </div>
                <div style={{ padding: '0.25rem 0' }}>
                  {[
                    { icon: User, label: 'Profile', path: '/profile' },
                    { icon: Settings, label: 'Settings', path: '/settings' },
                  ].map(({ icon: Icon, label, path }) => (
                    <div
                      key={label}
                      onClick={() => { if (path) navigate(path); setProfileOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.625rem',
                        padding: '0.5rem 1rem', cursor: 'pointer',
                        fontSize: '0.82rem', color: 'var(--text-primary)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--content-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Icon size={14} />
                      {label}
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.25rem', paddingTop: '0.25rem' }}>
                    <div
                      onClick={() => { navigate('/login'); setProfileOpen(false); }}
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
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      {searchOpen && (
        <div className="search-modal-overlay" onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
          <div className="search-modal" onClick={e => e.stopPropagation()}>
            <div className="search-modal-input">
              <Search size={18} color="var(--text-muted)" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search medicines, customers, suppliers, invoices…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                id="global-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="search-modal-results">
              {searchQuery.length < 2 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Type to search medicines, customers, suppliers…
                </div>
              )}
              {searchQuery.length >= 2 && Object.keys(grouped).length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  No results for "{searchQuery}"
                </div>
              )}
              {Object.entries(grouped).map(([type, items]) => (
                <div key={type} className="search-result-group">
                  <div className="search-result-label">{type}</div>
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="search-result-item"
                      onClick={() => handleSearchSelect(item)}
                    >
                      <div className="search-result-icon">
                        <item.icon size={14} />
                      </div>
                      <div>
                        <div className="search-result-name">{item.name}</div>
                        <div className="search-result-sub">{item.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{
              padding: '0.5rem 1rem', borderTop: '1px solid var(--border)',
              display: 'flex', gap: '1rem', fontSize: '0.68rem', color: 'var(--text-muted)',
            }}>
              <span>↑↓ Navigate</span>
              <span>↵ Open</span>
              <span>Esc Close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
