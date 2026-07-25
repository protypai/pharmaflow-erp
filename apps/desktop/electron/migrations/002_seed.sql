-- 002_seed.sql
-- Default initial company template (if uninitialized)
INSERT OR IGNORE INTO Company (id, name, shortName, email)
VALUES ('comp_001', 'PharmaFlow Pharmacy', 'PharmaFlow', 'info@pharmaflow.in');

