module.exports = {
  appId: 'in.pharmaflow.erp',
  productName: 'PharmaFlow ERP',
  copyright: 'Copyright 2025 PharmaFlow',
  directories: {
    output: 'release',
    buildResources: 'assets',
  },
  files: [
    'dist/**/*',
    'dist-electron/**/*',
    'node_modules/**/*',
    'package.json',
  ],
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'assets/icon.ico',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    installerIcon: 'assets/icon.ico',
    uninstallerIcon: 'assets/icon.ico',
    installerHeaderIcon: 'assets/icon.ico',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'PharmaFlow ERP',
  },
  publish: {
    provider: 'github',
    owner: 'protypai',
    repo: 'pharmaflow-releases',
    private: false,
  },
};
