/**
 * 281 단위 — missing 라벨 포맷·픽만 채우면 pick ok (format.js와 동일 규칙).
 * Vite CSS import 때문에 format.js 직접 import는 하지 않는다.
 */

function formatTierMissingReason(missing) {
  const labels = [];
  if (Array.isArray(missing)) {
    for (const item of missing) {
      const label = item && typeof item === 'object' ? String(item.label || '') : String(item || '');
      if (label) labels.push(label);
    }
  }
  if (!labels.length) return null;
  if (labels.length <= 3) return labels.join(', ');
  return `${labels.slice(0, 3).join(', ')} 외 ${labels.length - 3}`;
}

function tierProductRow(key, label, side, phase) {
  if (phase === 'loading' || (phase === 'ready' && !side) || !phase) {
    return { key, label, ok: false, reason: '확인 중', statusText: '확인 중' };
  }
  if (phase === 'error') {
    return { key, label, ok: false, reason: '확인 실패', statusText: '확인 실패' };
  }
  const reason = formatTierMissingReason(side?.missing);
  const ok = side?.can_buy === true && !reason;
  return { key, label, ok, reason, statusText: ok ? '신청 가능' : reason || '항목 부족' };
}

const pickMissing = [
  { id: 'school_or_career', label: '학교·학과 또는 경력' },
  { id: 'teaching_style_badges', label: '강의스타일' },
];
const primeMissing = [
  ...pickMissing,
  { id: 'intro_long', label: '상세 소개' },
  { id: 'feature_2', label: '특징 2' },
  { id: 'feature_3', label: '특징 3' },
];

/** 경고 띠용 — 픽·프라임 missing을 합칠 때 라벨 중복 제거 (screens.js와 동일) */
function dedupeMissingByLabel(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const label = item && typeof item === 'object' ? String(item.label || '') : String(item || '');
    if (!label || seen.has(label)) continue;
    seen.add(label);
    out.push(item);
  }
  return out;
}

const pick = tierProductRow('pick', '픽 카드', { can_buy: false, missing: pickMissing }, 'ready');
const prime = tierProductRow('prime', '프라임 카드', { can_buy: false, missing: primeMissing }, 'ready');
const pickOnly = tierProductRow('pick', '픽 카드', { can_buy: true, missing: [] }, 'ready');

// 픽+프라임 둘 다 missing이면 pick 항목이 prime에도 있어 이름이 중복된다 → 제거 후 포맷
const bannerDupRaw = [...pickMissing, ...primeMissing];
const bannerDupReason = formatTierMissingReason(dedupeMissingByLabel(bannerDupRaw));
const bannerDupRawReason = formatTierMissingReason(bannerDupRaw);

const checks = [
  ['pick.label', pick.label === '픽 카드'],
  ['pick.reason', pick.reason === '학교·학과 또는 경력, 강의스타일'],
  ['prime.reason 외 n', prime.reason === '학교·학과 또는 경력, 강의스타일, 상세 소개 외 2'],
  ['pick only ok', pickOnly.ok === true],
  ['expanded 무관: pick missing이면 불가', pick.ok === false],
  ['banner raw has dup count 7', bannerDupRaw.length === 7],
  ['banner dedupe count 5', dedupeMissingByLabel(bannerDupRaw).length === 5],
  [
    'banner dedupe reason',
    bannerDupReason === '학교·학과 또는 경력, 강의스타일, 상세 소개 외 2',
  ],
  ['banner raw reason differs (dup)', bannerDupRawReason !== bannerDupReason],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(ok ? 'PASS' : 'FAIL', name);
  if (!ok) failed++;
}

// 소스에 expanded_complete 픽 판정이 남아 있지 않은지 (허용 파일)
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tutorFormat = readFileSync(join(root, 'preview/home-ui/src/tutor-reg/format.js'), 'utf8');
const roomFormat = readFileSync(join(root, 'preview/home-ui/src/study-room-reg/format.js'), 'utf8');
const tutorStore = readFileSync(join(root, 'preview/home-ui/src/tutor-reg/store.js'), 'utf8');
const roomStore = readFileSync(join(root, 'preview/home-ui/src/study-room-reg/store.js'), 'utf8');
const copy = readFileSync(join(root, 'preview/home-ui/src/tutor-reg/registration-check-copy.js'), 'utf8');
const tutorScreens = readFileSync(join(root, 'preview/home-ui/src/tutor-reg/screens.js'), 'utf8');
const roomScreens = readFileSync(join(root, 'preview/home-ui/src/study-room-reg/screens.js'), 'utf8');

const sourceChecks = [
  ['tutor format no 상세등록 완료 필요', !tutorFormat.includes('상세등록 완료 필요')],
  ['tutor store no 상세등록 완료 시 추천', !tutorStore.includes('상세등록 완료 시 추천 노출 신청 가능')],
  ['room store no 프라임/픽 노출 후보', !roomStore.includes('프라임/픽 노출 후보')],
  ['tutor format has 픽 카드', tutorFormat.includes("'픽 카드'")],
  ['room format has 픽 카드', roomFormat.includes("'픽 카드'")],
  ['university hint', copy.includes('픽 카드 조건이에요. 경력이 있으면 경력으로 대신할 수 있어요.')],
  ['tutor format uses can_buy', tutorFormat.includes('can_buy')],
  ['tutor screens dedupe uniqueMissing', tutorScreens.includes('uniqueMissing')],
  ['room screens dedupe uniqueMissing', roomScreens.includes('uniqueMissing')],
];

for (const [name, ok] of sourceChecks) {
  console.log(ok ? 'PASS' : 'FAIL', name);
  if (!ok) failed++;
}

process.exit(failed ? 1 : 0);
