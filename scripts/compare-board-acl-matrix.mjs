/**
 * JS dumpBoardAclMatrix vs PHP BoardChannelAcl::dumpMatrix
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const tmp = join(dirname(fileURLToPath(import.meta.url)), '..', 'tmp');
const jsPath = join(tmp, 'board-acl-matrix-js.json');
const phpPath = join(tmp, 'board-acl-matrix-php.json');

if (!existsSync(jsPath)) {
  console.error('JS matrix missing — run verify-board-channel-acl.mjs first');
  process.exit(1);
}
if (!existsSync(phpPath)) {
  console.error('PHP matrix missing — PHP ACL verify 미실행. 서버 ACL 완료로 처리하지 않음.');
  process.exit(2);
}

function keyOf(row) {
  return `${row.role}|${row.alias}`;
}

function norm(row) {
  return {
    role: row.role,
    channel: row.channel,
    alias: row.alias,
    discover: Boolean(row.discover),
    list: Boolean(row.list),
    detail: Boolean(row.detail),
    compose: Boolean(row.compose),
    comment: Boolean(row.comment),
    react: Boolean(row.react),
    download: Boolean(row.download),
    upload: Boolean(row.upload),
    delete: Boolean(row.delete),
    moderate: Boolean(row.moderate),
    access: String(row.access),
  };
}

const js = JSON.parse(readFileSync(jsPath, 'utf8')).map(norm);
const php = JSON.parse(readFileSync(phpPath, 'utf8')).map(norm);
const phpMap = new Map(php.map((r) => [keyOf(r), r]));

let fail = 0;
if (js.length !== php.length) {
  console.error(`FAIL  count js=${js.length} php=${php.length}`);
  fail += 1;
}

for (const row of js) {
  const other = phpMap.get(keyOf(row));
  if (!other) {
    console.error(`FAIL  missing php row ${keyOf(row)}`);
    fail += 1;
    continue;
  }
  const fields = ['channel', 'discover', 'list', 'detail', 'compose', 'comment', 'react', 'download', 'upload', 'delete', 'moderate', 'access'];
  for (const f of fields) {
    if (row[f] !== other[f]) {
      console.error(`FAIL  ${keyOf(row)} ${f} js=${row[f]} php=${other[f]}`);
      fail += 1;
    }
  }
}

if (fail) {
  console.error(`\n${fail} JS↔PHP ACL diffs`);
  process.exit(1);
}
console.log(`JS↔PHP ACL matrix match (${js.length} rows)`);
