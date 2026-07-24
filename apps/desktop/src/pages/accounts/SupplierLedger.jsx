import React, { useState, useEffect, useMemo } from 'react';
import { Search, Printer, Download, BookOpen } from 'lucide-react';


export default function SupplierLedger() {
  const [suppliers, set_suppliers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res_suppliers = await window.pharmaAPI.db.query("SELECT * FROM suppliers");
      set_suppliers(res_suppliers?.data || []);
    };
    fetchData();
  }, []);

  const [supplierId, setSupplierId] = useState('');
  
  const [ledgerEntries, setLedgerEntries] = useState([]);

  useEffect(() => {
    const fetchLedger = async () => {
      if (!supplierId) {
        setLedgerEntries([]);
        return;
      }
      
      const sup = suppliers.find(s => s.id === supplierId);
      const opening = sup?.opening_balance || 0;
      
      const purRes = await window.pharmaAPI.db.query("SELECT * FROM purchases WHERE supplier_id = ?", [supplierId]);
      const payRes = await window.pharmaAPI.db.query("SELECT * FROM payments WHERE supplier_id = ?", [supplierId]);
      const retRes = await window.pharmaAPI.db.query("SELECT * FROM purchase_returns WHERE supplier_id = ?", [supplierId]);
      
      const entries = [];
      entries.push({ id: 'op', date: '2025-04-01', vchType: 'Opening Balance', vchNo: '-', particulars: 'By Opening Balance', debit: 0, credit: opening, timestamp: 0 });
      
      (purRes?.data || []).forEach(p => {
        entries.push({ id: p.id, date: p.invoice_date, vchType: 'Purchase', vchNo: p.invoice_no, particulars: 'By Purchase A/c', debit: 0, credit: p.net_amount, timestamp: new Date(p.invoice_date).getTime() });
      });
      
      (payRes?.data || []).forEach(p => {
        entries.push({ id: p.id, date: p.date, vchType: 'Payment', vchNo: p.payment_no, particulars: `To Bank A/c (${p.payment_mode})`, debit: p.amount, credit: 0, timestamp: new Date(p.date).getTime() });
      });
      
      (retRes?.data || []).forEach(r => {
        entries.push({ id: r.id, date: r.return_date, vchType: 'Purchase Return', vchNo: r.entry_no, particulars: 'To Purchase Return A/c', debit: r.net_amount, credit: 0, timestamp: new Date(r.return_date).getTime() });
      });
      
      entries.sort((a, b) => {
        if (a.id === 'op') return -1;
        if (b.id === 'op') return 1;
        return a.timestamp - b.timestamp;
      });
      
      let currentBalance = 0;
      const computedEntries = entries.map(entry => {
        currentBalance += entry.credit - entry.debit;
        return { ...entry, balance: Math.abs(currentBalance), balType: currentBalance >= 0 ? 'Cr' : 'Dr' };
      });
      
      setLedgerEntries(computedEntries);
    };
    fetchLedger();
  }, [supplierId, suppliers]);

  const totals = ledgerEntries.reduce((acc, curr) => {
    acc.debit += curr.debit;
    acc.credit += curr.credit;
    return acc;
  }, { debit: 0, credit: 0 });

  const closingBalance = totals.credit - totals.debit;

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <div>
          <h2 className="card-title">Supplier Ledger (Statement of Account)</h2>
          <div className="page-sub">Track running balances, purchases, and payments for vendors</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline"><Printer size={16} /> Print Ledger</button>
          <button className="btn btn-outline"><Download size={16} /> Export PDF</button>
        </div>
      </div>

      <div className="filter-bar" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', background: '#F8FAFC' }}>
        <div style={{ flex: 1, maxWidth: '400px' }}>
          <label className="form-label">Select Supplier <span className="text-danger">*</span></label>
          <select className="form-select" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
            <option value="">Search Supplier...</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.city})</option>)}
          </select>
        </div>
        <div style={{ width: '150px' }}>
          <label className="form-label">From Date</label>
          <input type="date" className="form-input" defaultValue="2025-04-01" />
        </div>
        <div style={{ width: '150px' }}>
          <label className="form-label">To Date</label>
          <input type="date" className="form-input" defaultValue={new Date().toISOString().split('T')[0]} />
        </div>
        <button className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>Go</button>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto', background: !supplierId ? '#F8FAFC' : 'white' }}>
        {!supplierId ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            <BookOpen size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>Please select a supplier to view their ledger statement.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ width: '100px' }}>Date</th>
                <th style={{ width: '120px' }}>Vch Type</th>
                <th style={{ width: '120px' }}>Vch No</th>
                <th>Particulars</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Debit (₹)</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Credit (₹)</th>
                <th style={{ width: '150px', textAlign: 'right' }}>Balance (₹)</th>
              </tr>
            </thead>
            <tbody>
              {ledgerEntries.map((row, i) => (
                <tr key={row.id} style={{ background: row.vchType === 'Opening Balance' ? '#F8FAFC' : 'transparent' }}>
                  <td>{row.date}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{row.vchType}</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 500, cursor: 'pointer' }}>{row.vchNo}</td>
                  <td>{row.particulars}</td>
                  <td style={{ textAlign: 'right', color: row.debit > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {row.debit > 0 ? row.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                  </td>
                  <td style={{ textAlign: 'right', color: row.credit > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {row.credit > 0 ? row.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {row.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{row.balType}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot style={{ position: 'sticky', bottom: 0, background: '#F1F5F9', fontWeight: 700 }}>
              <tr>
                <td colSpan="4" style={{ textAlign: 'right' }}>Total:</td>
                <td style={{ textAlign: 'right', color: 'var(--text-primary)' }}>{totals.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ textAlign: 'right', color: 'var(--text-primary)' }}>{totals.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ textAlign: 'right', color: closingBalance >= 0 ? 'var(--danger)' : 'var(--success)' }}>
                  {Math.abs(closingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })} {closingBalance >= 0 ? 'Cr' : 'Dr'}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}