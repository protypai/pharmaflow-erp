import React, { useState, useEffect } from 'react';
import { Printer, Download, Banknote } from 'lucide-react';

export default function CashBook() {
  
  const [cashEntries, setCashEntries] = useState([]);

  useEffect(() => {
    const fetchCashBook = async () => {
      try {
        const query = `
          SELECT * FROM (
            SELECT id, date, 'By Receipt: ' || IFNULL(notes, 'Cash') as particulars, amount as receipt, 0 as payment 
            FROM receipts WHERE payment_mode = 'cash'
            UNION ALL
            SELECT id, date, 'To Payment: ' || IFNULL(notes, 'Cash') as particulars, 0 as receipt, amount as payment 
            FROM payments WHERE payment_mode = 'cash'
          ) ORDER BY date ASC
        `;
        const res = await window.pharmaAPI.db.query(query);
        const entries = res?.data || [];
        
        let currentBalance = 0;
        const processed = entries.map(entry => {
          currentBalance += (entry.receipt || 0) - (entry.payment || 0);
          return { ...entry, balance: currentBalance };
        });
        
        setCashEntries(processed);
      } catch (err) {
        console.error("Failed to fetch cash book:", err);
      }
    };
    fetchCashBook();
  }, []);

  const totals = cashEntries.reduce((acc, curr) => {
    acc.receipt += curr.receipt;
    acc.payment += curr.payment;
    return acc;
  }, { receipt: 0, payment: 0 });

  const openingBalance = cashEntries.length > 0 ? cashEntries[0].receipt : 0;
  const closingBalance = totals.receipt - totals.payment;
  
  // Actually received today (excluding opening balance)
  const receivedToday = totals.receipt - openingBalance;

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <div>
          <h2 className="card-title">Cash Book (Day Book)</h2>
          <div className="page-sub">Track daily physical cash flow and expenses</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline"><Printer size={16} /> Print Cash Book</button>
          <button className="btn btn-outline"><Download size={16} /> Export PDF</button>
        </div>
      </div>

      <div className="filter-bar" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', background: '#F8FAFC' }}>
        <div style={{ width: '150px' }}>
          <label className="form-label">From Date</label>
          <input type="date" className="form-input" defaultValue={new Date().toISOString().split('T')[0]} />
        </div>
        <div style={{ width: '150px' }}>
          <label className="form-label">To Date</label>
          <input type="date" className="form-input" defaultValue={new Date().toISOString().split('T')[0]} />
        </div>
        <button className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>View</button>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'white', borderBottom: '1px solid var(--border)' }}>
        <div className="card" style={{ flex: 1, padding: '1rem', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Opening Balance</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>₹ {openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '1rem', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <div style={{ fontSize: '0.8rem', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }}>Cash In (Today)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#15803D' }}>+ ₹ {receivedToday.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '1rem', background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <div style={{ fontSize: '0.8rem', color: '#991B1B', textTransform: 'uppercase', fontWeight: 600 }}>Cash Out (Today)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#B91C1C' }}>- ₹ {totals.payment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '1rem', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <div style={{ fontSize: '0.8rem', color: '#1E40AF', textTransform: 'uppercase', fontWeight: 600 }}>Closing Cash In Hand</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D4ED8' }}>₹ {closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ width: '120px' }}>Date</th>
              <th>Particulars</th>
              <th style={{ width: '150px', textAlign: 'right' }}>Receipt (Cash In)</th>
              <th style={{ width: '150px', textAlign: 'right' }}>Payment (Cash Out)</th>
              <th style={{ width: '150px', textAlign: 'right' }}>Running Balance</th>
            </tr>
          </thead>
          <tbody>
            {cashEntries.map((row) => (
              <tr key={row.id} style={{ background: row.particulars.includes('Opening') ? '#F8FAFC' : 'transparent' }}>
                <td>{row.date}</td>
                <td style={{ fontWeight: 500 }}>{row.particulars}</td>
                <td style={{ textAlign: 'right', color: row.receipt > 0 ? 'var(--success)' : 'var(--text-secondary)', fontWeight: row.receipt > 0 ? 600 : 400 }}>
                  {row.receipt > 0 ? row.receipt.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                </td>
                <td style={{ textAlign: 'right', color: row.payment > 0 ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: row.payment > 0 ? 600 : 400 }}>
                  {row.payment > 0 ? row.payment.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  ₹ {row.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot style={{ position: 'sticky', bottom: 0, background: '#F1F5F9', fontWeight: 700 }}>
            <tr>
              <td colSpan="2" style={{ textAlign: 'right' }}>Totals:</td>
              <td style={{ textAlign: 'right', color: 'var(--success)' }}>{totals.receipt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td style={{ textAlign: 'right', color: 'var(--danger)' }}>{totals.payment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td style={{ textAlign: 'right', color: 'var(--primary)' }}>
                ₹ {closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}