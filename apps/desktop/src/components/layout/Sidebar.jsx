import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, Truck, Building2, Tag, Grid3X3,
  ShoppingCart, ArrowLeftRight, Receipt, Wallet, BarChart3,
  Archive, Settings, Database, ChevronRight, Pill, BadgeIndianRupee,
  FileText, TrendingUp, LogOut, Menu, X, Layers,
} from 'lucide-react';

const navConfig = [
  {
    type: 'single',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    type: 'group',
    label: 'Masters',
    icon: Layers,
    children: [
      { label: 'Product Master', path: '/masters/products', icon: Pill },
      { label: 'Customer Master', path: '/masters/customers', icon: Users },
      { label: 'Supplier Master', path: '/masters/suppliers', icon: Truck },
      { label: 'Company Master', path: '/masters/companies', icon: Building2 },
      { label: 'Category', path: '/masters/categories', icon: Tag },
      { label: 'Rack Master', path: '/masters/racks', icon: Grid3X3 },
    ],
  },
  {
    type: 'group',
    label: 'Transactions',
    icon: ArrowLeftRight,
    children: [
      { label: 'Purchase', path: '/transactions/purchase', icon: ShoppingCart },
      { label: 'Purchase Return', path: '/transactions/purchase-return', icon: ArrowLeftRight },
      { label: 'Sales', path: '/transactions/sales', icon: BadgeIndianRupee },
      { label: 'Sales Return', path: '/transactions/sales-return', icon: ArrowLeftRight },
      { label: 'Receipts', path: '/transactions/receipts', icon: Receipt },
      { label: 'Payments', path: '/transactions/payments', icon: Wallet },
      { label: 'Stock Adjustment', path: '/transactions/stock-adjustment', icon: Package },
    ],
  },
  {
    type: 'group',
    label: 'Inventory',
    icon: Archive,
    children: [
      { label: 'Current Stock', path: '/inventory/current-stock', icon: Archive },
      { label: 'Batch Enquiry', path: '/inventory/batch-enquiry', icon: FileText },
      { label: 'Near Expiry', path: '/inventory/near-expiry', icon: Package },
      { label: 'Expired Stock', path: '/inventory/expired', icon: Package },
      { label: 'Dead Stock', path: '/inventory/dead-stock', icon: Package },
      { label: 'Low Stock', path: '/inventory/low-stock', icon: Package },
    ],
  },
  {
    type: 'group',
    label: 'Accounts',
    icon: BadgeIndianRupee,
    children: [
      { label: 'Customer Ledger', path: '/accounts/customer-ledger', icon: Users },
      { label: 'Supplier Ledger', path: '/accounts/supplier-ledger', icon: Truck },
      { label: 'Cash Book', path: '/accounts/cash-book', icon: Wallet },
      { label: 'Bank Book', path: '/accounts/bank-book', icon: Building2 },
      { label: 'Journal', path: '/accounts/journal', icon: FileText },
      { label: 'Outstanding', path: '/accounts/outstanding', icon: BadgeIndianRupee },
    ],
  },
  {
    type: 'group',
    label: 'Reports',
    icon: BarChart3,
    children: [
      { label: 'Sales Report', path: '/reports/sales', icon: TrendingUp },
      { label: 'Purchase Report', path: '/reports/purchase', icon: ShoppingCart },
      { label: 'Stock Report', path: '/reports/stock', icon: Archive },
      { label: 'GST Report', path: '/reports/gst', icon: FileText },
      { label: 'Customer Report', path: '/reports/customer', icon: Users },
      { label: 'Supplier Report', path: '/reports/supplier', icon: Truck },
      { label: 'Profit Report', path: '/reports/profit', icon: TrendingUp },
    ],
  },
  {
    type: 'single',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState(() => {
    // Auto-open the group that contains the active route
    const active = {};
    navConfig.forEach((item) => {
      if (item.type === 'group') {
        if (item.children.some((c) => location.pathname.startsWith(c.path))) {
          active[item.label] = true;
        }
      }
    });
    return active;
  });

  const toggleGroup = (label) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isGroupActive = (item) =>
    item.type === 'group' && item.children.some((c) => location.pathname.startsWith(c.path));

  return (
    <aside className={`app-sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Pill size={18} color="white" />
        </div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">Pharma ERP</span>
            <span className="sidebar-logo-sub">FY 2025-26</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navConfig.map((item) => {
          if (item.type === 'single') {
            return (
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
            );
          }

          const isOpen = openGroups[item.label];
          const isActive = isGroupActive(item);

          return (
            <div key={item.label} className="sidebar-group">
              <div
                className={`sidebar-group-header${isActive ? ' active' : ''}`}
                onClick={() => !collapsed && toggleGroup(item.label)}
                title={collapsed ? item.label : ''}
              >
                <span className="sidebar-group-icon">
                  <item.icon size={16} />
                </span>
                {!collapsed && (
                  <>
                    <span className="sidebar-group-label">{item.label}</span>
                    <ChevronRight
                      size={14}
                      className={`sidebar-group-chevron${isOpen ? ' open' : ''}`}
                    />
                  </>
                )}
              </div>

              {!collapsed && (
                <div className={`sidebar-group-items${isOpen ? ' open' : ''}`}>
                  {item.children.map((child) => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      className={({ isActive }) =>
                        `sidebar-item${isActive ? ' active' : ''}`
                      }
                    >
                      <span className="sidebar-item-dot" />
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div 
        className="sidebar-footer" 
        onClick={() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/profile';
          }
        }}
        style={{ cursor: 'pointer' }}
      >
        <div className="sidebar-footer-avatar">SM</div>
        {!collapsed && (
          <div className="sidebar-footer-info">
            <div className="sidebar-footer-name">Sharma Medicals</div>
            <div className="sidebar-footer-role">Admin</div>
          </div>
        )}
      </div>
    </aside>
  );
}
