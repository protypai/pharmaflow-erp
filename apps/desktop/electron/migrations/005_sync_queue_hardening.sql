-- 005_sync_queue_hardening.sql
--
-- Adds columns required by the hardened outbound sync (retry backoff + dead-letter)
-- and by the delta-pull cursor.
--
-- SQLite has no "ADD COLUMN IF NOT EXISTS". These columns are all new (they do not
-- exist in 001_initial_schema.sql), and the migration runner records applied files
-- in the _migrations table so this file executes exactly once per install. Should a
-- statement ever hit a pre-existing column, the runner tolerates "duplicate column
-- name" errors and marks the migration applied.

-- Outbound queue: entity id, tenant id, and backoff bookkeeping.
ALTER TABLE sync_queue ADD COLUMN record_id TEXT;
ALTER TABLE sync_queue ADD COLUMN company_id TEXT;
ALTER TABLE sync_queue ADD COLUMN next_retry_at TEXT;
ALTER TABLE sync_queue ADD COLUMN last_attempt_at TEXT;

-- Delta-pull cursor (serverTime from the last successful pull).
ALTER TABLE sync_status ADD COLUMN pull_cursor TEXT;

-- Index used by the pending-selection query (pending + backoff window).
CREATE INDEX IF NOT EXISTS idx_sync_queue_retry ON sync_queue(is_synced, next_retry_at);
