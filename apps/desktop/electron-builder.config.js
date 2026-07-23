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
    '**/*.dylib',
    '**/*.so',
    'dist/**/*',  // Unpack all dist files
    'assets/**/*',
    'node_modules/better-sqlite3/**/*',
    'node_modules/keytar/**/*'
  ],
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'assets/icon.png',
    certificateFile: process.env.WIN_CSC_LINK,
    certificatePassword: process.env.WIN_CSC_KEY_PASSWORD,
    signingHashAlgorithms: ['sha256'],
    sign: './customSign.js'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'PharmaFlow ERP',
    artifactName: '${productName} ${version}.${ext}',
  },
  publish: {
    provider: 'github',
    owner: 'protypai',
    repo: 'pharmaflow-releases',
    private: false,
  },
};
