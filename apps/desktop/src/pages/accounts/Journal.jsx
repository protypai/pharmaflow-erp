import React, { useState } from 'react';
import { Save, Plus, Trash2, Printer } from 'lucide-react';

export default function Journal() {
  const [rows, setRows] = useState([
    { id: 1, account: '', type: 'Dr', amount: 0 },
    { id: 2, account: '', type: 'Cr', amount: 0 }
  ]);
  const [narration, setNarration] = useState('');

  const totals = rows.reduce((acc, row) => {
    if (row.type === 'Dr') acc.dr += Number(row.amount) || 0;
    if (row.type === 'Cr') acc.cr += Number(row.amount) || 0;
    return acc;
  }, { dr: 0, cr: 0 });

  const isBalanced = totals.dr === totals.cr && totals.dr > 0;

  const addRow = () => {
    setRows([...rows, { id: Date.now(), account: '', type: 'Dr', amount: 0 }]);
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeRow = (id) => {
    if (rows.length > 2) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Journal Voucher (JV)</h1>
          <div className="page-sub">Post manual double-entry accounting adjustments</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline"><Printer size={16} /> Print JV</button>
          <button className="btn btn-primary" disabled={!isBalanced}><Save size={16} /> Post Entry</button>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Voucher Date <span className="text-danger">*</span></label>
              <input type="date" className="form-input" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="form-group">
              <label className="form-label">Voucher No</label>
              <input type="text" className="form-input" defaultValue="JV-1004" disabled />
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
          <table className="data-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ width: '80px' }}>Dr / Cr</th>
                <th>Account Ledger</th>
                <th style={{ width: '200px', textAlign: 'right' }}>Debit (₹)</th>
                <th style={{ width: '200px', textAlign: 'right' }}>Credit (₹)</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <select className="form-select form-input-sm" value={r.type} onChange={e => updateRow(r.id, 'type', e.target.value)} style={{ fontWeight: 600 }}>
                      <option value="Dr">Dr</option>
                      <option value="Cr">Cr</option>
                    </select>
                  </td>
                  <td>
                    <select className="form-select form-input-sm" value={r.account} onChange={e => updateRow(r.id, 'account', e.target.value)}>
                      <option value="">Select Ledger Account...</option>
                      <option value="salary">Salary Expense A/c</option>
                      <option value="rent">Rent Expense A/c</option>
                      <option value="dep">Depreciation A/c</option>
                      <option value="bank_charges">Bank Charges A/c</option>
                      <option value="cash">Cash A/c</option>
                      <option value="hdfc">HDFC Bank A/c</option>
                    </select>
                  </td>
                  <td>
                    <input 
                      type="number" 
                      className="form-input form-input-sm" 
                      style={{ textAlign: 'right' }} 
                      value={r.type === 'Dr' ? r.amount || '' : ''} 
                      onChange={e => updateRow(r.id, 'amount', e.target.value)}
                      disabled={r.type !== 'Dr'}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      className="form-input form-input-sm" 
                      style={{ textAlign: 'right' }} 
                      value={r.type === 'Cr' ? r.amount || '' : ''} 
                      onChange={e => updateRow(r.id, 'amount', e.target.value)}
                      disabled={r.type !== 'Cr'}
                    />
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => removeRow(r.id)} style={{ color: 'var(--danger)', padding: '0.25rem' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan="5">
                  <button className="btn btn-ghost btn-sm" onClick={addRow} style={{ color: 'var(--primary)' }}>
                    <Plus size={16} /> Add Row
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
            <label className="form-label">Narration (Remarks)</label>
            <textarea 
              className="form-input" 
              rows="3" 
              placeholder="e.g., Being salary paid for the month of July 2025..."
              value={narration}
              onChange={e => setNarration(e.target.value)}
            ></textarea>
          </div>
        </div>
        
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '450px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 600 }}>
              <span>Total Debit:</span> 
              <span>₹ {totals.dr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 600 }}>
              <span>Total Credit:</span> 
              <span>₹ {totals.cr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            
            <div style={{ 
              marginTop: '0.5rem', 
              paddingTop: '0.5rem', 
              borderTop: '1px solid var(--border)',
              display: 'flex', 
              justifyContent: 'center'
            }}>
              {isBalanced ? (
                <div style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></span>
                  Voucher is Balanced
                </div>
              ) : (
                <div style={{ color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' }}></span>
                  Difference: ₹ {Math.abs(totals.dr - totals.cr).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}