/* Dependency-free structural checks. Run: node scripts/check.cjs */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const context = { window: {} };
vm.createContext(context);
for (const file of fs.readdirSync(path.join(root, 'js')).filter(file => file.endsWith('.js'))) {
  const source = fs.readFileSync(path.join(root, 'js', file), 'utf8');
  new vm.Script(source, { filename: file });
  if (['translations.js', 'config.js', 'data.js'].includes(file)) vm.runInContext(source, context);
}
const dictionaries = context.window.SIAM_TRANSLATIONS;
const keys = Object.keys(dictionaries.en).sort();
for (const language of ['en', 'de', 'th']) {
  assert.deepEqual(Object.keys(dictionaries[language]).sort(), keys, 'Language keys differ: ' + language);
  assert.ok(Object.values(dictionaries[language]).every(value => typeof value === 'string' && value.trim()), 'Empty translation: ' + language);
}
for (const match of html.matchAll(/data-i18n(?:-aria|-alt)?="([^"]+)"/g)) assert.ok(keys.includes(match[1]), 'Missing key: ' + match[1]);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'Duplicate HTML IDs');
for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(match[1]), 'Broken anchor: ' + match[1]);
for (const match of html.matchAll(/(?:src|href)="([^"#:]+\.(?:js|css|svg|webp|avif|png|jpe?g))"/g)) {
  assert.ok(!match[1].startsWith('/'), 'Root-absolute asset path: ' + match[1]);
  assert.ok(fs.existsSync(path.join(root, match[1])), 'Missing asset: ' + match[1]);
}
for (const match of html.matchAll(/srcset="([^"]+)"/g)) {
  for (const entry of match[1].split(',')) {
    const [file, width] = entry.trim().split(/\s+/);
    assert.ok(/^assets\/images\//.test(file) && /^\d+w$/.test(width), 'Invalid responsive image source: ' + entry);
    assert.ok(fs.existsSync(path.join(root, file)), 'Missing responsive image: ' + file);
  }
}
const gallery = context.window.SIAM_DATA.gallery;
assert.equal(gallery.length, new Set(gallery.map(item => item.id)).size, 'Duplicate gallery IDs');
for (const item of gallery) {
  if (!item.image) continue;
  assert.ok(['en', 'de', 'th'].every(lang => item.alt?.[lang]?.trim()), 'Missing photo translation: ' + item.id);
  for (const file of [item.image, item.thumbnail, ...(item.sources || []).map(source => source.image)].filter(Boolean)) {
    assert.ok(/^assets\/images\//.test(file) && !file.includes('..'), 'Non-local photo path: ' + file);
    assert.ok(fs.existsSync(path.join(root, file)), 'Missing gallery photo: ' + file);
  }
}
assert.ok(!/\b[A-Za-z]:[\\/]/.test(html), 'Local Windows path in HTML');
assert.ok(!html.includes('brand-symbol'), 'Invented monogram remains');
assert.ok(fs.existsSync(path.join(root, '.nojekyll')), 'Missing .nojekyll');
console.log('PASS: script syntax, ' + keys.length + ' keys in all 3 languages, anchors, unique IDs, local assets and GitHub Pages paths.');
