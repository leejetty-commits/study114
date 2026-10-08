/**
 * 학생 마이페이지 4탭 스크린샷 캡처
 * 실행: cd preview/home-ui && npx vite-node ../../scripts/capture-student-mypage-shots.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'tmp-design/shots');

// 브라우저 전역 객체 폴리필
const mem = new Map();
const storage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
};
globalThis.sessionStorage = storage;
globalThis.localStorage = storage;
globalThis.window = globalThis;
const loc = {
  hash: '#/mypage/registrations/students/1',
  href: 'http://127.0.0.1:5174/#/mypage/registrations/students/1',
  origin: 'http://127.0.0.1:5174',
  host: '127.0.0.1:5174',
  hostname: '127.0.0.1',
  protocol: 'http:',
  pathname: '/',
  search: '',
  assign() {},
  replace(url) {
    const s = String(url || '');
    const hash = s.startsWith('#') ? s : s.includes('#') ? s.slice(s.indexOf('#')) : '';
    if (hash) this.hash = hash;
  },
};
Object.defineProperty(globalThis, 'location', { value: loc, writable: true, configurable: true });
globalThis.document = {
  documentElement: { style: { setProperty() {}, getPropertyValue() { return ''; } } },
  body: { appendChild() {}, removeChild() {} },
  getElementById() { return null; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  createElement() {
    return { style: {}, setAttribute() {}, appendChild() {}, addEventListener() {}, classList: { add() {}, remove() {} } };
  },
  addEventListener() {},
  removeEventListener() {},
};
globalThis.history = globalThis.history || { pushState() {}, replaceState() {}, state: null };
if (typeof globalThis.dispatchEvent !== 'function') {
  const winEvents = new EventTarget();
  globalThis.dispatchEvent = (event) => winEvents.dispatchEvent(event);
}
if (typeof globalThis.matchMedia !== 'function') {
  globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
}

const cssFiles = [
  'preview/home-ui/src/styles/tokens.css',
  'preview/home-ui/src/styles/home.css',
  'preview/home-ui/src/styles/home-member-flows.css',
  'preview/home-ui/src/styles/home-right-rail.css',
  'preview/search-ui/src/styles/search.css',
  'preview/home-ui/src/styles/design-system.css',
  'preview/home-ui/src/styles/home-listings.css',
  'preview/home-ui/src/styles/product-chrome.css',
  'preview/home-ui/src/styles/mypage-ops.css',
  'preview/home-ui/src/styles/registration-check.css',
  'preview/home-ui/src/styles/home-card-samples.css',
  'preview/shared/register-form-primitives.css',
  'preview/shared/input-fill.css',
  'preview/shared/register-flow.css',
  'preview/study-room-ui/src/styles/register.css',
  'preview/search-ui/src/styles/search-visily.css',
  'preview/home-ui/src/styles/udx-std-apply.css',
  'preview/home-ui/src/styles/student-detail.css',
  'preview/home-ui/src/styles/inquiry-settings-catalog.css',
  'preview/home-ui/src/styles/student-mypage-stage5b.css',
];

let mergedCss = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
  body { margin: 0; padding: 0; font-family: Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif; background: #fff; }
`;
for (const rel of cssFiles) {
  const p = join(ROOT, rel);
  if (existsSync(p)) {
    mergedCss += `\n/* --- ${rel} --- */\n` + readFileSync(p, 'utf8');
  }
}

// 가짜 세션 환경 설정
const session = {
  authenticated: true,
  role_type: 'guardian_student',
  email: 'guardian1@dev.local',
  name: '김하늘',
  email_verified: true,
};

globalThis.fetch = async (url) => {
  const urlStr = String(url || '');
  if (urlStr.includes('/api/auth/me.php')) {
    return {
      ok: true,
      json: async () => ({
        ok: true,
        authenticated: session.authenticated,
        role_type: session.role_type,
        email: session.email,
        name: session.name,
        email_verified: session.email_verified,
      }),
    };
  }
  if (urlStr.includes('/api/board/posts.php')) {
    return {
      ok: true,
      json: async () => ({
        ok: true,
        posts: [
          { id: 'n1', title: '봄맞이 서비스 점검 및 기능 개선 안내', date: '2026.10.08', target_role: 'all', targetRole: 'all' },
          { id: 'n2', title: '학생 회원을 위한 희망지역 설정 가이드', date: '2026.10.07', target_role: 'student', targetRole: 'student' },
        ],
      }),
    };
  }
  if (urlStr.includes('/api/auth/regions.php')) {
    const sampleCities = [
      { id: '117', label: '서울특별시 도봉구', sido_code: '11', sido_name: '서울특별시', official_code: '1132000000', city_name: '도봉구', kind: 'city' },
      { id: '118', label: '서울특별시 노원구', sido_code: '11', sido_name: '서울특별시', official_code: '1135000000', city_name: '노원구', kind: 'city' },
      { id: '9101', label: '경기도 의정부시 가능동', sido_code: '41', sido_name: '경기도', official_code: '4115000000', city_name: '의정부시', kind: 'city' },
    ];
    return {
      ok: true,
      text: async () => JSON.stringify({ ok: true, cities: sampleCities }),
      json: async () => ({ ok: true, cities: sampleCities }),
    };
  }
  return { ok: true, json: async () => ({ ok: true, data: [] }) };
};

const { initAuthSession } = await import('../preview/home-ui/src/auth-session.js');
const { ensureStudentStore, getStudent, updateStudent } = await import('../preview/home-ui/src/student-reg/store.js');
const { ensureTutorCityUnits } = await import('../preview/home-ui/src/tutor-reg/city-units.js');
const { deactivateRegistrationsApi } = await import('../preview/home-ui/src/registrations-backend.js');
const { activateBoardApi, hydrateNoticeHome } = await import('../preview/home-ui/src/board/board-backend.js');
const { renderMypageShell } = await import('../preview/home-ui/src/mypage/shell.js');
const { renderMypageScreen } = await import('../preview/home-ui/src/mypage/screens.js');
const { setActiveRole } = await import('../preview/home-ui/src/state.js');

await initAuthSession(false);
setActiveRole('parent');
deactivateRegistrationsApi();
ensureStudentStore();
await ensureTutorCityUnits();
await activateBoardApi({ navRole: 'parent' });
await hydrateNoticeHome();

// 시안과 동일하게 기본정보 탭에서 희망지역(공부방) 주소칸 및 결과 줄 표시 설정
await updateStudent(1, {
  public_display_name: '학생',
  preferred_lesson_type: 'study_room',
  preferred_studyroom_regions: [
    {
      region_id: '9101',
      region_label: '경기도 의정부시 가능동',
      region_basis_type: 'dong',
      address_text: '경기도 의정부시 가능동',
      address_bname: '가능동',
      is_primary: true,
    },
  ],
  preferred_studyroom_region_id: '9101',
  preferred_studyroom_fee_amount: 420000,
  school_level: '초등',
  grade_level: '초5',
  lesson_format: 'one_on_one',
  preferred_student_count_group: 'solo',
  subject_label: '수학',
  request_summary: '숙제 조금만',
});

function wrapPage(title, bodyHtml) {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    ${mergedCss}
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
}

const TABS = [
  { id: 'after-1-myprofile', path: '/mypage/registrations/students/1', title: '내 등록 - 마이프로필' },
  { id: 'after-2-basic', path: '/mypage/registrations/students/1/basic', title: '내 등록 - 기본정보' },
  { id: 'after-3-detail', path: '/mypage/registrations/students/1/detail', title: '내 등록 - 상세정보' },
  { id: 'after-4-settings', path: '/mypage/registrations/students/1/settings', title: '내 등록 - 쪽지설정' },
];

async function launchChromium(chromium) {
  try {
    return await chromium.launch();
  } catch (first) {
    const base = process.env.LOCALAPPDATA
      ? join(process.env.LOCALAPPDATA, 'ms-playwright')
      : join(process.env.HOME || '', process.platform === 'darwin' ? 'Library/Caches/ms-playwright' : '.cache/ms-playwright');
    const { readdirSync } = await import('node:fs');
    const dirs = existsSync(base) ? readdirSync(base) : [];
    const candidates = [
      ...dirs.filter((d) => d.startsWith('chromium_headless_shell-')).map((d) => join(base, d, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe')),
      ...dirs.filter((d) => d.startsWith('chromium_headless_shell-')).map((d) => join(base, d, 'chrome-linux', 'headless_shell')),
      ...dirs.filter((d) => /^chromium-\d+$/.test(d)).map((d) => join(base, d, 'chrome-win', 'chrome.exe')),
      ...dirs.filter((d) => /^chromium-\d+$/.test(d)).map((d) => join(base, d, 'chrome-win64', 'chrome.exe')),
    ].filter((p) => existsSync(p));
    if (!candidates.length) throw first;
    return chromium.launch({ executablePath: candidates[0] });
  }
}

const browser = await launchChromium(chromium);

for (const tab of TABS) {
  console.log(`Rendering ${tab.id} (${tab.path})...`);
  loc.hash = `#${tab.path}`;
  const body = renderMypageScreen(tab.path);
  const shell = renderMypageShell(tab.path, body);
  const fullHtml = wrapPage(tab.title, shell);

  // Desktop (1280px)
  const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } });
  await page.setContent(fullHtml, { waitUntil: 'load' });

  // 194 회색 채움 적용
  await page.evaluate(() => {
    const forms = document.querySelectorAll('form');
    forms.forEach((f) => f.setAttribute('data-input-fill', ''));
    const SKIP_TYPES = new Set(['hidden', 'radio', 'checkbox', 'button', 'submit', 'reset', 'file', 'image', 'range', 'color']);
    document.querySelectorAll('input, select, textarea').forEach((el) => {
      const tag = el.tagName.toUpperCase();
      const type = String(el.type || 'text').toLowerCase();
      if (SKIP_TYPES.has(type)) return;
      const val = String(el.value || '').trim();
      el.setAttribute('data-fill', val ? 'filled' : 'empty');
    });
  });

  await page.evaluate(() => document.fonts.ready);

  const desktopPath = join(OUT_DIR, `${tab.id}.png`);
  await page.screenshot({ path: desktopPath, fullPage: true });
  console.log(`  Saved desktop shot: ${desktopPath}`);

  // Mobile (390px)
  await page.setViewportSize({ width: 390, height: 1200 });
  const mobilePath = join(OUT_DIR, `${tab.id}-m.png`);
  await page.screenshot({ path: mobilePath, fullPage: true });
  console.log(`  Saved mobile shot: ${mobilePath}`);

  await page.close();

  // 기본정보의 경우 과외형도 추가 캡처
  if (tab.id === 'after-2-basic') {
    await updateStudent(1, {
      preferred_lesson_type: 'tutor',
      preferred_tutor_region_id: '117',
    });
    const tutorBody = renderMypageScreen(tab.path);
    const tutorShell = renderMypageShell(tab.path, tutorBody);
    const tutorHtml = wrapPage(`${tab.title} (과외형)`, tutorShell);

    const tPage = await browser.newPage({ viewport: { width: 1280, height: 1600 } });
    await tPage.setContent(tutorHtml, { waitUntil: 'load' });
    await tPage.evaluate(() => {
      const forms = document.querySelectorAll('form');
      forms.forEach((f) => f.setAttribute('data-input-fill', ''));
      const SKIP_TYPES = new Set(['hidden', 'radio', 'checkbox', 'button', 'submit', 'reset', 'file', 'image', 'range', 'color']);
      document.querySelectorAll('input, select, textarea').forEach((el) => {
        const tag = el.tagName.toUpperCase();
        const type = String(el.type || 'text').toLowerCase();
        if (SKIP_TYPES.has(type)) return;
        const val = String(el.value || '').trim();
        el.setAttribute('data-fill', val ? 'filled' : 'empty');
      });
    });
    await tPage.evaluate(() => document.fonts.ready);
    const tutorDesktopPath = join(OUT_DIR, 'after-2-basic-tutor.png');
    await tPage.screenshot({ path: tutorDesktopPath, fullPage: true });
    console.log(`  Saved tutor desktop shot: ${tutorDesktopPath}`);

    await tPage.setViewportSize({ width: 390, height: 1200 });
    const tutorMobilePath = join(OUT_DIR, 'after-2-basic-tutor-m.png');
    await tPage.screenshot({ path: tutorMobilePath, fullPage: true });
    console.log(`  Saved tutor mobile shot: ${tutorMobilePath}`);
    await tPage.close();

    // 복구
    await updateStudent(1, {
      preferred_lesson_type: 'study_room',
      preferred_studyroom_region_id: '9101',
    });
  }
}

await browser.close();
console.log('\nAll screenshots captured successfully!');
