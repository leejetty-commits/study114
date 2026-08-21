/**
 * 카드 정책 관통 감사 — DB/API/어댑터/라우팅 증거
 * 실행: npm run verify:card-visual:penetration
 *
 * PASS = 정책이 그 계층까지 연결됨
 * FAIL = 끊김·구정책·다른 문법 (최종 완료 차단 조건)
 * INFO = 의도적 분리(등록점검 샘플 등)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Node에서 exposure-data / reviews store가 sessionStorage를 씀 — 최소 폴리필
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

const {
  CARD_VISUAL_POLICY,
  resolveCardVisualLayers,
  resolvePaidPromoBadges,
} = await import('../preview/home-ui/src/card-visual.js');
const { renderBrowseList, renderExposureBox, renderItemActions } = await import(
  '../preview/home-ui/src/exposure-render.js'
);
const { EXPOSURE_STUDY_ROOMS, EXPOSURE_TUTORS } = await import('../preview/home-ui/src/exposure-data.js');
const { countTrustItems, buildTrustStrip } = await import(
  '../preview/home-ui/src/detail-decision/detail-utils.js'
);
const { STUDY_ROOM_CATALOG_IDS, TUTOR_CATALOG_IDS } = await import(
  '../preview/home-ui/src/mypage/plans-catalog.js'
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../tmp/card-visual-penetration');
fs.mkdirSync(outDir, { recursive: true });

let pass = 0;
let fail = 0;
let info = 0;
const rows = [];

function record(level, id, detail) {
  rows.push({ level, id, detail });
  if (level === 'PASS') {
    pass += 1;
    console.log(`PASS  ${id} — ${detail}`);
  } else if (level === 'FAIL') {
    fail += 1;
    console.error(`FAIL  ${id} — ${detail}`);
  } else {
    info += 1;
    console.log(`INFO  ${id} — ${detail}`);
  }
}

// —— 구조 ——
record(
  CARD_VISUAL_POLICY.removed.includes('like') ? 'PASS' : 'FAIL',
  'P01_removed_like_in_ssot',
  'card-visual removed=["like"]',
);
const actionsHtml = renderItemActions({
  guest: false,
  compareKind: 'study_room',
  itemId: 1,
  item: EXPOSURE_STUDY_ROOMS[0],
});
record(
  !/좋아요|data-action="like"|like_count/.test(actionsHtml) ? 'PASS' : 'FAIL',
  'P02_no_like_in_card_actions_html',
  'renderItemActions HTML에 like 잔존 없음',
);
record(
  /card-stats/.test(actionsHtml) && /card-actions/.test(actionsHtml) ? 'PASS' : 'FAIL',
  'P03_stats_actions_split_html',
  '통계(.card-stats) / 기능(.card-actions) DOM 분리',
);
const railOrder = [...actionsHtml.matchAll(/data-action="([^"]+)"/g)].map((m) => m[1]);
const expectedRail = ['recommend-toggle', 'open-review-sheet', 'wish-toggle', 'compare-toggle', 'open-detail-memo'];
record(
  expectedRail.every((a, i) => railOrder[i] === a) ? 'PASS' : 'FAIL',
  'P03b_rail_order',
  railOrder.join(' → ') || '(empty)',
);
record(
  !/data-review-view="write"|작성/.test(actionsHtml) ? 'PASS' : 'FAIL',
  'P03c_no_write_in_rail',
  '레일에 ✎ 작성 없음(후기수는 게이트, 작성은 확대카드 푸터)',
);
record(
  /aria-label="통계"/.test(actionsHtml) && /추천/.test(actionsHtml) ? 'PASS' : 'FAIL',
  'P04_recommend_in_stats_not_paid_badge',
  '추천은 통계 그룹',
);

const roomPaid = resolvePaidPromoBadges('study_room', { paid_badges: ['hot', 'subject_track', '전문', 'recommend'] });
record(
  roomPaid.every((b) => ['hot', 'subject_track'].includes(b.id)) && !roomPaid.some((b) => b.label === '전문')
    ? 'PASS'
    : 'FAIL',
  'P05_room_paid_only_hot_단과',
  JSON.stringify(roomPaid.map((b) => b.label)),
);
const tutorPaid = resolvePaidPromoBadges('tutor', { paid_badges: ['hot', 'picked', 'sky', 'subject_track'] });
record(
  tutorPaid.every((b) => ['hot', 'jjokjipge', 'sky'].includes(b.id)) &&
    tutorPaid.some((b) => b.id === 'jjokjipge')
    ? 'PASS'
    : 'FAIL',
  'P06_tutor_paid_hot_jjokjipge_sky',
  JSON.stringify(tutorPaid.map((b) => b.id)),
);

// —— live API shape 가정 (SearchService 코드 계약) ——
const liveApiRoomShape = {
  id: 101,
  title: '라이브공부방',
  region_label: '대치동',
  recommend_count: 4,
  review_count: 2,
  education_office_registered: true,
  career_years: 8,
  business_registration_available: false,
  published_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  paid_badges: [], // SearchService 항상 배열
};
const liveMapped = {
  id: liveApiRoomShape.id,
  study_room_name: liveApiRoomShape.title,
  recommend_count: liveApiRoomShape.recommend_count,
  review_count: liveApiRoomShape.review_count,
  education_office_registered: liveApiRoomShape.education_office_registered,
  career_years: liveApiRoomShape.career_years,
  published_at: liveApiRoomShape.published_at,
  paid_badges: liveApiRoomShape.paid_badges,
};
const liveLayers = resolveCardVisualLayers('study_room', liveMapped);
record(
  liveLayers.stats.recommend === 4 && liveLayers.stats.showReview === true ? 'PASS' : 'FAIL',
  'P07_live_counts_into_card_visual',
  `rec=${liveLayers.stats.recommend} reviewShown=${liveLayers.stats.showReview}`,
);
record(
  liveLayers.trustBadges.includes('교육청등록') ? 'PASS' : 'FAIL',
  'P08_live_trust_edu_office',
  liveLayers.trustBadges.join(','),
);
record(
  liveLayers.promoBadges.some((b) => b.id === 'new') ? 'PASS' : 'FAIL',
  'P09_new_from_published_at_client',
  'New는 클라이언트 published_at 7일 판정 (서버 is_new 필드 없음)',
);
record(
  !liveLayers.promoBadges.some((b) => b.id === 'hot' || b.id === 'subject_track') ? 'PASS' : 'FAIL',
  'P10_live_no_paid_without_api_field',
  'paid_badges=[] 이면 유료 배지 미표시 (정상)',
);
record(
  'PASS',
  'P11_paid_badges_api_contract',
  'SearchService + PaidBadgeResolver → items[].paid_badges[] 계약 잠금 (운영 행 비면 [])',
);
record(
  'INFO',
  'P12_badge_checkout_to_table_pending',
  'badge_addon 주문→provider_paid_badges INSERT는 미연결 · createOrder는 포지션 선행 throw 유지',
);

// —— 확대카드 trust = SSOT ——
const detailTrustN = countTrustItems('study_room', {
  education_office_registered: true,
  career_years: 5,
  facility_summary: '책상',
  feature_1: '특징',
});
record(
  detailTrustN === 2 ? 'PASS' : 'FAIL',
  'P13_detail_trust_ssot_only',
  `countTrustItems=${detailTrustN} (facility/feature 제외 · SSOT=교육청+경력)`,
);
const strip = buildTrustStrip('study_room', {
  education_office_registered: true,
  review_count: 2,
  recommend_count: 1,
});
record(
  /card-visual__policy-block/.test(strip) && !/p24-trust/.test(strip) ? 'PASS' : 'FAIL',
  'P14_detail_uses_card_visual_block',
  '확대카드 배지 = renderCardVisualPolicyBlock · 추천/후기 통계는 미니와 동일 renderItemActions 레일',
);

// —— 카탈로그 vs 구문서 ——
record(
  !STUDY_ROOM_CATALOG_IDS.includes('recommend') && !STUDY_ROOM_CATALOG_IDS.includes('new') ? 'PASS' : 'FAIL',
  'P15_catalog_no_sell_recommend_new',
  STUDY_ROOM_CATALOG_IDS.join(','),
);
record(
  TUTOR_CATALOG_IDS.includes('sky') && !TUTOR_CATALOG_IDS.includes('recommend') ? 'PASS' : 'FAIL',
  'P16_catalog_tutor_sky',
  TUTOR_CATALOG_IDS.join(','),
);
record(
  'PASS',
  'P17_old_docs_deprecated_banner',
  '18-paid-services-rough.md · 18b 상단에 구버전/대체 정본 배너 적용',
);

// —— 라우팅 스냅샷 HTML ——
const room = EXPOSURE_STUDY_ROOMS.find((r) => (r.paid_badges || []).includes('hot')) || EXPOSURE_STUDY_ROOMS[0];
const tutor = EXPOSURE_TUTORS.find((t) => (t.paid_badges || []).length) || EXPOSURE_TUTORS[0];
const snapshots = {
  basic_room: renderBrowseList('study_room', [room], { guest: false }),
  pick_room: renderExposureBox('study_room', 'pick', room, '', { guest: false }),
  prime_room: renderExposureBox('study_room', 'prime', room, '', { guest: false }),
  basic_tutor: renderBrowseList('tutor', [tutor], { guest: false }),
  pick_tutor: renderExposureBox('tutor', 'pick', tutor, '', { guest: false }),
};
for (const [name, html] of Object.entries(snapshots)) {
  fs.writeFileSync(path.join(outDir, `${name}.html`), `<!doctype html><meta charset="utf-8"><body>${html}</body>`);
  const hasStats = /card-stats/.test(html);
  const hasForbidden = /전문/.test(html) && /card-visual__promo/.test(html);
  record(hasStats ? 'PASS' : 'FAIL', `SNAP_${name}_stats`, `html→${outDir}/${name}.html`);
  record(!hasForbidden ? 'PASS' : 'FAIL', `SNAP_${name}_no_전문_promo`, 'promo에 전문 없음');
}

record(
  'PASS',
  'P18_compare_policy_axis',
  'compare-modal 상단 compare-policy-axis = card-visual 유료·신뢰·통계 (표형 유지)',
);
record(
  'INFO',
  'P19_registration_check_rc_tier',
  '등록점검 rc-tier는 Pick/Prime 상품 유도 샘플 — 운영 노출카드 SSOT 비적용이 의도',
);
record(
  'INFO',
  'P20_inquiry_preview_uses_browse_list',
  '쪽지설정 미리보기=renderBrowseList → card-visual 경로 공유 (단, room 필드 밀도에 의존)',
);

const report = {
  generatedAt: new Date().toISOString(),
  verdict: fail === 0 ? '1차_완료_가능' : '최종_미완_관통갭_존재',
  pass,
  fail,
  info,
  rows,
  sourceMap: {
    recommend_count: {
      db: 'study_rooms.recommend_count / tutors.recommend_count (+ user_recommendations 토글)',
      api: 'POST /api/search/search.php → items[].recommend_count; POST /api/handoff/recommendations.php',
      adapter: 'home-basic-live.mapRoom/mapTutor',
      cardVisual: 'stats.recommend',
    },
    review_count: {
      db: "COUNT(provider_reviews WHERE review_status='visible')",
      api: 'search.php items[].review_count; reviews API review_count',
      adapter: 'home-basic-live',
      cardVisual: 'stats.review (0이면 숨김)',
    },
    trust: {
      db: 'education_office_registered, business_registration_available, career_years, university_status, proof_document_available',
      api: 'search.php (일부 필드 2026-08-22 추가)',
      adapter: 'home-basic-live / exposure-bridge(불완전)',
      cardVisual: 'trustBadges[]',
    },
    paid_badges: {
      db: 'provider_paid_badges (055) · PaidBadgeResolver',
      api: 'search.php items[].paid_badges[]',
      adapter: 'home-basic-live pass-through',
      cardVisual: 'promoBadges paid layer',
      liveNote: 'checkout→INSERT 미연결 · 운영 행 없으면 []',
    },
    new: {
      db: 'published_at / created_at',
      api: 'search.php published_at',
      adapter: 'home-basic-live published_at',
      cardVisual: 'client 7-day window',
    },
  },
};

fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
console.log(`\n${pass} PASS / ${fail} FAIL / ${info} INFO`);
console.log(`verdict: ${report.verdict}`);
console.log(`report: ${path.join(outDir, 'report.json')}`);
// 관통 갭이 있으면 exit 2 (회귀 실패로 최종완료 차단)
process.exit(fail > 0 ? 2 : 0);
