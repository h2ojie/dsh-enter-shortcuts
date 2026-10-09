import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));

test('declares an installable bundle without changing its Web client contract', () => {
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml');
  assert.equal(manifest.dsh.client.platform, 'web');
  assert.equal(manifest.dsh.client.immediately, true);
});

test('the bundle inserts exactly one entry with the existing id and module name', () => {
  const patch = readFileSync(new URL(manifest.dsh.bundle.patch, root), 'utf8');
  const content = patch.split('\n').filter(line => line.trim() && !line.trim().startsWith('#')).join('\n');
  assert.equal(content, '- insert:\n    - id: ui-enter-shortcuts\n      name: dsh-enter-shortcuts');
});

test('package contents include the bundle patch and both implementation halves', () => {
  for (const path of ['cordis.patch.yml', 'lib/index.js', 'lib/client.js', 'README.md']) {
    assert.ok(manifest.files.includes(path), `${path} must be packaged`);
    assert.ok(existsSync(new URL(path, root)), `${path} must exist`);
  }
});
