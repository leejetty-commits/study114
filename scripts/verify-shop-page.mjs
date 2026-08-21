/**
 * ShopPage 공통 포맷 검증
 * cd preview/home-ui && npx vite-node ../../scripts/verify-shop-page.mjs
 */

import { renderMyshopShowcase, buildShopViewModel, SHOP_SECTION_ORDER, SHOP_FALLBACK_MATRIX } from '../preview/home-ui/src/study-room-reg/myshop-render.js';
import { toMyshopShowcaseInputs } from '../preview/home-ui/src/myshop/public-model.js';
import {
  splitHeroAndGallery,
  collectShopPhotos,
  formatCapacity,
  formatMonthlyFeeBand,
  formatLessonPlace,
  formatLessonOperation,
  formatBoolFlag,
  formatLivingAreaSentence,
  SHOP_FORBIDDEN_KEYS,
} from '../preview/home-ui/src/study-room-reg/shop-formatters.js';
import {
  resolveHeroGalleryWithFallback,
  resolveHeroCopy,
  visibleShopSections,
} from '../preview/home-ui/src/study-room-reg/shop-view-model.js';
import { getShopCompletenessItems, getShopCompletenessSummary } from '../preview/home-ui/src/study-room-reg/shop-completeness.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../tmp/shop-verify');
fs.mkdirSync(outDir, { recursive: true });

const FAIL = [];
const PASS = [];
function ok(name, cond, detail = '') {
  if (cond) PASS.push(name);
  else FAIL.push(`${name}${detail ? ` — ${detail}` : ''}`);
}

function stripRoot(html) {
  const m = html.match(/<article class="shop"[\s\S]*?<\/article>/);
  return m ? m[0] : html;
}

function sectionIds(html) {
  return [...html.matchAll(/data-shop-section="([^"]+)"/g)].map((m) => m[1]);
}

function countClassCards(html) {
  return (html.match(/data-shop-class-index="/g) || []).length;
}

function hasLeak(html) {
  return SHOP_FORBIDDEN_KEYS.filter((k) => html.includes(k)).concat(
    ['집주소', '사업장주소', '010-0000', 'mailto:'].filter((k) => html.includes(k)),
  );
}

function baseState(over = {}) {
  return {
    study_room_name: '검증 공부방',
    slogan: '매일 성장하는 작은 공부방',
    intro_short: '소규모 맞춤 관리',
    intro_long: '개별 피드백을 중심으로 운영합니다.',
    main_subject_note: '수학',
    lesson_place_type: 'study_room',
    primary_school_levels: ['middle', 'high'],
    lesson_operation_type: 'group_by_time_slot',
    capacity_per_time: 'one_to_four',
    monthly_fee_manwon: '35',
    minutes_per_lesson: '90',
    lessons_per_week: '3',
    teaching_style_ids: ['meticulous', 'patient'],
    teaching_style_note: '개념을 먼저 잡고 빈틈을 메웁니다.',
    weekend_available: true,
    one_on_one_available: false,
    card_payment_available: true,
    cash_receipt_available: false,
    correction_available: true,
    feature_1: '숙제관리',
    feature_2: '',
    feature_3: '',
    university_name: '',
    major_name: '',
    career_years: '',
    academy_career_years: '',
    franchise_flag: null,
    franchise_name: '',
    education_office_registered: false,
    education_office_reg_no: '',
    business_registration_available: false,
    other_proof_notes: [],
    facility_ids: [],
    facility_names: [],
    facility_note: '',
    youtube_url: '',
    facebook_url: '',
    instagram_url: '',
    inquiry_status: 'open',
    classes: [],
    images: [],
    saved_regions: [{ is_primary: true, region_label: '강남구 · 대치동', complex_name: '' }],
    home_address: '서울시 강남구 대치동 000-0 (절대노출금지)',
    address_text: '사업장 원문주소 노출금지',
    gender: 'male',
    contact_phone: '010-0000-0000',
    ...over,
  };
}

function roomOf(s) {
  return {
    study_room_name: s.study_room_name,
    slogan: s.slogan,
    intro_short: s.intro_short,
    intro_long: s.intro_long,
    main_subject_note: s.main_subject_note,
    grade_band: '중등 고등',
    price_amount: 350000,
    region_label: '강남구 · 대치동',
    location_label: '강남구 · 대치동',
    inquiry_status: s.inquiry_status,
    lesson_place_type: s.lesson_place_type,
    capacity_per_time: s.capacity_per_time,
  };
}

function toPublicItem(s, room) {
  return {
    ...s,
    grade_band: room.grade_band,
    price_amount: room.price_amount,
    location_label: room.location_label,
    promo_regions: (s.saved_regions || []).map((r) => r.region_label).filter(Boolean),
    facility_names: s.facility_names || [],
    images: s.images || [],
    classes: s.classes || [],
    primary_school_levels: s.primary_school_levels || [],
  };
}

function wrapComparePage(blocks) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"/><title>ShopPage 케이스 비교</title>
  <link rel="stylesheet" href="/assets/index-DbB1Nc3b.css"/>
  <style>
    body{margin:0;background:#f5f5f4;font-family:Pretendard,sans-serif}
    .cmp{display:grid;grid-template-columns:1fr;gap:2rem;padding:1.5rem;max-width:62rem;margin:0 auto}
    .cmp__h{margin:0 0 .5rem;font-size:1.1rem}
    .cmp__note{color:#78716c;font-size:.85rem;margin:0 0 1rem}
  </style></head><body><div class="cmp">${blocks}</div></body></html>`;
}

// —— formatter unit ——
ok('fmt_원생수', formatCapacity('one_to_four') === '1~4명');
ok('fmt_원생수_raw숨김', formatCapacity('weird_enum_key') === '');
ok('fmt_가격', formatMonthlyFeeBand('35', null) === '월 35만원대');
ok('fmt_교습형태', formatLessonPlace('academy') === '교습소');
ok('fmt_수업형태', formatLessonOperation('time_slot_mixed_grade') === '타임별 무학년 수업');
ok('fmt_bool', formatBoolFlag(true, '가능') === '가능' && formatBoolFlag(false) === '');
ok('fmt_생활권', formatLivingAreaSentence(['대치동', '은마']) === '대치동 생활권 · 은마');

// —— ViewModel shape / fallback matrix (회귀 고정) ——
ok('VM_섹션키수', SHOP_SECTION_ORDER.length === 12);
ok('VM_fallback문서', Boolean(SHOP_FALLBACK_MATRIX.heroImage?.length && SHOP_FALLBACK_MATRIX.classes?.length));
{
  const emptyPhoto = resolveHeroGalleryWithFallback([]);
  ok('FB_사진없음', emptyPhoto.ruleId === 'no_photos' && !emptyPhoto.hero);
  const noCover = resolveHeroGalleryWithFallback([
    { src: '/a.jpg', type: 'interior' },
    { src: '/b.jpg', type: 'other' },
  ]);
  ok('FB_cover없음_첫장Hero', noCover.ruleId === 'no_cover_first_photo' && noCover.hero?.src === '/a.jpg');
  const withCover = resolveHeroGalleryWithFallback([
    { src: '/c.jpg', type: 'cover' },
    { src: '/i.jpg', type: 'interior' },
  ]);
  ok('FB_cover우선', withCover.ruleId === 'cover' && withCover.hero?.src === '/c.jpg');
  ok('FB_슬로건만', resolveHeroCopy('슬로건', '').ruleId === 'slogan_only');
  ok('FB_한줄만', resolveHeroCopy('', '한줄').ruleId === 'intro_only' && resolveHeroCopy('', '한줄').lead === '한줄');
  ok('FB_동일문구', resolveHeroCopy('같음', '같음').ruleId === 'same' && !resolveHeroCopy('같음', '같음').lead);
}
{
  const vm = buildShopViewModel(
    baseState({
      slogan: '',
      intro_short: '한줄만',
      classes: [],
      monthly_fee_manwon: '40',
      images: [{ image_type: 'interior', image_path: '/only.jpg' }],
      saved_regions: [{ region_label: '대치동' }],
    }),
    { study_room_name: '검증 공부방', price_amount: null, grade_band: '', region_label: '', location_label: '' },
  );
  ok('FB_한줄_HeroLead', vm.hero.lead === '한줄만' && !vm.hero.slogan);
  ok('FB_수업없음_가격타일', vm.classes.items.length === 0 && vm.facts.tiles.some((t) => t.label === '가격대'));
  ok('FB_지역1_문장', vm.livingArea.labels.length === 1 && vm.hero.livingLine.includes('생활권'));
  ok('FB_meta규칙', vm.meta.fallbacks.heroImage === 'no_cover_first_photo' && vm.meta.fallbacks.classes === 'no_classes_fee_tile');
  ok('VM_visible에hero', visibleShopSections(vm).includes('hero') && visibleShopSections(vm).includes('facts'));
  ok('VM_offerings여지', vm.meta.offeringsAlias === 'classes');
}
{
  const items = getShopCompletenessItems(
    baseState({
      images: [{ image_type: 'other', image_path: '/x.jpg' }],
      intro_short: '',
      slogan: '',
      classes: [],
      teaching_style_ids: [],
      teaching_style_note: '',
      teaching_style: '',
      monthly_fee_manwon: '',
      saved_regions: [],
      promo_regions: [],
      region_label: '',
    }),
    { has_representative_image: false, price_amount: null, region_label: '', has_regions: false },
  );
  const miss = items.filter((i) => !i.ok).map((i) => i.id);
  ok(
    '완성도_누락우선',
    ['cover', 'intro_short', 'classes', 'teaching_style', 'fee', 'living'].every((id) => miss.includes(id)),
  );
  const summary = getShopCompletenessSummary(
    baseState({
      images: [{ image_type: 'other', image_path: '/x.jpg' }],
      intro_short: '',
      slogan: '',
      classes: [],
      teaching_style_ids: [],
      teaching_style_note: '',
      teaching_style: '',
      monthly_fee_manwon: '',
      saved_regions: [],
      promo_regions: [],
      region_label: '',
    }),
    { has_representative_image: false, price_amount: null, region_label: '', has_regions: false },
  );
  ok('완성도_이유문장', summary.weak && /얇아 보이는 이유/.test(summary.reasonLine) && /대표사진 없음/.test(summary.reasonLine));
}

// —— 동일 본문 ——
{
  const s = baseState({
    images: [
      { image_type: 'cover', image_path: '/assets/listings/room-1.jpg', caption: '대표' },
      { image_type: 'interior', image_path: '/assets/listings/room-2.jpg', caption: '내부' },
      { image_type: 'other', image_path: '/assets/listings/room-3.jpg', caption: '기타' },
    ],
    classes: [
      {
        class_name: '중등 수학',
        school_level: 'middle',
        grade_band: '2학년',
        subject_name: '수학',
        attendance_days: ['mon', 'wed'],
        lessons_per_week: '2',
        monthly_fee: '35',
        fee_note: '교재비 별도',
        lesson_note: '오답 피드백',
      },
      {
        class_name: '고등 수학',
        school_level: 'high',
        subject_name: '수학',
        attendance_days: ['tue', 'thu'],
        lessons_per_week: '3',
        monthly_fee: '48',
      },
    ],
    facility_names: ['냉난방', 'CCTV/안전관리'],
    education_office_registered: true,
    education_office_reg_no: '제123호',
    career_years: '6',
    university_name: '서울대',
    major_name: '수학교육',
    youtube_url: 'https://youtube.com/example',
  });
  const room = roomOf(s);
  const ownerHtml = stripRoot(renderMyshopShowcase(s, room));
  const pair = toMyshopShowcaseInputs(toPublicItem(s, room));
  const publicHtml = stripRoot(renderMyshopShowcase(pair.state, pair.room));
  fs.writeFileSync(path.join(outDir, 'owner.html'), ownerHtml, 'utf8');
  fs.writeFileSync(path.join(outDir, 'public.html'), publicHtml, 'utf8');
  ok('동일본문_HTML', ownerHtml === publicHtml);
  ok('동일본문_섹션ID', JSON.stringify(sectionIds(ownerHtml)) === JSON.stringify(sectionIds(publicHtml)));
  // route 분기 정적 검사 — 렌더 소스에 경로/역할 분기 금지
  {
    const renderSrc = fs.readFileSync(
      path.join(__dirname, '../preview/home-ui/src/study-room-reg/myshop-render.js'),
      'utf8',
    );
    const bad = /(isPublic|isOwner|viewerRole|myshopMode|routeMode|publicOnly|ownerOnly)/.test(renderSrc);
    ok('렌더_route분기없음', !bad);
  }
  ok('민감정보_비노출', hasLeak(ownerHtml).length === 0, String(hasLeak(ownerHtml)));
  ok('수업카드_2개', countClassCards(ownerHtml) === 2);
  ok('raw_enum_없음', !ownerHtml.includes('one_to_four') && !ownerHtml.includes('group_by_time_slot'));
  ok('원생수_변환', ownerHtml.includes('1~4명'));
  ok('Gallery_내부우선', /shop-gallery__hero[\s\S]*room-2\.jpg/.test(ownerHtml));
  ok('준비중문구_없음', !ownerHtml.includes('준비중') && !ownerHtml.includes('정보 없음'));
}

// —— 사진 1/3/5 ——
{
  const one = collectShopPhotos(
    baseState({ images: [{ image_type: 'cover', image_path: '/p1.jpg' }] }),
  );
  const split1 = splitHeroAndGallery(one);
  ok('사진1_Hero만', Boolean(split1.hero) && split1.gallery.length === 0);
  const html1 = stripRoot(
    renderMyshopShowcase(baseState({ images: [{ image_type: 'cover', image_path: '/p1.jpg' }] }), roomOf(baseState())),
  );
  ok('사진1_Gallery섹션숨김', !sectionIds(html1).includes('gallery'));
  ok('사진1_레이아웃유지', html1.includes('shop-hero') && html1.includes('data-shop-root'));
}

{
  const imgs = [
    { image_type: 'cover', image_path: '/c.jpg' },
    { image_type: 'other', image_path: '/o.jpg' },
    { image_type: 'interior', image_path: '/i.jpg' },
  ];
  const split = splitHeroAndGallery(collectShopPhotos(baseState({ images: imgs })));
  ok('사진3_Hero커버', split.hero?.src === '/c.jpg');
  ok('사진3_Gallery내부우선', split.gallery[0]?.src === '/i.jpg' && split.gallery[1]?.src === '/o.jpg');
  const html = stripRoot(renderMyshopShowcase(baseState({ images: imgs }), roomOf(baseState())));
  ok('사진3_Gallery렌더', sectionIds(html).includes('gallery') && (html.match(/data-shop-thumb/g) || []).length === 2);
}

{
  const imgs = [
    { image_type: 'cover', image_path: '/1.jpg' },
    { image_type: 'interior', image_path: '/2.jpg' },
    { image_type: 'facility', image_path: '/3.jpg' },
    { image_type: 'other', image_path: '/4.jpg' },
    { image_type: 'other', image_path: '/5.jpg' },
  ];
  const split = splitHeroAndGallery(collectShopPhotos(baseState({ images: imgs })));
  ok('사진5_Gallery4장', split.gallery.length === 4);
  ok(
    '사진5_정렬',
    split.gallery.map((g) => g.type).join(',') === 'interior,facility,other,other',
  );
  const html = stripRoot(renderMyshopShowcase(baseState({ images: imgs }), roomOf(baseState())));
  ok('사진5_붕괴없음', html.includes('shop-gallery__thumbs') && html.includes('shop-hero'));
}

// —— 수업 1/2/3 ——
for (const n of [1, 2, 3]) {
  const classes = Array.from({ length: n }, (_, i) => ({
    class_name: `수업${i + 1}`,
    school_level: 'middle',
    subject_name: '수학',
    monthly_fee: String(30 + i),
    attendance_days: ['mon'],
    lessons_per_week: '2',
  }));
  const html = stripRoot(renderMyshopShowcase(baseState({ classes }), roomOf(baseState())));
  ok(`수업반복_${n}`, countClassCards(html) === n);
}

// —— 밀도 A/B/C ——
const caseA = baseState({
  intro_long: '',
  teaching_style_ids: [],
  teaching_style_note: '',
  feature_1: '',
  classes: [],
  images: [{ image_type: 'cover', image_path: '/assets/listings/room-1.jpg' }],
  facility_names: [],
  career_years: '',
  university_name: '',
  youtube_url: '',
  education_office_registered: false,
});
const htmlA = stripRoot(renderMyshopShowcase(caseA, roomOf(caseA)));
fs.writeFileSync(path.join(outDir, 'case-A.html'), htmlA, 'utf8');
const idsA = sectionIds(htmlA);
ok('케이스A_필수만', idsA.includes('hero') && idsA.includes('facts'));
ok('케이스A_숨김', !idsA.includes('classes') && !idsA.includes('gallery') && !idsA.includes('signature') && !idsA.includes('social') && !idsA.includes('career'));
ok('케이스A_빈제목없음', !htmlA.match(/shop-sec__title[^>]*>\s*<span[^>]*><\/span>\s*<\/h2>/));

const caseB = baseState({
  classes: [
    { class_name: 'A반', subject_name: '수학', monthly_fee: '35', school_level: 'middle' },
    { class_name: 'B반', subject_name: '영어', monthly_fee: '40', school_level: 'high' },
  ],
  facility_names: ['냉난방'],
  facility_note: '환기 잘 됩니다',
  education_office_registered: true,
  images: [
    { image_type: 'cover', image_path: '/a.jpg' },
    { image_type: 'interior', image_path: '/b.jpg' },
  ],
});
const htmlB = stripRoot(renderMyshopShowcase(caseB, roomOf(caseB)));
fs.writeFileSync(path.join(outDir, 'case-B.html'), htmlB, 'utf8');
const idsB = sectionIds(htmlB);
ok('케이스B_수업2', countClassCards(htmlB) === 2);
ok('케이스B_시설신뢰Gallery', idsB.includes('facilities') && idsB.includes('trust') && idsB.includes('gallery'));

const caseC = baseState({
  images: [
    { image_type: 'cover', image_path: '/c1.jpg' },
    { image_type: 'interior', image_path: '/c2.jpg' },
    { image_type: 'facility', image_path: '/c3.jpg' },
    { image_type: 'other', image_path: '/c4.jpg' },
    { image_type: 'other', image_path: '/c5.jpg' },
  ],
  classes: [
    { class_name: '1', subject_name: '수학', monthly_fee: '30', school_level: 'middle', attendance_days: ['mon'], lessons_per_week: '2' },
    { class_name: '2', subject_name: '영어', monthly_fee: '32', school_level: 'middle', attendance_days: ['tue'], lessons_per_week: '2' },
    { class_name: '3', subject_name: '과학', monthly_fee: '34', school_level: 'high', attendance_days: ['wed'], lessons_per_week: '3' },
  ],
  university_name: '연세대',
  major_name: '물리',
  career_years: '10',
  academy_career_years: '4',
  feature_1: 'a',
  feature_2: 'b',
  feature_3: 'c',
  facility_names: ['냉난방', '환기', 'CCTV/안전관리'],
  education_office_registered: true,
  business_registration_available: true,
  franchise_flag: true,
  franchise_name: '테스트프',
  youtube_url: 'https://youtube.com/x',
  facebook_url: 'https://facebook.com/x',
  instagram_url: 'https://instagram.com/x',
});
const htmlC = stripRoot(renderMyshopShowcase(caseC, roomOf(caseC)));
fs.writeFileSync(path.join(outDir, 'case-C.html'), htmlC, 'utf8');
const idsC = sectionIds(htmlC);
ok('케이스C_수업3', countClassCards(htmlC) === 3);
ok(
  '케이스C_전섹션',
  ['hero', 'facts', 'signature', 'gallery', 'classes', 'career', 'trust', 'facilities', 'livingArea', 'social', 'reviews', 'inquiry'].every((id) =>
    idsC.includes(id),
  ),
);
ok(
  '후기섹션_티저placeholder',
  htmlC.includes('data-shop-section="reviews"') &&
    htmlC.includes('data-shop-review-teaser') &&
    idsC.indexOf('reviews') > idsC.indexOf('social') &&
    idsC.indexOf('reviews') < idsC.indexOf('inquiry'),
);

// 섹션 순서 (있는 것만 단조 증가)
{
  const order = [...SHOP_SECTION_ORDER];
  let mono = true;
  let last = -1;
  for (const id of order) {
    const idx = idsC.indexOf(id);
    if (idx < 0) continue;
    if (idx < last) mono = false;
    last = idx;
  }
  ok('섹션순서_고정', mono, idsC.join('>'));
  ok('섹션순서_상수일치', JSON.stringify(order) === JSON.stringify(SHOP_SECTION_ORDER));
}

// 비교 페이지 (스크린샷용 산출물)
fs.writeFileSync(
  path.join(outDir, 'compare-ABC.html'),
  wrapComparePage(
    [
      `<section><h2 class="cmp__h">케이스 A — 입력 적음</h2><p class="cmp__note">섹션: ${idsA.join(', ')}</p>${htmlA}</section>`,
      `<section><h2 class="cmp__h">케이스 B — 입력 보통</h2><p class="cmp__note">섹션: ${idsB.join(', ')} · 수업 ${countClassCards(htmlB)}</p>${htmlB}</section>`,
      `<section><h2 class="cmp__h">케이스 C — 입력 많음</h2><p class="cmp__note">섹션: ${idsC.join(', ')} · 수업 ${countClassCards(htmlC)}</p>${htmlC}</section>`,
    ].join('\n'),
  ),
  'utf8',
);

fs.writeFileSync(
  path.join(outDir, 'compare-owner-public.html'),
  wrapComparePage(
    [
      `<section><h2 class="cmp__h">마이페이지 경로 (직접 renderMyshopShowcase)</h2><p class="cmp__note">바이트 동일 여부: ${htmlA && '아래 twin 참고'}</p>${fs.readFileSync(path.join(outDir, 'owner.html'), 'utf8')}</section>`,
      `<section><h2 class="cmp__h">공개 경로 (toMyshopShowcaseInputs → 동일 렌더)</h2><p class="cmp__note">owner≡public: ${fs.readFileSync(path.join(outDir, 'owner.html'), 'utf8') === fs.readFileSync(path.join(outDir, 'public.html'), 'utf8')}</p>${fs.readFileSync(path.join(outDir, 'public.html'), 'utf8')}</section>`,
    ].join('\n'),
  ),
  'utf8',
);

const report = {
  pass: PASS.length,
  fail: FAIL.length,
  FAIL,
  PASS,
  artifacts: outDir,
  comparePages: ['compare-ABC.html', 'compare-owner-public.html'],
};
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
console.log(JSON.stringify(report, null, 2));
if (FAIL.length) process.exit(1);
