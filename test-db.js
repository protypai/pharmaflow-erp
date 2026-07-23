const { app } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

app.whenReady().then(() => {
  const dbPath = path.join(app.getPath('userData'), 'pharmaflow.db');
  console.log('DB Path:', dbPath);
  const db = new Database(dbPath);

  const batches = db.prepare("SELECT * FROM batches").all();
  console.log('BATCHES:', batches);
  
  const purchases = db.prepare("SELECT * FROM purchases").all();
  console.log('PURCHASES:', purchases);

  const sales = db.prepare("SELECT * FROM sales").all();
  console.log('SALES:', sales);

  app.quit();
});
