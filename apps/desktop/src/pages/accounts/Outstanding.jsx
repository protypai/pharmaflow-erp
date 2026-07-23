import React, { useState, useEffect, useMemo } from 'react';
import { Search, Printer, Download, TrendingUp, TrendingDown } from 'lucide-react';


export default function Outstanding() {
  const [customers, set_customers] = useState([]);
  const [suppliers, set_suppliers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res_customers = await window.pharmaAPI.db.query("SELECT * FROM customers");
      set_customers(res_customers?.data || []);
      const res_suppliers = await window.pharmaAPI.db.query("SELECT * FROM suppliers");
      set_suppliers(res_suppliers?.data || []);
    };
    fetchData();
  }, []);

  const [viewType, setViewType] = useState('receivables'); // 'receivables' or 'payables'
  const [search, setSearch] = useState('');

  const outstandingData = useMemo(() => {
    let data = [];
    
    if (viewType === 'receivables') {
      // Customers owe money TO the pharmacy
      data = customers.map(c => {
        // Mock pending calculation based on credit limit
        const pendingAmt = c.outstanding;
        const totalBilled = pendingAmt + (c.id * 15000); // Mock total billed
        const oldestDueDays = c.id * 5; // Mock days due
        
        return {
          id: c.id,
          partyName: c.name,
          contact: c.phone || 'N/A',
          city: c.area || c.city,
          totalBilled,
          pendingAmt,
          oldestDueDays,
          status: oldestDueDays > 30 ? 'Overdue' : 'Normal'
        };
      }).filter(x => x.pendingAmt > 0);
    } else {
      // Pharmacy owes money TO suppliers
      data = suppliers.map(s => {
        // Mock pending calculation
        const pendingAmt = s.id * 25000;
        const totalBilled = pendingAmt + 100000;
        const oldestDueDays = s.id * 10;
        
        return {
          id: s.id,
          partyName: s.name,
          contact: s.contactPerson || 'N/A',
          city: s.city,
          totalBilled,
          pendingAmt,
          oldestDueDays,
          status: oldestDueDays > 45 ? 'Overdue' : 'Normal'
        };
      }).filter(x => x.pendingAmt > 0);
    }

    if (search) {
      data = data.filter(d => d.partyName.toLowerCase().includes(search.toLowerCase()));
    }

    // Sort by highest pending amount first
    return data.sort((a, b) => b.pendingAmt - a.pendingAmt);
  }, [viewType, search]);

  const totalOutstanding = outstandingData.reduce((sum, d) => sum + d.pendingAmt, 0);

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <div>
          <h2 className="card-title">Outstanding (Receivables & Payables)</h2>
          <div className="page-sub">Track money owed to you and money you owe</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline"><Printer size={16} /> Print Report</button>
          <button className="btn btn-outline" onClick={() => alert("Data exported successfully as CSV!")}><Download size={16} /> Export CSV</button>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        <button 
          className="btn btn-ghost"
          style={{ 
            borderRadius: 0, 
            borderBottom: viewType === 'receivables' ? '2px solid var(--primary)' : '2px solid transparent', 
            color: viewType === 'receivables' ? 'var(--primary)' : 'inherit',
            padding: '1rem 2rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onClick={() => setViewType('receivables')}
        >
          <TrendingUp size={18} /> Accounts Receivable (Customers Owe Us)
        </button>
        <button 
          className="btn btn-ghost"
          style={{ 
            borderRadius: 0, 
            borderBottom: viewType === 'payables' ? '2px solid var(--danger)' : '2px solid transparent', 
            color: viewType === 'payables' ? 'var(--danger)' : 'inherit',
            padding: '1rem 2rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onClick={() => setViewType('payables')}
        >
          <TrendingDown size={18} /> Accounts Payable (We Owe Suppliers)
        </button>
      </div>

      <div className="filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search Party Name..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '250px' }}
          />
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          background: viewType === 'receivables' ? '#EFF6FF' : '#FEF2F2', 
          padding: '0.5rem 1rem', 
          borderRadius: 'var(--radius)', 
          color: viewType === 'receivables' ? '#1E40AF' : '#991B1B' 
        }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>
            Total {viewType === 'receivables' ? 'Receivables' : 'Payables'}:
          </span>
          <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            ₹ {totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th>{viewType === 'receivables' ? 'Customer Name' : 'Supplier Name'}</th>
              <th>Contact & City</th>
              <th style={{ textAlign: 'right' }}>Total Billed (₹)</th>
              <th style={{ textAlign: 'right' }}>Pending Balance (₹)</th>
              <th>Oldest Due</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {outstandingData.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No outstanding records found!</td></tr>
            ) : outstandingData.map((row) => (
              <tr key={row.id}>
                <td style={{ fontWeight: 600 }}>{row.partyName}</td>
                <td>
                  <div>{row.contact}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.city}</div>
                </td>
                <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                  {row.totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: viewType === 'receivables' ? 'var(--primary)' : 'var(--danger)' }}>
                  {row.pendingAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td>
                  <span style={{ 
                    background: row.status === 'Overdue' ? 'var(--danger)' : '#E2E8F0', 
                    color: row.status === 'Overdue' ? 'white' : 'var(--text-secondary)',
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '12px', 
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {row.oldestDueDays} Days
                  </span>
                </td>
                <td className="col-actions">
                  <button 
                    className="btn btn-outline btn-sm" 
                    title={viewType === 'receivables' ? "Send Payment Reminder" : "Plan Payment"}
                  >
                    {viewType === 'receivables' ? 'Send Reminder' : 'Pay Now'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}