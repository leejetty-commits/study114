import { renderMyshopShowcase } from '../preview/home-ui/src/study-room-reg/myshop-render.js';
import { toMyshopShowcaseInputs } from '../preview/home-ui/src/myshop/public-model.js';
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

function stripChrome(html) {
  const m = html.match(/<article class="shop"[\s\S]*?<\/article>/);
  return m ? m[0] : html;
}

function sectionTitles(html) {
  return [...html.matchAll(/<h2 class="shop-sec__title">[\s\S]*?<\/h2>/g)].map((m) =>
    m[0].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
  );
}

function countClassCards(html) {
  return (html.match(/class="shop-class"/g) || []).length;
}

function hasLeak(html) {
  const bad = ['home_address', '집주소', 'address_text', '사업장주소', 'contact_phone', 'mailto:', '010-0000'];
  return bad.filter((k) => html.includes(k));
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

function diffHint(a, b) {
  const la = a.split('\n');
  const lb = b.split('\n');
  for (let i = 0; i < Math.max(la.length, lb.length); i++) {
    if (la[i] !== lb[i]) return `line ${i + 1}:\nA:${(la[i] || '').slice(0, 140)}\nB:${(lb[i] || '').slice(0, 140)}`;
  }
  return 'len';
}

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
        lesson_note: '',
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
  const ownerHtml = stripChrome(renderMyshopShowcase(s, room));
  const pair = toMyshopShowcaseInputs(toPublicItem(s, room));
  const publicHtml = stripChrome(renderMyshopShowcase(pair.state, pair.room));
  fs.writeFileSync(path.join(outDir, 'owner.html'), ownerHtml, 'utf8');
  fs.writeFileSync(path.join(outDir, 'public.html'), publicHtml, 'utf8');
  ok('동일본문_HTML', ownerHtml === publicHtml, ownerHtml === publicHtml ? '' : diffHint(ownerHtml, publicHtml));
  ok('민감정보_비노출', hasLeak(ownerHtml).length === 0, String(hasLeak(ownerHtml)));
  ok('수업카드_2개', countClassCards(ownerHtml) === 2, `got ${countClassCards(ownerHtml)}`);
  ok('raw_enum_없음', !ownerHtml.includes('one_to_four') && !ownerHtml.includes('group_by_time_slot'));
  ok('원생수_변환', ownerHtml.includes('1~4명'));
  ok('Gallery_내부우선', /shop-gallery__hero[\s\S]*room-2\.jpg/.test(ownerHtml));
}

for (const n of [1, 2, 3]) {
  const classes = Array.from({ length: n }, (_, i) => ({
    class_name: `수업${i + 1}`,
    school_level: 'middle',
    subject_name: '수학',
    monthly_fee: String(30 + i),
    attendance_days: ['mon'],
    lessons_per_week: '2',
  }));
  const html = stripChrome(renderMyshopShowcase(baseState({ classes }), roomOf(baseState())));
  ok(`수업반복_${n}`, countClassCards(html) === n, `got ${countClassCards(html)}`);
}

{
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
  const htmlA = stripChrome(renderMyshopShowcase(caseA, roomOf(caseA)));
  const titlesA = sectionTitles(htmlA);
  fs.writeFileSync(path.join(outDir, 'case-A.html'), htmlA, 'utf8');
  ok('케이스A_수업숨김', !titlesA.includes('수업 안내'));
  ok('케이스A_매력숨김', !titlesA.includes('이 공부방의 매력'));
  ok('케이스A_Gallery숨김', !titlesA.includes('사진으로 보는 공간'));
  ok('케이스A_소셜숨김', !titlesA.includes('소셜'));
  ok('케이스A_경력숨김', !titlesA.includes('원장 소개 · 경력'));
}

{
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
  const htmlB = stripChrome(renderMyshopShowcase(caseB, roomOf(caseB)));
  const titlesB = sectionTitles(htmlB);
  fs.writeFileSync(path.join(outDir, 'case-B.html'), htmlB, 'utf8');
  ok('케이스B_수업2', countClassCards(htmlB) === 2);
  ok('케이스B_시설', titlesB.includes('시설 · 환경'));
  ok('케이스B_신뢰', titlesB.includes('신뢰 정보'));
  ok('케이스B_Gallery', titlesB.includes('사진으로 보는 공간'));
}

{
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
  const htmlC = stripChrome(renderMyshopShowcase(caseC, roomOf(caseC)));
  const titlesC = sectionTitles(htmlC);
  fs.writeFileSync(path.join(outDir, 'case-C.html'), htmlC, 'utf8');
  ok('케이스C_수업3', countClassCards(htmlC) === 3);
  ok(
    '케이스C_전섹션',
    ['이 공부방의 매력', '사진으로 보는 공간', '수업 안내', '원장 소개 · 경력', '신뢰 정보', '시설 · 환경', '위치 · 생활권', '소셜'].every(
      (t) => titlesC.includes(t),
    ),
  );
  ok('케이스C_문의', htmlC.includes('shop-inquiry'));
}

{
  const html = stripChrome(
    renderMyshopShowcase(
      baseState({
        images: [
          { image_type: 'cover', image_path: '/1.jpg' },
          { image_type: 'interior', image_path: '/2.jpg' },
        ],
        classes: [{ class_name: 'X', subject_name: '수학', monthly_fee: '1' }],
        facility_names: ['냉난방'],
        career_years: '1',
        education_office_registered: true,
        youtube_url: 'https://y.t',
      }),
      roomOf(baseState()),
    ),
  );
  const titles = sectionTitles(html);
  const expected = ['이 공부방의 매력', '사진으로 보는 공간', '수업 안내', '원장 소개 · 경력', '신뢰 정보', '시설 · 환경', '위치 · 생활권', '소셜'];
  let mono = true;
  let last = -1;
  for (const t of expected) {
    const idx = titles.indexOf(t);
    if (idx < 0) continue;
    if (idx < last) mono = false;
    last = idx;
  }
  ok('섹션순서_고정', mono, titles.join(' > '));
}

const report = { pass: PASS.length, fail: FAIL.length, FAIL, PASS, artifacts: outDir };
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
console.log(JSON.stringify(report, null, 2));
if (FAIL.length) process.exit(1);
