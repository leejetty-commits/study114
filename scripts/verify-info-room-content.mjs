#!/usr/bin/env node
/**
 * 362 info-room content verifier (markdown files only).
 * Usage: node scripts/verify-info-room-content.mjs <folder>
 */
import fs from 'node:fs';
import path from 'node:path';

const MIN_CHARS = 2500;
const MAX_CHARS = 4000;
const MIN_H2 = 4;
const MIN_SUMMARY = 3;
const MIN_CHECKS = 5;
const URL_RE = /https?:\/\/[^\s)\]]+/gi;
const TITLE_SIM_WARN = 0.55;
/** CJK Unified Ideographs (한자). 한글·가나·전각문장부호는 제외. */
const HAN_RE = /[\u4e00-\u9fff]/g;

const folder = process.argv[2];
if (!folder) {
  console.error('Usage: node scripts/verify-info-room-content.mjs <folder>');
  process.exit(2);
}

const abs = path.resolve(folder);
if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
  console.error(`Not a directory: ${abs}`);
  process.exit(2);
}

const files = fs
  .readdirSync(abs)
  .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
  .sort();

if (files.length === 0) {
  console.error(`No markdown files in ${abs}`);
  process.exit(2);
}

function parseFrontmatter(raw) {
  if (!raw.startsWith('---')) return { meta: null, body: raw };
  const end = raw.indexOf('\n---', 3);
  if (end < 0) return { meta: null, body: raw };
  const fm = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\r?\n/, '');
  const meta = {};
  for (const line of fm.split(/\r?\n/)) {
    const m = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      const inner = val.slice(1, -1).trim();
      meta[key] = inner
        ? inner.split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''))
        : [];
    } else if (/^\d+$/.test(val)) {
      meta[key] = Number(val);
    } else {
      meta[key] = val.replace(/^["']|["']$/g, '');
    }
  }
  return { meta, body };
}

function splitParagraphs(body) {
  return body
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.replace(/\r?\n/g, '\n').trim())
    .filter((p) => p.length > 0);
}

/** 동일 문단(공백 정규화)이 2회 이상이면 반복으로 본다. */
function findRepeatedParagraphs(body) {
  const counts = new Map();
  for (const p of splitParagraphs(body)) {
    const key = p.replace(/[ \t]+/g, ' ').trim();
    if (key.length < 40) continue; // 짧은 체크·불릿 블록은 제외
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].filter(([, c]) => c >= 2);
}

/** 반복 문단은 첫 등장만 남긴 본문 */
function dedupeParagraphs(body) {
  const parts = body.split(/(\r?\n\s*\r?\n)/);
  const seen = new Set();
  const out = [];
  for (const part of parts) {
    if (/^\r?\n\s*\r?\n$/.test(part) || part === '\n\n') {
      out.push(part);
      continue;
    }
    const key = part.replace(/[ \t]+/g, ' ').trim();
    if (!key) {
      out.push(part);
      continue;
    }
    if (key.length >= 40 && seen.has(key)) continue;
    if (key.length >= 40) seen.add(key);
    out.push(part);
  }
  return out.join('').replace(/(\r?\n){3,}/g, '\n\n').replace(/\s+$/, '\n');
}

function countSummaryBullets(body) {
  const lines = body.split(/\r?\n/);
  let inSummary = false;
  let count = 0;
  for (const line of lines) {
    if (/요약|이 글에서 알 수 있는 것/.test(line) && !line.startsWith('#')) {
      inSummary = true;
      continue;
    }
    if (inSummary) {
      if (/^#{1,6}\s/.test(line)) break;
      if (/^[-*]\s+/.test(line)) count += 1;
      else if (line.trim() === '') continue;
      else if (count > 0) break;
    }
  }
  return count;
}

function tokenizeTitle(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

function jaccard(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter += 1;
  return inter / (A.size + B.size - inter);
}

const REQUIRED = ['title', 'topic', 'category_suggest', 'basis_date', 'chars', 'uncertain_facts'];
const rows = [];
let fail = 0;
const titles = [];

for (const file of files) {
  const full = path.join(abs, file);
  const raw = fs.readFileSync(full, 'utf8');
  const { meta, body } = parseFrontmatter(raw);
  const issues = [];

  if (!meta) {
    issues.push('frontmatter missing');
  } else {
    for (const k of REQUIRED) {
      if (!(k in meta)) issues.push(`missing field ${k}`);
    }
  }

  const reps = findRepeatedParagraphs(body);
  if (reps.length) {
    const top = reps.sort((a, b) => b[1] - a[1])[0];
    issues.push(`repeated paragraph ${top[1]}x (len=${top[0].length})`);
  }

  const uniqueBody = dedupeParagraphs(body);
  const measured = [...uniqueBody].length;
  const declared = meta?.chars;
  if (measured < MIN_CHARS || measured > MAX_CHARS) {
    issues.push(`chars out of range measured=${measured} (after dedupe)`);
  }
  if (typeof declared === 'number' && Math.abs(declared - measured) > 30) {
    issues.push(`chars mismatch declared=${declared} measured=${measured}`);
  }

  const han = uniqueBody.match(HAN_RE) || [];
  if (han.length) {
    const sample = [...new Set(han)].slice(0, 8).join('');
    issues.push(`CJK Han residual ${han.length} (${sample})`);
  }

  const h1 = (body.match(/^#\s+.+/m) || []).length;
  if (h1 < 1) issues.push('missing # title');

  const h2 = (body.match(/^##\s+.+/gm) || []).length;
  if (h2 < MIN_H2) issues.push(`## count ${h2} < ${MIN_H2}`);

  const summary = countSummaryBullets(body);
  if (summary < MIN_SUMMARY) issues.push(`summary bullets ${summary} < ${MIN_SUMMARY}`);

  const checks = (body.match(/^- \[[ xX]\] /gm) || []).length;
  if (checks < MIN_CHECKS) issues.push(`checklist ${checks} < ${MIN_CHECKS}`);

  const urls = body.match(URL_RE) || [];
  if (urls.length) issues.push(`body URLs ${urls.length}`);

  const hasExample = /예시|사례/.test(body);
  if (!hasExample) issues.push('no 사례/예시 marker');

  const title = meta?.title || file;
  titles.push({ file, title, tokens: tokenizeTitle(title) });

  const ok = issues.length === 0;
  if (!ok) fail += 1;
  rows.push({
    file,
    title,
    measured,
    declared: declared ?? '',
    h2,
    summary,
    checks,
    urls: urls.length,
    status: ok ? 'PASS' : 'FAIL',
    issues: issues.join('; '),
  });
}

console.log(`Folder: ${abs}`);
console.log(`Files: ${files.length}`);
console.log('');
console.log(
  [
    'file'.padEnd(42),
    'chars'.padStart(6),
    'h2'.padStart(3),
    'sum'.padStart(3),
    'chk'.padStart(3),
    'url'.padStart(3),
    'status'.padStart(6),
    'issues',
  ].join(' | ')
);
console.log('-'.repeat(120));
for (const r of rows) {
  console.log(
    [
      r.file.padEnd(42),
      String(r.measured).padStart(6),
      String(r.h2).padStart(3),
      String(r.summary).padStart(3),
      String(r.checks).padStart(3),
      String(r.urls).padStart(3),
      r.status.padStart(6),
      r.issues || '-',
    ].join(' | ')
  );
}

console.log('');
console.log('Title similarity warnings:');
let warn = 0;
for (let i = 0; i < titles.length; i += 1) {
  for (let j = i + 1; j < titles.length; j += 1) {
    const sim = jaccard(titles[i].tokens, titles[j].tokens);
    if (sim >= TITLE_SIM_WARN) {
      warn += 1;
      console.log(
        `  WARN ${titles[i].file} ↔ ${titles[j].file} sim=${sim.toFixed(2)} | ${titles[i].title} / ${titles[j].title}`
      );
    }
  }
}
if (warn === 0) console.log('  (none)');

console.log('');
const measuredList = rows.map((r) => r.measured);
const min = Math.min(...measuredList);
const max = Math.max(...measuredList);
const avg = Math.round(measuredList.reduce((a, b) => a + b, 0) / measuredList.length);
console.log(`Char distribution (after dedupe): min=${min} avg=${avg} max=${max}`);
console.log(`Result: ${fail === 0 ? 'PASS' : 'FAIL'} (${files.length - fail} pass / ${fail} fail)`);

process.exit(fail === 0 ? 0 : 1);
