import React, { useState, useEffect } from 'react';
import { Printer, Download, Landmark } from 'lucide-react';

export default function BankBook() {
  const [bankId, setBankId] = useState('hdfc');

  const [bankEntries, setBankEntries] = useState([]);

  useEffect(() => {
    const fetchBankBook = async () => {
      try {
        const query = `
          SELECT * FROM (
            SELECT id, date, 'By Receipt: ' || IFNULL(notes, 'Bank') as particulars, IFNULL(cheque_no, payment_mode) as instrument, amount as deposit, 0 as withdrawal 
            FROM receipts WHERE payment_mode != 'cash'
            UNION ALL
            SELECT id, date, 'To Payment: ' || IFNULL(notes, 'Bank') as particulars, IFNULL(cheque_no, payment_mode) as instrument, 0 as deposit, amount as withdrawal 
            FROM payments WHERE payment_mode != 'cash'
          ) ORDER BY date ASC
        `;
        const res = await window.pharmaAPI.db.query(query);
        const entries = res?.data || [];
        
        let currentBalance = 0;
        const processed = entries.map(entry => {
          currentBalance += (entry.deposit || 0) - (entry.withdrawal || 0);
          return { ...entry, balance: currentBalance };
        });
        
        setBankEntries(processed);
      } catch (err) {
        console.error("Failed to fetch bank book:", err);
      }
    };
    fetchBankBook();
  }, [bankId]);

  const totals = bankEntries.reduce((acc, curr) => {
    acc.withdrawal += curr.withdrawal;
    acc.deposit += curr.deposit;
    return acc;
  }, { withdrawal: 0, deposit: 0 });

  const openingBalance = bankEntries.length > 0 ? bankEntries[0].deposit : 0;
  const closingBalance = totals.deposit - totals.withdrawal;

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <div>
          <h2 className="card-title">Bank Book (Bank Reconciliation)</h2>
          <div className="page-sub">Track digital transactions and reconcile with bank statements</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline"><Printer size={16} /> Print Bank Book</button>
          <button className="btn btn-outline"><Download size={16} /> Export PDF</button>
        </div>
      </div>

      <div className="filter-bar" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', background: '#F8FAFC' }}>
        <div style={{ flex: 1, maxWidth: '300px' }}>
          <label className="form-label">Select Bank Account <span className="text-danger">*</span></label>
          <select className="form-select" value={bankId} onChange={e => setBankId(e.target.value)}>
            <option value="hdfc">HDFC Current A/c - 502000123</option>
            <option value="sbi">SBI Current A/c - 301000987</option>
          </select>
        </div>
        <div style={{ width: '150px' }}>
          <label className="form-label">From Date</label>
          <input type="date" className="form-input" defaultValue="2025-07-01" />
        </div>
        <div style={{ width: '150px' }}>
          <label className="form-label">To Date</label>
          <input type="date" className="form-input" defaultValue={new Date().toISOString().split('T')[0]} />
        </div>
        <button className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>View</button>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ width: '100px' }}>Date</th>
              <th>Particulars</th>
              <th style={{ width: '150px' }}>Inst / Chq No</th>
              <th style={{ width: '150px', textAlign: 'right' }}>Withdrawal (Dr)</th>
              <th style={{ width: '150px', textAlign: 'right' }}>Deposit (Cr)</th>
              <th style={{ width: '150px', textAlign: 'right' }}>Running Balance</th>
            </tr>
          </thead>
          <tbody>
            {bankEntries.map((row) => (
              <tr key={row.id} style={{ background: row.particulars.includes('Opening') ? '#F8FAFC' : 'transparent' }}>
                <td>{row.date}</td>
                <td style={{ fontWeight: 500 }}>{row.particulars}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{row.instrument}</td>
                <td style={{ textAlign: 'right', color: row.withdrawal > 0 ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: row.withdrawal > 0 ? 600 : 400 }}>
                  {row.withdrawal > 0 ? row.withdrawal.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                </td>
                <td style={{ textAlign: 'right', color: row.deposit > 0 ? 'var(--success)' : 'var(--text-secondary)', fontWeight: row.deposit > 0 ? 600 : 400 }}>
                  {row.deposit > 0 ? row.deposit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  ₹ {row.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot style={{ position: 'sticky', bottom: 0, background: '#F1F5F9', fontWeight: 700 }}>
            <tr>
              <td colSpan="3" style={{ textAlign: 'right' }}>Totals:</td>
              <td style={{ textAlign: 'right', color: 'var(--danger)' }}>{totals.withdrawal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td style={{ textAlign: 'right', color: 'var(--success)' }}>{totals.deposit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
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