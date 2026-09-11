import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, Users, Package, AlertTriangle, IndianRupee, 
  ArrowUpRight, ArrowDownRight, Clock, FileText, Activity,
  ShoppingCart, Receipt, Wallet, BadgeIndianRupee, Building2,
  XCircle, ShieldAlert, Plus, ExternalLink, RefreshCw, Eye, X, Filter
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeAlertTab, setActiveAlertTab] = useState('lowStock'); // 'lowStock' | 'expiry'
  const [activeTxTab, setActiveTxTab] = useState('sales'); // 'sales' | 'purchases' | 'collections' | 'payments'
  const [selectedTx, setSelectedTx] = useState(null); // Modal item preview
  const [todayLists, setTodayLists] = useState({ sales: [], purchases: [], collections: [], payments: [] });

  const [stats, setStats] = useState({
    todaySales: { amount: 0, count: 0 },
    todayPurchase: { amount: 0, count: 0 },
    todayCollections: { amount: 0, count: 0 },
    todayPayments: { amount: 0, count: 0 },
    cashBalance: 0,
    bankBalance: 0,
    outstandingReceivable: 0,
    outstandingPayable: 0,
    nearExpiryCount: 0,
    expiredCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });

  const [lowStockItems, setLowStockItems] = useState([]);
  const [expiryItems, setExpiryItems] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [outstandingAging, setOutstandingAging] = useState([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. Core Financial Queries
      const salesRes = await window.pharmaAPI.db.query(`SELECT COUNT(*) as count, SUM(net_amount) as total FROM sales WHERE date LIKE '${today}%'`);
      const purchRes = await window.pharmaAPI.db.query(`SELECT COUNT(*) as count, SUM(net_amount) as total FROM purchases WHERE invoice_date LIKE '${today}%'`);
      const collRes = await window.pharmaAPI.db.query(`SELECT COUNT(*) as count, SUM(amount) as total FROM receipts WHERE date LIKE '${today}%'`);
      const payRes = await window.pharmaAPI.db.query(`SELECT COUNT(*) as count, SUM(amount) as total FROM payments WHERE date LIKE '${today}%'`);

      const salesListRes = await window.pharmaAPI.db.query(`SELECT s.*, c.name as customer_name FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.date LIKE '${today}%' ORDER BY s.created_at DESC`);
      const purchListRes = await window.pharmaAPI.db.query(`SELECT p.*, sup.name as supplier_name FROM purchases p LEFT JOIN suppliers sup ON p.supplier_id = sup.id WHERE p.invoice_date LIKE '${today}%' ORDER BY p.created_at DESC`);
      const collListRes = await window.pharmaAPI.db.query(`SELECT r.*, c.name as customer_name FROM receipts r LEFT JOIN customers c ON r.customer_id = c.id WHERE r.date LIKE '${today}%' ORDER BY r.created_at DESC`);
      const payListRes = await window.pharmaAPI.db.query(`SELECT p.*, sup.name as supplier_name FROM payments p LEFT JOIN suppliers sup ON p.supplier_id = sup.id WHERE p.date LIKE '${today}%' ORDER BY p.created_at DESC`);

      const recRes = await window.pharmaAPI.db.query(`
        SELECT 
          COALESCE((SELECT SUM(opening_balance) FROM customers), 0) +
          COALESCE((SELECT SUM(net_amount) FROM sales), 0) -
          COALESCE((SELECT SUM(net_amount) FROM sale_returns), 0) -
          COALESCE((SELECT SUM(amount) FROM receipts), 0) as total
      `);

      const paybleRes = await window.pharmaAPI.db.query(`
        SELECT 
          COALESCE((SELECT SUM(opening_balance) FROM suppliers), 0) +
          COALESCE((SELECT SUM(net_amount) FROM purchases), 0) -
          COALESCE((SELECT SUM(net_amount) FROM purchase_returns), 0) -
          COALESCE((SELECT SUM(amount) FROM payments), 0) as total
      `);

      const cashRes = await window.pharmaAPI.db.query(`
        SELECT 
          COALESCE((SELECT SUM(amount) FROM receipts WHERE payment_mode = 'cash'), 0) -
          COALESCE((SELECT SUM(amount) FROM payments WHERE payment_mode = 'cash'), 0) as total
      `);

      const bankRes = await window.pharmaAPI.db.query(`
        SELECT 
          COALESCE((SELECT SUM(amount) FROM receipts WHERE payment_mode != 'cash'), 0) -
          COALESCE((SELECT SUM(amount) FROM payments WHERE payment_mode != 'cash'), 0) as total
      `);

      // 2. Actionable Low-Stock Items Query (Detailed specific products)
      const lowStockRes = await window.pharmaAPI.db.query(`
        SELECT 
          p.id, p.code, p.name, p.min_stock, p.packing,
          COALESCE(r.code, 'Unassigned') as rack_code,
          COALESCE(m.name, 'N/A') as manufacturer_name,
          COALESCE(SUM(b.current_qty), 0) as total_qty
        FROM products p
        LEFT JOIN racks r ON p.rack_id = r.id
        LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
        LEFT JOIN batches b ON p.id = b.product_id
        GROUP BY p.id
        HAVING total_qty <= COALESCE(NULLIF(p.min_stock, 0), 10)
        ORDER BY total_qty ASC, p.name ASC
        LIMIT 15
      `);
      const lowStockData = lowStockRes?.data || [];

      // 3. Actionable Expiry Watchlist Query (Detailed specific batches)
      const batchRes = await window.pharmaAPI.db.query(`
        SELECT 
          b.id, b.batch_no, b.expiry_date, b.current_qty, b.mrp, b.ptr, b.product_id,
          p.name as product_name, p.code as product_code
        FROM batches b
        JOIN products p ON b.product_id = p.id
        WHERE b.current_qty > 0 AND b.expiry_date IS NOT NULL
      `);
      const allBatches = batchRes?.data || [];
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const formattedExpiry = [];
      let nExpCount = 0;
      let expCount = 0;

      allBatches.forEach(b => {
        let expDate;
        if (b.expiry_date.includes('/') && b.expiry_date.length === 5) {
          const [m, y] = b.expiry_date.split('/');
          expDate = new Date(2000 + parseInt(y), parseInt(m) - 1, 1);
        } else {
          expDate = new Date(b.expiry_date);
        }
        if (isNaN(expDate.getTime())) return;

        const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 180) { // 6 Months threshold
          if (daysLeft <= 0) expCount++;
          else nExpCount++;

          formattedExpiry.push({
            id: b.id,
            productId: b.product_id,
            productName: b.product_name,
            batchNo: b.batch_no,
            expiryDate: b.expiry_date,
            qty: b.current_qty,
            mrp: b.mrp,
            ptr: b.ptr,
            daysLeft,
            status: daysLeft <= 0 ? 'expired' : daysLeft <= 30 ? 'critical' : daysLeft <= 90 ? 'warning' : 'info'
          });
        }
      });
      formattedExpiry.sort((a, b) => a.daysLeft - b.daysLeft);

      // 4. Recent Sales & Purchases (Detailed Recent Transactions)
      const recentSalesRes = await window.pharmaAPI.db.query(`
        SELECT s.id, s.invoice_no, s.date, s.net_amount, s.payment_mode, s.status, s.created_at,
               c.name as customer_name
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        ORDER BY s.created_at DESC
        LIMIT 8
      `);

      const recentPurchasesRes = await window.pharmaAPI.db.query(`
        SELECT p.id, p.invoice_no, p.entry_no, p.invoice_date, p.net_amount, p.status, p.created_at,
               sup.name as supplier_name
        FROM purchases p
        LEFT JOIN suppliers sup ON p.supplier_id = sup.id
        ORDER BY p.created_at DESC
        LIMIT 8
      `);

      // 5. Customer Aging Model
      const recTotal = recRes?.data?.[0]?.total || 0;
      let aging = [];
      try {
        const agingRes = await window.pharmaAPI.db.query(`
          SELECT 
            SUM(CASE WHEN CAST(julianday('now') - julianday(date) AS INTEGER) <= 30 THEN net_amount ELSE 0 END) as b30,
            SUM(CASE WHEN CAST(julianday('now') - julianday(date) AS INTEGER) BETWEEN 31 AND 60 THEN net_amount ELSE 0 END) as b60,
            SUM(CASE WHEN CAST(julianday('now') - julianday(date) AS INTEGER) BETWEEN 61 AND 90 THEN net_amount ELSE 0 END) as b90,
            SUM(CASE WHEN CAST(julianday('now') - julianday(date) AS INTEGER) > 90 THEN net_amount ELSE 0 END) as b90plus
          FROM sales
          WHERE payment_mode = 'credit'
        `);
        const row = agingRes?.data?.[0] || {};
        const b30 = row.b30 || 0;
        const b60 = row.b60 || 0;
        const b90 = row.b90 || 0;
        const b90p = row.b90plus || 0;
        const totalCreditSales = b30 + b60 + b90 + b90p;

        if (totalCreditSales > 0 && recTotal > 0) {
          aging = [
            { label: '0-30 Days', value: (b30 / totalCreditSales) * recTotal, color: '#10B981' },
            { label: '31-60 Days', value: (b60 / totalCreditSales) * recTotal, color: '#3B82F6' },
            { label: '61-90 Days', value: (b90 / totalCreditSales) * recTotal, color: '#F59E0B' },
            { label: '> 90 Days', value: (b90p / totalCreditSales) * recTotal, color: '#EF4444' }
          ];
        } else {
          aging = [
            { label: '0-30 Days', value: recTotal, color: '#10B981' },
            { label: '31-60 Days', value: 0, color: '#3B82F6' },
            { label: '61-90 Days', value: 0, color: '#F59E0B' },
            { label: '> 90 Days', value: 0, color: '#EF4444' }
          ];
        }
      } catch (e) {
        console.error("Aging error", e);
      }

      const sales = salesRes?.data || [];
      const purch = purchRes?.data || [];
      const coll = collRes?.data || [];
      const paym = payRes?.data || [];

      setStats({
        todaySales: { amount: sales[0]?.total || 0, count: sales[0]?.count || 0 },
        todayPurchase: { amount: purch[0]?.total || 0, count: purch[0]?.count || 0 },
        todayCollections: { amount: coll[0]?.total || 0, count: coll[0]?.count || 0 },
        todayPayments: { amount: paym[0]?.total || 0, count: paym[0]?.count || 0 },
        outstandingReceivable: recTotal,
        outstandingPayable: paybleRes?.data?.[0]?.total || 0,
        cashBalance: cashRes?.data?.[0]?.total || 0,
        bankBalance: bankRes?.data?.[0]?.total || 0,
        nearExpiryCount: nExpCount,
        expiredCount: expCount,
        lowStockCount: lowStockData.filter(i => i.total_qty > 0).length,
        outOfStockCount: lowStockData.filter(i => i.total_qty <= 0).length,
      });

      setTodayLists({
        sales: salesListRes?.data || [],
        purchases: purchListRes?.data || [],
        collections: collListRes?.data || [],
        payments: payListRes?.data || []
      });

      setLowStockItems(lowStockData);
      setExpiryItems(formattedExpiry.slice(0, 15));
      setRecentSales(recentSalesRes?.data || []);
      setRecentPurchases(recentPurchasesRes?.data || []);
      setOutstandingAging(aging);

    } catch (err) {
      console.error('Failed to load Dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh dashboard when user switches back to the app window or navigates back
    const handleFocus = () => {
      fetchDashboardData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const formatCurr = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const openTxDetails = async (type, id) => {
    try {
      if (type === 'sale') {
        const saleRes = await window.pharmaAPI.db.query(`
          SELECT s.*, c.name as customer_name, c.phone as customer_phone, c.gstin as customer_gstin
          FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
          WHERE s.id = '${id}'
        `);
        const itemsRes = await window.pharmaAPI.db.query(`
          SELECT si.*, p.name as product_name, b.batch_no
          FROM sale_items si
          LEFT JOIN products p ON si.product_id = p.id
          LEFT JOIN batches b ON si.batch_id = b.id
          WHERE si.sale_id = '${id}'
        `);
        if (saleRes?.data?.[0]) {
          setSelectedTx({
            type: 'Sale Invoice',
            header: saleRes.data[0],
            items: itemsRes?.data || []
          });
        }
      } else {
        const purchRes = await window.pharmaAPI.db.query(`
          SELECT p.*, sup.name as supplier_name, sup.phone as supplier_phone, sup.gstin as supplier_gstin
          FROM purchases p LEFT JOIN suppliers sup ON p.supplier_id = sup.id
          WHERE p.id = '${id}'
        `);
        const itemsRes = await window.pharmaAPI.db.query(`
          SELECT pi.*, pr.name as product_name, b.batch_no
          FROM purchase_items pi
          LEFT JOIN products pr ON pi.product_id = pr.id
          LEFT JOIN batches b ON pi.batch_id = b.id
          WHERE pi.purchase_id = '${id}'
        `);
        if (purchRes?.data?.[0]) {
          setSelectedTx({
            type: 'Purchase Bill',
            header: purchRes.data[0],
            items: itemsRes?.data || []
          });
        }
      }
    } catch (err) {
      console.error("Failed to load invoice modal details", err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2.5rem' }}>
      
      {/* ─── QUICK ACTION TOOLBAR ─── */}
      <div style={{ 
        display: 'flex', 
        justify: 'space-between', 
        alignItems: 'center', 
        background: 'var(--card-bg)', 
        padding: '0.85rem 1.25rem', 
        borderRadius: 'var(--radius-lg)', 
        border: '1px solid var(--border-color)',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={20} color="var(--primary)" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Command Center
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
            onClick={() => navigate('/transactions/sales')}
          >
            <Plus size={16} /> New Sale <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>(F2)</span>
          </button>

          <button 
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
            onClick={() => navigate('/transactions/purchase')}
          >
            <ShoppingCart size={16} /> New Purchase <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>(F3)</span>
          </button>

          <button 
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', border: '1px solid var(--border-color)' }}
            onClick={() => navigate('/transactions/stock-adjustment')}
          >
            <Package size={16} /> Stock Adjust
          </button>

          <button 
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', border: '1px solid var(--border-color)' }}
            onClick={() => navigate('/masters/products')}
          >
            <Plus size={16} /> Add Product
          </button>

          <button 
            className="btn btn-ghost btn-sm" 
            title="Refresh Data"
            onClick={fetchDashboardData}
            style={{ padding: '0.4rem 0.6rem' }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* ─── SECTION 1: FINANCIAL OVERVIEW SUMMARY ─── */}
      <div>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Financial Overview
        </h3>
        <div className="kpi-grid">
          <div className="kpi-card blue">
            <div className="kpi-label">Today's Sales</div>
            <div className="kpi-value">{formatCurr(stats.todaySales.amount)}</div>
            <div className="kpi-sub">{stats.todaySales.count} Invoices Billed</div>
            <TrendingUp size={56} className="kpi-icon" color="var(--primary)" />
          </div>

          <div className="kpi-card purple">
            <div className="kpi-label">Today's Purchase</div>
            <div className="kpi-value">{formatCurr(stats.todayPurchase.amount)}</div>
            <div className="kpi-sub">{stats.todayPurchase.count} Bills Entered</div>
            <ShoppingCart size={56} className="kpi-icon" color="var(--purple)" />
          </div>

          <div className="kpi-card green">
            <div className="kpi-label">Collections & Payments</div>
            <div className="kpi-value" style={{ fontSize: '1.25rem' }}>
              <span style={{ color: 'var(--success)' }}>+{formatCurr(stats.todayCollections.amount)}</span>
            </div>
            <div className="kpi-sub">
              Paid: <span style={{ color: 'var(--warning)', fontWeight: 600 }}>-{formatCurr(stats.todayPayments.amount)}</span>
            </div>
            <Receipt size={56} className="kpi-icon" color="var(--success)" />
          </div>

          <div className="kpi-card teal">
            <div className="kpi-label">Cash & Bank Liquidity</div>
            <div className="kpi-value" style={{ fontSize: '1.2rem' }}>
              Cash: {formatCurr(stats.cashBalance)}
            </div>
            <div className="kpi-sub">
              Bank: <span style={{ fontWeight: 600, color: 'var(--info)' }}>{formatCurr(stats.bankBalance)}</span>
            </div>
            <Building2 size={56} className="kpi-icon" color="var(--info)" />
          </div>
        </div>

        <div className="kpi-grid" style={{ marginTop: '-0.5rem' }}>
          <div className="kpi-card green" style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="kpi-label">Receivables (To Collect)</div>
                <div className="kpi-value">{formatCurr(stats.outstandingReceivable)}</div>
                <div className="kpi-sub">Customer Credit Balance</div>
              </div>
              <button 
                className="btn btn-ghost btn-sm" 
                style={{ color: 'var(--success)', border: '1px solid var(--success)' }}
                onClick={() => navigate('/accounts/outstanding')}
              >
                View Ledger →
              </button>
            </div>
          </div>

          <div className="kpi-card red" style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="kpi-label">Payables (To Pay)</div>
                <div className="kpi-value">{formatCurr(stats.outstandingPayable)}</div>
                <div className="kpi-sub">Supplier Credit Balance</div>
              </div>
              <button 
                className="btn btn-ghost btn-sm" 
                style={{ color: 'var(--danger)', border: '1px solid var(--danger)' }}
                onClick={() => navigate('/accounts/outstanding')}
              >
                View Ledger →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: ACTION REQUIRED CENTER (TABBED INTERACTIVE TABLES) ─── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', background: 'var(--content-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} color="var(--warning)" /> Inventory Action Items
            </h3>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--card-bg)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <button
                className={`btn btn-sm ${activeAlertTab === 'lowStock' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveAlertTab('lowStock')}
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
              >
                Low Stock Products ({lowStockItems.length})
              </button>
              <button
                className={`btn btn-sm ${activeAlertTab === 'expiry' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveAlertTab('expiry')}
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
              >
                Expiry Watchlist ({expiryItems.length})
              </button>
            </div>
          </div>

          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(activeAlertTab === 'lowStock' ? '/inventory/low-stock' : '/inventory/near-expiry')}
          >
            Open Full Report <ExternalLink size={14} />
          </button>
        </div>

        <div className="card-body no-pad" style={{ maxHeight: '360px', overflowY: 'auto' }}>
          {/* TAB 1: LOW STOCK PRODUCTS DETAIL TABLE */}
          {activeAlertTab === 'lowStock' && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Code</th>
                  <th>Medicine Name</th>
                  <th>Rack / Shelf</th>
                  <th>Min Stock</th>
                  <th>Current Stock</th>
                  <th>Manufacturer</th>
                  <th style={{ textAlign: 'right' }}>Quick Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      🎉 No low stock or out-of-stock products! All inventory levels healthy.
                    </td>
                  </tr>
                ) : (
                  lowStockItems.map((item) => (
                    <tr key={item.id}>
                      <td><span className="badge font-mono">{item.code}</span></td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</td>
                      <td><span className="badge badge-secondary">{item.rack_code}</span></td>
                      <td>{item.min_stock || 10} strips</td>
                      <td>
                        <span className={`badge ${item.total_qty <= 0 ? 'badge-danger' : 'badge-warning'}`}>
                          {item.total_qty <= 0 ? 'Out of Stock (0)' : `${item.total_qty} strips left`}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.manufacturer_name}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                          onClick={() => navigate('/transactions/purchase', { state: { autoFillItem: item } })}
                        >
                          <ShoppingCart size={12} /> Reorder
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TAB 2: EXPIRY WATCHLIST DETAIL TABLE */}
          {activeAlertTab === 'expiry' && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Batch Number</th>
                  <th>Expiry Date</th>
                  <th>Stock Qty</th>
                  <th>Days Remaining</th>
                  <th>MRP</th>
                  <th style={{ textAlign: 'right' }}>Quick Action</th>
                </tr>
              </thead>
              <tbody>
                {expiryItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      ✅ No batches expiring within the next 90 days!
                    </td>
                  </tr>
                ) : (
                  expiryItems.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.productName}</td>
                      <td><span className="badge font-mono">{item.batchNo}</span></td>
                      <td>{item.expiryDate}</td>
                      <td>{item.qty} strips</td>
                      <td>
                        <span className={`badge ${
                          item.status === 'expired' ? 'badge-danger' :
                          item.status === 'critical' ? 'badge-warning' : 'badge-info'
                        }`}>
                          {item.daysLeft <= 0 ? 'EXPIRED' : `${item.daysLeft} days left`}
                        </span>
                      </td>
                      <td>{formatCurr(item.mrp)}</td>
                      <td style={{ textAlign: 'right', display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', border: '1px solid var(--border-color)' }}
                          onClick={() => navigate('/transactions/stock-adjustment')}
                        >
                          Adjust
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', border: '1px solid var(--warning)', color: 'var(--warning)' }}
                          onClick={() => navigate('/transactions/purchase-return', { state: { autoFillItem: item } })}
                        >
                          Return
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─── SECTION 3: TODAY'S TRANSACTIONS STREAM & AGING (SPLIT PANELS) ─── */}
      <div className="grid-2">
        {/* TODAY'S TRANSACTIONS STREAM */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-color)', background: 'var(--content-bg)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className={`btn btn-sm ${activeTxTab === 'sales' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTxTab('sales')}
                style={{ fontSize: '0.8rem' }}
              >
                Sales ({todayLists.sales.length})
              </button>
              <button
                className={`btn btn-sm ${activeTxTab === 'purchases' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTxTab('purchases')}
                style={{ fontSize: '0.8rem' }}
              >
                Purchases ({todayLists.purchases.length})
              </button>
              <button
                className={`btn btn-sm ${activeTxTab === 'collections' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTxTab('collections')}
                style={{ fontSize: '0.8rem' }}
              >
                Collections ({todayLists.collections.length})
              </button>
              <button
                className={`btn btn-sm ${activeTxTab === 'payments' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTxTab('payments')}
                style={{ fontSize: '0.8rem' }}
              >
                Payments ({todayLists.payments.length})
              </button>
            </div>
            
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => navigate(activeTxTab === 'sales' ? '/reports/sales' : activeTxTab === 'purchases' ? '/reports/purchase' : activeTxTab === 'collections' ? '/transactions/receipts' : '/transactions/payments')}
            >
              View Full Report →
            </button>
          </div>

          <div className="card-body no-pad" style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {activeTxTab === 'sales' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Mode</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {todayLists.sales.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No sales recorded yet today.
                      </td>
                    </tr>
                  ) : (
                    todayLists.sales.map((s) => (
                      <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => openTxDetails('sale', s.id)}>
                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{s.invoice_no}</td>
                        <td style={{ fontWeight: 500 }}>{s.customer_name || 'Cash Customer'}</td>
                        <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurr(s.net_amount)}</td>
                        <td><span className="badge badge-secondary">{s.payment_mode || 'cash'}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.4rem' }} title="Quick Inspection">
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTxTab === 'purchases' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Bill / Entry #</th>
                    <th>Supplier</th>
                    <th>Amount</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {todayLists.purchases.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No purchase entries logged today.
                      </td>
                    </tr>
                  ) : (
                    todayLists.purchases.map((p) => (
                      <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => openTxDetails('purchase', p.id)}>
                        <td style={{ fontWeight: 600, color: 'var(--purple)' }}>{p.invoice_no || p.entry_no}</td>
                        <td style={{ fontWeight: 500 }}>{p.supplier_name || 'N/A'}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurr(p.net_amount)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.4rem' }} title="Quick Inspection">
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTxTab === 'collections' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {todayLists.collections.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No receipts logged today.
                      </td>
                    </tr>
                  ) : (
                    todayLists.collections.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>{r.receipt_no}</td>
                        <td style={{ fontWeight: 500 }}>{r.customer_name || '—'}</td>
                        <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurr(r.amount)}</td>
                        <td><span className="badge badge-secondary">{r.payment_mode || 'cash'}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTxTab === 'payments' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Payment #</th>
                    <th>Supplier</th>
                    <th>Amount</th>
                    <th>Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {todayLists.payments.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No payments logged today.
                      </td>
                    </tr>
                  ) : (
                    todayLists.payments.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.payment_no}</td>
                        <td style={{ fontWeight: 500 }}>{p.supplier_name || '—'}</td>
                        <td style={{ fontWeight: 600, color: 'var(--danger)' }}>{formatCurr(p.amount)}</td>
                        <td><span className="badge badge-secondary">{p.payment_mode || 'bank'}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* CUSTOMER OUTSTANDING AGING */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Customer Outstanding Aging</h3>
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/accounts/outstanding')}
            >
              Full Aging Report
            </button>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {outstandingAging.map((age, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{age.label}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurr(age.value)}</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--content-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      background: age.color,
                      width: stats.outstandingReceivable > 0 ? `${(age.value / stats.outstandingReceivable) * 100}%` : '0%' 
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── QUICK INSPECTION MODAL DRAWER ─── */}
      {selectedTx && (
        <div className="modal-backdrop" onClick={() => setSelectedTx(null)}>
          <div 
            className="modal" 
            style={{ maxWidth: '650px', width: '90%' }} 
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{selectedTx.type} Details</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Ref #: <strong>{selectedTx.header.invoice_no || selectedTx.header.entry_no}</strong> | Date: {selectedTx.header.date || selectedTx.header.invoice_date}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedTx(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'var(--content-bg)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Party Name:</span><br />
                  <strong>{selectedTx.header.customer_name || selectedTx.header.supplier_name || 'Cash/Walk-in'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>GSTIN / Phone:</span><br />
                  <strong>{selectedTx.header.customer_gstin || selectedTx.header.supplier_gstin || selectedTx.header.customer_phone || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Payment Mode:</span><br />
                  <span className="badge badge-secondary">{selectedTx.header.payment_mode || 'cash'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Net Amount:</span><br />
                  <strong style={{ fontSize: '1rem', color: 'var(--success)' }}>{formatCurr(selectedTx.header.net_amount)}</strong>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Line Items ({selectedTx.items.length})
                </h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Batch</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th style={{ textAlign: 'right' }}>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTx.items.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 500 }}>{item.product_name || 'Item'}</td>
                        <td><span className="badge font-mono">{item.batch_no || 'N/A'}</span></td>
                        <td>{item.qty}</td>
                        <td>{formatCurr(item.sale_price || item.purchase_price || item.mrp)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurr(item.net_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setSelectedTx(null)}>Close</button>
            </div>
          </div>
        </div>
      )}



    </div>
  );
}
