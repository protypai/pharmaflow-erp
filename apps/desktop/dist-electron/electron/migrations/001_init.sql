-- 001_init.sql
CREATE TABLE IF NOT EXISTS Company (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    shortName TEXT,
    gstin TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    companyId TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (companyId) REFERENCES Company(id)
);

CREATE TABLE IF NOT EXISTS Customer (
    id TEXT PRIMARY KEY,
    companyId TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    creditLimit REAL DEFAULT 0,
    outstanding REAL DEFAULT 0,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (companyId) REFERENCES Company(id)
);

CREATE TABLE IF NOT EXISTS Product (
    id TEXT PRIMARY KEY,
    companyId TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    gstRate REAL DEFAULT 12,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (companyId) REFERENCES Company(id)
);

CREATE TABLE IF NOT EXISTS Sale (
    id TEXT PRIMARY KEY,
    companyId TEXT NOT NULL,
    invoiceNo TEXT UNIQUE NOT NULL,
    customerId TEXT NOT NULL,
    date TEXT NOT NULL,
    subtotal REAL DEFAULT 0,
    discountAmount REAL DEFAULT 0,
    taxableAmount REAL DEFAULT 0,
    cgstAmount REAL DEFAULT 0,
    sgstAmount REAL DEFAULT 0,
    igstAmount REAL DEFAULT 0,
    netAmount REAL DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (companyId) REFERENCES Company(id),
    FOREIGN KEY (customerId) REFERENCES Customer(id)
);
