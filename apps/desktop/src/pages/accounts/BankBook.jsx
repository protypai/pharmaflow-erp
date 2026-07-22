import React, { useState, useMemo } from 'react';
import { Printer, Download, Landmark } from 'lucide-react';

export default function BankBook() {
  const [bankId, setBankId] = useState('hdfc');

  // Mock Bank Book Entries
  const bankEntries = useMemo(() => {
    // Generate different mock data based on bank selected
    let entries = [];
    if (bankId === 'hdfc') {
      entries = [
        { id: 1, date: '2025-07-01', particulars: 'By Opening Balance', instrument: '-', withdrawal: 0, deposit: 250000 },
        { id: 2, date: '2025-07-05', particulars: 'To Supplier (Sun Pharma) - NEFT', instrument: 'N123456789', withdrawal: 45000, deposit: 0 },
        { id: 3, date: '2025-07-08', particulars: 'By Customer (Sharma Clinic) - Cheque', instrument: 'CHQ-889922', withdrawal: 0, deposit: 12500 },
        { id: 4, date: '2025-07-10', particulars: 'To Electricity Bill - Auto Debit', instrument: 'ACH-1122', withdrawal: 3500, deposit: 0 },
        { id: 5, date: '2025-07-15', particulars: 'By Cash Deposit', instrument: 'Slip-001', withdrawal: 0, deposit: 20000 }
      ];
    } else {
      entries = [
        { id: 1, date: '2025-07-01', particulars: 'By Opening Balance', instrument: '-', withdrawal: 0, deposit: 75000 },
        { id: 2, date: '2025-07-10', particulars: 'By UPI Settlements (Razorpay)', instrument: 'UTR-ABC123', withdrawal: 0, deposit: 8500 },
        { id: 3, date: '2025-07-12', particulars: 'To Bank Charges', instrument: '-', withdrawal: 250, deposit: 0 }
      ];
    }

    let currentBalance = 0;
    return entries.map(entry => {
      currentBalance += entry.deposit - entry.withdrawal;
      return { ...entry, balance: currentBalance };
    });
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