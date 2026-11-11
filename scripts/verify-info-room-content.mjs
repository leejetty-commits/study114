#!/usr/bin/env node
/**
 * 362 info-room content verifier (markdown files only).
 * Usage:
 *   node scripts/verify-info-room-content.mjs <folder>
 *   node scripts/verify-info-room-content.mjs <folder> 01,02,03
 * 접두사 필터가 있어도 비교 대상은 폴더 전체(8차 A-7).
 */
import fs from 'node:fs';
import path from 'node:path';

const MIN_CHARS = 2700;
const MAX_CHARS = 4000;
const MIN_CHARS_NOSPACE = 2000;
const MIN_BODY_CHARS = 2300;
const MIN_H2 = 4;
const MIN_SUMMARY = 3;
const MIN_CHECKS = 5;
const MIN_SECTION_SENTENCES = 3;
const SENT_COMPARE_MIN = 15;
const SENT_NORM_MIN = 15;
const H2_TITLE_SIM = 0.5;
const TRIGRAM_FAIL = 0.5;
const SHARE_FAIL = 0.1;
const URL_RE = /https?:\/\/[^\s)\]]+/gi;
const TITLE_SIM_WARN = 0.55;
const HAN_RE = /[\u4e00-\u9fff]/g;
const UDONG =
  '우리 동네 공부방·과외 정보는 우동공과 카드로도 정리해 두시면 좋아요.';
const QUOTE_OK_PARTICLE =
  /^(을|를|이|가|은|는|과|와|의|에|에서|로|으로|으로만|만|만으로|도|부터|까지|처럼|보다|라고|이라고|이라며|이며|이고|고|요|다|등|및|입니다|인가|인|인지|할|한|하면|하거나|이면|면|일|와)$/;

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

const allFiles = fs
  .readdirSync(abs)
  .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
  .sort();

if (allFiles.length === 0) {
  console.error(`No markdown files in ${abs}`);
  process.exit(2);
}

const reportFiles = onlyPrefixes
  ? allFiles.filter((f) =>
      onlyPrefixes.some((p) => f.startsWith(`${p.padStart(2, '0')}-`))
    )
  : allFiles;

if (reportFiles.length === 0) {
  console.error(`No markdown files match filter`);
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

/** 글간 비교용 예외. 글내 유사도에서는 법령도 비교(A-4) */
function isExceptionSentence(s) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  if (!t) return true;
  if (t === UDONG) return true;
  if (/제\d+조/.test(t) && /(학원법|시행령|법\s*제)/.test(t) && t.length < 220) return true;
  if (/개인과외교습자는/.test(t) && /바뀌면/.test(t) && /15일/.test(t) && /변경신고/.test(t))
    return true;
  if (/개인과외 장소로는 불가/.test(t) && t.length < 100) return true;
  if (/상가·오피스텔은 불가/.test(t) && t.length < 100) return true;
  if (/반환사유 발생일부터 5일/.test(t) && t.length < 180) return true;
  if (/신고증명서를 게시해야 하고/.test(t) && /제14조의2/.test(t) && t.length < 160) return true;
  if (/필수 표시가 빠진 광고는/.test(t) && t.length < 80) return true;
  return false;
}

function countNoSpace(s) {
  return [...String(s || '').replace(/\s+/g, '')].length;
}

function normalizeForCompare(p) {
  return String(p || '')
    .replace(/실행\s*메모\s*\d+/g, '')
    .replace(/준비\s*메모\s*\d+/g, '')
    .replace(/시나리오\s*\d+/g, '')
    .replace(/\(\d{2}-[a-z0-9-]+:\d+\)/gi, '')
    .replace(/\([a-z0-9-]+:\d+\)/gi, '')
    .replace(/Q\.\s*/g, '')
    .replace(/A\.\s*/g, '')
    .replace(/「[^」]*」/g, '')
    .replace(/『[^』]*』/g, '')
    .replace(/[A-Za-z]+/g, '')
    .replace(/\d+/g, '')
    .replace(/[^\p{L}\s]/gu, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function splitSentences(text, minNoSpace = 1) {
  const flat = String(text || '')
    .replace(/\r?\n/g, ' ')
    .replace(/\b([QA])\.\s+/g, '$1∶ ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!flat) return [];
  return flat
    .split(/(?<=[.!?。？！]|습니다|세요|니다|까요|습니까)\s+/)
    .map((s) => s.trim().replace(/^([QA])∶\s*/, '$1. '))
    .filter(
      (s) =>
        countNoSpace(s) >= minNoSpace &&
        !/^#/.test(s) &&
        !/^- \[[ xX]\] /.test(s) &&
        !/^[QA]\.?\s*$/i.test(s)
    );
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

function classifyH2Kind(title) {
  const t = String(title || '').trim();
  if (/체크리스트|점검하며/.test(t)) return 'check';
  if (/^Q\s*&?\s*A/i.test(t) || t === 'Q&A' || /^Q&A/.test(t)) return 'qa';
  if (/사례/.test(t)) return 'case';
  return 'other';
}

function paraBucket(n) {
  if (n <= 1) return '1';
  if (n === 2) return '2';
  if (n <= 4) return '3-4';
  if (n <= 5) return '5';
  return '6+';
}

/** ## 절 목록(체크리스트 제외) + 문단 수 */
function listSections(body) {
  const chunks = String(body || '').split(/^##\s+/m);
  const out = [];
  for (let i = 1; i < chunks.length; i += 1) {
    const nl = chunks[i].indexOf('\n');
    const title = (nl < 0 ? chunks[i] : chunks[i].slice(0, nl)).trim();
    let content = nl < 0 ? '' : chunks[i].slice(nl + 1);
    if (/체크리스트|점검하며/.test(title)) continue;
    content = content.replace(/^###[\s\S]*/m, '');
    const paras = splitParagraphs(content).filter(
      (p) => !/^#/.test(p) && !/^- \[[ xX]\] /.test(p)
    );
    out.push({
      title,
      kind: classifyH2Kind(title),
      paras,
      paraCount: paras.length,
      bucket: paraBucket(paras.length),
    });
  }
  return out;
}

/** 같은 틀: (종류순서+문단수구간) 동일 OR 대응 제목 유사≥50% — 둘 중 하나 */
function sameFrame(secA, secB) {
  if (!secA.length || !secB.length) return false;
  const kindsA = secA.map((s) => `${s.kind}:${s.bucket}`).join('›');
  const kindsB = secB.map((s) => `${s.kind}:${s.bucket}`).join('›');
  if (kindsA === kindsB) return true;
  if (secA.length !== secB.length) return false;
  let simOk = true;
  for (let i = 0; i < secA.length; i += 1) {
    const na = normalizeForCompare(secA[i].title);
    const nb = normalizeForCompare(secB[i].title);
    if (!na || !nb || trigramOverlap(na, nb) < H2_TITLE_SIM) {
      simOk = false;
      break;
    }
  }
  return simOk;
}

/** 부록: 사례 뒤 ~ Q&A 직전, 문단 ≤2인 절 */
function countPositionalAppendix(sections) {
  let caseIdx = -1;
  let qaIdx = -1;
  for (let i = 0; i < sections.length; i += 1) {
    if (sections[i].kind === 'case' && caseIdx < 0) caseIdx = i;
    if (sections[i].kind === 'qa') qaIdx = i;
  }
  if (qaIdx < 0) return 0;
  const start = caseIdx >= 0 ? caseIdx + 1 : 0;
  let n = 0;
  for (let i = start; i < qaIdx; i += 1) {
    if (sections[i].kind === 'qa' || sections[i].kind === 'case') continue;
    if (sections[i].paraCount <= 2) n += 1;
  }
  return n;
}

/** 본문 2300: 소제목·체크·Q&A·홍보 제외, 중복 제거 후 공백포함 */
function measureBodyCore(body) {
  const chunks = String(body || '').split(/^##\s+/m);
  const paras = [];
  // 서두(첫 ## 전): 제목·요약 제외한 본문 문단
  const head = chunks[0] || '';
  for (const p of splitParagraphs(head)) {
    if (/^#\s/.test(p)) continue;
    if (/^이 글에서 알 수 있는 것/.test(p)) continue;
    if (/^[-*]\s+/.test(p) && !/^- \[[ xX]\] /.test(p)) continue; // summary bullets
    if (p === UDONG || /우동공과/.test(p)) continue;
    if (/^- \[[ xX]\] /.test(p)) continue;
    paras.push(p);
  }
  for (let i = 1; i < chunks.length; i += 1) {
    const nl = chunks[i].indexOf('\n');
    const title = (nl < 0 ? chunks[i] : chunks[i].slice(0, nl)).trim();
    let content = nl < 0 ? '' : chunks[i].slice(nl + 1);
    if (/^Q\s*&?\s*A/i.test(title) || title === 'Q&A' || /^Q&A/.test(title)) continue;
    if (/체크리스트|점검하며/.test(title)) continue;
    content = content.replace(/^###[\s\S]*/m, '');
    for (const p of splitParagraphs(content)) {
      if (/^- \[[ xX]\] /.test(p)) continue;
      if (p === UDONG || /우동공과/.test(p)) continue;
      paras.push(p);
    }
  }
  const seen = new Set();
  const unique = [];
  for (const p of paras) {
    const key = normalizeForCompare(p);
    if (key.length >= 20 && seen.has(key)) continue;
    if (key.length >= 20) seen.add(key);
    unique.push(p);
  }
  const text = unique.join('\n\n');
  return { text, withSpace: [...text].length, noSpace: countNoSpace(text) };
}

function findQuoteSpacingErrors(body) {
  const errors = [];
  const reTight = /」([가-힣]+)/g;
  let m;
  while ((m = reTight.exec(body))) {
    if (!QUOTE_OK_PARTICLE.test(m[1])) errors.push(`」${m[1]}`);
  }
  const reSpaceParticle =
    /」\s+(을|를|이|가|은|는|과|와|의|에|에서|로|으로|만|만으로|도|부터|까지|처럼|보다|라고|이라고|이라며|이며|이고|고|요|다|등|및|입니다|인가|인|인지|할|한|하면|하거나|이면|면|일|와)\b/g;
  while ((m = reSpaceParticle.exec(body))) {
    errors.push(`」 ${m[1]}`);
  }
  return errors;
}

function findWeakSections(body) {
  const issues = [];
  for (const sec of listSections(body)) {
    if (sec.kind === 'qa') continue;
    const flat = sec.paras.join(' ').replace(/\s+/g, ' ').trim();
    if (flat.length < 40) continue;
    const sentences =
      flat.match(
        /[^.!?。]+?(?:습니다|세요|니다|까요|습니까)\.?|[^.!?。]+?[.!?。]/g
      ) || [];
    const meaningful = sentences.filter((s) => countNoSpace(s) >= 12);
    if (meaningful.length < MIN_SECTION_SENTENCES) {
      issues.push(
        `section「${sec.title.slice(0, 24)}」sentences ${meaningful.length}<${MIN_SECTION_SENTENCES}`
      );
    }
  }
  return issues;
}

function findParticleErrors(body) {
  const errors = [];
  const re = /「([^」]{1,80})」(을|를|이|가|은|는)/g;
  let m;
  while ((m = re.exec(body))) {
    const hangul = [...m[1]].reverse().find((ch) => ch >= '가' && ch <= '힣');
    if (!hangul) continue;
    const jong = (hangul.charCodeAt(0) - 0xac00) % 28;
    const hasBatchim = jong !== 0;
    const particle = m[2];
    const expect = {
      을: hasBatchim,
      를: !hasBatchim,
      이: hasBatchim,
      가: !hasBatchim,
      은: hasBatchim,
      는: !hasBatchim,
    };
    if (expect[particle] === false) errors.push(`「…${hangul}」${particle}`);
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

const REQUIRED = ['title', 'topic', 'category_suggest', 'basis_date', 'chars', 'uncertain_facts'];

/** 폴더 전체 로드 (비교용) */
const docs = allFiles.map((file) => {
  const full = path.join(abs, file);
  const raw = fs.readFileSync(full, 'utf8');
  const { meta, body } = parseFrontmatter(raw);
  const paras = splitParagraphs(body);
  const sections = listSections(body);
  return { file, full, raw, meta, body, paras, sections };
});

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

for (const doc of docs) {
  const sentsCross = [];
  const sentsInfile = [];
  const allSents = [];
  for (const p of doc.paras) {
    if (isExceptionPara(p)) continue;
    if (/^#/.test(p) || /^- \[[ xX]\] /.test(p) || /^이 글에서 알 수 있는 것/.test(p)) continue;
    for (const s of splitSentences(p, 1)) {
      const raw = String(s || '').replace(/\s+/g, ' ').trim();
      if (!raw) continue;
      allSents.push(raw);
      if (countNoSpace(raw) < SENT_COMPARE_MIN) continue;
      const n = normalizeForCompare(s);
      if (n.length < SENT_NORM_MIN) continue;
      sentsInfile.push({ s: raw, n }); // 글내: 법령 포함
      if (!isExceptionSentence(s)) sentsCross.push({ s: raw, n });
    }
  }
  doc.sentsCross = sentsCross;
  doc.sentsInfile = sentsInfile;
  doc.allSents = allSents;
}

/** 같은 틀 ≥3 */
const frameFail = new Set();
const frameOwners = new Map();
for (let i = 0; i < docs.length; i += 1) {
  const group = [docs[i].file];
  for (let j = i + 1; j < docs.length; j += 1) {
    if (sameFrame(docs[i].sections, docs[j].sections)) group.push(docs[j].file);
  }
  if (group.length >= 3) {
    const k = `f${i}`;
    frameOwners.set(
      k,
      group
    );
    for (const f of group) frameFail.add(f);
  }
}

/** 글간 문장 유사도 (예외 제외, 폴더 전체) */
const crossSentenceHits = new Map();
for (let i = 0; i < docs.length; i += 1) {
  for (let j = i + 1; j < docs.length; j += 1) {
    for (const a of docs[i].sentsCross) {
      for (const b of docs[j].sentsCross) {
        const ov = trigramOverlap(a.n, b.n);
        if (ov >= TRIGRAM_FAIL) {
          if (!crossSentenceHits.has(docs[i].file)) crossSentenceHits.set(docs[i].file, []);
          if (!crossSentenceHits.has(docs[j].file)) crossSentenceHits.set(docs[j].file, []);
          crossSentenceHits
            .get(docs[i].file)
            .push(`${docs[j].file} ov=${(ov * 100).toFixed(0)}%`);
          crossSentenceHits
            .get(docs[j].file)
            .push(`${docs[i].file} ov=${(ov * 100).toFixed(0)}%`);
        }
      }
    }
  }
}

const reportSet = new Set(reportFiles);
const rows = [];
let fail = 0;
const titles = [];

for (const doc of docs) {
  if (!reportSet.has(doc.file)) continue;
  const { file, meta, body, paras, sections } = doc;
  const issues = [];

  if (!meta) issues.push('frontmatter missing');
  else {
    for (const k of REQUIRED) {
      if (!(k in meta)) issues.push(`missing field ${k}`);
    }
  }

  // 절 크기
  const contentParas = sections.reduce((n, s) => n + s.paraCount, 0) || 1;
  for (const sec of sections) {
    if (sec.kind === 'qa') continue;
    if (sec.paraCount >= 6) {
      issues.push(`section「${sec.title.slice(0, 20)}」paras ${sec.paraCount}>=6`);
    }
    if (sec.paraCount / contentParas >= 0.4 && sec.paraCount >= 3) {
      issues.push(
        `section「${sec.title.slice(0, 20)}」share ${Math.round((sec.paraCount / contentParas) * 100)}%>=40%`
      );
    }
  }

  // exact-dup / near-dup in-file (법령 포함)
  const exactSeen = new Map();
  for (const raw of doc.allSents) exactSeen.set(raw, (exactSeen.get(raw) || 0) + 1);
  let exactDup = 0;
  for (const [, c] of exactSeen) if (c >= 2) exactDup += c - 1;
  if (exactDup) issues.push(`exact-dup sentences in-file ${exactDup} pair(s)`);

  let sentDup = 0;
  const sIn = doc.sentsInfile || [];
  for (let i = 0; i < sIn.length; i += 1) {
    for (let j = i + 1; j < sIn.length; j += 1) {
      if (trigramOverlap(sIn[i].n, sIn[j].n) >= TRIGRAM_FAIL) sentDup += 1;
    }
  }
  if (sentDup) issues.push(`near-dup sentences in-file ${sentDup} pair(s)`);

  // 「바뀌면」×2
  const changeTwice = doc.allSents.filter((raw) => (raw.match(/바뀌면/g) || []).length >= 2);
  if (changeTwice.length) issues.push(`「바뀌면」×2 in sentence ${changeTwice.length}x`);

  // 법령 묶음: 제N조 문장 ≥3 / 문단
  let lawCluster = 0;
  for (const p of paras) {
    if (/^#/.test(p)) continue;
    let n = 0;
    for (const s of splitSentences(p, 1)) {
      if (/제\d+조/.test(s)) n += 1;
    }
    if (n >= 3) lawCluster += 1;
  }
  if (lawCluster) issues.push(`law-exception cluster in paragraph ${lawCluster}x (≥3)`);

  // 본문 2300 (A-6)
  const core = measureBodyCore(body);
  if (core.withSpace < MIN_BODY_CHARS) {
    issues.push(`body-core chars(with space)=${core.withSpace} < ${MIN_BODY_CHARS}`);
  }

  // 글간
  const cross = crossSentenceHits.get(file) || [];
  if (cross.length) {
    issues.push(`cross-file sentence sim ${cross.slice(0, 2).join(', ')}`);
  }

  // slug / filename
  const slugHits = body.match(/\(\d{2}-[a-z0-9-]+:\d+\)/gi) || [];
  if (slugHits.length) issues.push(`slug-tail ${slugHits.length}x`);
  const base = file.replace(/\.md$/i, '');
  if (body.includes(base)) issues.push(`filename string「${base}」in body`);

  // Q&A 뒤 절
  let afterQA = 0;
  let seenQA = false;
  for (const sec of sections) {
    if (sec.kind === 'qa') {
      seenQA = true;
      continue;
    }
    if (seenQA) afterQA += 1;
  }
  if (afterQA >= 2) issues.push(`sections after Q&A ${afterQA} >= 2`);

  // 부록(위치·크기)
  const appendix = countPositionalAppendix(sections);
  if (appendix >= 2) issues.push(`appendix(positional) ${appendix} >= 2`);

  // 같은 틀
  if (frameFail.has(file)) {
    let owners = 0;
    for (const [, g] of frameOwners) if (g.includes(file)) owners = Math.max(owners, g.length);
    issues.push(`h2-frame shared by ${owners} files`);
  }

  // 공유 문단·고유 길이
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
    issues.push(
      `shared paras ${(shareRatio * 100).toFixed(1)}% > ${SHARE_FAIL * 100}% (${shared}/${shareable})`
    );
  }

  const uniqueParas = paras.filter((p) => {
    if (isExceptionPara(p)) return false;
    if (/^#/.test(p) || /^이 글에서 알 수 있는 것/.test(p)) return true;
    if (/^- \[[ xX]\] /.test(p)) return true;
    if (/^- /.test(p) && !/^- \[[ xX]\] /.test(p)) return true;
    const key = normalizeForCompare(p);
    if (key.length >= 30 && sharedKeys.has(key)) return false;
    return true;
  });
  const uniqueForMeasure = uniqueParas.join('\n\n');
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
    issues.push(`chars mismatch declared=${declared} uniqueWithSpace=${charsWithSpace}`);
  }

  const particleErrs = findParticleErrors(body);
  if (particleErrs.length) issues.push(`particle ${particleErrs.slice(0, 3).join(', ')}`);
  const quoteSpace = findQuoteSpacingErrors(body);
  if (quoteSpace.length) issues.push(`quote-space ${quoteSpace.slice(0, 4).join(', ')}`);
  const weakSecs = findWeakSections(body);
  if (weakSecs.length) issues.push(weakSecs.slice(0, 3).join('; '));

  const han = body.match(HAN_RE) || [];
  if (han.length) {
    issues.push(`CJK Han residual ${han.length} (${[...new Set(han)].slice(0, 8).join('')})`);
  }

  const udongCount = (
    body.match(/우리 동네 공부방·과외 정보는 우동공과 카드로도 정리해 두시면 좋아요\./g) || []
  ).length;
  if (udongCount !== 1) issues.push(`udonggong lines ${udongCount} != 1`);

  if ((body.match(/^#\s+.+/m) || []).length < 1) issues.push('missing # title');
  const h2 = (body.match(/^##\s+.+/gm) || []).length;
  if (h2 < MIN_H2) issues.push(`## count ${h2} < ${MIN_H2}`);
  const summary = countSummaryBullets(body);
  if (summary < MIN_SUMMARY) issues.push(`summary bullets ${summary} < ${MIN_SUMMARY}`);
  const checks = (body.match(/^- \[[ xX]\] /gm) || []).length;
  if (checks < MIN_CHECKS) issues.push(`checklist ${checks} < ${MIN_CHECKS}`);
  const urls = body.match(URL_RE) || [];
  if (urls.length) issues.push(`body URLs ${urls.length}`);
  if (!/예시|사례/.test(body)) issues.push('no 사례/예시 marker');

  const title = meta?.title || file;
  titles.push({ file, title, tokens: tokenizeTitle(title) });

  const ok = issues.length === 0;
  if (!ok) fail += 1;
  rows.push({
    file,
    title,
    charsWithSpace,
    charsNoSpace,
    bodyCore: core.withSpace,
    shareRatio,
    status: ok ? 'PASS' : 'FAIL',
    issues: issues.join('; '),
    sections,
  });
}

console.log(`Folder: ${abs}`);
console.log(
  `Files: ${rows.length}${onlyPrefixes ? ` (filter ${onlyPrefixes.join(',')}; compare-all=${allFiles.length})` : ` (compare-all=${allFiles.length})`}`
);
console.log('');
console.log(
  [
    'file'.padEnd(42),
    'w/sp'.padStart(5),
    'noSp'.padStart(5),
    'core'.padStart(5),
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
      String(r.bodyCore).padStart(5),
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
console.log(`Result: ${fail === 0 ? 'PASS' : 'FAIL'} (${rows.length - fail} pass / ${fail} fail)`);

process.exit(fail === 0 ? 0 : 1);
