-- PharmaFlow Local SQLite Schema
-- Migration: 001_initial_schema

-- Companies (single record for this installation)
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  gstin TEXT,
  drug_license_20b TEXT,
  drug_license_21b TEXT,
  fssai_license TEXT,
  pan TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  state_code TEXT,
  phone TEXT,
  email TEXT,
  financial_year TEXT DEFAULT '2025-26',
  bank_name TEXT,
  bank_account TEXT,
  bank_ifsc TEXT,
  bank_branch TEXT,
  upi_id TEXT,
  authorized_sign TEXT,
  est_year INTEGER,
  logo_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  is_active INTEGER DEFAULT 1,
  last_login_at TEXT,
  access_token TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Manufacturers
CREATE TABLE IF NOT EXISTS manufacturers (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Racks
CREATE TABLE IF NOT EXISTS racks (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  code TEXT NOT NULL,
  barcode TEXT,
  name TEXT NOT NULL,
  generic_name TEXT,
  manufacturer_id TEXT,
  category_id TEXT,
  rack_id TEXT,
  packing TEXT,
  purchase_unit TEXT,
  sale_unit TEXT,
  conversion_factor REAL,
  hsn_code TEXT,
  gst_rate REAL DEFAULT 12,
  schedule TEXT,
  min_stock REAL DEFAULT 0,
  max_stock REAL DEFAULT 0,
  reorder_qty REAL DEFAULT 0,
  discontinued INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id),
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (rack_id) REFERENCES racks(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_code ON products(company_id, code);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

-- Batches
CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  batch_no TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  mrp REAL NOT NULL,
  ptr REAL NOT NULL,
  pts REAL,
  purchase_price REAL NOT NULL,
  gst_rate REAL NOT NULL,
  current_qty REAL DEFAULT 0,
  free_qty REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_batches_unique ON batches(product_id, batch_no);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON batches(expiry_date);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  code TEXT,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'retail',
  gstin TEXT,
  drug_license TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  area TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  salesman TEXT,
  credit_limit REAL DEFAULT 0,
  credit_days INTEGER DEFAULT 0,
  opening_balance REAL DEFAULT 0,
  opening_balance_type TEXT DEFAULT 'debit',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  code TEXT,
  name TEXT NOT NULL,
  gstin TEXT,
  drug_license TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  credit_days INTEGER DEFAULT 0,
  credit_limit REAL DEFAULT 0,
  opening_balance REAL DEFAULT 0,
  opening_balance_type TEXT DEFAULT 'credit',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Purchases
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  entry_no TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  invoice_no TEXT NOT NULL,
  invoice_date TEXT NOT NULL,
  gst_type TEXT DEFAULT 'exclusive',
  subtotal REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  taxable_amount REAL DEFAULT 0,
  cgst_amount REAL DEFAULT 0,
  sgst_amount REAL DEFAULT 0,
  igst_amount REAL DEFAULT 0,
  net_amount REAL DEFAULT 0,
  round_off REAL DEFAULT 0,
  payment_mode TEXT DEFAULT 'credit',
  paid_amount REAL DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'saved',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_entry_no ON purchases(company_id, entry_no);

-- Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items (
  id TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  batch_id TEXT NOT NULL,
  qty REAL NOT NULL,
  free_qty REAL DEFAULT 0,
  purchase_price REAL NOT NULL,
  ptr REAL NOT NULL,
  mrp REAL NOT NULL,
  disc_percent REAL DEFAULT 0,
  disc_amount REAL DEFAULT 0,
  gst_rate REAL NOT NULL,
  cgst REAL DEFAULT 0,
  sgst REAL DEFAULT 0,
  igst REAL DEFAULT 0,
  taxable_amt REAL DEFAULT 0,
  net_amount REAL NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  FOREIGN KEY (batch_id) REFERENCES batches(id)
);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  invoice_no TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  date TEXT NOT NULL,
  salesman TEXT,
  gst_type TEXT DEFAULT 'exclusive',
  subtotal REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  taxable_amount REAL DEFAULT 0,
  cgst_amount REAL DEFAULT 0,
  sgst_amount REAL DEFAULT 0,
  igst_amount REAL DEFAULT 0,
  net_amount REAL DEFAULT 0,
  round_off REAL DEFAULT 0,
  payment_mode TEXT DEFAULT 'credit',
  paid_amount REAL DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'saved',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_invoice_no ON sales(company_id, invoice_no);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);

-- Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  batch_id TEXT NOT NULL,
  qty REAL NOT NULL,
  mrp REAL NOT NULL,
  ptr REAL NOT NULL,
  sale_price REAL NOT NULL,
  disc_percent REAL DEFAULT 0,
  disc_amount REAL DEFAULT 0,
  gst_rate REAL NOT NULL,
  cgst REAL DEFAULT 0,
  sgst REAL DEFAULT 0,
  igst REAL DEFAULT 0,
  taxable_amt REAL DEFAULT 0,
  net_amount REAL NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (batch_id) REFERENCES batches(id)
);

-- Purchase Returns
CREATE TABLE IF NOT EXISTS purchase_returns (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  entry_no TEXT NOT NULL,
  purchase_id TEXT,
  supplier_id TEXT NOT NULL,
  return_date TEXT NOT NULL,
  reason TEXT,
  debit_note_no TEXT,
  net_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'saved',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Purchase Return Items
CREATE TABLE IF NOT EXISTS purchase_return_items (
  id TEXT PRIMARY KEY,
  return_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  batch_id TEXT NOT NULL,
  qty REAL NOT NULL,
  mrp REAL NOT NULL,
  ptr REAL NOT NULL,
  net_amount REAL NOT NULL,
  reason TEXT NOT NULL,
  FOREIGN KEY (return_id) REFERENCES purchase_returns(id) ON DELETE CASCADE
);

-- Sale Returns
CREATE TABLE IF NOT EXISTS sale_returns (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  entry_no TEXT NOT NULL,
  sale_id TEXT,
  customer_id TEXT NOT NULL,
  return_date TEXT NOT NULL,
  reason TEXT,
  credit_note_no TEXT,
  net_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'saved',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Sale Return Items
CREATE TABLE IF NOT EXISTS sale_return_items (
  id TEXT PRIMARY KEY,
  return_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  batch_id TEXT NOT NULL,
  qty REAL NOT NULL,
  mrp REAL NOT NULL,
  sale_price REAL NOT NULL,
  net_amount REAL NOT NULL,
  reason TEXT NOT NULL,
  FOREIGN KEY (return_id) REFERENCES sale_returns(id) ON DELETE CASCADE
);

-- Receipts
CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  receipt_no TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_mode TEXT NOT NULL,
  cheque_no TEXT,
  cheque_date TEXT,
  bank_name TEXT,
  utr_no TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  payment_no TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_mode TEXT NOT NULL,
  cheque_no TEXT,
  cheque_date TEXT,
  bank_name TEXT,
  utr_no TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Journals
CREATE TABLE IF NOT EXISTS journals (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  entry_no TEXT NOT NULL,
  date TEXT NOT NULL,
  narration TEXT NOT NULL,
  debit_amt REAL NOT NULL,
  credit_amt REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  journal_id TEXT NOT NULL,
  particular TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  FOREIGN KEY (journal_id) REFERENCES journals(id) ON DELETE CASCADE
);

-- Stock Adjustments
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  entry_no TEXT NOT NULL,
  date TEXT NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Stock Adjustment Items
CREATE TABLE IF NOT EXISTS stock_adjustment_items (
  id TEXT PRIMARY KEY,
  adjustment_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  batch_id TEXT NOT NULL,
  system_qty REAL NOT NULL,
  physical_qty REAL NOT NULL,
  difference_qty REAL NOT NULL,
  reason TEXT NOT NULL,
  FOREIGN KEY (adjustment_id) REFERENCES stock_adjustments(id) ON DELETE CASCADE
);

-- Sync Queue (offline-first core)
CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload TEXT NOT NULL,
  is_synced INTEGER DEFAULT 0,
  synced_at TEXT,
  sync_error TEXT,
  retry_count INTEGER DEFAULT 0,
  app_version TEXT NOT NULL,
  device_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_pending ON sync_queue(is_synced, created_at);

-- Pre-seeded Initial Demo Data for Team Testing
INSERT OR IGNORE INTO companies (id, name, short_name, gstin, phone, city, state, financial_year)
VALUES ('COMP-DEMO-001', 'PharmaFlow Demo Medicals', 'PharmaFlow Demo', '27AABCA1234F1Z5', '9876543210', 'Mumbai', 'Maharashtra', '2025-26');

INSERT OR IGNORE INTO users (id, company_id, name, email, password_hash, role)
VALUES ('USER-DEMO-001', 'COMP-DEMO-001', 'Demo Admin User', 'demo@pharmaflow.in', '$2a$12$eImiTXuWVxfM37uY4JANj.R5x.jC.8f0L4hE9k.9g.H2k1u.L.2S', 'admin');

