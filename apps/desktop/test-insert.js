const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join('C:', 'Users', 'satya', 'AppData', 'Roaming', 'pharmaflow-desktop', 'pharmaflow.db');
const db = new Database(dbPath);

try {
  const id = 'CUST-' + Date.now();
  const companyId = 'COMP-DEMO-001';
  
  const stmt = db.prepare(`
    INSERT INTO customers (
      id, company_id, name, type, salesman, phone, email, address, area, pincode, 
      drug_license, gstin, credit_limit, credit_days, opening_balance, opening_balance_type,
      status, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now')
    )
  `);
  
  const res = stmt.run(
    id, companyId, 'Test Customer', 'Retail', 'Salesman', '999999999', 'a@a.com',
    'Address', 'Area', '400000', 'DL123', 'GST123',
    50000, 30, 0, 'debit'
  );
  console.log("Success:", res);
} catch (e) {
  console.error("Error:", e.message);
}
