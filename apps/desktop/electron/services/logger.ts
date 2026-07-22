import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const logFile = path.join(app.getPath('userData'), 'pharmaflow.log');

function formatMsg(level: string, message: string, meta?: any): string {
  const ts = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${level.toUpperCase()}] ${message}${metaStr}\n`;
}

export const logger = {
  info: (message: string, meta?: any) => {
    const line = formatMsg('info', message, meta);
    process.stdout.write(line);
    fs.appendFileSync(logFile, line);
  },
  error: (message: string, meta?: any) => {
    const line = formatMsg('error', message, meta);
    process.stderr.write(line);
    fs.appendFileSync(logFile, line);
  },
  warn: (message: string, meta?: any) => {
    const line = formatMsg('warn', message, meta);
    process.stdout.write(line);
    fs.appendFileSync(logFile, line);
  },
};
