#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GENERATED = new Set(['scripts/config.js']);
const errors = [];

const htmlFiles = fs.readdirSync(ROOT).filter(name => name.endsWith('.html'));

function countTag(content, tag) {
  const open = (content.match(new RegExp(`<${tag}\\b`, 'gi')) || []).length;
  const close = (content.match(new RegExp(`</${tag}>`, 'gi')) || []).length;
  return { open, close };
}

htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(ROOT, file), 'utf8');

  const seenIds = new Set();
  let match;
  const idRe = /\sid="([^"]+)"/g;
  while ((match = idRe.exec(content))) {
    if (seenIds.has(match[1])) errors.push(`${file}: duplicate id "${match[1]}"`);
    seenIds.add(match[1]);
  }

  ['div', 'section'].forEach(tag => {
    const { open, close } = countTag(content, tag);
    if (open !== close) errors.push(`${file}: <${tag}> ${open} open vs ${close} close`);
  });

  const refRe = /(?:href|src)="([^"]+)"/g;
  while ((match = refRe.exec(content))) {
    const raw = match[1];
    if (/^(https?:|data:|mailto:|tel:|#)/i.test(raw)) continue;
    const ref = raw.split('#')[0].split('?')[0];
    if (!ref || GENERATED.has(ref)) continue;
    if (!fs.existsSync(path.join(ROOT, ref))) errors.push(`${file}: missing reference "${raw}"`);
  }
});

if (errors.length) {
  console.error('Static checks failed:');
  errors.forEach(err => console.error(`  - ${err}`));
  process.exit(1);
}

console.log(`Static checks passed for ${htmlFiles.length} HTML files.`);
