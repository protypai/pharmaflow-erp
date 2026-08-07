const Database = require('better-sqlite3');
try {
  const db = new Database('C:\\\\Users\\\\satya\\\\AppData\\\\Roaming\\\\pharmaflow-erp\\\\pharmaflow.db');
  const stmt = db.prepare(`
            SELECT 'sale' as type, date as ref_date, invoice_no as desc, c.name as party, net_amount as amount, s.created_at
            FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
            WHERE s.date LIKE '2026-08-07%'
            UNION ALL
            SELECT 'purchase' as type, invoice_date as ref_date, invoice_no as desc, sup.name as party, net_amount as amount, p.created_at
            FROM purchases p LEFT JOIN suppliers sup ON p.supplier_id = sup.id
            WHERE p.invoice_date LIKE '2026-08-07%'
            UNION ALL
            SELECT 'receipt' as type, date as ref_date, receipt_no as desc, c.name as party, amount, r.created_at
            FROM receipts r LEFT JOIN customers c ON r.customer_id = c.id
            WHERE r.date LIKE '2026-08-07%'
            UNION ALL
            SELECT 'payment' as type, date as ref_date, payment_no as desc, sup.name as party, amount, p.created_at
            FROM payments p LEFT JOIN suppliers sup ON p.supplier_id = sup.id
            WHERE p.date LIKE '2026-08-07%'
            ORDER BY created_at DESC
            LIMIT 10
  `);
  console.log(stmt.all());
} catch(e) {
  console.log("Error:", e);
}
