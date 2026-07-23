const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join('C:', 'Users', 'satya', 'AppData', 'Roaming', 'pharmaflow-desktop', 'pharmaflow.db');
const db = new Database(dbPath);

try {
  const stmt = db.prepare("SELECT * FROM customers ORDER BY name ASC");
  const res = stmt.all();
  console.log("Customers Count:", res.length);
  console.log("Customers:", res);
} catch (e) {
  console.error("Error:", e.message);
}
