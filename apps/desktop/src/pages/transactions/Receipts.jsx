import React, { useState, useEffect } from 'react';
import { Save, Printer, IndianRupee } from 'lucide-react';
import { syncEntity } from '../../services/dataService';

export default function Receipts() {
  const [customers, set_customers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res_customers = await window.pharmaAPI.db.query("SELECT * FROM customers");
      set_customers(res_customers?.data || []);
    };
    fetchData();
  }, []);

  const [customerId, setCustomerId] = useState('');
  const [amountReceived, setAmountReceived] = useState(0);
  const [payMode, setPayMode] = useState('bank');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [chequeNo, setChequeNo] = useState('');
  const [bankName, setBankName] = useState('');
  
  // Mock pending bills for a selected customer
  const [bills, setBills] = useState([]);
  
  // State for total allocated
  const [allocatedTotal, setAllocatedTotal] = useState(0);

  useEffect(() => {
    const fetchPendingBills = async () => {
      if (customerId) {
        const res = await window.pharmaAPI.db.query("SELECT * FROM sales WHERE customer_id = ? AND (net_amount - paid_amount) > 0 ORDER BY date ASC", [customerId]);
        const dbBills = (res?.data || []).map(s => ({
          id: s.invoice_no,
          dbId: s.id,
          date: s.date,
          amount: s.net_amount,
          pending: s.net_amount - s.paid_amount,
          allocated: 0,
          discount: 0
        }));
        setBills(dbBills);
      } else {
        setBills([]);
      }
    };
    fetchPendingBills();
  }, [customerId]);

  useEffect(() => {
    const total = bills.reduce((sum, b) => sum + (Number(b.allocated) || 0) + (Number(b.discount) || 0), 0);
    setAllocatedTotal(total);
  }, [bills]);

  const updateBill = (id, field, value) => {
    setBills(bills.map(b => b.id === id ? { ...b, [field]: Number(value) } : b));
  };

  const autoAllocate = () => {
    let remaining = Number(amountReceived) || 0;
    const newBills = bills.map(b => {
      let allocated = 0;
      if (remaining > 0) {
        allocated = Math.min(b.pending, remaining);
        remaining -= allocated;
      }
      return { ...b, allocated };
    });
    setBills(newBills);
  };

  const handleSave = async () => {
    try {
      if (!customerId) throw new Error("Please select a customer.");
      if (!amountReceived || Number(amountReceived) <= 0) throw new Error("Amount must be greater than 0.");
      if (allocatedTotal > Number(amountReceived)) throw new Error("Allocation exceeds received amount!");
      
      const receiptNo = "REC-" + Date.now().toString().slice(-6);
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const companyId = user.companyId || 'COMP-DEMO-001';
      const receiptId = crypto.randomUUID();

      await window.pharmaAPI.db.run(
        `INSERT INTO receipts (
          id, company_id, receipt_no, customer_id, date, amount, payment_mode, cheque_no, bank_name
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?
        )`,
        [
          receiptId,
          companyId,
          receiptNo,
          customerId,
          receiptDate,
          Number(amountReceived),
          payMode,
          chequeNo,
          bankName
        ]
      );

      const mapPayMode = (m) => {
        if (m === 'cash') return 'cash';
        return 'neft_rtgs';
      };

      await syncEntity('Receipt', 'create', {
        id: receiptId,
        companyId,
        receiptNo,
        customerId,
        date: new Date(receiptDate).toISOString(),
        amount: Number(amountReceived),
        paymentMode: mapPayMode(payMode),
        chequeNo,
        bankName
      });
      
      for (const b of bills) {
        if (b.allocated > 0 || b.discount > 0) {
          const addAmount = Number(b.allocated || 0) + Number(b.discount || 0);
          await window.pharmaAPI.db.run(
            "UPDATE sales SET paid_amount = paid_amount + ? WHERE id = ?", 
            [addAmount, b.dbId]
          );

          const saleRes = await window.pharmaAPI.db.query("SELECT paid_amount FROM sales WHERE id = ?", [b.dbId]);
          if (saleRes?.data?.length > 0) {
            await syncEntity('Sale', 'update', {
              id: b.dbId,
              paidAmount: saleRes.data[0].paid_amount
            });
          }
        }
      }
      setCustomerId('');
      setAmountReceived(0);
      setChequeNo('');
      setBankName('');
      setBills([]);
      alert(`Receipt ${receiptNo} saved successfully!`);
    } catch (err) {
      alert(err.message || "Failed to save receipt.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Receipts (Money Received)</h1>
          <div className="page-sub">Collect payments from customers and adjust against invoices</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline"><Printer size={16} /> Print Receipt</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={allocatedTotal > (Number(amountReceived)||0)}><Save size={16} /> Save Receipt</button>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Customer <span className="text-danger">*</span></label>
              <select className="form-select" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">Select Customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Receipt Date <span className="text-danger">*</span></label>
              <input type="date" className="form-input" value={receiptDate} onChange={e => setReceiptDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Total Amount Received (₹) <span className="text-danger">*</span></label>
                  <div className="search-input-wrap" style={{ width: '100%' }}>
                    <IndianRupee size={16} className="search-icon" color="var(--success)" />
                    <input type="number" className="form-input" value={amountReceived || ''} onChange={e => setAmountReceived(e.target.value)} style={{ fontWeight: 600, fontSize: '1.1rem' }} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Payment Mode <span className="text-danger">*</span></label>
                  <select className="form-select" value={payMode} onChange={e => setPayMode(e.target.value)}>
                    <option value="bank">Cheque / NEFT / RTGS</option>
                    <option value="upi">UPI</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
              </div>
            </div>
            
            {payMode !== 'cash' && (
              <>
                <div className="form-group">
                  <label className="form-label">Instrument / Cheque No.</label>
                  <input type="text" className="form-input" placeholder="e.g. 123456" value={chequeNo} onChange={e => setChequeNo(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Bank Name</label>
                  <input type="text" className="form-input" placeholder="e.g. HDFC Bank" value={bankName} onChange={e => setBankName(e.target.value)} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title" style={{ fontSize: '1rem' }}>Pending Invoice Allocation</h3>
          <button className="btn btn-outline btn-sm" onClick={autoAllocate} disabled={!customerId || !amountReceived}>
            Auto Allocate (FIFO)
          </button>
        </div>
        <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
          <table className="data-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Bill Amount (₹)</th>
                <th>Pending (₹)</th>
                <th style={{ width: '150px' }}>Allocated (₹)</th>
                <th style={{ width: '150px' }}>Cash Disc (₹)</th>
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Select a customer to view pending invoices</td></tr>
              ) : bills.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 500 }}>{b.id}</td>
                  <td>{b.date}</td>
                  <td>{b.amount.toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{b.pending.toLocaleString('en-IN')}</td>
                  <td>
                    <input type="number" className="form-input form-input-sm" max={b.pending} value={b.allocated || ''} onChange={e => updateBill(b.id, 'allocated', e.target.value)} />
                  </td>
                  <td>
                    <input type="number" className="form-input form-input-sm" max={b.pending - b.allocated} value={b.discount || ''} onChange={e => updateBill(b.id, 'discount', e.target.value)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Received Amount:</span> <span>₹ {Number(amountReceived || 0).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Total Allocated:</span> <span>- ₹ {allocatedTotal.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 600, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', color: (Number(amountReceived) - allocatedTotal) < 0 ? 'var(--danger)' : 'var(--primary)' }}>
              <span>Unallocated (Advance):</span> <span>₹ {(Number(amountReceived) - allocatedTotal).toLocaleString('en-IN')}</span>
            </div>
            {allocatedTotal > (Number(amountReceived)||0) && (
              <div style={{ color: 'var(--danger)', fontSize: '0.8rem', textAlign: 'right' }}>Allocation exceeds received amount!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}