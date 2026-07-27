-- Migration: 004_sync_status
CREATE TABLE IF NOT EXISTS sync_status (
  id TEXT PRIMARY KEY,
  last_sync_time TEXT,
  last_successful_sync TEXT,
  status TEXT DEFAULT 'Success',
  records_uploaded INTEGER DEFAULT 0,
  error_message TEXT,
  next_sync_time TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Seed initial status row if not exists
INSERT OR IGNORE INTO sync_status (id, status) VALUES ('current', 'Success');
