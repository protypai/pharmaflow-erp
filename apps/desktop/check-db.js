const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');

app.whenReady().then(() => {
  const dbPath = path.join(app.getPath('appData'), 'pharmaflow-desktop', 'pharmaflow.db');
  const db = new Database(dbPath);
  
  try {
    const users = db.prepare('SELECT id, name, companyId, role FROM User WHERE email = ? AND passwordHash = ? AND isActive = 1').all('demo@pharmaflow.in', 'Password@123');
    console.log('Query result:');
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error querying User table:', err);
  }
  app.quit();
});
