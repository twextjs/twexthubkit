// Exercise metadata validation through the real generator in isolated fixtures.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { expect, onTestFinished, test } from 'vitest';
import YAML from 'yaml';

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'twexthubkit-product-'));
  onTestFinished(function () {
    fs.rmSync(root, { recursive: true, force: true });
  });
  fs.mkdirSync(path.join(root, 'scripts'));
  fs.mkdirSync(path.join(root, 'src'));
  fs.symlinkSync(path.resolve('node_modules'), path.join(root, 'node_modules'));
  fs.copyFileSync('scripts/product.mjs', path.join(root, 'scripts/product.mjs'));
  fs.copyFileSync('package.json', path.join(root, 'package.json'));
  return root;
}

for (const key of ['success', 'error', 'progress', 'bullet']) {
  test(`product commands reject invalid symbols.${key}`, function () {
    const root = fixture();
    for (const value of [undefined, '', ' ', 1, null]) {
      const metadata = YAML.parse(fs.readFileSync('product.yml', 'utf8'));
      metadata.symbols[key] = value;
      fs.writeFileSync(path.join(root, 'product.yml'), YAML.stringify(metadata));
      for (const args of [[], ['--check']]) {
        const result = spawnSync(process.execPath, ['scripts/product.mjs', ...args], {
          cwd: root,
          encoding: 'utf8',
        });
        expect(result.status).toBe(1);
        expect(result.stderr).toContain(`symbols.${key} must be a non-empty string`);
      }
    }
    const metadata = YAML.parse(fs.readFileSync('product.yml', 'utf8'));
    delete metadata.symbols;
    fs.writeFileSync(path.join(root, 'product.yml'), YAML.stringify(metadata));
    for (const args of [[], ['--check']]) {
      const result = spawnSync(process.execPath, ['scripts/product.mjs', ...args], { cwd: root });
      expect(result.status).toBe(1);
    }
  });
}

test('generated product freezes nested metadata and passes its check', async function () {
  const root = fixture();
  fs.copyFileSync('product.yml', path.join(root, 'product.yml'));
  for (const args of [[], ['--check']]) {
    const result = spawnSync(process.execPath, ['scripts/product.mjs', ...args], { cwd: root });
    expect(result.status).toBe(0);
  }
  const { product } = await import(pathToFileURL(path.join(root, 'src/product.js')).href);
  for (const value of [product, product.defaults, product.symbols]) {
    expect(Object.isFrozen(value)).toBe(true);
  }
  expect(function () {
    product.symbols.success = 'changed';
  }).toThrow(TypeError);
  expect(function () {
    product.defaults.apiBaseUrl = 'https://changed.example';
  }).toThrow(TypeError);
});
