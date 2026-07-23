#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, '..');
const requiredFiles = [
  'dist/index.html',
  'dist-electron/electron/main.js',
  'dist-electron/electron/preload.js',
];

const optionalFiles = [
  'assets/icon.png',
  'dist-electron/electron/migrations',  // Migrations directory (not a specific file)
];

console.log('\n🔍 Validating build output...\n');

let errors = [];
let warnings = [];

requiredFiles.forEach(file => {
  const fullPath = path.join(basePath, file);
  if (!fs.existsSync(fullPath)) {
    errors.push(`✗ MISSING (required): ${file}`);
  } else {
    console.log(`✓ Found: ${file}`);
  }
});

optionalFiles.forEach(file => {
  const fullPath = path.join(basePath, file);
  if (!fs.existsSync(fullPath)) {
    warnings.push(`⚠ MISSING (optional): ${file}`);
  } else {
    console.log(`✓ Found: ${file}`);
  }
});

// Check dist directory has content
const distPath = path.join(basePath, 'dist');
if (fs.existsSync(distPath)) {
  const files = fs.readdirSync(distPath, { recursive: true }).filter(f => {
    const stat = fs.statSync(path.join(distPath, f));
    return stat.isFile();
  });
  console.log(`\n📦 Dist folder contains ${files.length} files\n`);
}

// Check preload.js size
const preloadPath = path.join(basePath, 'dist-electron/electron/preload.js');
if (fs.existsSync(preloadPath)) {
  const size = fs.statSync(preloadPath).size;
  if (size < 100) {
    warnings.push(`⚠ Preload script is very small (${size} bytes) - may not have compiled correctly`);
  } else {
    console.log(`📝 Preload script size: ${(size / 1024).toFixed(2)} KB ✓\n`);
  }
}

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach(w => console.log(`  ${w}`));
}

if (errors.length > 0) {
  console.error('\n❌ Build validation FAILED. Errors:\n');
  errors.forEach(e => console.error(`  ${e}`));
  process.exit(1);
} else {
  console.log('✅ Build validation PASSED\n');
}
