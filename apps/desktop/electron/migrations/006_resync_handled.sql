-- Tracks the last admin-requested re-sync timestamp this device has already
-- acted on, so it un-parks its dead-lettered records only once per request.
ALTER TABLE sync_status ADD COLUMN resync_handled_at TEXT;
