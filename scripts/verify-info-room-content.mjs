#!/usr/bin/env node
/**
 * 362 info-room content verifier (markdown files only).
 * Usage:
 *   node scripts/verify-info-room-content.mjs <folder>
 *   node scripts/verify-info-room-content.mjs <folder> 01,02,03,04,05
 */
import fs from 'node:fs';
import path from 'node:path';

const MIN_CHARS = 2500;
const MAX_CHARS = 4000;
const MIN_CHARS_NOSPACE = 1800;
const MIN_H2 = 4;
const MIN_SUMMARY = 3;
const MIN_CHECKS = 5;
const URL_RE = /https?:\/\/[^\s)\]]+/gi;
const TITLE_SIM_WARN = 0.55;
const HAN_RE = /[\u4e00-\u9fff]/g;
const TRIGRAM_FAIL = 0.6;
const SHARE_FAIL = 0.1;
const UDONG =
  '우리 동네 공부방·과외 정보는 우동공과 카드로도 정리해 두시면 좋아요.';

const folder = process.argv[2];
if (!folder) {
  console.error('Usage: node scripts/verify-info-room-content.mjs <folder> [01,02,...]');
  process.exit(2);
}

const abs = path.resolve(folder);
if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
  console.error(`Not a directory: ${abs}`);
  process.exit(2);
}

const onlyRaw = process.argv[3];
const onlyPrefixes = onlyRaw
  ? onlyRaw.split(',').map((s) => s.trim()).filter(Boolean)
  : null;

let files = fs
  .readdirSync(abs)
  .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
  .sort();

if (onlyPrefixes) {
  files = files.filter((f) =>
    onlyPrefixes.some((p) => {
      const pref = p.padStart(2, '0');
      return f.startsWith(`${pref}-`);
    })
  );
}

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

function isExceptionPara(p) {
  const t = p.replace(/\s+/g, ' ').trim();
  if (t === UDONG) return true;
  if (/^(학원법|시행령|「학원)/.test(t) && /제\d+조/.test(t) && t.length < 220) return true;
  if (/기준일\s*2026-11/.test(t) && /제\d+조/.test(t) && t.length < 280) return true;
  return false;
}

/** 번호·「」제목·기호 제거 후 비교용 문자열 */
function normalizeForCompare(p) {
  return p
    .replace(/실행\s*메모\s*\d+/g, '')
    .replace(/준비\s*메모\s*\d+/g, '')
    .replace(/「[^」]*」/g, '')
    .replace(/『[^』]*』/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function trigrams(s) {
  const out = [];
  if (s.length < 3) {
    if (s.length) out.push(s);
    return out;
  }
  for (let i = 0; i <= s.length - 3; i += 1) out.push(s.slice(i, i + 3));
  return out;
}

function trigramOverlap(a, b) {
  const A = trigrams(a);
  const B = trigrams(b);
  if (A.length === 0 || B.length === 0) return 0;
  const setB = new Set(B);
  let inter = 0;
  for (const t of A) if (setB.has(t)) inter += 1;
  return inter / Math.min(A.length, B.length);
}

function findRepeatedParagraphs(body) {
  const counts = new Map();
  for (const p of splitParagraphs(body)) {
    const key = p.replace(/[ \t]+/g, ' ').trim();
    if (key.length < 40) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].filter(([, c]) => c >= 2);
}

function findNearDuplicatePairs(paras) {
  const hits = [];
  const norms = paras.map((p) => ({ p, n: normalizeForCompare(p) }));
  for (let i = 0; i < norms.length; i += 1) {
    if (norms[i].n.length < 30 || isExceptionPara(paras[i])) continue;
    for (let j = i + 1; j < norms.length; j += 1) {
      if (norms[j].n.length < 30 || isExceptionPara(paras[j])) continue;
      const ov = trigramOverlap(norms[i].n, norms[j].n);
      if (ov >= TRIGRAM_FAIL) {
        hits.push({ i, j, ov });
      }
    }
  }
  return hits;
}

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

/** 「」 직후 조사 받침 검사 */
function findParticleErrors(body) {
  const errors = [];
  const re = /「([^」]{1,80})」(을|를|이|가|은|는)/g;
  let m;
  while ((m = re.exec(body))) {
    const inner = m[1];
    const particle = m[2];
    const hangul = [...inner].reverse().find((ch) => ch >= '가' && ch <= '힣');
    if (!hangul) continue;
    const code = hangul.charCodeAt(0) - 0xac00;
    const jong = code % 28;
    const hasBatchim = jong !== 0;
    const expect = {
      을: hasBatchim,
      를: !hasBatchim,
      이: hasBatchim,
      가: !hasBatchim,
      은: hasBatchim,
      는: !hasBatchim,
    };
    if (expect[particle] === false) {
      errors.push(`「…${hangul}」${particle}`);
    }
  }
  return errors;
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

function countNoSpace(s) {
  return [...s.replace(/\s+/g, '')].length;
}

const REQUIRED = ['title', 'topic', 'category_suggest', 'basis_date', 'chars', 'uncertain_facts'];

/** 파일별 파싱 */
const docs = files.map((file) => {
  const full = path.join(abs, file);
  const raw = fs.readFileSync(full, 'utf8');
  const { meta, body } = parseFrontmatter(raw);
  const paras = splitParagraphs(body);
  return { file, full, raw, meta, body, paras };
});

/** 폴더 전역: 정규화 키 → 등장 파일 집합 (예외 문단 제외) */
const globalNorm = new Map();
for (const doc of docs) {
  for (const p of doc.paras) {
    if (isExceptionPara(p)) continue;
    if (p.length < 40) continue;
    if (/^#/.test(p) || /^- \[[ xX]\] /.test(p) || /^이 글에서 알 수 있는 것/.test(p)) continue;
    const key = normalizeForCompare(p);
    if (key.length < 30) continue;
    if (!globalNorm.has(key)) globalNorm.set(key, new Set());
    globalNorm.get(key).add(doc.file);
  }
}

const rows = [];
let fail = 0;
const titles = [];

for (const doc of docs) {
  const { file, meta, body, paras } = doc;
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

  const near = findNearDuplicatePairs(paras);
  if (near.length) {
    const top = near.sort((a, b) => b.ov - a.ov)[0];
    issues.push(`near-dup paragraphs ov=${(top.ov * 100).toFixed(0)}%`);
  }

  // 공유 문단 비율
  let shareable = 0;
  let shared = 0;
  const sharedKeys = new Set();
  for (const p of paras) {
    if (isExceptionPara(p)) continue;
    if (p.length < 40) continue;
    if (/^#/.test(p) || /^- \[[ xX]\] /.test(p) || /^이 글에서 알 수 있는 것/.test(p)) continue;
    const key = normalizeForCompare(p);
    if (key.length < 30) continue;
    shareable += 1;
    const owners = globalNorm.get(key);
    if (owners && owners.size > 1) {
      shared += 1;
      sharedKeys.add(key);
    }
  }
  const shareRatio = shareable === 0 ? 0 : shared / shareable;
  if (shareRatio > SHARE_FAIL) {
    issues.push(`shared paras ${(shareRatio * 100).toFixed(1)}% > ${SHARE_FAIL * 100}% (${shared}/${shareable})`);
  }

  // 고유 본문: 공유·실행메모·템플릿성 문단 제외
  const uniqueParas = paras.filter((p) => {
    if (isExceptionPara(p)) return true; // 예외는 본문에 남아도 되지만 고유 측정에서는 제외
    if (/실행\s*메모\s*\d+/.test(p) || /준비\s*메모\s*\d+/.test(p)) return false;
    if (/^#/.test(p) || /^이 글에서 알 수 있는 것/.test(p) || /^- /.test(p) || /^### /.test(p)) return true;
    const key = normalizeForCompare(p);
    if (key.length >= 30 && sharedKeys.has(key)) return false;
    // 제목만 바꾼 공통 마무리 패턴
    if (/내용을 실행으로 옮길 때는 오늘/.test(p)) return false;
    if (/가족과 나눌 때도 같은 세 칸/.test(p)) return false;
    if (/상담에 쓸 때는 형태·장소/.test(p) || /상담·공지에 쓸 때는/.test(p) || /문구에 쓸 때는 혜택/.test(p)) return false;
    if (/점검은 주간 리뷰로/.test(p)) return false;
    if (/확인이 끝나면 다음 글/.test(p) || /확인이 끝나면, 오늘/.test(p)) return false;
    if (/공간이 정해졌다면 사진 세 장/.test(p)) return false;
    if (/일정이 밀리면 홍보를 줄이고/.test(p)) return false;
    if (/시즌이 바뀌면/.test(p) && /체크를 한 번 더/.test(p)) return false;
    if (/남은 불확실 항목은/.test(p)) return false;
    if (/인쇄물·채팅/.test(p) && /필수 표시/.test(p)) return false;
    if (/도움이 되는 동료·멘토/.test(p)) return false;
    if (/배포 전에 「/.test(p) && /다른 사람 한 명/.test(p)) return false;
    if (/사진·후기를 쓸 계획이면/.test(p)) return false;
    if (/예산이 빠듯하면/.test(p)) return false;
    if (/관련해서 「/.test(p) && /확인이 끝나면/.test(p)) return false;
    if (/실행 메모 \d+:/.test(p)) return false;
    return true;
  });
  // 고유 측정에서 예외·헤더·체크 제외한 본문 글자
  const uniqueForMeasure = uniqueParas
    .filter((p) => !isExceptionPara(p))
    .filter((p) => !/^#/.test(p) && !/^이 글에서/.test(p) && !/^- \[[ xX]\] /.test(p) && !/^### /.test(p))
    .join('\n\n');
  const charsWithSpace = [...uniqueForMeasure].length;
  const charsNoSpace = countNoSpace(uniqueForMeasure);

  if (charsWithSpace < MIN_CHARS || charsWithSpace > MAX_CHARS) {
    issues.push(`unique chars(with space)=${charsWithSpace} not in ${MIN_CHARS}-${MAX_CHARS}`);
  }
  if (charsNoSpace < MIN_CHARS_NOSPACE) {
    issues.push(`unique chars(no space)=${charsNoSpace} < ${MIN_CHARS_NOSPACE}`);
  }

  const declared = meta?.chars;
  if (typeof declared === 'number' && Math.abs(declared - charsWithSpace) > 80) {
    // frontmatter는 전체 본문일 수 있어 경고성 — 고유 기준과 크게 어긋나면 FAIL
    // 재작성 후 chars는 고유 with-space에 맞출 예정
    issues.push(`chars mismatch declared=${declared} uniqueWithSpace=${charsWithSpace}`);
  }

  const particleErrs = findParticleErrors(body);
  if (particleErrs.length) {
    issues.push(`particle ${particleErrs.slice(0, 3).join(', ')}`);
  }

  const han = body.match(HAN_RE) || [];
  if (han.length) {
    const sample = [...new Set(han)].slice(0, 8).join('');
    issues.push(`CJK Han residual ${han.length} (${sample})`);
  }

  const udongCount = (body.match(/우리 동네 공부방·과외 정보는 우동공과 카드로도 정리해 두시면 좋아요\./g) || []).length;
  if (udongCount !== 1) issues.push(`udonggong lines ${udongCount} != 1`);

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
    charsWithSpace,
    charsNoSpace,
    shareRatio,
    shared,
    shareable,
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
console.log(`Files: ${files.length}${onlyPrefixes ? ` (filter ${onlyPrefixes.join(',')})` : ''}`);
console.log('');
console.log(
  [
    'file'.padEnd(42),
    'w/sp'.padStart(5),
    'noSp'.padStart(5),
    'shr%'.padStart(5),
    'status'.padStart(6),
    'issues',
  ].join(' | ')
);
console.log('-'.repeat(120));
for (const r of rows) {
  console.log(
    [
      r.file.padEnd(42),
      String(r.charsWithSpace).padStart(5),
      String(r.charsNoSpace).padStart(5),
      (r.shareRatio * 100).toFixed(0).padStart(4) + '%',
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
const ws = rows.map((r) => r.charsWithSpace);
const ns = rows.map((r) => r.charsNoSpace);
console.log(
  `Unique chars with space: min=${Math.min(...ws)} avg=${Math.round(ws.reduce((a, b) => a + b, 0) / ws.length)} max=${Math.max(...ws)}`
);
console.log(
  `Unique chars no space:   min=${Math.min(...ns)} avg=${Math.round(ns.reduce((a, b) => a + b, 0) / ns.length)} max=${Math.max(...ns)}`
);
console.log(`Result: ${fail === 0 ? 'PASS' : 'FAIL'} (${files.length - fail} pass / ${fail} fail)`);

process.exit(fail === 0 ? 0 : 1);
