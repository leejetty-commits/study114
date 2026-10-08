/**
 * 견본·가짜 카드 데이터 재유입 차단 (2026-10-09 견본카드 제거)
 * 대상: preview/ 전체(관리자 화면 admin/ 제외), 빌드 산출물·node_modules 제외.
 * 실행: node scripts/verify-no-sample-data.mjs
 *
 * 1) TUTOR_SEED / STUDY_ROOM_SEED / STUDENT_SEED 정의 0
 * 2) search-exposure-mapper 의 EXPOSURE_ 폴백 0
 * 3) '샘플 과외쌤' / '샘플 공부방' / 'expo-sample-stamp' 0
 * 4) home-card-samples 프리셋 import 0
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PREVIEW = join(ROOT, 'preview');
const SKIP_DIRS = new Set(['node_modules', 'dist', 'admin', '.vite']);
const EXTS = /\.(m?js|cjs|ts|tsx|jsx|css|html|vue)$/;

function walk(dir, out = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      walk(join(dir, ent.name), out);
    } else if (EXTS.test(ent.name)) {
      out.push(join(dir, ent.name));
    }
  }
  return out;
}

const files = walk(PREVIEW).map((abs) => ({
  rel: relative(ROOT, abs).replace(/\\/g, '/'),
  src: readFileSync(abs, 'utf8'),
}));

let failed = 0;
function check(name, hits) {
  if (hits.length) {
    failed += 1;
    console.error(`FAIL: ${name}`);
    for (const h of hits) console.error(`  - ${h}`);
  } else {
    console.log(`PASS: ${name}`);
  }
}

function grepAll(re) {
  const hits = [];
  for (const { rel, src } of files) {
    src.split(/\r?\n/).forEach((line, i) => {
      if (re.test(line)) hits.push(`${rel}:${i + 1}: ${line.trim().slice(0, 120)}`);
    });
  }
  return hits;
}

check(
  '1) TUTOR_SEED / STUDY_ROOM_SEED / STUDENT_SEED 정의 0',
  grepAll(/\b(?:const|let|var|function)\s+(?:TUTOR_SEED|STUDY_ROOM_SEED|STUDENT_SEED)\b/),
);

const mapperRel = 'preview/search-ui/src/search-exposure-mapper.js';
const mapper = files.find((f) => f.rel === mapperRel);
check(
  '2) search-exposure-mapper EXPOSURE_ 폴백 0',
  !mapper
    ? [`${mapperRel} 없음`]
    : mapper.src
        .split(/\r?\n/)
        .map((line, i) => (/EXPOSURE_/.test(line) ? `${mapperRel}:${i + 1}: ${line.trim()}` : ''))
        .filter(Boolean),
);

check("3) '샘플 과외쌤' / '샘플 공부방' / 'expo-sample-stamp' 0", grepAll(/샘플 과외쌤|샘플 공부방|expo-sample-stamp/));

check(
  '4) home-card-samples 프리셋 import 0',
  [
    ...grepAll(/(?:import|from)\s*\(?\s*['"][^'"]*home-card-samples\//),
    ...(existsSync(join(PREVIEW, 'home-ui/src/home-card-samples/presets.js'))
      ? ['preview/home-ui/src/home-card-samples/presets.js 파일이 남아 있음']
      : []),
  ],
);

console.log(`\n검사 파일 ${files.length}개 (preview/, admin 제외)`);
if (failed) {
  console.error(`no-sample-data FAILED (${failed})`);
  process.exit(1);
}
console.log('no-sample-data OK');
