"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logFile = path_1.default.join(electron_1.app.getPath('userData'), 'pharmaflow.log');
function formatMsg(level, message, meta) {
    const ts = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} [${level.toUpperCase()}] ${message}${metaStr}\n`;
}
exports.logger = {
    info: (message, meta) => {
        const line = formatMsg('info', message, meta);
        process.stdout.write(line);
        fs_1.default.appendFileSync(logFile, line);
    },
    error: (message, meta) => {
        const line = formatMsg('error', message, meta);
        process.stderr.write(line);
        fs_1.default.appendFileSync(logFile, line);
    },
    warn: (message, meta) => {
        const line = formatMsg('warn', message, meta);
        process.stdout.write(line);
        fs_1.default.appendFileSync(logFile, line);
    },
};
