/**
 * Cross-platform: run ShopPage regression with home-ui Vite aliases.
 * Usage: node scripts/run-verify-shop-page.mjs  |  npm run verify:shop-page
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cwd = path.join(root, 'preview', 'home-ui');
const script = path.join(root, 'scripts', 'verify-shop-page.mjs');

const r = spawnSync(
  'npx',
  ['--yes', 'vite-node', script],
  { cwd, stdio: 'inherit', shell: true, env: process.env },
);

process.exit(r.status ?? 1);
