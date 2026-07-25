import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Dashboard
import Dashboard from './pages/dashboard/Dashboard';

// Masters
import ProductMaster from './pages/masters/ProductMaster';
import CustomerMaster from './pages/masters/CustomerMaster';
import SupplierMaster from './pages/masters/SupplierMaster';
import CompanyMaster from './pages/masters/CompanyMaster';
import CategoryMaster from './pages/masters/CategoryMaster';
import RackMaster from './pages/masters/RackMaster';

// Transactions
import Purchase from './pages/transactions/Purchase';
import PurchaseReturn from './pages/transactions/PurchaseReturn';
import Sales from './pages/transactions/Sales';
import SalesReturn from './pages/transactions/SalesReturn';
import Receipts from './pages/transactions/Receipts';
import Payments from './pages/transactions/Payments';
import StockAdjustment from './pages/transactions/StockAdjustment';

// Inventory
import CurrentStock from './pages/inventory/CurrentStock';
import BatchEnquiry from './pages/inventory/BatchEnquiry';
import NearExpiry from './pages/inventory/NearExpiry';
import ExpiredStock from './pages/inventory/ExpiredStock';
import DeadStock from './pages/inventory/DeadStock';
import LowStock from './pages/inventory/LowStock';

// Accounts
import CustomerLedger from './pages/accounts/CustomerLedger';
import SupplierLedger from './pages/accounts/SupplierLedger';
import CashBook from './pages/accounts/CashBook';
import BankBook from './pages/accounts/BankBook';
import Journal from './pages/accounts/Journal';
import Outstanding from './pages/accounts/Outstanding';

// Reports
import SalesReport from './pages/reports/SalesReport';
import PurchaseReport from './pages/reports/PurchaseReport';
import StockReport from './pages/reports/StockReport';
import GSTReport from './pages/reports/GSTReport';
import CustomerReport from './pages/reports/CustomerReport';
import SupplierReport from './pages/reports/SupplierReport';
import ProfitReport from './pages/reports/ProfitReport';

// Settings, Profile
import Settings from './pages/settings/Settings';
import Profile from './pages/profile/Profile';

// Admin
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import CompanyManagement from './pages/admin/CompanyManagement';
import ResetPassword from './pages/admin/ResetPassword';
import ActivityLogs from './pages/admin/ActivityLogs';
import AdminSettings from './pages/admin/AdminSettings';
import AdminLayout from './components/layout/AdminLayout';

import './styles/index.css';

function WithLayout({ children }) {
  return <AppLayout>{children}</AppLayout>;
}

function WithAdminLayout({ children }) {
  return <AdminLayout>{children}</AdminLayout>;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin Portal */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<WithAdminLayout><AdminDashboard /></WithAdminLayout>} />
        <Route path="/admin/companies" element={<WithAdminLayout><CompanyManagement /></WithAdminLayout>} />
        <Route path="/admin/reset-password" element={<WithAdminLayout><ResetPassword /></WithAdminLayout>} />
        <Route path="/admin/activity-logs" element={<WithAdminLayout><ActivityLogs /></WithAdminLayout>} />
        <Route path="/admin/settings" element={<WithAdminLayout><AdminSettings /></WithAdminLayout>} />

        {/* ERP Routes */}
        <Route path="/dashboard" element={<WithLayout><Dashboard /></WithLayout>} />

        {/* Masters */}
        <Route path="/masters/products" element={<WithLayout><ProductMaster /></WithLayout>} />
        <Route path="/masters/customers" element={<WithLayout><CustomerMaster /></WithLayout>} />
        <Route path="/masters/suppliers" element={<WithLayout><SupplierMaster /></WithLayout>} />
        <Route path="/masters/companies" element={<WithLayout><CompanyMaster /></WithLayout>} />
        <Route path="/masters/categories" element={<WithLayout><CategoryMaster /></WithLayout>} />
        <Route path="/masters/racks" element={<WithLayout><RackMaster /></WithLayout>} />

        {/* Transactions */}
        <Route path="/transactions/purchase" element={<WithLayout><Purchase /></WithLayout>} />
        <Route path="/transactions/purchase-return" element={<WithLayout><PurchaseReturn /></WithLayout>} />
        <Route path="/transactions/sales" element={<WithLayout><Sales /></WithLayout>} />
        <Route path="/transactions/sales-return" element={<WithLayout><SalesReturn /></WithLayout>} />
        <Route path="/transactions/receipts" element={<WithLayout><Receipts /></WithLayout>} />
        <Route path="/transactions/payments" element={<WithLayout><Payments /></WithLayout>} />
        <Route path="/transactions/stock-adjustment" element={<WithLayout><StockAdjustment /></WithLayout>} />

        {/* Inventory */}
        <Route path="/inventory/current-stock" element={<WithLayout><CurrentStock /></WithLayout>} />
        <Route path="/inventory/batch-enquiry" element={<WithLayout><BatchEnquiry /></WithLayout>} />
        <Route path="/inventory/near-expiry" element={<WithLayout><NearExpiry /></WithLayout>} />
        <Route path="/inventory/expired" element={<WithLayout><ExpiredStock /></WithLayout>} />
        <Route path="/inventory/dead-stock" element={<WithLayout><DeadStock /></WithLayout>} />
        <Route path="/inventory/low-stock" element={<WithLayout><LowStock /></WithLayout>} />

        {/* Accounts */}
        <Route path="/accounts/customer-ledger" element={<WithLayout><CustomerLedger /></WithLayout>} />
        <Route path="/accounts/supplier-ledger" element={<WithLayout><SupplierLedger /></WithLayout>} />
        <Route path="/accounts/cash-book" element={<WithLayout><CashBook /></WithLayout>} />
        <Route path="/accounts/bank-book" element={<WithLayout><BankBook /></WithLayout>} />
        <Route path="/accounts/journal" element={<WithLayout><Journal /></WithLayout>} />
        <Route path="/accounts/outstanding" element={<WithLayout><Outstanding /></WithLayout>} />

        {/* Reports */}
        <Route path="/reports/sales" element={<WithLayout><SalesReport /></WithLayout>} />
        <Route path="/reports/purchase" element={<WithLayout><PurchaseReport /></WithLayout>} />
        <Route path="/reports/stock" element={<WithLayout><StockReport /></WithLayout>} />
        <Route path="/reports/gst" element={<WithLayout><GSTReport /></WithLayout>} />
        <Route path="/reports/customer" element={<WithLayout><CustomerReport /></WithLayout>} />
        <Route path="/reports/supplier" element={<WithLayout><SupplierReport /></WithLayout>} />
        <Route path="/reports/profit" element={<WithLayout><ProfitReport /></WithLayout>} />

        {/* Settings, Profile */}
        <Route path="/settings" element={<WithLayout><Settings /></WithLayout>} />
        <Route path="/profile" element={<WithLayout><Profile /></WithLayout>} />

        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </HashRouter>
  );
}
