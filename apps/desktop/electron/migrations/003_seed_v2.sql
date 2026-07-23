-- 003_seed_v2.sql
-- Seed Super Admin User
INSERT OR REPLACE INTO User (id, companyId, name, email, passwordHash, role)
VALUES ('usr_001', 'comp_001', 'Super Admin', 'admin@pharmaflow.in', 'Admin@123', 'admin');

-- Seed Store Admin User
INSERT OR REPLACE INTO User (id, companyId, name, email, passwordHash, role)
VALUES ('usr_002', 'comp_001', 'Store Admin', 'demo@pharmaflow.in', 'Password@123', 'admin');
