#!/usr/bin/env node
/**
 * 362 info-room content verifier (markdown files only).
 * Usage:
 *   node scripts/verify-info-room-content.mjs <folder>
 *   node scripts/verify-info-room-content.mjs <folder> 01,02,03,04,05
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
const H2_TITLE_SIM = 0.5;
const URL_RE = /https?:\/\/[^\s)\]]+/gi;
const TITLE_SIM_WARN = 0.55;
const HAN_RE = /[\u4e00-\u9fff]/g;
const TRIGRAM_FAIL = 0.6;
const SHARE_FAIL = 0.1;
const UDONG =
  '우리 동네 공부방·과외 정보는 우동공과 카드로도 정리해 두시면 좋아요.';
/** 「」 직후 조사만 허용. 그 외 한글 밀착은 띄어쓰기 FAIL */
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

const APPENDIX_CORE =
  /(마무리\s*한\s*걸음|바로\s*적용|운영\s*노트|요일\s*루틴|습관\s*한\s*가지|실행으로\s*옮기기|현장\s*메모)/;
const APPENDIX_TITLE =
  /^(마무리 한 걸음|바로 적용|운영 노트|요일 루틴|습관 한 가지|실행으로 옮기기|현장 메모)$/;

/** 법령 의무·우동공과 등 공유 허용 문장 (글간 비교 예외). 글내 2회는 별도 FAIL */
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

function listH2Titles(body) {
  const out = [];
  for (const line of String(body || '').split(/\r?\n/)) {
    const m = line.match(/^##\s+(.+)$/);
    if (!m) continue;
    const title = m[1].trim();
    if (/체크리스트|점검하며/.test(title)) continue;
    out.push(title);
  }
  return out;
}

function isAppendixTitle(t) {
  const s = String(t || '').trim();
  if (!s) return false;
  if (APPENDIX_TITLE.test(s)) return true;
  if (APPENDIX_CORE.test(s)) return true;
  if (/정리\s*$/.test(s)) return true;
  if (/바로\s*적용/.test(s)) return true;
  return false;
}

function countAppendixSections(body) {
  return listH2Titles(body).filter((t) => isAppendixTitle(t)).length;
}

function classifyH2Kind(title) {
  const t = String(title || '').trim();
  if (/체크리스트|점검하며/.test(t)) return 'check';
  if (/^Q\s*&?\s*A/i.test(t) || t === 'Q&A' || /^Q&A/.test(t)) return 'qa';
  if (/사례/.test(t)) return 'case';
  if (isAppendixTitle(t)) return 'appendix';
  return 'other';
}

/** 제목 정규화(비교용). 3-gram 유사 ≥50%면 같은 제목으로 묶음 */
function titleNormKey(title) {
  return normalizeForCompare(String(title || '')).slice(0, 40);
}

function h2StructureKey(body) {
  const titles = listH2Titles(body).filter((t) => classifyH2Kind(t) !== 'check');
  const kinds = titles.map((t) => classifyH2Kind(t));
  const counts = { case: 0, qa: 0, appendix: 0, other: 0 };
  for (const k of kinds) {
    if (counts[k] != null) counts[k] += 1;
  }
  // 기타 제목은 유사도 묶음 id 대신 정규화 키(짧음)로 순서에 반영
  const otherKeys = titles
    .filter((t) => classifyH2Kind(t) === 'other')
    .map((t) => titleNormKey(t));
  return `${kinds.join('›')}|c${counts.case}q${counts.qa}a${counts.appendix}o${counts.other}|${otherKeys.join('·')}`;
}

function h2OrderKey(body) {
  return h2StructureKey(body);
}

/** 두 구조 키가 같은지: 종류 순서·개수 동일 + other 제목끼리 50% 유사면 동일 취급 */
function structuresEquivalent(keyA, keyB, titlesA, titlesB) {
  if (keyA === keyB) return true;
  const kindsA = titlesA.map(classifyH2Kind).filter((k) => k !== 'check');
  const kindsB = titlesB.map(classifyH2Kind).filter((k) => k !== 'check');
  if (kindsA.join('›') !== kindsB.join('›')) return false;
  const othersA = titlesA.filter((t) => classifyH2Kind(t) === 'other');
  const othersB = titlesB.filter((t) => classifyH2Kind(t) === 'other');
  if (othersA.length !== othersB.length) return false;
  for (let i = 0; i < othersA.length; i += 1) {
    const na = normalizeForCompare(othersA[i]);
    const nb = normalizeForCompare(othersB[i]);
    if (!na || !nb) continue;
    if (trigramOverlap(na, nb) < H2_TITLE_SIM && na !== nb) return false;
  }
  return true;
}

/** 번호·「」·영문·괄호 꼬리표·기호 제거 후 비교용 문자열 */
function normalizeForCompare(p) {
  return p
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

/** 본문을 비교용 문장 배열로 분해 */
function splitSentences(text, minNoSpace = 18) {
  const flat = String(text || '')
    .replace(/\r?\n/g, ' ')
    // Q./A. 뒤 마침표는 문장 종결이 아님
    .replace(/\b([QA])\.\s+/g, '$1∶ ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!flat) return [];
  const parts = flat.split(/(?<=[.!?。？！]|습니다|세요|니다|까요|습니까)\s+/);
  return parts
    .map((s) => s.trim().replace(/^([QA])∶\s*/, '$1. '))
    .filter(
      (s) =>
        countNoSpace(s) >= minNoSpace &&
        !/^#/.test(s) &&
        !/^- \[[ xX]\] /.test(s) &&
        !/^[QA]\.?\s*$/i.test(s)
    );
}

/** Q&A 섹션 뒤에 이어지는 ## 절 개수 (체크리스트 제외) */
function countSectionsAfterQA(body) {
  const chunks = body.split(/^##\s+/m);
  let seenQA = false;
  let after = 0;
  for (let i = 1; i < chunks.length; i += 1) {
    const nl = chunks[i].indexOf('\n');
    const title = (nl < 0 ? chunks[i] : chunks[i].slice(0, nl)).trim();
    if (/^Q\s*&?\s*A/i.test(title) || title === 'Q&A' || /^Q&A/.test(title)) {
      seenQA = true;
      continue;
    }
    if (!seenQA) continue;
    if (/체크리스트|점검하며/.test(title)) continue;
    after += 1;
  }
  return after;
}

/** 「」 직후 한글 밀착(조사 제외). 」+공백+조사도 FAIL */
function findQuoteSpacingErrors(body) {
  const errors = [];
  const reTight = /」([가-힣]+)/g;
  let m;
  while ((m = reTight.exec(body))) {
    if (!QUOTE_OK_PARTICLE.test(m[1])) errors.push(`」${m[1]}`);
  }
  const reSpaceParticle = /」\s+(을|를|이|가|은|는|과|와|의|에|에서|로|으로|만|만으로|도|부터|까지|처럼|보다|라고|이라고|이라며|이며|이고|고|요|다|등|및|입니다|인가|인|인지|할|한|하면|하거나|이면|면|일|와)\b/g;
  while ((m = reSpaceParticle.exec(body))) {
    errors.push(`」 ${m[1]}`);
  }
  return errors;
}

/** 소제목(##)마다 문장 수·나열만 있는 절 검사 */
function findWeakSections(body) {
  const issues = [];
  const chunks = body.split(/^##\s+/m);
  for (let i = 1; i < chunks.length; i += 1) {
    const chunk = chunks[i];
    const nl = chunk.indexOf('\n');
    const title = (nl < 0 ? chunk : chunk.slice(0, nl)).trim();
    let content = nl < 0 ? '' : chunk.slice(nl + 1);
    if (/체크리스트|점검하며/.test(title)) continue;
    // ### 이하는 본문 문장 집계에서 제외(체크만 있는 경우 대비)
    content = content.replace(/^###[\s\S]*/m, '');
    const flat = content.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (flat.length < 40) continue;
    const listOnly =
      /장점\s*:/.test(flat) &&
      /확인\s*항목\s*:/.test(flat) &&
      (flat.match(/[.!?。]|습니다|세요|니다|까요/g) || []).length < 4;
    if (listOnly) {
      issues.push(`list-only section「${title.slice(0, 24)}」`);
      continue;
    }
    // 문장: 종결·물음 패턴
    const sentences = flat.match(
      /[^.!?。]+?(?:습니다|세요|니다|까요|습니까)\.?|[^.!?。]+?[.!?。]/g
    ) || [];
    const meaningful = sentences.filter((s) => countNoSpace(s) >= 12);
    if (meaningful.length < MIN_SECTION_SENTENCES && !/^Q&A/.test(title)) {
      issues.push(
        `section「${title.slice(0, 24)}」sentences ${meaningful.length}<${MIN_SECTION_SENTENCES}`
      );
    }
  }
  return issues;
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

/** 폴더 전역: 문단 공유 + 문장 단위 비교용 */
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

/** 파일별 문장 목록 (정규화 포함). 비교 최소 정규화 길이 15 */
const SENT_NORM_MIN = 15;
for (const doc of docs) {
  const sents = [];
  const allSents = [];
  for (const p of doc.paras) {
    if (isExceptionPara(p)) continue;
    if (/^#/.test(p) || /^- \[[ xX]\] /.test(p) || /^이 글에서 알 수 있는 것/.test(p)) continue;
    for (const s of splitSentences(p, 1)) {
      const raw = String(s || '').replace(/\s+/g, ' ').trim();
      if (!raw) continue;
      allSents.push(raw);
      if (isExceptionSentence(s)) continue;
      if (countNoSpace(raw) < SENT_COMPARE_MIN) continue;
      const n = normalizeForCompare(s);
      if (n.length < SENT_NORM_MIN) continue;
      sents.push({ s: raw, n });
    }
  }
  doc.sents = sents;
  doc.allSents = allSents;
  doc.h2Titles = listH2Titles(doc.body);
  doc.h2Key = h2OrderKey(doc.body);
}

/** 절 종류·순서(제목 유사 50% 동일 취급)가 같은 파일이 ≥3이면 FAIL */
const h2OrderFailFiles = new Set();
const h2KeyOwners = new Map();
for (let i = 0; i < docs.length; i += 1) {
  const group = [docs[i].file];
  for (let j = i + 1; j < docs.length; j += 1) {
    if (
      structuresEquivalent(
        docs[i].h2Key,
        docs[j].h2Key,
        docs[i].h2Titles || [],
        docs[j].h2Titles || []
      )
    ) {
      group.push(docs[j].file);
    }
  }
  if (group.length >= 3) {
    const k = docs[i].h2Key || `g${i}`;
    if (!h2KeyOwners.has(k)) h2KeyOwners.set(k, []);
    for (const f of group) {
      h2OrderFailFiles.add(f);
      if (!h2KeyOwners.get(k).includes(f)) h2KeyOwners.get(k).push(f);
    }
  }
}

/** 글간 문장 유사도: 60% 이상이면 양쪽 FAIL 후보 */
const crossSentenceHits = new Map(); // file -> samples
for (let i = 0; i < docs.length; i += 1) {
  for (let j = i + 1; j < docs.length; j += 1) {
    const A = docs[i].sents;
    const B = docs[j].sents;
    for (const a of A) {
      for (const b of B) {
        const ov = trigramOverlap(a.n, b.n);
        if (ov >= TRIGRAM_FAIL) {
          if (!crossSentenceHits.has(docs[i].file)) crossSentenceHits.set(docs[i].file, []);
          if (!crossSentenceHits.has(docs[j].file)) crossSentenceHits.set(docs[j].file, []);
          crossSentenceHits.get(docs[i].file).push(`${docs[j].file} ov=${(ov * 100).toFixed(0)}%`);
          crossSentenceHits.get(docs[j].file).push(`${docs[i].file} ov=${(ov * 100).toFixed(0)}%`);
        }
      }
    }
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

  // 같은 글 안 문장 유사도 + 완전 동일 문장
  const sents = doc.sents || [];
  const allSents = doc.allSents || [];
  let sentDup = 0;
  let exactDup = 0;
  const exactSeen = new Map();
  for (const raw of allSents) {
    if (!raw) continue;
    exactSeen.set(raw, (exactSeen.get(raw) || 0) + 1);
  }
  for (const [, c] of exactSeen) {
    if (c >= 2) exactDup += c - 1;
  }
  if (exactDup) issues.push(`exact-dup sentences in-file ${exactDup} pair(s)`);

  for (let i = 0; i < sents.length; i += 1) {
    for (let j = i + 1; j < sents.length; j += 1) {
      if (trigramOverlap(sents[i].n, sents[j].n) >= TRIGRAM_FAIL) sentDup += 1;
    }
  }
  if (sentDup) issues.push(`near-dup sentences in-file ${sentDup} pair(s)`);

  // 같은 법령 예외 문장(공백 정규화 후 완전 동일)이 글 안에서 2회 이상
  const lawCounts = new Map();
  for (const raw of allSents) {
    if (!raw || raw === UDONG || !isExceptionSentence(raw)) continue;
    if (!/제\d+조|15일|5일|필수 표시|장소로는 불가|상가·오피스텔은 불가|변경신고/.test(raw))
      continue;
    const key = raw.replace(/\s+/g, ' ').trim();
    lawCounts.set(key, (lawCounts.get(key) || 0) + 1);
  }
  const lawDup = [...lawCounts.values()].filter((c) => c >= 2).length;
  if (lawDup) issues.push(`law-exception repeated in-file ${lawDup} form(s)`);

  // 한 문장에 「바뀌면」 2회
  const changeTwice = allSents.filter((raw) => (raw.match(/바뀌면/g) || []).length >= 2);
  if (changeTwice.length) issues.push(`「바뀌면」×2 in sentence ${changeTwice.length}x`);

  // 한 문단에 「공유 허용형」법령 짧은 문장 ≥3 (조문 해설 장문은 제외)
  function isPackedLawLine(s) {
    const t = String(s || '').replace(/\s+/g, ' ').trim();
    if (!t || t.length > 180) return false;
    if (/필수 표시가 빠진/.test(t)) return true;
    if (/개인과외 장소로는 불가|상가·오피스텔은 불가|상가·오피스텔은 개인과외/.test(t))
      return true;
    if (/반환사유 발생일부터 5일/.test(t)) return true;
    if (/개인과외교습자는/.test(t) && /15일/.test(t) && /변경신고/.test(t)) return true;
    return false;
  }
  let lawCluster = 0;
  for (const p of paras) {
    if (isExceptionPara(p) || /^#/.test(p)) continue;
    let n = 0;
    for (const s of splitSentences(p, 1)) {
      if (isPackedLawLine(s)) n += 1;
    }
    if (n >= 3) lawCluster += 1;
  }
  if (lawCluster) issues.push(`law-exception cluster in paragraph ${lawCluster}x (≥3)`);

  // 본문(공백 포함) 최소 길이
  const bodyChars = [...body].length;
  if (bodyChars < MIN_BODY_CHARS) {
    issues.push(`body chars(with space)=${bodyChars} < ${MIN_BODY_CHARS}`);
  }

  // 글간 문장 유사도
  const cross = crossSentenceHits.get(file) || [];
  if (cross.length) {
    issues.push(`cross-file sentence sim ${cross.slice(0, 2).join(', ')}`);
  }

  // slug·파일명 꼬리표
  const slugHits = body.match(/\(\d{2}-[a-z0-9-]+:\d+\)/gi) || [];
  if (slugHits.length) issues.push(`slug-tail ${slugHits.length}x`);
  const base = file.replace(/\.md$/i, '');
  if (body.includes(base)) issues.push(`filename string「${base}」in body`);

  // Q&A 뒤 절 2개 이상
  const afterQA = countSectionsAfterQA(body);
  if (afterQA >= 2) issues.push(`sections after Q&A ${afterQA} >= 2`);

  // 덧붙임 절(고정 틀) — Q&A 위치와 무관
  const appendix = countAppendixSections(body);
  if (appendix >= 2) issues.push(`appendix sections ${appendix} >= 2`);

  // 소제목 순서 동일 3편 이상
  if (h2OrderFailFiles.has(file)) {
    issues.push(`h2-order shared by ${h2KeyOwners.get(doc.h2Key)?.length || 0} files`);
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
  // 고유 측정: 공유·템플릿·예외(우동공과·짧은 법령줄)만 제외. 제목·요약·체크는 글의 고유 구성으로 포함.
  const uniqueForMeasure = uniqueParas.filter((p) => !isExceptionPara(p)).join('\n\n');
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

  const quoteSpace = findQuoteSpacingErrors(body);
  if (quoteSpace.length) {
    issues.push(`quote-space ${quoteSpace.slice(0, 4).join(', ')}`);
  }

  const weakSecs = findWeakSections(body);
  if (weakSecs.length) {
    issues.push(weakSecs.slice(0, 3).join('; '));
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
