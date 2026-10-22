// Keeps src/product.js and package.json in step with the product.yml that names
// this package. Run with --check in CI; run without it to rewrite the module.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const productPath = path.join(root, 'product.yml');
const productModulePath = path.join(root, 'src', 'product.js');
const packagePath = path.join(root, 'package.json');

function loadProduct() {
  const product = YAML.parse(fs.readFileSync(productPath, 'utf8'));
  if (!product || typeof product !== 'object') {
    throw new Error('product.yml must contain a mapping');
  }
  for (const key of ['name', 'version', 'tagline', 'author', 'homepage']) {
    if (typeof product[key] !== 'string' || product[key].length === 0) {
      throw new Error(`product.yml is missing a non-empty ${key}`);
    }
  }
  if (!product.defaults || typeof product.defaults.apiBaseUrl !== 'string') {
    throw new Error('product.yml defaults.apiBaseUrl must be a string');
  }
  return product;
}

function renderProductModule(product) {
  const json = JSON.stringify(product, null, 2);
  return [
    '// Generated from product.yml by scripts/product.mjs. Do not edit by hand.',
    `export const product = Object.freeze(${json});`,
    '',
  ].join('\n');
}

function check() {
  const product = loadProduct();
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const expectedModule = renderProductModule(product);
  const actualModule = fs.existsSync(productModulePath)
    ? fs.readFileSync(productModulePath, 'utf8')
    : '';

  const problems = [];
  if (pkg.version !== product.version) {
    problems.push(
      `package.json version ${pkg.version} does not match product.yml ${product.version}`,
    );
  }
  if (actualModule !== expectedModule) {
    problems.push('src/product.js is out of date; run npm run product:sync');
  }
  if (problems.length > 0) {
    console.error(problems.join('\n'));
    process.exitCode = 1;
    return;
  }
  console.log('product.yml, package.json, and src/product.js agree');
}

function write() {
  const product = loadProduct();
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  if (pkg.version !== product.version) {
    throw new Error(
      `package.json version ${pkg.version} does not match product.yml ${product.version}`,
    );
  }
  fs.writeFileSync(productModulePath, renderProductModule(product));
  console.log('wrote src/product.js');
}

if (process.argv.includes('--check')) {
  check();
} else {
  write();
}
