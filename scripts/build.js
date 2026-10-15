#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const IGNORED = new Set([
  '.git',
  '.github',
  '.gitignore',
  '.env',
  '.env.local',
  '.env.example',
  'dist',
  'node_modules',
  'package.json',
  'package-lock.json'
]);

function readEnvFile() {
  const envPath = path.join(ROOT, '.env');
  const result = {};
  if (!fs.existsSync(envPath)) return result;
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  });
  return result;
}

function getKey() {
  if (process.env.WEB3FORMS_KEY) return process.env.WEB3FORMS_KEY.trim();
  return (readEnvFile().WEB3FORMS_KEY || '').trim();
}

function writeConfig() {
  const key = getKey();
  const content = `window.KAMATAMIS_CONFIG = {\n  web3formsKey: ${JSON.stringify(key)}\n};\n`;
  fs.writeFileSync(path.join(ROOT, 'scripts', 'config.js'), content, 'utf8');
  if (!key) {
    console.warn('[build] WEB3FORMS_KEY is empty - the pre-order form will be disabled until it is set (see .env.example).');
  } else {
    console.log('[build] Generated scripts/config.js from WEB3FORMS_KEY.');
  }
}

function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (IGNORED.has(entry.name)) continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyRecursive(from, to);
    else fs.copyFileSync(from, to);
  }
}

function build() {
  writeConfig();
  fs.rmSync(DIST, { recursive: true, force: true });
  copyRecursive(ROOT, DIST);
  fs.writeFileSync(path.join(DIST, '.nojekyll'), '');
  console.log('[build] Site built to dist/');
}

build();
