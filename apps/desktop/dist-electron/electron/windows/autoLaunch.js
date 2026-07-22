"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAutoLaunch = setupAutoLaunch;
exports.getAutoLaunchStatus = getAutoLaunchStatus;
const electron_1 = require("electron");
const logger_1 = require("../services/logger");
function setupAutoLaunch(enable) {
    // Uses Electron's built-in loginItems API (Windows Registry)
    electron_1.app.setLoginItemSettings({
        openAtLogin: enable,
        name: 'PharmaFlow ERP',
        path: process.execPath,
        args: ['--autostart'],
    });
    logger_1.logger.info(`Auto-launch ${enable ? 'enabled' : 'disabled'}`);
}
function getAutoLaunchStatus() {
    return electron_1.app.getLoginItemSettings().openAtLogin;
}
