"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTray = setupTray;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
function setupTray(mainWindow) {
    const iconPath = path_1.default.join(__dirname, '../../assets/tray-icon.png');
    let icon;
    try {
        icon = electron_1.nativeImage.createFromPath(iconPath);
    }
    catch {
        icon = electron_1.nativeImage.createEmpty();
    }
    const tray = new electron_1.Tray(icon);
    tray.setToolTip('PharmaFlow ERP');
    const updateTrayMenu = () => {
        const contextMenu = electron_1.Menu.buildFromTemplate([
            {
                label: 'Open PharmaFlow ERP',
                click: () => {
                    mainWindow.show();
                    mainWindow.focus();
                },
            },
            { type: 'separator' },
            {
                label: 'Sync Now',
                click: () => {
                    mainWindow.show();
                    mainWindow.webContents.send('tray:sync');
                },
            },
            {
                label: 'Create Backup',
                click: () => {
                    mainWindow.show();
                    mainWindow.webContents.send('tray:backup');
                },
            },
            { type: 'separator' },
            {
                label: 'Quit PharmaFlow',
                click: () => {
                    mainWindow.removeAllListeners('close');
                    electron_1.app.quit();
                },
            },
        ]);
        tray.setContextMenu(contextMenu);
    };
    updateTrayMenu();
    tray.on('double-click', () => {
        mainWindow.show();
        mainWindow.focus();
    });
    return tray;
}
