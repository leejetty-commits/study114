/**
 * Large-file growth landing gate.
 * Hubs may only grow via tiny wiring; new logic must land in ext / *Store / *Writer.
 *
 * Usage: node scripts/verify-large-file-growth-landing.mjs
 *        npm run verify:large-file-growth-landing
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** @type {{ rel: string, maxLines: number, maxExportFn?: number, maxPublicFn?: number, maxPrivateFn?: number, mustInclude: string[] }} */
const HUBS = [
  {
    rel: 'preview/home-ui/src/plans/screens.js',
    maxLines: 2350,
    maxExportFn: 13,
    mustInclude: [
      'GROWTH RULE',
      "from './screens-ext-positions.js'",
      "from './screens-ext-access.js'",
      "from './screens-ext-checkout.js'",
    ],
  },
  {
    rel: 'src/StudyRoom/StudyRoomRegisterService.php',
    maxLines: 2600,
    maxPublicFn: 3,
    maxPrivateFn: 52,
    mustInclude: [
      'GROWTH RULE',
      'StudyRoomRegisterExt::STEPS',
    ],
  },
];

const LANDINGS = [
  'preview/home-ui/src/plans/screens-ext-positions.js',
  'preview/home-ui/src/plans/screens-ext-access.js',
  'preview/home-ui/src/plans/screens-ext-checkout.js',
  'src/StudyRoom/StudyRoomRegisterExt.php',
];

const errors = [];

function read(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    errors.push(`missing: ${rel}`);
    return null;
  }
  return fs.readFileSync(abs, 'utf8');
}

function lineCount(src) {
  if (!src) return 0;
  return src.split(/\r?\n/).length;
}

for (const rel of LANDINGS) {
  const src = read(rel);
  if (!src) continue;
  if (rel.endsWith('StudyRoomRegisterExt.php') && !src.includes('public const STEPS')) {
    errors.push(`${rel}: STEPS const required`);
  }
  if (rel.includes('screens-ext-') && !/GROWTH LANDING/.test(src)) {
    errors.push(`${rel}: GROWTH LANDING marker required`);
  }
}

for (const hub of HUBS) {
  const src = read(hub.rel);
  if (!src) continue;
  const lines = lineCount(src);
  if (lines > hub.maxLines) {
    errors.push(
      `${hub.rel}: ${lines} lines > max ${hub.maxLines} — put new logic in screens-ext-* / StudyRoomRegisterExt|*Store|*Writer`,
    );
  }
  for (const needle of hub.mustInclude) {
    if (!src.includes(needle)) {
      errors.push(`${hub.rel}: missing required marker/wiring: ${needle}`);
    }
  }
  if (hub.maxExportFn != null) {
    const n = (src.match(/^export function /gm) || []).length;
    if (n > hub.maxExportFn) {
      errors.push(
        `${hub.rel}: export function count ${n} > max ${hub.maxExportFn} — add helpers in screens-ext-*.js`,
      );
    }
  }
  if (hub.maxPublicFn != null) {
    const n = (src.match(/public function /g) || []).length;
    if (n > hub.maxPublicFn) {
      errors.push(
        `${hub.rel}: public function count ${n} > max ${hub.maxPublicFn} — extend via StudyRoomRegisterExt / *Store`,
      );
    }
  }
  if (hub.maxPrivateFn != null) {
    const n = (src.match(/private function /g) || []).length;
    if (n > hub.maxPrivateFn) {
      errors.push(
        `${hub.rel}: private function count ${n} > max ${hub.maxPrivateFn} — extract to StudyRoomRegisterExt / *Store / *Writer`,
      );
    }
  }
}

if (errors.length) {
  console.error('verify:large-file-growth-landing FAILED\n');
  for (const e of errors) console.error(` - ${e}`);
  console.error('\nSee .cursor/rules/large-file-growth-landing.mdc');
  process.exit(1);
}

console.log('verify:large-file-growth-landing OK');
for (const hub of HUBS) {
  const src = read(hub.rel);
  console.log(`  ${hub.rel}: ${lineCount(src)} lines (max ${hub.maxLines})`);
}
