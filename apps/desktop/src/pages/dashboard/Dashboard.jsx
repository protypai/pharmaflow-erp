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
        const salesRes = await window.pharmaAPI.db.query("SELECT COUNT(*) as count, SUM(netAmount) as total FROM Sale WHERE date = date('now')");
        const customersRes = await window.pharmaAPI.db.query("SELECT COUNT(*) as count FROM Customer");
        const outstandingRes = await window.pharmaAPI.db.query("SELECT SUM(outstanding) as total FROM Customer");

        const sales = salesRes?.data || [];
        const customers = customersRes?.data || [];
        const outstanding = outstandingRes?.data || [];

        setStats(prev => ({
          ...prev,
          todaySales: { amount: sales[0]?.total || 0, count: sales[0]?.count || 0 },
          newCustomers: customers[0]?.count || 0,
          outstandingReceivable: outstanding[0]?.total || 0,
        }));
      } catch (err) {
        console.error('Failed to load DB stats', err);
      }
    };
    fetchStats();
  }, []);

  const salesTrend = [];
  const outstandingAging = [];
  const topProducts = [];
  const recentActivities = [];

  const {
    todaySales, todayPurchase, todayCollections, todayPayments,
    cashBalance, bankBalance, outstandingReceivable, outstandingPayable,
    nearExpiry, expiredStock, lowStock, outOfStock, deadStock,
    newCustomers, pendingReturns
  } = stats;

  const formatCurr = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
      
      {/* SECTION 1: FINANCIAL KPIs */}
      <div>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Today's Business
        </h3>
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
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

        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: '-0.5rem' }}>
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
        <div className="alert-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
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
                {recentActivities.map((act, i) => (
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
                ))}
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


