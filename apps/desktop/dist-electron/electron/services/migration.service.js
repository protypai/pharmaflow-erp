"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("./logger");
async function runMigrations(db) {
    // Create migrations tracking table
    db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
    const migrationsDir = path_1.default.join(__dirname, '../migrations');
    if (!fs_1.default.existsSync(migrationsDir)) {
        logger_1.logger.warn('No migrations directory found, skipping migrations');
        return;
    }
    const files = fs_1.default.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();
    for (const file of files) {
        const applied = db.prepare('SELECT id FROM _migrations WHERE name = ?').get(file);
        if (applied)
            continue;
        const sql = fs_1.default.readFileSync(path_1.default.join(migrationsDir, file), 'utf-8');
        logger_1.logger.info(`Applying migration: ${file}`);
        db.exec(sql);
        db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
        logger_1.logger.info(`Migration applied: ${file}`);
    }
    logger_1.logger.info('All migrations applied');
}
