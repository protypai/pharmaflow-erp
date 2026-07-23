-- 002_seed.sql
INSERT OR IGNORE INTO Company (id, name, shortName, email)
VALUES ('comp_001', 'PharmaFlow Demo Pharmacy', 'PharmaFlow', 'demo@pharmaflow.in');

-- Seed Super Admin User
INSERT OR IGNORE INTO User (id, companyId, name, email, passwordHash, role)
VALUES ('usr_001', 'comp_001', 'Super Admin', 'admin@pharmaflow.in', 'Admin@123', 'admin');

-- Seed Store Admin User
INSERT OR IGNORE INTO User (id, companyId, name, email, passwordHash, role)
VALUES ('usr_002', 'comp_001', 'Store Admin', 'demo@pharmaflow.in', 'Password@123', 'admin');
