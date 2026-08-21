/**
 * paid_badges live 경로 증명 (렌더·계약) — DB 없이도 API shape → 카드/확대/비교 스냅샷
 * 실행: cd preview/home-ui && npx vite-node ../../scripts/smoke-paid-badges-proof.mjs
 *
 * 운영 DB 적재 후 실증명은 scripts/smoke-paid-badges-live.php (PHP+PDO) 사용.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

if (typeof globalThis.sessionStorage === 'undefined') {
  const mem = new Map();
  globalThis.sessionStorage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
    clear: () => mem.clear(),
  };
}
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = globalThis.sessionStorage;
}

const { resolveCardVisualLayers } = await import(
  '../preview/home-ui/src/card-visual.js'
);
const { renderBrowseList } = await import('../preview/home-ui/src/exposure-render.js');
const { buildTrustStrip } = await import('../preview/home-ui/src/detail-decision/detail-utils.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../tmp/paid-badges-live-proof');
fs.mkdirSync(outDir, { recursive: true });

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** DB 행 → API items[] 계약 (SearchService 동형) */
const roomDbRow = {
  id: 1,
  provider_type: 'study_room',
  badge_code: 'hot',
  status: 'active',
  starts_on: '2026-08-01',
  end_exclusive_on: '2026-09-01',
};
const tutorDbRow = {
  id: 2,
  provider_type: 'tutor',
  badge_code: 'jjokjipge',
  status: 'active',
  starts_on: '2026-08-01',
  end_exclusive_on: '2026-09-01',
};

const apiRoom = {
  id: 101,
  title: '증명용공부방',
  study_room_name: '증명용공부방',
  region_label: '대치동',
  recommend_count: 3,
  review_count: 2,
  education_office_registered: true,
  career_years: 5,
  published_at: '2026-07-01T00:00:00+09:00',
  paid_badges: [roomDbRow.badge_code],
  grade_band: '초등',
  main_subject_note: '수학',
  price_amount: 350000,
  compare_eligible: true,
};

const apiTutor = {
  id: 12,
  title: '증명용과외쌤',
  tutor_display_name: '증명용과외쌤',
  region_label: '역삼동',
  recommend_count: 1,
  review_count: 0,
  university_status: 'graduated',
  career_year_band: 'y4_6',
  proof_document_available: true,
  published_at: '2026-07-01T00:00:00+09:00',
  paid_badges: [tutorDbRow.badge_code],
  main_subject_note: '영어',
  preferred_fee_amount: 400000,
  compare_eligible: true,
};

const roomLayers = resolveCardVisualLayers('study_room', apiRoom);
const tutorLayers = resolveCardVisualLayers('tutor', apiTutor);

const evidence = {
  note: '본 스모크는 DB 행 shape → API paid_badges[] → card-visual 관통 증명. 운영 INSERT는 checkout fulfill + 055 적용 후 smoke-paid-badges-live.php',
  db_rows: [roomDbRow, tutorDbRow],
  api_response_examples: {
    study_room: { id: apiRoom.id, paid_badges: apiRoom.paid_badges, recommend_count: apiRoom.recommend_count },
    tutor: { id: apiTutor.id, paid_badges: apiTutor.paid_badges, recommend_count: apiTutor.recommend_count },
  },
  card_visual: {
    room_promo: roomLayers.promoBadges.map((b) => b.id),
    tutor_promo: tutorLayers.promoBadges.map((b) => b.id),
  },
  fulfill_path: {
    service: 'ProviderCheckoutService::completeOrder → fulfillBadgeAddon',
    insert: 'PaidBadgeRepository::grantFromOrder → provider_paid_badges',
    read: 'PaidBadgeResolver::forProvider → SearchService items[].paid_badges',
  },
};

fs.writeFileSync(path.join(outDir, 'evidence.json'), JSON.stringify(evidence, null, 2));

const basicRoom = renderBrowseList('study_room', [apiRoom], { guest: false });
const basicTutor = renderBrowseList('tutor', [apiTutor], { guest: false });
const expandRoom = buildTrustStrip('study_room', apiRoom);
const expandTutor = buildTrustStrip('tutor', apiTutor);

fs.writeFileSync(path.join(outDir, 'basic-room.html'), `<!doctype html><meta charset="utf-8"><body>${basicRoom}</body>`);
fs.writeFileSync(path.join(outDir, 'basic-tutor.html'), `<!doctype html><meta charset="utf-8"><body>${basicTutor}</body>`);
fs.writeFileSync(path.join(outDir, 'expand-room.html'), `<!doctype html><meta charset="utf-8"><body>${expandRoom}</body>`);
fs.writeFileSync(path.join(outDir, 'expand-tutor.html'), `<!doctype html><meta charset="utf-8"><body>${expandTutor}</body>`);

// compare axis HTML (without DOM open)
const compareAxis = `
<table><tr><th>유료·신뢰</th>
<td>${roomLayers.promoBadges.map((b) => b.label).join(',')}</td>
<td>${tutorLayers.promoBadges.map((b) => b.label).join(',')}</td>
</tr>
<tr><th>추천·후기</th>
<td>추천 ${roomLayers.stats.recommend} · 후기 ${roomLayers.stats.review}</td>
<td>추천 ${tutorLayers.stats.recommend}</td>
</tr></table>`;
fs.writeFileSync(path.join(outDir, 'compare-axis.html'), `<!doctype html><meta charset="utf-8"><body>${compareAxis}</body>`);

const roomHasHot = /card-visual__promo-badge--hot/.test(basicRoom) && /card-visual__promo-badge--hot/.test(expandRoom);
const tutorHasJj = /card-visual__promo-badge--jjokjipge/.test(basicTutor) && /jjokjipge|쪽집게/.test(expandTutor);

console.log(JSON.stringify(evidence.api_response_examples, null, 2));
console.log(roomHasHot ? 'PASS room hot on basic+expand' : 'FAIL room hot');
console.log(tutorHasJj ? 'PASS tutor jjokjipge on basic+expand' : 'FAIL tutor jjokjipge');
console.log('out:', outDir);
if (!roomHasHot || !tutorHasJj) process.exit(1);
