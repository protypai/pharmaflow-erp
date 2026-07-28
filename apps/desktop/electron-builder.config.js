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
    '.env.production',
  ],
  asarUnpack: [
    '**/*.node',
    '**/*.dylib',
    '**/*.so',
    'dist/**/*',  // Unpack all dist files
    'assets/**/*',
    'node_modules/better-sqlite3/**/*',
    'node_modules/keytar/**/*'
  ],
  win: {
    target: [{ target: 'nsis', arch: ['ia32', 'x64', 'arm64'] }],
    icon: 'assets/icon.png',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'PharmaFlow ERP',
    artifactName: '${name}-${version}-${arch}.${ext}',
  },
  publish: {
    provider: 'github',
    owner: 'protypai',
    repo: 'pharmaflow-erp',
    private: false,
  },
};
