import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Edit2, Package, History, X, Save } from 'lucide-react';
import { syncEntity } from '../../services/dataService';
import { formatStock } from '../../utils/units';

export default function ProductMaster() {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [mfgFilter, setMfgFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('basic');

  const [isBatchesModalOpen, setIsBatchesModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productBatches, setProductBatches] = useState([]);
  const [productHistory, setProductHistory] = useState([]);

  const [productsList, setProductsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [racks, setRacks] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    id: null,
    name: '', generic_name: '', manufacturer_id: '', category_id: '',
    code: '', barcode: '', packing: '',
    hsn_code: '', gst_rate: 12, schedule: 'Not Scheduled (OTC)',
    purchase_unit: 'Box', sale_unit: 'Strip', conversion_factor: 10,
    rack_id: '', min_stock: 0, max_stock: 0
  });
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    try {
      const prodsRes = await window.pharmaAPI.db.query(`
        SELECT p.*, c.name as category_name, m.name as mfg_name, r.code as rack_code,
               IFNULL(b_agg.totalQty, 0) as totalQty
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
        LEFT JOIN racks r ON p.rack_id = r.id
        LEFT JOIN (
           SELECT product_id, SUM(current_qty) as totalQty
           FROM batches
           WHERE current_qty > 0
           GROUP BY product_id
        ) b_agg ON b_agg.product_id = p.id
        WHERE COALESCE(p.status, 'active') <> 'inactive'
        ORDER BY p.name ASC
      `);
      setProductsList(prodsRes?.data || []);

      const catsRes = await window.pharmaAPI.db.query("SELECT * FROM categories WHERE COALESCE(status, 'active') <> 'inactive' ORDER BY name ASC");
      setCategories(catsRes?.data || []);

      const mfgsRes = await window.pharmaAPI.db.query("SELECT * FROM manufacturers WHERE COALESCE(status, 'active') <> 'inactive' ORDER BY name ASC");
      setManufacturers(mfgsRes?.data || []);

      const racksRes = await window.pharmaAPI.db.query("SELECT * FROM racks WHERE COALESCE(status, 'active') <> 'inactive' ORDER BY code ASC");
      setRacks(racksRes?.data || []);
    } catch (err) {
      console.error('Failed to load product data', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    setErrorMsg('');
    if (!formData.name || !formData.hsn_code || !formData.conversion_factor) {
      setErrorMsg("Name, HSN Code, and Conversion Factor are required.");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userRes = await window.pharmaAPI.db.query("SELECT company_id FROM users WHERE id = ? OR email = ?", [user.id || '', user.email || '']);
      if (!userRes?.data?.length) throw new Error("Admin user not found in local DB");
      const companyId = userRes.data[0].company_id;
      const code = formData.code || ('ITM' + Math.floor(Math.random() * 100000));
      const isNew = !formData.id;
      const id = isNew ? 'PROD-' + Date.now() : formData.id;

      if (!isNew) {
        const res = await window.pharmaAPI.db.run(`
          UPDATE products SET
            code = ?, barcode = ?, name = ?, generic_name = ?, manufacturer_id = ?, category_id = ?,
            rack_id = ?, packing = ?, purchase_unit = ?, sale_unit = ?, conversion_factor = ?,
            hsn_code = ?, gst_rate = ?, schedule = ?, min_stock = ?, max_stock = ?, updated_at = datetime('now')
          WHERE id = ?
        `, [
          code, formData.barcode, formData.name, formData.generic_name, 
          formData.manufacturer_id || null, formData.category_id || null, formData.rack_id || null, 
          formData.packing, formData.purchase_unit, formData.sale_unit, formData.conversion_factor, 
          formData.hsn_code, formData.gst_rate, formData.schedule, formData.min_stock, formData.max_stock,
          formData.id
        ]);
        if (!res.success) { setErrorMsg("Database error: " + res.error); return; }
      } else {
        const res = await window.pharmaAPI.db.run(`
          INSERT INTO products (
            id, company_id, code, barcode, name, generic_name, manufacturer_id, category_id,
            rack_id, packing, purchase_unit, sale_unit, conversion_factor, hsn_code, gst_rate,
            schedule, min_stock, max_stock, status, created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now')
          )
        `, [
          id, companyId, code, formData.barcode, formData.name, formData.generic_name, 
          formData.manufacturer_id || null, formData.category_id || null, formData.rack_id || null, 
          formData.packing, formData.purchase_unit, formData.sale_unit, formData.conversion_factor, 
          formData.hsn_code, formData.gst_rate, formData.schedule, formData.min_stock, formData.max_stock
        ]);
        if (!res.success) { setErrorMsg("Database error: " + res.error); return; }
      }

      // Sync to cloud
      await syncEntity('Product', isNew ? 'create' : 'update', {
        id,
        companyId,
        code,
        barcode: formData.barcode,
        name: formData.name,
        genericName: formData.generic_name,
        manufacturerId: formData.manufacturer_id || null,
        categoryId: formData.category_id || null,
        rackId: formData.rack_id || null,
        packing: formData.packing,
        purchaseUnit: formData.purchase_unit,
        saleUnit: formData.sale_unit,
        conversionFactor: formData.conversion_factor,
        hsnCode: formData.hsn_code,
        gstRate: formData.gst_rate,
        schedule: formData.schedule,
        minStock: formData.min_stock,
        maxStock: formData.max_stock,
        status: 'active'
      });

      setIsModalOpen(false);
      setFormData({
        id: null,
        name: '', generic_name: '', manufacturer_id: '', category_id: '',
        code: '', barcode: '', packing: '',
        hsn_code: '', gst_rate: 12, schedule: 'Not Scheduled (OTC)',
        purchase_unit: 'Box', sale_unit: 'Strip', conversion_factor: 10,
        rack_id: '', min_stock: 0, max_stock: 0
      });
      fetchData();
    } catch (err) {
      console.error("Save failed", err);
      setErrorMsg("Failed to save product: " + err.message);
    }
  };

  const handleEdit = (prod) => {
    setFormData({
      id: prod.id,
      name: prod.name || '', generic_name: prod.generic_name || '', manufacturer_id: prod.manufacturer_id || '', category_id: prod.category_id || '',
      code: prod.code || '', barcode: prod.barcode || '', packing: prod.packing || '',
      hsn_code: prod.hsn_code || '', gst_rate: prod.gst_rate || 12, schedule: prod.schedule || 'Not Scheduled (OTC)',
      purchase_unit: prod.purchase_unit || 'Box', sale_unit: prod.sale_unit || 'Strip', conversion_factor: prod.conversion_factor || 10,
      rack_id: prod.rack_id || '', min_stock: prod.min_stock || 0, max_stock: prod.max_stock || 0
    });
    setModalTab('basic');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      // Soft-delete: retire the record (hide it) instead of erasing it, so existing
      // batches/invoices that reference it keep resolving. The cloud does the same
      // (status='inactive'), so the delta pull never re-creates a hard-deleted row.
      await window.pharmaAPI.db.run("UPDATE products SET status = 'inactive', updated_at = datetime('now') WHERE id = ?", [id]);

      // Sync to cloud (server maps 'delete' -> status='inactive' for masters)
      await syncEntity('Product', 'delete', { id });
      
      fetchData();
    } catch (err) {
      alert("Failed to delete product: " + err.message);
    }
  };

  const handleViewBatches = async (prod) => {
    setSelectedProduct(prod);
    try {
      const res = await window.pharmaAPI.db.query("SELECT * FROM batches WHERE product_id = ? ORDER BY expiry_date ASC", [prod.id]);
      setProductBatches(res?.data || []);
      setIsBatchesModalOpen(true);
    } catch (err) {
      alert("Failed to load batches: " + err.message);
    }
  };

  const handleStockHistory = async (prod) => {
    setSelectedProduct(prod);
    try {
      // Fetch Purchases
      const purRes = await window.pharmaAPI.db.query(`
        SELECT p.invoice_date as date, 'Purchase' as type, p.invoice_no as ref_no, pi.qty, pi.free_qty, b.batch_no
        FROM purchase_items pi
        JOIN purchases p ON pi.purchase_id = p.id
        JOIN batches b ON pi.batch_id = b.id
        WHERE pi.product_id = ?
        ORDER BY p.invoice_date DESC
      `, [prod.id]);
      
      // Fetch Sales
      const saleRes = await window.pharmaAPI.db.query(`
        SELECT s.date as date, 'Sale' as type, s.invoice_no as ref_no, si.qty, 0 as free_qty, b.batch_no
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN batches b ON si.batch_id = b.id
        WHERE si.product_id = ?
        ORDER BY s.date DESC
      `, [prod.id]);

      const history = [...(purRes?.data || []), ...(saleRes?.data || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
      setProductHistory(history);
      setIsHistoryModalOpen(true);
    } catch (err) {
      alert("Failed to load history: " + err.message);
    }
  };

  const filtered = productsList.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.generic_name?.toLowerCase().includes(search.toLowerCase()) && !p.code.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter && p.category_id !== catFilter) return false;
    if (mfgFilter && p.manufacturer_id !== mfgFilter) return false;
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
          <button className="btn btn-primary" onClick={() => { 
            setFormData({
              id: null,
              name: '', generic_name: '', manufacturer_id: '', category_id: '',
              code: '', barcode: '', packing: '',
              hsn_code: '', gst_rate: 12, schedule: 'Not Scheduled (OTC)',
              purchase_unit: 'Box', sale_unit: 'Strip', conversion_factor: 10,
              rack_id: '', min_stock: 0, max_stock: 0
            });
            setModalTab('basic'); 
            setIsModalOpen(true); 
          }}>
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
              const totalStock = prod.totalQty || 0;
              const isLow = totalStock < prod.min_stock;
              return (
                <tr key={prod.id}>
                  <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{prod.code}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{prod.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {prod.generic_name ? `${prod.generic_name} • ` : ''}{prod.packing || '-'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>{prod.category_name || 'N/A'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{prod.mfg_name || 'N/A'}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: isLow ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {formatStock(totalStock, prod.conversion_factor, prod.sale_unit)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rack: {prod.rack_code || 'None'}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>GST: {prod.gst_rate}%</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>HSN: {prod.hsn_code}</div>
                  </td>
                  <td className="col-actions">
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-outline btn-sm" title="View Batches" style={{ color: 'var(--purple)', borderColor: 'var(--purple)' }} onClick={() => handleViewBatches(prod)}>
                        <Package size={14} />
                      </button>
                      <button className="btn btn-outline btn-sm" title="Stock History" style={{ color: 'var(--info-dark)', borderColor: 'var(--info-dark)' }} onClick={() => handleStockHistory(prod)}>
                        <History size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => handleEdit(prod)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm" title="Delete" onClick={() => handleDelete(prod.id)} style={{ color: 'var(--danger)' }}>
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
            
            {errorMsg && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', margin: '1rem 1.5rem 0', borderRadius: '4px', border: '1px solid #f87171' }}>
                {errorMsg}
              </div>
            )}

            <div className="card-body" style={{ overflowY: 'auto' }}>
              {modalTab === 'basic' && (
                <div className="form-row-2">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Product Name (as on pack) <span className="text-danger">*</span></label>
                    <input className="form-input" placeholder="e.g. Dolo 650mg Tablet" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Generic Name / Composition <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal', fontSize: '0.85rem' }}>(optional)</span></label>
                    <input className="form-input" placeholder="e.g. Paracetamol 650mg" value={formData.generic_name} onChange={e => setFormData({...formData, generic_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Manufacturer / Company</label>
                    <select className="form-select" value={formData.manufacturer_id} onChange={e => setFormData({...formData, manufacturer_id: e.target.value})}>
                      <option value="">Select Company...</option>
                      {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}>
                      <option value="">Select Category...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Item Code / Barcode</label>
                    <input className="form-input" placeholder="Leave empty to auto-generate" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Packing Description</label>
                    <input className="form-input" placeholder="e.g. 15x10 (15 strips of 10)" value={formData.packing} onChange={e => setFormData({...formData, packing: e.target.value})} />
                  </div>
                </div>
              )}

              {modalTab === 'tax' && (
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">HSN Code <span className="text-danger">*</span></label>
                    <input className="form-input" placeholder="e.g. 3004" maxLength="8" value={formData.hsn_code} onChange={e => setFormData({...formData, hsn_code: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GST Slab % <span className="text-danger">*</span></label>
                    <select className="form-select" value={formData.gst_rate} onChange={e => setFormData({...formData, gst_rate: Number(e.target.value)})}>
                      <option value="12">12% (Common Medicines)</option>
                      <option value="5">5% (Life Saving)</option>
                      <option value="18">18% (Supplements/Cosmetics)</option>
                      <option value="0">0% (Exempt)</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Drug Schedule</label>
                    <select className="form-select" value={formData.schedule} onChange={e => setFormData({...formData, schedule: e.target.value})}>
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
                    <select className="form-select" value={formData.purchase_unit} onChange={e => setFormData({...formData, purchase_unit: e.target.value})}>
                      <option>Box</option>
                      <option>Case</option>
                      <option>Jar</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sale Unit</label>
                    <select className="form-select" value={formData.sale_unit} onChange={e => setFormData({...formData, sale_unit: e.target.value})}>
                      <option>Strip</option>
                      <option>Bottle</option>
                      <option>Tube</option>
                      <option>Box</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Conversion Factor <span className="text-danger">*</span></label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>1 {formData.purchase_unit} =</span>
                      <input className="form-input" type="number" placeholder="Qty" style={{ width: '80px' }} value={formData.conversion_factor} onChange={e => setFormData({...formData, conversion_factor: Number(e.target.value)})} />
                      <span>{formData.sale_unit}s</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Default Rack / Location</label>
                    <select className="form-select" value={formData.rack_id} onChange={e => setFormData({...formData, rack_id: e.target.value})}>
                      <option value="">No Rack Assigned</option>
                      {racks.map(r => <option key={r.id} value={r.id}>{r.code} - {r.description}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Min Stock Level ({formData.sale_unit}s)</label>
                    <input className="form-input" type="number" placeholder="Alert below this" value={formData.min_stock} onChange={e => setFormData({...formData, min_stock: Number(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Stock Level ({formData.sale_unit}s)</label>
                    <input className="form-input" type="number" placeholder="Stop over-ordering" value={formData.max_stock} onChange={e => setFormData({...formData, max_stock: Number(e.target.value)})} />
                  </div>
                </div>
              )}
            </div>

            <div className="card-header" style={{ borderTop: '1px solid var(--border)', justifyContent: 'flex-end', background: '#F8FAFC' }}>
              <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>
                <Save size={16} /> Save Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batches Modal */}
      {isBatchesModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '800px', maxWidth: '95vw' }}>
            <div className="modal-header">
              <h3 className="modal-title">Batches - {selectedProduct?.name}</h3>
              <button className="modal-close" onClick={() => setIsBatchesModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body no-pad" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {productBatches.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Batch No</th>
                      <th>Expiry</th>
                      <th style={{ textAlign: 'right' }}>MRP</th>
                      <th style={{ textAlign: 'right' }}>PTR</th>
                      <th style={{ textAlign: 'right' }}>Current Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productBatches.map(b => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 600 }}>{b.batch_no}</td>
                        <td style={{ color: new Date(b.expiry_date) < new Date() ? 'var(--danger)' : 'inherit' }}>
                          {b.expiry_date}
                        </td>
                        <td style={{ textAlign: 'right' }}>₹{b.mrp.toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>₹{b.ptr.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: b.current_qty > 0 ? 'var(--text-primary)' : 'var(--danger)' }}>
                          {formatStock(b.current_qty, selectedProduct?.conversion_factor, selectedProduct?.sale_unit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No batches found for this product.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsBatchesModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Stock History Modal */}
      {isHistoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '800px', maxWidth: '95vw' }}>
            <div className="modal-header">
              <h3 className="modal-title">Stock History - {selectedProduct?.name}</h3>
              <button className="modal-close" onClick={() => setIsHistoryModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body no-pad" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {productHistory.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Ref No</th>
                      <th>Batch No</th>
                      <th style={{ textAlign: 'right' }}>Qty In</th>
                      <th style={{ textAlign: 'right' }}>Qty Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productHistory.map((h, i) => (
                      <tr key={i}>
                        <td>{h.date}</td>
                        <td>
                          <span className={`badge ${h.type === 'Purchase' ? 'badge-success' : 'badge-primary'}`}>
                            {h.type}
                          </span>
                        </td>
                        <td>{h.ref_no}</td>
                        <td>{h.batch_no}</td>
                        <td style={{ textAlign: 'right', color: 'var(--success)' }}>
                          {h.type === 'Purchase' ? `+${h.qty + h.free_qty}` : '-'}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--danger)' }}>
                          {h.type === 'Sale' ? `-${h.qty}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No transaction history found for this product.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsHistoryModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
