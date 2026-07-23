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
  asarUnpack: [
    '**/*.node',
    'dist/**/*',
    'assets/**/*',
    'node_modules/better-sqlite3/**/*',
    'node_modules/keytar/**/*'
  ],
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'assets/icon.png',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
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
