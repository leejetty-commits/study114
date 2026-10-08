/**
 * 글자 크기 집합 {12, 14, 16, 18, 22, 28} 만족 여부,
 * 내 공지 / 탭 바 / 카드의 오른쪽 끝 정렬(±1px),
 * 카드 제목 == 첫 라벨 == 첫 입력칸 == 저장 버튼의 왼쪽선 정렬(±1px) 측정 (PC & 모바일)
 * 실행: cd preview/home-ui && npx vite-node ../../scripts/verify-student-mypage-metrics.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

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
  body { margin: 0; padding: 0; font-family: Pretendard, sans-serif; background: #fff; }
`;
for (const rel of cssFiles) {
  const p = join(ROOT, rel);
  if (existsSync(p)) {
    mergedCss += `\n/* --- ${rel} --- */\n` + readFileSync(p, 'utf8');
  }
}

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
          { id: 'n1', title: '봄맞이 공지', date: '2026.10.08', target_role: 'all', targetRole: 'all' },
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
const { ensureStudentStore, getStudent, updateStudent, addStudent } = await import('../preview/home-ui/src/student-reg/store.js');
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
if (!getStudent(1)) addStudent({ student_name: '김하늘', gender: 'female', birth_year: 2012, exposure_status: 'published' });
await ensureTutorCityUnits();
await activateBoardApi({ navRole: 'parent' });
await hydrateNoticeHome();

// 김하늘(1) 학생에 공부방 희망지역 주입(시안과 동일한 주소 및 단지)
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

function wrapPage(title, bodyHtml) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"/><title>${title}</title><style>${mergedCss}</style></head><body>${bodyHtml}</body></html>`;
}

const browser = await launchChromium(chromium);

const TABS = [
  { name: '마이프로필', path: '/mypage/registrations/students/1', isForm: false },
  { name: '기본정보', path: '/mypage/registrations/students/1/basic', isForm: true },
  { name: '상세정보', path: '/mypage/registrations/students/1/detail', isForm: true },
  { name: '쪽지설정', path: '/mypage/registrations/students/1/settings', isForm: true },
];

const ALLOWED_FONT_SIZES = new Set([12, 14, 16, 18, 22, 28]);
const VIEWPORTS = [
  { name: 'PC', width: 1280, height: 1600 },
  { name: '모바일', width: 390, height: 1400 },
];

let allPassed = true;

for (const vp of VIEWPORTS) {
  console.log(`\n========================================`);
  console.log(` 검증 시작: ${vp.name} (${vp.width}x${vp.height})`);
  console.log(`========================================`);
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

  for (const tab of TABS) {
    console.log(`\n--- [${vp.name}] ${tab.name} (${tab.path}) ---`);
    loc.hash = `#${tab.path}`;
    const body = renderMypageScreen(tab.path);
    const shell = renderMypageShell(tab.path, body);
    await page.setContent(wrapPage(tab.name, shell), { waitUntil: 'load' });

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

    // 1. 오른쪽 끝 정렬 (내 공지, 탭 바, 카드)
    const rightBounds = await page.evaluate(() => {
      const notice = document.querySelector('.mypage-notice');
      const tabs = document.querySelector('.mp-room__tabs');
      const cards = Array.from(document.querySelectorAll('.p21-profile__section, .p19-form-section, .student-detail-section'));
      const getRight = (el) => {
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return Math.round(rect.right * 10) / 10;
      };

      return {
        noticeRight: getRight(notice),
        tabsRight: getRight(tabs),
        cardRights: cards.map(getRight),
      };
    });

    if (rightBounds.noticeRight && rightBounds.tabsRight) {
      const diff = Math.abs(rightBounds.noticeRight - rightBounds.tabsRight);
      const ok = diff <= 1.0;
      console.log(`  [오른쪽 정렬] 내 공지 ↔ 탭 바: ${diff}px (${ok ? 'PASS' : 'FAIL'})`);
      if (!ok) allPassed = false;
    }
    if (rightBounds.tabsRight && rightBounds.cardRights.length) {
      for (let i = 0; i < rightBounds.cardRights.length; i++) {
        const diff = Math.abs(rightBounds.tabsRight - rightBounds.cardRights[i]);
        const ok = diff <= 1.0;
        console.log(`  [오른쪽 정렬] 탭 바 ↔ 카드[${i}]: ${diff}px (${ok ? 'PASS' : 'FAIL'})`);
        if (!ok) allPassed = false;
      }
    }

    // 2. [핵심] 왼쪽선 정렬 (카드 제목 == 첫 라벨 == 첫 입력칸/칩 == 저장 버튼)
    if (tab.isForm) {
      const leftMetrics = await page.evaluate(() => {
        const card = document.querySelector('.p19-form-section, .student-detail-section');
        const title = document.querySelector('.p19-form-section__title, .student-detail-title');
        const lead = document.querySelector('.p19-form-section__lead, .student-detail-lead');
        const firstLabel = document.querySelector('.p19-field__label, .student-detail-label');
        const firstInput = document.querySelector('.p19-input:not([type="hidden"]), .p19-select, .p21-inq-choice');
        const submitBtn = document.querySelector('.p19-form-footer button[type="submit"], .p19-form-actions button[type="submit"]');
        const footerBar = document.querySelector('.p19-form-footer');

        const getLeft = (el) => {
          if (!el) return null;
          return Math.round(el.getBoundingClientRect().left * 10) / 10;
        };

        return {
          cardLeft: getLeft(card),
          titleLeft: getLeft(title),
          leadLeft: getLeft(lead),
          firstLabelLeft: getLeft(firstLabel),
          firstInputLeft: getLeft(firstInput),
          submitBtnLeft: getLeft(submitBtn),
          footerBarLeft: getLeft(footerBar),
        };
      });

      console.log(`  [왼쪽선 측정]`, leftMetrics);
      const ref = leftMetrics.titleLeft;
      const targets = [
        { name: '첫 라벨', val: leftMetrics.firstLabelLeft },
        { name: '첫 입력/칩', val: leftMetrics.firstInputLeft },
        { name: '저장 버튼', val: leftMetrics.submitBtnLeft },
        { name: '저장 바 구분선', val: leftMetrics.footerBarLeft },
      ].filter((t) => t.val !== null);

      let formLeftOk = true;
      for (const t of targets) {
        const diff = Math.abs(ref - t.val);
        const ok = diff <= 1.0;
        console.log(`    카드 제목(${ref}px) ↔ ${t.name}(${t.val}px): 차이 ${diff}px (${ok ? 'PASS' : 'FAIL'})`);
        if (!ok) {
          formLeftOk = false;
          allPassed = false;
        }
      }
      if (formLeftOk) {
        console.log(`  PASS: ${tab.name} 왼쪽선 일치 (오차 <= 1px)`);
      }
    }

    // 2-1. [신규] 기본정보 희망지역 묶음 간격 및 하위 요소 규격 검사 (공부방형 & 과외형)
    if (tab.path === '/mypage/registrations/students/1/basic') {
      console.log(`  [희망지역 검증 - 공부방형]`);
      const roomMetrics = await page.evaluate(() => {
        const slot = document.querySelector('[data-p19-hope-panel="study_room"] [data-p19-hope-region-slot]');
        const budgetLabel = document.querySelector('[data-p19-hope-panel="study_room"] label .p19-field__label');
        const toolbar = document.querySelector('[data-hope-region] .register-region-slot__toolbar');
        const toolbarStrong = document.querySelector('[data-hope-region] .register-region-slot__toolbar strong');
        const hint = document.querySelector('.register-region-slot__basis-hint');
        const chip = document.querySelector('.register-region-slot__basis .chip');
        const zipRow = document.querySelector('.form-address__zip-row');
        const desc = document.querySelector('.register-region-slot__search .form-hint');
        const resolved = document.querySelector('[data-slot-resolved]');

        const r = (el) => el ? el.getBoundingClientRect() : null;
        const sr = r(slot);
        const br = r(budgetLabel);
        const hr = r(hint);
        const cr = r(chip);
        const zr = r(zipRow);
        const dr = r(desc);
        const rr = r(resolved);

        return {
          labelVisible: Boolean(toolbarStrong && toolbarStrong.textContent.trim() === '희망지역' && window.getComputedStyle(toolbar).display !== 'none'),
          labelFontSize: toolbarStrong ? window.getComputedStyle(toolbarStrong).fontSize : null,
          labelFontWeight: toolbarStrong ? window.getComputedStyle(toolbarStrong).fontWeight : null,
          slotBottomToBudgetTop: sr && br ? Math.round((br.top - sr.bottom) * 10) / 10 : null,
          hintBottomToChipTop: hr && cr ? Math.round((cr.top - hr.bottom) * 10) / 10 : null,
          chipBottomToZipRowTop: cr && zr ? Math.round((zr.top - cr.bottom) * 10) / 10 : null,
          zipRowBottomToDescTop: zr && dr ? Math.round((dr.top - zr.bottom) * 10) / 10 : null,
          descBottomToResolvedTop: dr && rr ? Math.round((rr.top - dr.bottom) * 10) / 10 : null,
        };
      });

      console.log('    공부방형 측정 결과:', roomMetrics);
      const roomChecks = [
        { name: '희망지역 라벨 노출(14px/600)', ok: roomMetrics.labelVisible && roomMetrics.labelFontSize === '14px' && (roomMetrics.labelFontWeight === '600' || roomMetrics.labelFontWeight === 'bold') },
        { name: '희망지역 묶음 아래 → 예산 라벨 위 (24±1px)', ok: roomMetrics.slotBottomToBudgetTop !== null && Math.abs(roomMetrics.slotBottomToBudgetTop - 24) <= 1.0, val: roomMetrics.slotBottomToBudgetTop },
        { name: '도움말 → 칩 (8±1px)', ok: roomMetrics.hintBottomToChipTop !== null && Math.abs(roomMetrics.hintBottomToChipTop - 8) <= 1.0, val: roomMetrics.hintBottomToChipTop },
        { name: '칩 → 주소줄 (8±1px)', ok: roomMetrics.chipBottomToZipRowTop !== null && Math.abs(roomMetrics.chipBottomToZipRowTop - 8) <= 1.0, val: roomMetrics.chipBottomToZipRowTop },
        { name: '주소줄 → 설명 (8±1px)', ok: roomMetrics.zipRowBottomToDescTop !== null && Math.abs(roomMetrics.zipRowBottomToDescTop - 8) <= 1.0, val: roomMetrics.zipRowBottomToDescTop },
        { name: '설명 → 결과 줄 (8±1px)', ok: roomMetrics.descBottomToResolvedTop !== null && Math.abs(roomMetrics.descBottomToResolvedTop - 8) <= 1.0, val: roomMetrics.descBottomToResolvedTop },
      ];

      for (const chk of roomChecks) {
        console.log(`    [공부방] ${chk.name}: ${chk.val !== undefined ? `${chk.val}px ` : ''}(${chk.ok ? 'PASS' : 'FAIL'})`);
        if (!chk.ok) allPassed = false;
      }

      // 과외형 희망지역 검사
      console.log(`  [희망지역 검증 - 과외형]`);
      await updateStudent(1, {
        preferred_lesson_type: 'tutor',
        preferred_tutor_region_id: '117',
      });
      const tutorBody = renderMypageScreen(tab.path);
      const tutorShell = renderMypageShell(tab.path, tutorBody);
      await page.setContent(wrapPage('기본정보(과외형)', tutorShell), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);

      const tutorMetrics = await page.evaluate(() => {
        const slot = document.querySelector('[data-p19-hope-panel="tutor"] [data-p19-tutor-region-slot]');
        const budgetLabel = document.querySelector('[data-p19-hope-panel="tutor"] label .p19-field__label');
        const hopeLabel = document.querySelector('[data-p19-hope-panel="tutor"] .p19-field__label');
        const firstSubGroup = document.querySelector('[data-region-cascade] .form-group');
        const firstSubLabel = firstSubGroup ? firstSubGroup.querySelector('.form-label') : null;
        const firstSelect = firstSubGroup ? firstSubGroup.querySelector('select') : null;
        const cityWrap = document.querySelector('[data-city-wrap]');
        const cityLabel = cityWrap ? cityWrap.querySelector('.form-label') : null;
        const guWrap = document.querySelector('[data-gu-wrap]');

        const r = (el) => el ? el.getBoundingClientRect() : null;
        const sr = r(slot);
        const br = r(budgetLabel);
        const hlr = r(hopeLabel);
        const fslr = r(firstSubLabel);
        const fsr = r(firstSelect);
        const clr = r(cityLabel);

        const subLabelStyle = firstSubLabel ? window.getComputedStyle(firstSubLabel) : null;
        const guWrapStyle = guWrap ? window.getComputedStyle(guWrap) : null;

        return {
          slotBottomToBudgetTop: sr && br ? Math.round((br.top - sr.bottom) * 10) / 10 : null,
          hopeLabelBottomToFirstSubLabelTop: hlr && fslr ? Math.round((fslr.top - hlr.bottom) * 10) / 10 : null,
          subLabelBottomToSelectTop: fslr && fsr ? Math.round((fsr.top - fslr.bottom) * 10) / 10 : null,
          subGroupsGap: fsr && clr ? Math.round((clr.top - fsr.bottom) * 10) / 10 : null,
          subLabelFontSize: subLabelStyle ? subLabelStyle.fontSize : null,
          subLabelFontWeight: subLabelStyle ? subLabelStyle.fontWeight : null,
          subLabelColor: subLabelStyle ? subLabelStyle.color : null,
          guWrapHidden: guWrapStyle ? guWrapStyle.display === 'none' : false,
        };
      });

      console.log('    과외형 측정 결과:', tutorMetrics);
      const tutorChecks = [
        { name: '희망지역 묶음 아래 → 예산 라벨 위 (24±1px)', ok: tutorMetrics.slotBottomToBudgetTop !== null && Math.abs(tutorMetrics.slotBottomToBudgetTop - 24) <= 1.0, val: tutorMetrics.slotBottomToBudgetTop },
        { name: '희망지역 라벨 → 첫 하위 라벨 (8±1px)', ok: tutorMetrics.hopeLabelBottomToFirstSubLabelTop !== null && Math.abs(tutorMetrics.hopeLabelBottomToFirstSubLabelTop - 8) <= 1.0, val: tutorMetrics.hopeLabelBottomToFirstSubLabelTop },
        { name: '하위 라벨 → 선택칸 (8±1px)', ok: tutorMetrics.subLabelBottomToSelectTop !== null && Math.abs(tutorMetrics.subLabelBottomToSelectTop - 8) <= 1.0, val: tutorMetrics.subLabelBottomToSelectTop },
        { name: '하위 칸 묶음 사이 (16±1px)', ok: tutorMetrics.subGroupsGap !== null && Math.abs(tutorMetrics.subGroupsGap - 16) <= 1.0, val: tutorMetrics.subGroupsGap },
        { name: '하위 라벨 12px/600/#4B5563', ok: tutorMetrics.subLabelFontSize === '12px' && (tutorMetrics.subLabelFontWeight === '600' || tutorMetrics.subLabelFontWeight === 'bold') && (tutorMetrics.subLabelColor === 'rgb(75, 85, 99)' || tutorMetrics.subLabelColor === '#4b5563') },
        { name: 'hidden 묶음(data-gu-wrap) 미노출', ok: tutorMetrics.guWrapHidden },
      ];

      for (const chk of tutorChecks) {
        console.log(`    [과외] ${chk.name}: ${chk.val !== undefined ? `${chk.val}px ` : ''}(${chk.ok ? 'PASS' : 'FAIL'})`);
        if (!chk.ok) allPassed = false;
      }

      // 학생 1 복구 (공부방형)
      await updateStudent(1, {
        preferred_lesson_type: 'study_room',
        preferred_studyroom_region_id: '9101',
      });
    }

    // 3. 폰트 크기 샘플 검사
    const fontSizes = await page.evaluate(() => {
      const elements = document.querySelectorAll('.mypage-content *');
      const sizes = new Set();
      for (const el of elements) {
        if (!el.textContent.trim()) continue;
        const fs = Math.round(parseFloat(window.getComputedStyle(el).fontSize));
        sizes.add(fs);
      }
      return Array.from(sizes).sort((a, b) => a - b);
    });

    const disallowed = fontSizes.filter((s) => !ALLOWED_FONT_SIZES.has(s));
    if (disallowed.length === 0) {
      console.log(`  PASS: 모든 폰트 크기가 {12, 14, 16, 18, 22, 28} 만족 (${fontSizes.join(', ')})`);
    } else {
      console.log(`  WARNING: 허용 외 폰트: ${disallowed.join(', ')}px (전체: ${fontSizes.join(', ')})`);
    }
  }

  await page.close();
}

await browser.close();

console.log(`\n========================================`);
if (allPassed) {
  console.log('✅ 모든 정렬 검증 (PC & 모바일) PASS!');
} else {
  console.log('❌ 일부 정렬 검증 실패!');
  process.exit(1);
}
