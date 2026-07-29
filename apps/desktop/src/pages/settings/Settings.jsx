import React, { useState, useEffect } from 'react';
import { Save, FileText, Settings as SettingsIcon, Database, CheckSquare, Layers, RefreshCw } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('invoicing');
  const [appVersion, setAppVersion] = useState('1.0.18');
  const [checking, setChecking] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');

  // Settings State
  const [settings, setSettings] = useState({
    invoicePrefix: 'INV/25-26/',
    nextInvoiceNumber: '42',
    printFormat: 'A4',
    printCopies: '2',
    terms: '1. Goods once sold will not be taken back.\\n2. Interest @24% p.a. will be charged if payment is delayed beyond 30 days.\\n3. Subject to Mumbai Jurisdiction.',
    allowNegativeStock: false,
    warnNearExpiry: true,
    blockExpired: true,
    enforceFefo: true,
    financialYear: '25-26',
    uiTheme: 'light',
    autoBackup: 'daily'
  });

  useEffect(() => {
    const saved = localStorage.getItem('pharmaSettings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const handleSettingChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const saveSettings = () => {
    localStorage.setItem('pharmaSettings', JSON.stringify(settings));
    alert('Settings saved successfully!');
  };

  useEffect(() => {
    if (window.pharmaAPI && window.pharmaAPI.app) {
      window.pharmaAPI.app.getVersion()
        .then(ver => setAppVersion(ver))
        .catch(err => console.error('Failed to get app version:', err));
    }
  }, []);

  const handleCheckForUpdates = async () => {
    if (!window.pharmaAPI || !window.pharmaAPI.update) {
      alert('Update service not available in development server browser context.');
      return;
    }
    setChecking(true);
    setUpdateStatus('Checking for updates...');
    try {
      const result = await window.pharmaAPI.update.check();
      if (result && result.success) {
        setUpdateStatus('Checking finished.');
        // The update handler will trigger the global update prompt if update is found.
      } else {
        setUpdateStatus(result.error || 'Failed to check for updates.');
      }
    } catch (err) {
      setUpdateStatus('Error checking for updates.');
    } finally {
      setChecking(false);
      setTimeout(() => setUpdateStatus(''), 5000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">System Settings</h1>
          <div className="page-sub">Configure billing rules and application preferences</div>
        </div>
        <button className="btn btn-primary" onClick={saveSettings}><Save size={16} /> Save Configuration</button>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar Tabs */}
        <div className="card" style={{ width: '250px', padding: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              className={`btn ${activeTab === 'invoicing' ? 'btn-primary' : 'btn-ghost'}`} 
              style={{ justifyContent: 'flex-start' }}
              onClick={() => setActiveTab('invoicing')}
            >
              <FileText size={16} /> Invoicing Details
            </button>
            <button 
              className={`btn ${activeTab === 'rules' ? 'btn-primary' : 'btn-ghost'}`} 
              style={{ justifyContent: 'flex-start' }}
              onClick={() => setActiveTab('rules')}
            >
              <CheckSquare size={16} /> Inventory Rules
            </button>
            <button 
              className={`btn ${activeTab === 'system' ? 'btn-primary' : 'btn-ghost'}`} 
              style={{ justifyContent: 'flex-start' }}
              onClick={() => setActiveTab('system')}
            >
              <SettingsIcon size={16} /> System & Theme
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="card" style={{ flex: 1, overflowY: 'auto' }}>
          <div className="card-body">
            {activeTab === 'invoicing' && (
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} color="var(--primary)" /> Billing & Invoice Formatting
                </h3>
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Invoice Prefix</label>
                    <input className="form-input" value={settings.invoicePrefix} onChange={e => handleSettingChange('invoicePrefix', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Next Invoice Number</label>
                    <input className="form-input" type="number" value={settings.nextInvoiceNumber} onChange={e => handleSettingChange('nextInvoiceNumber', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Print Format</label>
                    <select className="form-select" value={settings.printFormat} onChange={e => handleSettingChange('printFormat', e.target.value)}>
                      <option value="A4">A4 Full Page</option>
                      <option value="A5">A5 Half Page</option>
                      <option value="Thermal">Thermal 80mm</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Number of Print Copies</label>
                    <select className="form-select" value={settings.printCopies} onChange={e => handleSettingChange('printCopies', e.target.value)}>
                      <option value="1">1 (Original)</option>
                      <option value="2">2 (Original + Duplicate)</option>
                      <option value="3">3 (Original + Duplicate + Transport)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Terms and Conditions (Printed on Invoice)</label>
                    <textarea className="form-input" rows={4} value={settings.terms} onChange={e => handleSettingChange('terms', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'rules' && (
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckSquare size={18} color="var(--primary)" /> Inventory & Sales Rules
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ width: '18px', height: '18px' }} checked={settings.allowNegativeStock} onChange={e => handleSettingChange('allowNegativeStock', e.target.checked)} />
                    <div>
                      <div style={{ fontWeight: 600 }}>Allow Negative Stock Billing</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Allow creating sales invoices even if system stock is zero (fixes physical vs system mismatch instantly).</div>
                    </div>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ width: '18px', height: '18px' }} checked={settings.warnNearExpiry} onChange={e => handleSettingChange('warnNearExpiry', e.target.checked)} />
                    <div>
                      <div style={{ fontWeight: 600 }}>Warn on selling Near Expiry stock</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Show a warning popup if batch expires within 30 days.</div>
                    </div>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" disabled style={{ width: '18px', height: '18px' }} checked={settings.blockExpired} />
                    <div>
                      <div style={{ fontWeight: 600 }}>Block sale of Expired Medicines</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Legally mandatory. System will not allow adding expired batches to any sales invoice.</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ width: '18px', height: '18px' }} checked={settings.enforceFefo} onChange={e => handleSettingChange('enforceFefo', e.target.checked)} />
                    <div>
                      <div style={{ fontWeight: 600 }}>Enforce FEFO (First Expire First Out)</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Automatically suggest the batch closest to expiry when generating sales.</div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <SettingsIcon size={18} color="var(--primary)" /> System Utilities
                </h3>
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Financial Year</label>
                    <select className="form-select" value={settings.financialYear} onChange={e => handleSettingChange('financialYear', e.target.value)}>
                      <option value="25-26">April 2025 - March 2026</option>
                      <option value="24-25">April 2024 - March 2025</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">UI Theme</label>
                    <select className="form-select" value={settings.uiTheme} onChange={e => handleSettingChange('uiTheme', e.target.value)}>
                      <option value="light">Light Mode</option>
                    </select>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dark mode restricted by admin.</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Auto Backup Frequency</label>
                    <select className="form-select" value={settings.autoBackup} onChange={e => handleSettingChange('autoBackup', e.target.value)}>
                      <option value="daily">Daily at 11:00 PM</option>
                      <option value="close">On Application Close</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>

                {/* Update Section */}
                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>App Updates</h4>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    background: 'var(--primary-50)', 
                    border: '1px solid var(--primary-light)', 
                    borderRadius: 'var(--radius-sm)', 
                    padding: '1.25rem' 
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        PharmaFlow ERP v{appVersion}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Ensure you are running the latest version for updated GST compliance and security rules.
                      </div>
                      {updateStatus && (
                        <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--primary)', marginTop: '0.5rem' }}>
                          {updateStatus}
                        </div>
                      )}
                    </div>
                    <button 
                      className="btn btn-secondary" 
                      onClick={handleCheckForUpdates}
                      disabled={checking}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <RefreshCw size={14} className={checking ? 'spin' : ''} />
                      {checking ? 'Checking...' : 'Check for Updates'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}