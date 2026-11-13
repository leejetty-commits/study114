/**
 * 368-내등록미리보기 — 홍보사진 편집 그리드: fit 우선 · contain · 흐림 없음
 * node scripts/verify-reg-promo-preview-contain.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;

function ok(name, cond, detail = '') {
  if (cond) {
    console.log(`PASS  ${name}`);
    return;
  }
  failed += 1;
  console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
}

const js = readFileSync(join(ROOT, 'preview/study-room-ui/src/promo-photos.js'), 'utf8');
const css = readFileSync(join(ROOT, 'preview/study-room-ui/src/styles/register.css'), 'utf8');

ok('previewSrc에 fit_1280 우선', /function previewSrc[\s\S]*?fit_1280_path/.test(js));
ok(
  'previewSrc가 basic_720을 맨 앞에 두지 않음',
  !/function previewSrc\([^)]*\)\s*\{\s*return\s+img\.basic_720_path/.test(js),
);
ok(
  'register-photo-card__frame img 는 contain',
  /\.register-photo-card__frame img\s*\{[^}]*object-fit:\s*contain/.test(css),
);
ok(
  'register-photo-card__frame img 에 cover 없음',
  !/\.register-photo-card__frame img\s*\{[^}]*object-fit:\s*cover/.test(css),
);
ok('frame 단색 background', /\.register-photo-card__frame\s*\{[^}]*background:\s*#e2e8f0/.test(css));
ok('픽셀 숫자 UI 문구 없음(미리보기)', !/미리보기[\s\S]{0,80}\d{3,4}\s*[×x]\s*\d{3,4}/.test(js));

/* 회귀: 카드 listingImage fit 우선 · myshop blur 제거 유지 */
const listing = readFileSync(join(ROOT, 'preview/home-ui/src/exposure-render.js'), 'utf8');
ok('카드 listingImage fit 유지', /image_path_fit/.test(listing) && /listingImage/.test(listing));
const myshopCss = readFileSync(join(ROOT, 'preview/home-ui/src/styles/myshop.css'), 'utf8');
ok('마이샵 shop-photo-blur 없음 유지', !myshopCss.includes('shop-photo-blur'));
const homeList = ['home-listings-headings.css', 'home-listings-cards.css', 'home-listings.css'].map((name) => readFileSync(join(ROOT, 'preview/home-ui/src/styles', name), 'utf8')).join('').replace(/^@import\s+['"]\.\/[^'"]+['"];\r?\n/gm, '');
ok('카드 expo-media contain 유지', /\.expo-media img\s*\{[^}]*object-fit:\s*contain/.test(homeList));

/* 과외쌤: 다른 컴포넌트 — fit+contain 이미 있음(보고용 확인) */
const tutorJs = readFileSync(join(ROOT, 'preview/home-ui/src/tutor-reg/profile-photos.js'), 'utf8');
const tutorCss = readFileSync(join(ROOT, 'preview/home-ui/src/styles/tutor-profile-photos.css'), 'utf8');
ok('과외쌤 preview fit 우선(기존)', /fit_1280_path/.test(tutorJs) && /tutorPhotoPreviewSrc/.test(tutorJs));
ok('과외쌤 frame contain(기존)', /\.p21-photos__frame img\s*\{[^}]*object-fit:\s*contain/.test(tutorCss));
ok(
  '과외쌤은 별도 컴포넌트·흐림 배경 잔존(범위 밖 보고)',
  tutorCss.includes('p21-photo-blur') || tutorCss.includes('blur(14px)'),
);

if (failed) {
  console.log(`\nverify-reg-promo-preview-contain FAILED (${failed})`);
  process.exit(1);
}
console.log('\nverify-reg-promo-preview-contain OK');
