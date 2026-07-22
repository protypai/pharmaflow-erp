import React, { useState } from 'react';
import { Search, Plus, Filter, Edit2, Package, History, X, Save } from 'lucide-react';
import { products, categories, manufacturers } from '../../data/mockData';

export default function ProductMaster() {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [mfgFilter, setMfgFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('basic');

  const filtered = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.genericName.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter && p.categoryId !== parseInt(catFilter)) return false;
    if (mfgFilter && p.manufacturerId !== parseInt(mfgFilter)) return false;
    return true;
  });

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <h2 className="card-title">Product Master</h2>
        <div className="search-bar">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search product name or generic..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '250px' }}
            />
          </div>
          <button className="btn btn-primary" onClick={() => { setModalTab('basic'); setIsModalOpen(true); }}>
            <Plus size={16} /> New Product
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <Filter size={16} /> Filters:
        </div>
        <select 
          className="form-select" 
          value={catFilter} 
          onChange={e => setCatFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select 
          className="form-select" 
          value={mfgFilter} 
          onChange={e => setMfgFilter(e.target.value)}
        >
          <option value="">All Manufacturers</option>
          {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      <div className="card-body no-pad" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Item Code</th>
              <th>Product Details</th>
              <th>Category / Mfg</th>
              <th>Stock Status</th>
              <th>Tax Info</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(prod => {
              const totalStock = prod.batches.reduce((acc, b) => acc + b.qty, 0);
              const isLow = totalStock < prod.minStock;
              return (
                <tr key={prod.id}>
                  <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{prod.code}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{prod.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {prod.genericName} • {prod.packing}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>{prod.category}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{prod.manufacturer}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: isLow ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {totalStock} {prod.saleUnit}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rack: {prod.rack}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>GST: {prod.gst}%</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>HSN: {prod.hsn}</div>
                  </td>
                  <td className="col-actions">
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-outline btn-sm" title="View Batches" style={{ color: 'var(--purple)', borderColor: 'var(--purple)' }}>
                        <Package size={14} />
                      </button>
                      <button className="btn btn-outline btn-sm" title="Stock History" style={{ color: 'var(--info-dark)', borderColor: 'var(--info-dark)' }}>
                        <History size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => setIsModalOpen(true)}>
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* New Product Modal - Deep UI */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '800px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border)', background: '#F8FAFC' }}>
              <h3 className="card-title">Add New Product</h3>
              <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)} style={{ padding: '0.25rem' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              <button 
                className={`btn btn-ghost`} 
                style={{ borderRadius: 0, borderBottom: modalTab === 'basic' ? '2px solid var(--primary)' : '2px solid transparent', color: modalTab === 'basic' ? 'var(--primary)' : 'inherit', padding: '1rem 1.5rem' }}
                onClick={() => setModalTab('basic')}
              >
                1. Basic Details
              </button>
              <button 
                className={`btn btn-ghost`} 
                style={{ borderRadius: 0, borderBottom: modalTab === 'tax' ? '2px solid var(--primary)' : '2px solid transparent', color: modalTab === 'tax' ? 'var(--primary)' : 'inherit', padding: '1rem 1.5rem' }}
                onClick={() => setModalTab('tax')}
              >
                2. Taxation & Compliance
              </button>
              <button 
                className={`btn btn-ghost`} 
                style={{ borderRadius: 0, borderBottom: modalTab === 'inv' ? '2px solid var(--primary)' : '2px solid transparent', color: modalTab === 'inv' ? 'var(--primary)' : 'inherit', padding: '1rem 1.5rem' }}
                onClick={() => setModalTab('inv')}
              >
                3. Inventory & Units
              </button>
            </div>

            <div className="card-body" style={{ overflowY: 'auto' }}>
              {modalTab === 'basic' && (
                <div className="form-row-2">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Product Name (as on pack) <span className="text-danger">*</span></label>
                    <input className="form-input" placeholder="e.g. Dolo 650mg Tablet" />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Generic Name / Composition <span className="text-danger">*</span></label>
                    <input className="form-input" placeholder="e.g. Paracetamol 650mg" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Manufacturer / Company</label>
                    <select className="form-select">
                      <option>Select Company...</option>
                      {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select">
                      <option>Select Category...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Item Code / Barcode</label>
                    <input className="form-input" placeholder="Scan or type..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Packing Description</label>
                    <input className="form-input" placeholder="e.g. 15x10 (15 strips of 10)" />
                  </div>
                </div>
              )}

              {modalTab === 'tax' && (
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">HSN Code <span className="text-danger">*</span></label>
                    <input className="form-input" placeholder="e.g. 3004" maxLength="8" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GST Slab % <span className="text-danger">*</span></label>
                    <select className="form-select">
                      <option>12% (Common Medicines)</option>
                      <option>5% (Life Saving)</option>
                      <option>18% (Supplements/Cosmetics)</option>
                      <option>0% (Exempt)</option>
                      <option>28%</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Drug Schedule</label>
                    <select className="form-select">
                      <option>Not Scheduled (OTC)</option>
                      <option>Schedule H (Prescription)</option>
                      <option>Schedule H1 (Strict Rx)</option>
                      <option>Schedule X (Narcotics)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" style={{ width: '18px', height: '18px' }} />
                      <span style={{ fontWeight: 600 }}>Under DPCO (Price Control)</span>
                    </label>
                  </div>
                </div>
              )}

              {modalTab === 'inv' && (
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Purchase Unit</label>
                    <select className="form-select">
                      <option>Box</option>
                      <option>Case</option>
                      <option>Jar</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sale Unit</label>
                    <select className="form-select">
                      <option>Strip</option>
                      <option>Bottle</option>
                      <option>Tube</option>
                      <option>Box</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Conversion Factor <span className="text-danger">*</span></label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>1 Box =</span>
                      <input className="form-input" type="number" placeholder="Qty" style={{ width: '80px' }} defaultValue="10" />
                      <span>Strips</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Default Rack / Location</label>
                    <input className="form-input" placeholder="e.g. A-12" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Min Stock Level (Sale Units)</label>
                    <input className="form-input" type="number" placeholder="Alert below this" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Stock Level (Sale Units)</label>
                    <input className="form-input" type="number" placeholder="Stop over-ordering" />
                  </div>
                </div>
              )}
            </div>

            <div className="card-header" style={{ borderTop: '1px solid var(--border)', justifyContent: 'flex-end', background: '#F8FAFC' }}>
              <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setIsModalOpen(false)}>
                <Save size={16} /> Save Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
