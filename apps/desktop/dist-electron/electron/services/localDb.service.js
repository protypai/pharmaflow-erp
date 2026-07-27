"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.initLocalDb = initLocalDb;
exports.resetLocalDb = resetLocalDb;
exports.queryDb = queryDb;
exports.runDb = runDb;
exports.transactionDb = transactionDb;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const migration_service_1 = require("./migration.service");
const logger_1 = require("./logger");
let db;
function getDb() {
    if (!db)
        throw new Error('Database not initialized. Call initLocalDb() first.');
    return db;
}
async function initLocalDb() {
    const dbPath = path_1.default.join(electron_1.app.getPath('userData'), 'pharmaflow.db');
    logger_1.logger.info(`Opening SQLite database at: ${dbPath}`);
    db = new better_sqlite3_1.default(dbPath);
    // Performance pragmas
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('synchronous = NORMAL');
    // Run migrations
    await (0, migration_service_1.runMigrations)(db);
    logger_1.logger.info('Local database initialized');
}
async function resetLocalDb() {
    logger_1.logger.info('Resetting local database tables');
    if (!db) {
        await initLocalDb();
    }
    try {
        // Disable foreign keys temporarily to avoid delete restrictions during wipe
        db.pragma('foreign_keys = OFF');
        // Get all user tables
        const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();
        // Begin transaction for speed and safety
        const deleteTx = db.transaction(() => {
            for (const table of tables) {
                db.prepare(`DELETE FROM "${table.name}"`).run();
            }
            // Reset auto-increment sequences
            try {
                db.prepare(`DELETE FROM sqlite_sequence`).run();
            }
            catch {
                // sqlite_sequence might not exist if no autoincrement tables are created yet
            }
        });
        deleteTx();
        // Re-enable foreign keys
        db.pragma('foreign_keys = ON');
        // Re-run migrations to ensure seeded values (e.g. sync_status 'current' row) are created
        await (0, migration_service_1.runMigrations)(db);
        logger_1.logger.info('Database reset complete via truncation');
    }
    catch (err) {
        logger_1.logger.error('Truncation reset failed, attempting hard delete', { error: err.message });
        // Fallback: If truncation fails, try closing and deleting the file
        try {
            if (db) {
                db.close();
                db = undefined;
            }
            const dbPath = path_1.default.join(electron_1.app.getPath('userData'), 'pharmaflow.db');
            const fs = require('fs');
            if (fs.existsSync(dbPath)) {
                fs.unlinkSync(dbPath);
                logger_1.logger.info('Old database file deleted');
            }
            if (fs.existsSync(dbPath + '-wal')) {
                fs.unlinkSync(dbPath + '-wal');
            }
            if (fs.existsSync(dbPath + '-shm')) {
                fs.unlinkSync(dbPath + '-shm');
            }
            await initLocalDb();
        }
        catch (fallbackErr) {
            logger_1.logger.error('Hard database reset failed', { error: fallbackErr.message });
            // Critical: even if reset fails completely, make sure we try to re-initialize db to prevent bricking the app
            try {
                await initLocalDb();
            }
            catch { }
            throw fallbackErr;
        }
    }
}
function queryDb(sql, params = []) {
    return getDb().prepare(sql).all(...params);
}
function runDb(sql, params = []) {
    return getDb().prepare(sql).run(...params);
}
function transactionDb(operations) {
    const txn = getDb().transaction(() => {
        for (const op of operations) {
            getDb().prepare(op.sql).run(...(op.params || []));
        }
    });
    txn();
}
