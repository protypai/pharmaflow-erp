import { app } from 'electron';
import { logger } from '../services/logger';

export function setupAutoLaunch(enable: boolean): void {
  // Uses Electron's built-in loginItems API (Windows Registry)
  app.setLoginItemSettings({
    openAtLogin: enable,
    name: 'PharmaFlow ERP',
    path: process.execPath,
    args: ['--autostart'],
  });
  logger.info(`Auto-launch ${enable ? 'enabled' : 'disabled'}`);
}

export function getAutoLaunchStatus(): boolean {
  return app.getLoginItemSettings().openAtLogin;
}
