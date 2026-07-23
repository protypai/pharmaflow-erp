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
    icon: 'assets/icon.png',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    installerIcon: 'assets/icon.png',
    uninstallerIcon: 'assets/icon.png',
    installerHeaderIcon: 'assets/icon.png',
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
