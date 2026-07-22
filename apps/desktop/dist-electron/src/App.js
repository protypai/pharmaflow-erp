"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = App;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const AppLayout_1 = __importDefault(require("./components/layout/AppLayout"));
// Auth
const Login_1 = __importDefault(require("./pages/auth/Login"));
// Dashboard
const Dashboard_1 = __importDefault(require("./pages/dashboard/Dashboard"));
// Masters
const ProductMaster_1 = __importDefault(require("./pages/masters/ProductMaster"));
const CustomerMaster_1 = __importDefault(require("./pages/masters/CustomerMaster"));
const SupplierMaster_1 = __importDefault(require("./pages/masters/SupplierMaster"));
const CompanyMaster_1 = __importDefault(require("./pages/masters/CompanyMaster"));
const CategoryMaster_1 = __importDefault(require("./pages/masters/CategoryMaster"));
const RackMaster_1 = __importDefault(require("./pages/masters/RackMaster"));
// Transactions
const Purchase_1 = __importDefault(require("./pages/transactions/Purchase"));
const PurchaseReturn_1 = __importDefault(require("./pages/transactions/PurchaseReturn"));
const Sales_1 = __importDefault(require("./pages/transactions/Sales"));
const SalesReturn_1 = __importDefault(require("./pages/transactions/SalesReturn"));
const Receipts_1 = __importDefault(require("./pages/transactions/Receipts"));
const Payments_1 = __importDefault(require("./pages/transactions/Payments"));
const StockAdjustment_1 = __importDefault(require("./pages/transactions/StockAdjustment"));
// Inventory
const CurrentStock_1 = __importDefault(require("./pages/inventory/CurrentStock"));
const BatchEnquiry_1 = __importDefault(require("./pages/inventory/BatchEnquiry"));
const NearExpiry_1 = __importDefault(require("./pages/inventory/NearExpiry"));
const ExpiredStock_1 = __importDefault(require("./pages/inventory/ExpiredStock"));
const DeadStock_1 = __importDefault(require("./pages/inventory/DeadStock"));
const LowStock_1 = __importDefault(require("./pages/inventory/LowStock"));
// Accounts
const CustomerLedger_1 = __importDefault(require("./pages/accounts/CustomerLedger"));
const SupplierLedger_1 = __importDefault(require("./pages/accounts/SupplierLedger"));
const CashBook_1 = __importDefault(require("./pages/accounts/CashBook"));
const BankBook_1 = __importDefault(require("./pages/accounts/BankBook"));
const Journal_1 = __importDefault(require("./pages/accounts/Journal"));
const Outstanding_1 = __importDefault(require("./pages/accounts/Outstanding"));
// Reports
const SalesReport_1 = __importDefault(require("./pages/reports/SalesReport"));
const PurchaseReport_1 = __importDefault(require("./pages/reports/PurchaseReport"));
const StockReport_1 = __importDefault(require("./pages/reports/StockReport"));
const GSTReport_1 = __importDefault(require("./pages/reports/GSTReport"));
const CustomerReport_1 = __importDefault(require("./pages/reports/CustomerReport"));
const SupplierReport_1 = __importDefault(require("./pages/reports/SupplierReport"));
const ProfitReport_1 = __importDefault(require("./pages/reports/ProfitReport"));
// Settings, Profile
const Settings_1 = __importDefault(require("./pages/settings/Settings"));
const Profile_1 = __importDefault(require("./pages/profile/Profile"));
// Admin
const AdminLogin_1 = __importDefault(require("./pages/admin/AdminLogin"));
const AdminDashboard_1 = __importDefault(require("./pages/admin/AdminDashboard"));
const CompanyManagement_1 = __importDefault(require("./pages/admin/CompanyManagement"));
const ResetPassword_1 = __importDefault(require("./pages/admin/ResetPassword"));
const ActivityLogs_1 = __importDefault(require("./pages/admin/ActivityLogs"));
const AdminSettings_1 = __importDefault(require("./pages/admin/AdminSettings"));
const AdminLayout_1 = __importDefault(require("./components/layout/AdminLayout"));
require("./styles/index.css");
function WithLayout({ children }) {
    return (0, jsx_runtime_1.jsx)(AppLayout_1.default, { children: children });
}
function WithAdminLayout({ children }) {
    return (0, jsx_runtime_1.jsx)(AdminLayout_1.default, { children: children });
}
function App() {
    return ((0, jsx_runtime_1.jsx)(react_router_dom_1.BrowserRouter, { children: (0, jsx_runtime_1.jsxs)(react_router_dom_1.Routes, { children: [(0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/login", element: (0, jsx_runtime_1.jsx)(Login_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/admin/login", element: (0, jsx_runtime_1.jsx)(AdminLogin_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/admin/dashboard", element: (0, jsx_runtime_1.jsx)(WithAdminLayout, { children: (0, jsx_runtime_1.jsx)(AdminDashboard_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/admin/companies", element: (0, jsx_runtime_1.jsx)(WithAdminLayout, { children: (0, jsx_runtime_1.jsx)(CompanyManagement_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/admin/reset-password", element: (0, jsx_runtime_1.jsx)(WithAdminLayout, { children: (0, jsx_runtime_1.jsx)(ResetPassword_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/admin/activity-logs", element: (0, jsx_runtime_1.jsx)(WithAdminLayout, { children: (0, jsx_runtime_1.jsx)(ActivityLogs_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/admin/settings", element: (0, jsx_runtime_1.jsx)(WithAdminLayout, { children: (0, jsx_runtime_1.jsx)(AdminSettings_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/dashboard", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(Dashboard_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/masters/products", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(ProductMaster_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/masters/customers", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(CustomerMaster_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/masters/suppliers", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(SupplierMaster_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/masters/companies", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(CompanyMaster_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/masters/categories", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(CategoryMaster_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/masters/racks", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(RackMaster_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/transactions/purchase", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(Purchase_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/transactions/purchase-return", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(PurchaseReturn_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/transactions/sales", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(Sales_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/transactions/sales-return", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(SalesReturn_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/transactions/receipts", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(Receipts_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/transactions/payments", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(Payments_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/transactions/stock-adjustment", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(StockAdjustment_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/inventory/current-stock", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(CurrentStock_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/inventory/batch-enquiry", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(BatchEnquiry_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/inventory/near-expiry", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(NearExpiry_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/inventory/expired", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(ExpiredStock_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/inventory/dead-stock", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(DeadStock_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/inventory/low-stock", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(LowStock_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/accounts/customer-ledger", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(CustomerLedger_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/accounts/supplier-ledger", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(SupplierLedger_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/accounts/cash-book", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(CashBook_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/accounts/bank-book", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(BankBook_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/accounts/journal", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(Journal_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/accounts/outstanding", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(Outstanding_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/reports/sales", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(SalesReport_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/reports/purchase", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(PurchaseReport_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/reports/stock", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(StockReport_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/reports/gst", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(GSTReport_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/reports/customer", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(CustomerReport_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/reports/supplier", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(SupplierReport_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/reports/profit", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(ProfitReport_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/settings", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(Settings_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/profile", element: (0, jsx_runtime_1.jsx)(WithLayout, { children: (0, jsx_runtime_1.jsx)(Profile_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/", element: (0, jsx_runtime_1.jsx)(react_router_dom_1.Navigate, { to: "/login", replace: true }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/admin", element: (0, jsx_runtime_1.jsx)(react_router_dom_1.Navigate, { to: "/admin/login", replace: true }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "*", element: (0, jsx_runtime_1.jsx)(react_router_dom_1.Navigate, { to: "/dashboard", replace: true }) })] }) }));
}
