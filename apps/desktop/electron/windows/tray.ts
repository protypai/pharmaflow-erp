import { Tray, Menu, nativeImage, app, BrowserWindow } from 'electron';
import path from 'path';

export function setupTray(mainWindow: BrowserWindow): Tray {
  const iconPath = path.join(__dirname, '../../assets/tray-icon.png');
  let icon: Electron.NativeImage;
  try {
    icon = nativeImage.createFromPath(iconPath);
  } catch {
    icon = nativeImage.createEmpty();
  }

  const tray = new Tray(icon);
  tray.setToolTip('PharmaFlow ERP');

  const updateTrayMenu = () => {
    const contextMenu = Menu.buildFromTemplate([
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
          app.quit();
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
