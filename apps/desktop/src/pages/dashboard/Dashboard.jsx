import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Users, Package, AlertTriangle, IndianRupee, 
  ArrowUpRight, ArrowDownRight, Clock, FileText, Activity,
  ShoppingCart, Receipt, Wallet, BadgeIndianRupee, Building2,
  XCircle, ShieldAlert, UserPlus
} from 'lucide-react';

export default function Dashboard() {

  const [stats, setStats] = useState({
    todaySales: { amount: 0, count: 0 },
    todayPurchase: { amount: 0, count: 0 },
    todayCollections: { amount: 0, count: 0 },
    todayPayments: { amount: 0, count: 0 },
    cashBalance: 0,
    bankBalance: 0,
    outstandingReceivable: 0,
    outstandingPayable: 0,
    nearExpiry: 0,
    expiredStock: 0,
    lowStock: 0,
    outOfStock: 0,
    deadStock: 0,
    newCustomers: 0,
    pendingReturns: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const salesRes = await window.pharmaAPI.db.query(`SELECT COUNT(*) as count, SUM(net_amount) as total FROM sales WHERE date LIKE '${today}%'`);
        const purchRes = await window.pharmaAPI.db.query(`SELECT COUNT(*) as count, SUM(net_amount) as total FROM purchases WHERE invoice_date LIKE '${today}%'`);
        const collRes = await window.pharmaAPI.db.query(`SELECT COUNT(*) as count, SUM(amount) as total FROM receipts WHERE date LIKE '${today}%'`);
        const payRes = await window.pharmaAPI.db.query(`SELECT COUNT(*) as count, SUM(amount) as total FROM payments WHERE date LIKE '${today}%'`);
        const customersRes = await window.pharmaAPI.db.query("SELECT COUNT(*) as count FROM customers");
        
        const recRes = await window.pharmaAPI.db.query(`
          SELECT 
            COALESCE((SELECT SUM(opening_balance) FROM customers), 0) +
            COALESCE((SELECT SUM(net_amount) FROM sales), 0) -
            COALESCE((SELECT SUM(amount) FROM receipts), 0) as total
        `);

        const paybleRes = await window.pharmaAPI.db.query(`
          SELECT 
            COALESCE((SELECT SUM(opening_balance) FROM suppliers), 0) +
            COALESCE((SELECT SUM(net_amount) FROM purchases), 0) -
            COALESCE((SELECT SUM(amount) FROM payments), 0) as total
        `);

        const batchRes = await window.pharmaAPI.db.query("SELECT expiry_date, current_qty FROM batches");
        const batches = batchRes?.data || [];
        let nearExpiryCount = 0, expiredStockCount = 0;
        const now = new Date();
        batches.forEach(b => {
          if (!b.expiry_date || b.current_qty <= 0) return;
          let expDate;
          if (b.expiry_date.includes('/') && b.expiry_date.length === 5) {
            const [m, y] = b.expiry_date.split('/');
            expDate = new Date(2000 + parseInt(y), parseInt(m) - 1, 1);
          } else {
            expDate = new Date(b.expiry_date);
          }
          if (isNaN(expDate)) return;
          const daysDiff = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
          if (daysDiff <= 0) expiredStockCount++;
          else if (daysDiff <= 90) nearExpiryCount++;
        });

        const prodRes = await window.pharmaAPI.db.query(`
          SELECT p.min_stock, COALESCE(SUM(b.current_qty), 0) as totalQty
          FROM products p
          LEFT JOIN batches b ON p.id = b.product_id
          GROUP BY p.id
        `);
        let lowStockCount = 0, outOfStockCount = 0;
        (prodRes?.data || []).forEach(p => {
          if (p.totalQty <= 0) outOfStockCount++;
          else if (p.totalQty < (p.min_stock || 10)) lowStockCount++;
        });

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

        let deadCount = 0;
        try {
          const deadRes = await window.pharmaAPI.db.query(`
            SELECT COUNT(DISTINCT p.id) as count 
            FROM products p 
            JOIN batches b ON p.id = b.product_id 
            WHERE b.current_qty > 0 
            AND p.id NOT IN (SELECT DISTINCT product_id FROM sale_items)
          `);
          deadCount = deadRes?.data?.[0]?.count || 0;
        } catch (e) {}

        let pendingRetCount = 0;
        try {
          const pendingRetRes = await window.pharmaAPI.db.query("SELECT COUNT(*) as count FROM sale_returns");
          pendingRetCount = pendingRetRes?.data?.[0]?.count || 0;
        } catch (e) {}

        let activities = [];
        try {
          const actRes = await window.pharmaAPI.db.query(`
            SELECT 'sale' as type, date as ref_date, invoice_no as desc, c.name as party, net_amount as amount, s.created_at
            FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
            WHERE s.date LIKE '${today}%'
            UNION ALL
            SELECT 'purchase' as type, invoice_date as ref_date, invoice_no as desc, sup.name as party, net_amount as amount, p.created_at
            FROM purchases p LEFT JOIN suppliers sup ON p.supplier_id = sup.id
            WHERE p.invoice_date LIKE '${today}%'
            UNION ALL
            SELECT 'receipt' as type, date as ref_date, receipt_no as desc, c.name as party, amount, r.created_at
            FROM receipts r LEFT JOIN customers c ON r.customer_id = c.id
            WHERE r.date LIKE '${today}%'
            UNION ALL
            SELECT 'payment' as type, date as ref_date, payment_no as desc, sup.name as party, amount, p.created_at
            FROM payments p LEFT JOIN suppliers sup ON p.supplier_id = sup.id
            WHERE p.date LIKE '${today}%'
            ORDER BY created_at DESC
            LIMIT 10
          `);
          if (actRes?.data) {
            activities = actRes.data.map(act => {
              const dt = new Date(act.created_at);
              let hours = dt.getHours();
              const ampm = hours >= 12 ? 'PM' : 'AM';
              hours = hours % 12;
              hours = hours ? hours : 12;
              const mins = dt.getMinutes().toString().padStart(2, '0');
              return {
                time: `${hours}:${mins} ${ampm}`,
                desc: act.desc,
                party: act.party || 'Cash',
                type: act.type,
                amount: act.amount
              };
            });
          }
        } catch (e) {
          console.error("Activity feed error", e);
        }

        let aging = [];
        const recTotal = recRes?.data?.[0]?.total || 0;
        try {
           // Distribute total outstanding into buckets (for dashboard visual representation)
           // If there is no logic to track individual invoice payments perfectly, 
           // we can provide a simplified aging model or simply query older unpaid invoices.
           const agingRes = await window.pharmaAPI.db.query(`
             SELECT 
               SUM(CASE WHEN CAST(julianday('now') - julianday(date) AS INTEGER) <= 30 THEN net_amount ELSE 0 END) as b30,
               SUM(CASE WHEN CAST(julianday('now') - julianday(date) AS INTEGER) BETWEEN 31 AND 60 THEN net_amount ELSE 0 END) as b60,
               SUM(CASE WHEN CAST(julianday('now') - julianday(date) AS INTEGER) BETWEEN 61 AND 90 THEN net_amount ELSE 0 END) as b90,
               SUM(CASE WHEN CAST(julianday('now') - julianday(date) AS INTEGER) > 90 THEN net_amount ELSE 0 END) as b90plus
             FROM sales
             WHERE payment_mode = 'credit'
           `);
           
           if (agingRes?.data && agingRes.data.length > 0) {
             const row = agingRes.data[0];
             const b30 = row.b30 || 0;
             const b60 = row.b60 || 0;
             const b90 = row.b90 || 0;
             const b90p = row.b90plus || 0;
             const totalCreditSales = b30 + b60 + b90 + b90p;
             
             // Approximate distribution of outstanding amount based on credit sales volume
             if (totalCreditSales > 0 && recTotal > 0) {
               aging = [
                 { label: '0-30 Days', value: (b30 / totalCreditSales) * recTotal },
                 { label: '31-60 Days', value: (b60 / totalCreditSales) * recTotal },
                 { label: '61-90 Days', value: (b90 / totalCreditSales) * recTotal },
                 { label: '> 90 Days', value: (b90p / totalCreditSales) * recTotal }
               ];
             } else {
               aging = [
                 { label: '0-30 Days', value: recTotal },
                 { label: '31-60 Days', value: 0 },
                 { label: '61-90 Days', value: 0 },
                 { label: '> 90 Days', value: 0 }
               ];
             }
           }
        } catch (e) {
           console.error("Aging error", e);
        }

        const sales = salesRes?.data || [];
        const purch = purchRes?.data || [];
        const coll = collRes?.data || [];
        const paym = payRes?.data || [];
        const customers = customersRes?.data || [];

        setStats(prev => ({
          ...prev,
          todaySales: { amount: sales[0]?.total || 0, count: sales[0]?.count || 0 },
          todayPurchase: { amount: purch[0]?.total || 0, count: purch[0]?.count || 0 },
          todayCollections: { amount: coll[0]?.total || 0, count: coll[0]?.count || 0 },
          todayPayments: { amount: paym[0]?.total || 0, count: paym[0]?.count || 0 },
          newCustomers: customers[0]?.count || 0,
          outstandingReceivable: recTotal,
          outstandingPayable: paybleRes?.data?.[0]?.total || 0,
          cashBalance: cashRes?.data?.[0]?.total || 0,
          bankBalance: bankRes?.data?.[0]?.total || 0,
          nearExpiry: nearExpiryCount,
          expiredStock: expiredStockCount,
          lowStock: lowStockCount,
          outOfStock: outOfStockCount,
          deadStock: deadCount,
          pendingReturns: pendingRetCount,
          recentActivities: activities,
          outstandingAging: aging
        }));
      } catch (err) {
        console.error('Failed to load DB stats', err);
      }
    };
    fetchStats();
  }, []);

  const salesTrend = [];
  const topProducts = [];

  const {
    todaySales, todayPurchase, todayCollections, todayPayments,
    cashBalance, bankBalance, outstandingReceivable, outstandingPayable,
    nearExpiry, expiredStock, lowStock, outOfStock, deadStock,
    newCustomers, pendingReturns, recentActivities = [], outstandingAging = []
  } = stats;

  const formatCurr = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
      
      {/* SECTION 1: FINANCIAL KPIs */}
      <div>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Today's Business
        </h3>
        <div className="kpi-grid">
          <div className="kpi-card blue">
            <div className="kpi-label">Today's Sales</div>
            <div className="kpi-value">{formatCurr(todaySales.amount)}</div>
            <div className="kpi-sub"><span className="text-success" style={{ display: 'inline-flex', alignItems: 'center' }}><ArrowUpRight size={12}/> 12%</span> vs yesterday</div>
            <TrendingUp size={64} className="kpi-icon" color="var(--primary)" />
          </div>
          <div className="kpi-card purple">
            <div className="kpi-label">Today's Purchase</div>
            <div className="kpi-value">{formatCurr(todayPurchase.amount)}</div>
            <div className="kpi-sub">{todayPurchase.count} invoices processed</div>
            <ShoppingCart size={64} className="kpi-icon" color="var(--purple)" />
          </div>
          <div className="kpi-card green">
            <div className="kpi-label">Collections Received</div>
            <div className="kpi-value">{formatCurr(todayCollections.amount)}</div>
            <div className="kpi-sub">from {todayCollections.count} customers</div>
            <Receipt size={64} className="kpi-icon" color="var(--success)" />
          </div>
          <div className="kpi-card orange">
            <div className="kpi-label">Payments Made</div>
            <div className="kpi-value">{formatCurr(todayPayments.amount)}</div>
            <div className="kpi-sub">to {todayPayments.count} suppliers</div>
            <Wallet size={64} className="kpi-icon" color="var(--warning)" />
          </div>
        </div>

        <div className="kpi-grid" style={{ marginTop: '-0.5rem' }}>
          <div className="kpi-card teal">
            <div className="kpi-label">Cash Balance</div>
            <div className="kpi-value">{formatCurr(cashBalance)}</div>
            <div className="kpi-sub">Available cash in hand</div>
            <BadgeIndianRupee size={64} className="kpi-icon" color="var(--info)" />
          </div>
          <div className="kpi-card teal">
            <div className="kpi-label">Bank Balance</div>
            <div className="kpi-value">{formatCurr(bankBalance)}</div>
            <div className="kpi-sub">Total across all accounts</div>
            <Building2 size={64} className="kpi-icon" color="var(--info)" />
          </div>
          <div className="kpi-card green">
            <div className="kpi-label">Receivables (To Collect)</div>
            <div className="kpi-value">{formatCurr(outstandingReceivable)}</div>
            <div className="kpi-sub">Customer outstanding</div>
            <TrendingUp size={64} className="kpi-icon" color="var(--success)" />
          </div>
          <div className="kpi-card red">
            <div className="kpi-label">Payables (To Pay)</div>
            <div className="kpi-value">{formatCurr(outstandingPayable)}</div>
            <div className="kpi-sub">Supplier outstanding</div>
            <TrendingDown size={64} className="kpi-icon" color="var(--danger)" />
          </div>
        </div>
      </div>

      {/* SECTION 2: INVENTORY & ALERTS */}
      <div>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Action Required Alerts
        </h3>
        <div className="alert-grid">
          <div className="alert-card orange">
            <div className="alert-icon"><Clock size={18} /></div>
            <div className="alert-count">{nearExpiry}</div>
            <div className="alert-label">Near Expiry</div>
          </div>
          <div className="alert-card red">
            <div className="alert-icon"><ShieldAlert size={18} /></div>
            <div className="alert-count">{expiredStock}</div>
            <div className="alert-label">Expired Stock</div>
          </div>
          <div className="alert-card orange">
            <div className="alert-icon"><AlertTriangle size={18} /></div>
            <div className="alert-count">{lowStock}</div>
            <div className="alert-label">Low Stock</div>
          </div>
          <div className="alert-card red">
            <div className="alert-icon"><XCircle size={18} /></div>
            <div className="alert-count">{outOfStock}</div>
            <div className="alert-label">Out of Stock</div>
          </div>
          <div className="alert-card purple">
            <div className="alert-icon"><Package size={18} /></div>
            <div className="alert-count">{deadStock}</div>
            <div className="alert-label">Dead Stock</div>
          </div>
          <div className="alert-card blue">
            <div className="alert-icon"><UserPlus size={18} /></div>
            <div className="alert-count">{newCustomers}</div>
            <div className="alert-label">New Customers</div>
          </div>
          <div className="alert-card green">
            <div className="alert-icon"><ArrowDownRight size={18} /></div>
            <div className="alert-count">{pendingReturns}</div>
            <div className="alert-label">Pending Returns</div>
          </div>
        </div>
      </div>

      {/* SECTION 3: TABLES & CHARTS */}
      <div className="grid-2">
        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Today's Activity Feed</h3>
            <button className="btn btn-ghost btn-sm">View All</button>
          </div>
          <div className="card-body no-pad">
            <table className="data-table">
              <tbody>
                {recentActivities.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No activity today
                    </td>
                  </tr>
                ) : (
                  recentActivities.map((act, i) => (
                    <tr key={i}>
                      <td style={{ width: '80px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {act.time}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{act.desc}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{act.party}</div>
                      </td>
                      <td className="col-amount" style={{ 
                        color: act.type === 'receipt' || act.type === 'sale' ? 'var(--success)' : 'var(--danger)' 
                      }}>
                        {act.type === 'receipt' || act.type === 'sale' ? '+' : '-'}{formatCurr(act.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Outstanding Aging */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Customer Outstanding Aging</h3>
            <button className="btn btn-ghost btn-sm">Full Report</button>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {outstandingAging.map((age, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 500 }}>{age.label}</span>
                    <span style={{ fontWeight: 600 }}>{formatCurr(age.value)}</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--content-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      background: age.color,
                      width: `${(age.value / outstandingReceivable) * 100}%` 
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}


