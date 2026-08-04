import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Eye, EyeOff, Lock, User, ArrowRight, Shield, Sparkles, Download } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasUpdate, setHasUpdate] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const navigate = useNavigate();

  // Show a reason if we were bounced here by a forced logout (e.g. account deactivated).
  useEffect(() => {
    const reason = localStorage.getItem('logoutReason');
    if (reason) {
      setError(reason);
      localStorage.removeItem('logoutReason');
    }
  }, []);

  // Auto-login check
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const performInitialSync = async (data) => {
    const ops = [];
    
    (data.customers || []).forEach(c => {
      ops.push({
        sql: 'INSERT OR REPLACE INTO customers (id, company_id, code, name, type, gstin, drug_license, phone, email, address, area, city, state, pincode, salesman, credit_limit, credit_days, opening_balance, opening_balance_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        params: [c.id, c.companyId, c.code, c.name, c.type, c.gstin, c.drugLicense, c.phone, c.email, c.address, c.area, c.city, c.state, c.pincode, c.salesman, c.creditLimit, c.creditDays, c.openingBalance, c.openingBalanceType, c.status]
      });
    });

    (data.suppliers || []).forEach(s => {
      ops.push({
        sql: 'INSERT OR REPLACE INTO suppliers (id, company_id, code, name, gstin, drug_license, phone, email, address, city, state, pincode, credit_days, credit_limit, opening_balance, opening_balance_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        params: [s.id, s.companyId, s.code, s.name, s.gstin, s.drugLicense, s.phone, s.email, s.address, s.city, s.state, s.pincode, s.creditDays, s.creditLimit, s.openingBalance, s.openingBalanceType, s.status]
      });
    });

    (data.products || []).forEach(p => {
      ops.push({
        sql: 'INSERT OR REPLACE INTO products (id, company_id, code, barcode, name, generic_name, manufacturer_id, category_id, rack_id, packing, purchase_unit, sale_unit, conversion_factor, hsn_code, gst_rate, min_stock, max_stock, reorder_qty, discontinued, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        params: [p.id, p.companyId, p.code, p.barcode, p.name, p.genericName, p.manufacturerId, p.categoryId, p.rackId, p.packing, p.purchaseUnit, p.saleUnit, p.conversionFactor, p.hsnCode, p.gstRate, p.minStock, p.maxStock, p.reorderQty, p.discontinued ? 1 : 0, p.status]
      });
    });

    (data.batches || []).forEach(b => {
      ops.push({
        sql: 'INSERT OR REPLACE INTO batches (id, product_id, batch_no, expiry_date, mrp, ptr, pts, purchase_price, gst_rate, current_qty, free_qty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        params: [b.id, b.productId, b.batchNo, b.expiryDate, b.mrp, b.ptr, b.pts, b.purchasePrice, b.gstRate, b.currentQty, b.freeQty]
      });
    });

    (data.manufacturers || []).forEach(m => {
      ops.push({
        sql: 'INSERT OR REPLACE INTO manufacturers (id, company_id, name, status) VALUES (?, ?, ?, ?)',
        params: [m.id, m.companyId, m.name, m.status]
      });
    });

    (data.categories || []).forEach(c => {
      ops.push({
        sql: 'INSERT OR REPLACE INTO categories (id, company_id, name, status) VALUES (?, ?, ?, ?)',
        params: [c.id, c.companyId, c.name, c.status]
      });
    });

    (data.racks || []).forEach(r => {
      ops.push({
        sql: 'INSERT OR REPLACE INTO racks (id, company_id, code, description, status) VALUES (?, ?, ?, ?, ?)',
        params: [r.id, r.companyId, r.code, r.description, r.status]
      });
    });

    (data.sales || []).forEach(item => {
      ops.push({
        sql: 'INSERT OR REPLACE INTO sales (id, company_id, invoice_no, customer_id, date, salesman, gst_type, subtotal, discount_amount, taxable_amount, cgst_amount, sgst_amount, igst_amount, net_amount, round_off, payment_mode, paid_amount, notes, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        params: [item.id, item.companyId, item.invoiceNo, item.customerId, item.date, item.salesman, item.gstType, item.subtotal, item.discountAmount, item.taxableAmount, item.cgstAmount, item.sgstAmount, item.igstAmount, item.netAmount, item.roundOff, item.paymentMode, item.paidAmount, item.notes, item.status, item.createdAt, item.updatedAt]
      });
    });

    (data.saleItems || []).forEach(item => {
      ops.push({
        sql: 'INSERT OR REPLACE INTO sale_items (id, sale_id, product_id, batch_id, qty, mrp, ptr, sale_price, disc_percent, disc_amount, gst_rate, cgst, sgst, igst, taxable_amt, net_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        params: [item.id, item.saleId, item.productId, item.batchId, item.qty, item.mrp, item.ptr, item.salePrice, item.discPercent, item.discAmount, item.gstRate, item.cgst, item.sgst, item.igst, item.taxableAmt, item.netAmount]
      });
    });

    (data.purchases || []).forEach(item => {
      ops.push({
        sql: 'INSERT OR REPLACE INTO purchases (id, company_id, entry_no, supplier_id, invoice_no, invoice_date, gst_type, subtotal, discount_amount, taxable_amount, cgst_amount, sgst_amount, igst_amount, net_amount, round_off, payment_mode, paid_amount, notes, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        params: [item.id, item.companyId, item.entryNo, item.supplierId, item.invoiceNo, item.invoiceDate, item.gstType, item.subtotal, item.discountAmount, item.taxableAmount, item.cgstAmount, item.sgstAmount, item.igstAmount, item.netAmount, item.roundOff, item.paymentMode, item.paidAmount, item.notes, item.status, item.createdAt, item.updatedAt]
      });
    });

    (data.purchaseItems || []).forEach(item => {
      ops.push({
        sql: 'INSERT OR REPLACE INTO purchase_items (id, purchase_id, product_id, batch_id, qty, free_qty, purchase_price, ptr, mrp, disc_percent, disc_amount, gst_rate, cgst, sgst, igst, taxable_amt, net_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        params: [item.id, item.purchaseId, item.productId, item.batchId, item.qty, item.freeQty, item.purchasePrice, item.ptr, item.mrp, item.discPercent, item.discAmount, item.gstRate, item.cgst, item.sgst, item.igst, item.taxableAmt, item.netAmount]
      });
    });

    (data.purchaseReturns || []).forEach(item => {
      ops.push({
        sql: 'INSERT OR REPLACE INTO purchase_returns (id, company_id, entry_no, purchase_id, supplier_id, return_date, reason, debit_note_no, net_amount, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        params: [item.id, item.companyId, item.entryNo, item.purchaseId, item.supplierId, item.returnDate, item.reason, item.debitNoteNo, item.netAmount, item.status, item.createdAt, item.updatedAt]
      });
    });

    (data.purchaseReturnItems || []).forEach(item => {
      ops.push({
        sql: 'INSERT OR REPLACE INTO purchase_return_items (id, return_id, product_id, batch_id, qty, mrp, ptr, net_amount, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        params: [item.id, item.returnId, item.productId, item.batchId, item.qty, item.mrp, item.ptr, item.netAmount, item.reason]
      });
    });

    (data.saleReturns || []).forEach(item => {
      ops.push({
        sql: 'INSERT OR REPLACE INTO sale_returns (id, company_id, entry_no, sale_id, customer_id, return_date, reason, credit_note_no, net_amount, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        params: [item.id, item.companyId, item.entryNo, item.saleId, item.customerId, item.returnDate, item.reason, item.creditNoteNo, item.netAmount, item.status, item.createdAt, item.updatedAt]
      });
    });

    (data.saleReturnItems || []).forEach(item => {
      ops.push({
        sql: 'INSERT OR REPLACE INTO sale_return_items (id, return_id, product_id, batch_id, qty, mrp, sale_price, net_amount, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        params: [item.id, item.returnId, item.productId, item.batchId, item.qty, item.mrp, item.salePrice, item.netAmount, item.reason]
      });
    });

    (data.receipts || []).forEach(item => {
      ops.push({
        sql: 'INSERT OR REPLACE INTO receipts (id, company_id, receipt_no, customer_id, date, amount, payment_mode, cheque_no, cheque_date, bank_name, utr_no, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        params: [item.id, item.companyId, item.receiptNo, item.customerId, item.date, item.amount, item.paymentMode, item.chequeNo, item.chequeDate, item.bankName, item.utrNo, item.notes, item.createdAt, item.updatedAt]
      });
    });

    (data.payments || []).forEach(item => {
      ops.push({
        sql: 'INSERT OR REPLACE INTO payments (id, company_id, payment_no, supplier_id, date, amount, payment_mode, cheque_no, cheque_date, bank_name, utr_no, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        params: [item.id, item.companyId, item.paymentNo, item.supplierId, item.date, item.amount, item.paymentMode, item.chequeNo, item.chequeDate, item.bankName, item.utrNo, item.notes, item.createdAt, item.updatedAt]
      });
    });

    (data.stockAdjustments || []).forEach(item => {
      ops.push({
        sql: 'INSERT OR REPLACE INTO stock_adjustments (id, company_id, entry_no, date, reason, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        params: [item.id, item.companyId, item.entryNo, item.date, item.reason, item.notes, item.createdAt]
      });
    });

    (data.stockAdjustmentItems || []).forEach(item => {
      ops.push({
        sql: 'INSERT OR REPLACE INTO stock_adjustment_items (id, adjustment_id, product_id, batch_id, system_qty, physical_qty, difference_qty, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        params: [item.id, item.adjustmentId, item.productId, item.batchId, item.systemQty, item.physicalQty, item.differenceQty, item.reason]
      });
    });

    (data.journals || []).forEach(item => {
      ops.push({
        sql: 'INSERT OR REPLACE INTO journals (id, company_id, entry_no, date, narration, debit_amt, credit_amt, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        params: [item.id, item.companyId, item.entryNo, item.date, item.narration, item.debitAmt, item.creditAmt, item.createdAt]
      });
    });

    (data.journalEntries || []).forEach(item => {
      ops.push({
        sql: 'INSERT OR REPLACE INTO journal_entries (id, journal_id, particular, type, amount) VALUES (?, ?, ?, ?, ?)',
        params: [item.id, item.journalId, item.particular, item.type, item.amount]
      });
    });

    if (ops.length > 0) {
      await window.pharmaAPI.db.transaction(ops);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) { setError('Please enter username and password.'); return; }
    setLoading(true);

    try {
      // 1. Try Cloud Backend Auth first
      let cloudSuccess = false;
      try {
        const cloudRes = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: username, password }),
        });

        const cloudData = await cloudRes.json();

        if (cloudRes.status === 403 || (cloudData.message && cloudData.message.includes('pending'))) {
          setError('Your account is pending Super Admin approval. Please contact administrator.');
          setLoading(false);
          return;
        }

        if (cloudRes.ok && cloudData.success && cloudData.data) {
          const { accessToken, refreshToken, user } = cloudData.data;
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);

          if (window.pharmaAPI?.auth) {
            await window.pharmaAPI.auth.setToken(accessToken, refreshToken);
          }

          // Sync into local SQLite if window.pharmaAPI exists
          if (window.pharmaAPI?.db) {
            try {
              // Workspace Protection Check
              const compRes = await window.pharmaAPI.db.query('SELECT id FROM companies LIMIT 1');
              if (compRes?.data && compRes.data.length > 0) {
                const existingCompanyId = compRes.data[0].id;
                const newCompanyId = user.company?.id || user.companyId || 'comp_001';
                
                if (existingCompanyId !== newCompanyId) {
                  console.warn('Workspace change detected! Wiping local database for new company.');
                  if (window.pharmaAPI.db.reset) {
                    await window.pharmaAPI.db.reset();
                  }
                }
              }

              if (user.company) {
                await window.pharmaAPI.db.run(
                  `INSERT OR REPLACE INTO companies (
                    id, name, short_name, email, est_year, authorized_sign,
                    address, city, pincode, state, state_code,
                    gstin, pan, drug_license_20b, drug_license_21b,
                    fssai_license, bank_name, bank_account, bank_ifsc, upi_id
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [
                    user.company.id, 
                    user.company.name, 
                    user.company.shortName || user.company.name, 
                    user.email,
                    user.company.estYear || null,
                    user.company.authorizedSign || null,
                    user.company.address || null,
                    user.company.city || null,
                    user.company.pincode || null,
                    user.company.state || null,
                    user.company.stateCode || null,
                    user.company.gstin || null,
                    user.company.pan || null,
                    user.company.drugLicense20B || null,
                    user.company.drugLicense21B || null,
                    user.company.fssaiLicense || null,
                    user.company.bankName || null,
                    user.company.bankAccount || null,
                    user.company.bankIfsc || null,
                    user.company.upiId || null
                  ]
                );
              }
              // Store a bcrypt hash (never the plaintext) so offline login can
              // verify with bcrypt.compare. The cloud response does not return the
              // password hash, so we derive it locally from the just-verified password.
              let localPasswordHash = '';
              if (window.pharmaAPI?.auth?.hashPassword) {
                try {
                  localPasswordHash = await window.pharmaAPI.auth.hashPassword(password);
                } catch (hashErr) {
                  console.warn('Failed to hash password for local storage:', hashErr);
                }
              }
              await window.pharmaAPI.db.run(
                'INSERT OR REPLACE INTO users (id, company_id, name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
                [user.id, user.companyId || user.company?.id || 'comp_001', user.name, user.email, localPasswordHash, user.role || 'admin']
              );

              // Initial Cloud Restore check
              const custRes = await window.pharmaAPI.db.query('SELECT COUNT(*) as c FROM customers');
              if (custRes?.data && custRes.data[0]?.c === 0) {
                setSyncing(true);
                const syncRes = await fetch(`${API_BASE_URL}/api/v1/sync/initial`, {
                  headers: { Authorization: `Bearer ${accessToken}` }
                });
                if (syncRes.ok) {
                  const syncData = await syncRes.json();
                  if (syncData.success && syncData.data) {
                    await performInitialSync(syncData.data);
                  }
                }
                setSyncing(false);
              }
            } catch (sqErr) {
              console.warn('Local SQLite sync warning:', sqErr);
            }
          }

          cloudSuccess = true;
          navigate('/dashboard');
          return;
        }
      } catch (cloudErr) {
        console.warn('Cloud Backend unreachable, attempting local authentication...', cloudErr);
      }

      if (cloudSuccess) return;

      // 2. Fallback to local SQLite DB if cloud unavailable.
      // Never compare plaintext against the stored hash — verify via bcrypt in the
      // electron main process (auth:verifyLocalPassword).
      if (window.pharmaAPI?.auth?.verifyLocalPassword) {
        const verifyRes = await window.pharmaAPI.auth.verifyLocalPassword(username, password);
        if (verifyRes?.success && verifyRes.user) {
          localStorage.setItem('user', JSON.stringify(verifyRes.user));
          // Offline mode has no cloud JWT; set a local session marker so the
          // client-side route guard permits access while disconnected.
          localStorage.setItem('accessToken', 'offline-session');
          navigate('/dashboard');
          return;
        }
      }

      setError('Invalid username or password, or account is pending approval.');
    } catch (err) {
      console.error('Login error:', err);
      setError('Login error: ' + (err.message || 'Failed to authenticate'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #F0F7FF 0%, #EFF6FF 40%, #F1F5F9 100%)',
    }}>
      {/* Left Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'var(--sidebar-bg)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(37,99,235,0.15) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(37,99,235,0.1) 0%, transparent 40%),
                            radial-gradient(circle at 60% 80%, rgba(124,58,237,0.08) 0%, transparent 40%)`,
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 420, width: '100%' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
            <div style={{
              width: 52, height: 52,
              background: 'var(--primary)',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
            }}>
              <Pill size={26} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', lineHeight: 1.1 }}>
                Pharma ERP
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--sidebar-text)', marginTop: 2 }}>
                Pharmaceutical Distribution System
              </div>
            </div>
          </div>

          {/* Taglines */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.2 }}>
              Modern ERP for<br />Pharma Distributors
            </h1>
            <p style={{ color: 'var(--sidebar-text)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Replace your old software with a faster, smarter, and more modern solution. Same features. Better experience.
            </p>
          </div>

          {/* Feature Pills */}
          {['Purchase & Sales Management', 'Batch & Expiry Tracking', 'GST-Ready Reports', 'Customer Outstanding'].map(f => (
            <div key={f} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              marginBottom: '0.5rem',
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: 'rgba(37,99,235,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#60A5FA' }} />
              </div>
              <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div style={{
        width: '480px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'white',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.06)',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* Software Update Notification Banner */}
          {hasUpdate && (
            <div style={{
              background: '#EFF6FF', border: '1px solid #BFDBFE',
              borderRadius: '8px', padding: '0.75rem 1rem',
              marginBottom: '1.5rem', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: '0.75rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} color="#2563EB" />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1E40AF' }}>Update Available</div>
                  <div style={{ fontSize: '0.72rem', color: '#3B82F6' }}>A new version is ready to install</div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  if (window.pharmaAPI?.update?.quitAndInstall) {
                    window.pharmaAPI.update.quitAndInstall();
                  } else {
                    alert('Installing latest update...');
                    window.location.reload();
                  }
                }}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
              >
                <Download size={12} /> Update Now
              </button>
            </div>
          )}

          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
              Welcome back
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Sign in to your Pharma ERP account
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            {/* Username */}
            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="input-wrapper">
                <span className="input-icon"><User size={15} /></span>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  id="login-username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <span className="input-icon"><Lock size={15} /></span>
                <input
                  className="form-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  id="login-password"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '0.625rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="remember-me"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                style={{ width: 14, height: 14, accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <label htmlFor="remember-me" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Remember me on this device
              </label>
            </div>

            {error && (
              <div style={{
                background: 'var(--danger-light)', border: '1px solid #FECACA',
                borderRadius: 'var(--radius-sm)', padding: '0.625rem 0.875rem',
                fontSize: '0.8rem', color: 'var(--danger)',
              }}>
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              id="login-submit"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: 'white', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Signing in…
                </>
              ) : (
                <>
                  {syncing ? 'Syncing device data...' : 'Sign In'}
                  {!syncing && <ArrowRight size={16} />}
                </>
              )}
            </button>

          </form>

          {/* Register & Admin Links */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <a
              href="/register"
              style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}
              onClick={(e) => { e.preventDefault(); navigate('/register'); }}
            >
              Register New Company
            </a>
            <a
              href="/admin/login"
              style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}
              onClick={(e) => { e.preventDefault(); navigate('/admin/login'); }}
            >
              Super Admin Portal →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
