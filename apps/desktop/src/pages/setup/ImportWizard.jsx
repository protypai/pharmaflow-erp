import React, { useState } from 'react';
import { Database, FileText, CheckCircle, AlertTriangle, ArrowRight, UploadCloud, Link as LinkIcon, Play, Server } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ImportWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // State
  const [file, setFile] = useState(null);
  const [filePath, setFilePath] = useState('');
  const [format, setFormat] = useState('csv');
  const [analysis, setAnalysis] = useState(null);
  const [mappings, setMappings] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(null);
  const [sourceToTargetTable, setSourceToTargetTable] = useState({});

  const targetSchema = {
    "customers": ['name', 'phone', 'email', 'address', 'gstin', 'city', 'state', 'pincode', 'opening_balance', 'code', 'type', 'drug_license', 'area', 'salesman', 'credit_limit', 'credit_days', 'opening_balance_type'],
    "suppliers": ['name', 'phone', 'email', 'address', 'gstin', 'city', 'state', 'pincode', 'opening_balance', 'code', 'drug_license', 'credit_days', 'credit_limit', 'opening_balance_type'],
    "products": ['name', 'code', 'barcode', 'packing', 'hsn_code', 'gst_rate', 'generic_name', 'manufacturer_id', 'category_id', 'rack_id', 'purchase_unit', 'sale_unit', 'conversion_factor', 'schedule', 'min_stock', 'max_stock', 'reorder_qty'],
    "batches": ['batch_no', 'expiry_date', 'mrp', 'ptr', 'purchase_price', 'current_qty', 'product_id', 'pts', 'gst_rate', 'free_qty'],
    "manufacturers": ['name', 'status'],
    "categories": ['name', 'status'],
    "racks": ['code', 'description', 'status'],
    "users": ['name', 'email', 'role', 'is_active'],
    "purchases": ['entry_no', 'supplier_id', 'invoice_no', 'invoice_date', 'gst_type', 'subtotal', 'discount_amount', 'taxable_amount', 'cgst_amount', 'sgst_amount', 'igst_amount', 'net_amount', 'round_off', 'payment_mode', 'paid_amount', 'notes'],
    "purchase_items": ['purchase_id', 'product_id', 'batch_id', 'qty', 'free_qty', 'purchase_price', 'ptr', 'mrp', 'disc_percent', 'disc_amount', 'gst_rate', 'cgst', 'sgst', 'igst', 'taxable_amt', 'net_amount'],
    "sales": ['invoice_no', 'customer_id', 'date', 'salesman', 'gst_type', 'subtotal', 'discount_amount', 'taxable_amount', 'cgst_amount', 'sgst_amount', 'igst_amount', 'net_amount', 'round_off', 'payment_mode', 'paid_amount', 'notes'],
    "sale_items": ['sale_id', 'product_id', 'batch_id', 'qty', 'free_qty', 'mrp', 'ptr', 'sale_price', 'disc_percent', 'disc_amount', 'gst_rate', 'cgst', 'sgst', 'igst', 'taxable_amt', 'net_amount']
  };

  const handleAnalyze = async () => {
    if (!filePath) return;
    setIsProcessing(true);
    setError('');
    try {
      if (window.pharmaAPI && window.pharmaAPI.import) {
        const result = await window.pharmaAPI.import.analyzeSource(filePath, format);
        setAnalysis(result);
        
        // Initialize mappings state
        const initialMappings = {};
        const initialTargets = {};
        result.tables.forEach((t) => { 
          initialMappings[t] = []; 
          initialTargets[t] = '';
        });
        setMappings(initialMappings);
        setSourceToTargetTable(initialTargets);
        
        setStep(2); // Go to mapping
      } else {
        throw new Error('API not available');
      }
    } catch (err) {
      setError(err.message || 'Analysis failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const addMapping = (table) => {
    setMappings(prev => ({
      ...prev,
      [table]: [...prev[table], { sourceField: '', targetField: '' }]
    }));
  };

  const updateMapping = (table, index, field, value) => {
    setMappings(prev => {
      const newTableMappings = [...prev[table]];
      newTableMappings[index] = { ...newTableMappings[index], [field]: value };
      return { ...prev, [table]: newTableMappings };
    });
  };

  const removeMapping = (table, index) => {
    setMappings(prev => {
      const newTableMappings = [...prev[table]];
      newTableMappings.splice(index, 1);
      return { ...prev, [table]: newTableMappings };
    });
  };

  const handleTargetTableChange = (table, selectedTargetTable) => {
    setSourceToTargetTable(prev => ({ ...prev, [table]: selectedTargetTable }));
    
    if (selectedTargetTable) {
      const targetFields = targetSchema[selectedTargetTable];
      const sourceCols = analysis.columns[table];
      const autoMappings = [];
      
      sourceCols.forEach(col => {
        const matchingTarget = targetFields.find(tf => 
          tf.toLowerCase() === col.toLowerCase() || 
          tf.toLowerCase().replace('_', '') === col.toLowerCase().replace(' ', '')
        );
        if (matchingTarget) {
          autoMappings.push({
            sourceField: col,
            targetField: `${selectedTargetTable}.${matchingTarget}`
          });
        }
      });
      
      setMappings(prev => ({ ...prev, [table]: autoMappings }));
    } else {
      setMappings(prev => ({ ...prev, [table]: [] }));
    }
  };

  const handleStartImport = async () => {
    setIsProcessing(true);
    setError('');
    setProgress(null);
    setStep(4); // Go to progress screen

    try {
      if (window.pharmaAPI && window.pharmaAPI.import) {
        window.pharmaAPI.import.onProgress((p) => {
          setProgress(p);
          if (p.step === 'completed') {
            setStep(5); // Success
            window.pharmaAPI.import.removeProgressListener();
          }
        });

        await window.pharmaAPI.import.startImport(filePath, format, {
          batchSize: 500,
          mappingConfig: mappings
        });
      }
    } catch (err) {
      setError(err.message || 'Import failed');
      setStep(3); // Go back to review
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={24} color="var(--primary)" /> Data Import Wizard
          </h1>
          <div className="page-sub">Migrate your legacy data into PharmaFlow ERP</div>
        </div>
        {step < 4 && (
          <button className="btn btn-ghost" onClick={() => navigate('/settings')}>Cancel</button>
        )}
      </div>

      <div className="card">
        {/* STEP 1: Select Source */}
        {step === 1 && (
          <div className="card-body">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Step 1: Select Source File</h3>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <button 
                className={`btn ${format === 'csv' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFormat('csv')}
              >
                <FileText size={16} /> CSV / Excel
              </button>
              <button 
                className={`btn ${format === 'sql' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFormat('sql')}
              >
                <Server size={16} /> SQLite Database (.db)
              </button>
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">File Path</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="C:\path\to\your\file.csv"
                  value={filePath}
                  onChange={e => setFilePath(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button 
                  className="btn btn-outline" 
                  onClick={async () => {
                    if (window.pharmaAPI && window.pharmaAPI.import.selectFile) {
                      const path = await window.pharmaAPI.import.selectFile();
                      if (path) setFilePath(path);
                    } else {
                      alert('File picker is not available in the web preview.');
                    }
                  }}
                >
                  Browse...
                </button>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Enter the absolute path to your file or click Browse.
              </div>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <button 
              className="btn btn-primary" 
              onClick={handleAnalyze} 
              disabled={!filePath || isProcessing}
            >
              {isProcessing ? 'Analyzing...' : 'Next: Analyze File'} <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2: Field Mapping */}
        {step === 2 && analysis && (
          <div className="card-body">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Step 2: Map Fields</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              We found {analysis.tables.length} table(s). Please map your columns to our system fields.
            </p>

            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '1rem' }}>
              {analysis.tables.map((table) => (
                <div key={table} style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', opacity: analysis.recordCounts[table] === 0 ? 0.7 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                    <h4 style={{ fontWeight: 600, margin: 0 }}>
                      Source: {table} <span style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>({analysis.recordCounts[table]} records)</span>
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Import into:</span>
                      <select 
                        className="form-select"
                        style={{ minWidth: '200px' }}
                        value={sourceToTargetTable[table] || ''}
                        onChange={(e) => handleTargetTableChange(table, e.target.value)}
                      >
                        <option value="">-- Select Target Table --</option>
                        {Object.keys(targetSchema).map(tName => (
                          <option key={tName} value={tName}>{tName.charAt(0).toUpperCase() + tName.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {sourceToTargetTable[table] ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                        <button className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem' }} onClick={() => addMapping(table)}>
                          + Add Field Mapping
                        </button>
                      </div>
                      
                      {mappings[table]?.map((mapping, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem', padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                          <select 
                            className="form-select" 
                            style={{ flex: 1 }}
                            value={mapping.sourceField} 
                            onChange={e => updateMapping(table, idx, 'sourceField', e.target.value)}
                          >
                            <option value="">-- Source Column --</option>
                            {analysis.columns[table].map((col) => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                          
                          <LinkIcon size={16} color="var(--primary)" />
                          
                          <select 
                            className="form-select" 
                            style={{ flex: 1 }}
                            value={mapping.targetField} 
                            onChange={e => updateMapping(table, idx, 'targetField', e.target.value)}
                          >
                            <option value="">-- Target Field --</option>
                            {targetSchema[sourceToTargetTable[table]].map(f => (
                              <option key={`${sourceToTargetTable[table]}.${f}`} value={`${sourceToTargetTable[table]}.${f}`}>
                                {f}
                              </option>
                            ))}
                          </select>

                          <button className="btn btn-ghost" style={{ color: 'red', padding: '0.5rem' }} onClick={() => removeMapping(table, idx)}>✕</button>
                        </div>
                      ))}
                      
                      {(!mappings[table] || mappings[table].length === 0) && (
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                          No fields mapped. Click "+ Add Field Mapping" to map columns.
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '2rem 1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                      Please select a target table from the dropdown above to begin mapping fields.
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
              <button className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>Next: Review</button>
            </div>
          </div>
        )}

        {/* STEP 3: Review */}
        {step === 3 && analysis && (
          <div className="card-body">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Step 3: Review & Import</h3>
            
            <div style={{ background: 'var(--primary-50)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Summary</h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                {analysis.tables.filter(table => analysis.recordCounts[table] > 0).map((table) => {
                  const mappedCount = mappings[table]?.length || 0;
                  if (mappedCount > 0) {
                    return (
                      <li key={table}>
                        Will import <strong>{analysis.recordCounts[table]}</strong> records from <strong>{table}</strong> using {mappedCount} mapped fields.
                      </li>
                    );
                  }
                  return null;
                })}
              </ul>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
              <button className="btn btn-outline" onClick={() => setStep(2)}>Back to Mapping</button>
              <button className="btn btn-primary" onClick={handleStartImport} style={{ background: 'var(--success)', borderColor: 'var(--success)' }}>
                <Play size={16} /> Start Import
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Progress */}
        {step === 4 && (
          <div className="card-body" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Importing Data...</h3>
            
            <div style={{ marginBottom: '2rem' }}>
              {progress ? (
                <>
                  <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
                    {progress.entity ? `Importing ${progress.entity}` : 'Processing...'}
                  </div>
                  {progress.total > 0 && (
                    <>
                      <div style={{ 
                        width: '100%', 
                        height: '8px', 
                        background: 'var(--border)', 
                        borderRadius: '4px',
                        overflow: 'hidden',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{ 
                          width: `${Math.min(100, (progress.imported / progress.total) * 100)}%`, 
                          height: '100%', 
                          background: 'var(--primary)',
                          transition: 'width 0.3s'
                        }} />
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {progress.imported} / {progress.total} records
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div style={{ color: 'var(--text-secondary)' }}>Initializing engine...</div>
              )}
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Please do not close the application during this process.
            </p>
          </div>
        )}

        {/* STEP 5: Success */}
        {step === 5 && (
          <div className="card-body" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <CheckCircle size={48} color="var(--success)" />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Import Completed!</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Your legacy data has been successfully mapped and imported into PharmaFlow ERP.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/settings')}>
              Return to Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
