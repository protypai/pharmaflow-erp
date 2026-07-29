const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'pharmaflow-desktop', 'pharmaflow.db');
console.log('Opening database at:', dbPath);
const db = new Database(dbPath);

console.log('Fixing sales table records...');
const info1 = db.prepare(`UPDATE sales SET status = 'saved' WHERE status = 'completed'`).run();
console.log(`Updated ${info1.changes} sales records.`);

console.log('Fixing sync_queue payloads for Sale...');
const info2 = db.prepare(`
  UPDATE sync_queue 
  SET payload = json_replace(payload, '$.status', 'saved')
  WHERE table_name = 'Sale' AND json_extract(payload, '$.status') = 'completed'
`).run();
console.log(`Updated ${info2.changes} sync_queue payloads.`);

console.log('Resetting failed/dead-lettered sync_queue records for retry...');
const info3 = db.prepare(`
  UPDATE sync_queue
  SET is_synced = 0, retry_count = 0, next_retry_at = NULL, sync_error = NULL
  WHERE is_synced = 2 OR (is_synced = 0 AND sync_error IS NOT NULL)
`).run();
console.log(`Reset ${info3.changes} sync_queue records.`);

db.close();
