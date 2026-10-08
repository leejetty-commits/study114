/**
 * 글자 크기 집합 {12, 14, 16, 18, 22, 28} 만족 여부 및
 * 내 공지 / 탭 바 / 카드의 오른쪽 끝 정렬(±1px) 측정
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
  'preview/home-ui/src/styles/design-system.css',
  'preview/home-ui/src/styles/home-listings.css',
  'preview/home-ui/src/styles/product-chrome.css',
  'preview/home-ui/src/styles/mypage-ops.css',
  'preview/home-ui/src/styles/registration-check.css',
  'preview/home-ui/src/styles/home-card-samples.css',
  'preview/shared/register-form-primitives.css',
  'preview/shared/register-flow.css',
  'preview/study-room-ui/src/styles/register.css',
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
  return { ok: true, json: async () => ({ ok: true, data: [] }) };
};

const { initAuthSession } = await import('../preview/home-ui/src/auth-session.js');
const { ensureStudentStore } = await import('../preview/home-ui/src/student-reg/store.js');
const { deactivateRegistrationsApi } = await import('../preview/home-ui/src/registrations-backend.js');
const { activateBoardApi, hydrateNoticeHome } = await import('../preview/home-ui/src/board/board-backend.js');
const { renderMypageShell } = await import('../preview/home-ui/src/mypage/shell.js');
const { renderMypageScreen } = await import('../preview/home-ui/src/mypage/screens.js');
const { setActiveRole } = await import('../preview/home-ui/src/state.js');

await initAuthSession(false);
setActiveRole('parent');
deactivateRegistrationsApi();
ensureStudentStore();
await activateBoardApi({ navRole: 'parent' });
await hydrateNoticeHome();

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
const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } });

const TABS = [
  { name: '마이프로필', path: '/mypage/registrations/students/1' },
  { name: '기본정보', path: '/mypage/registrations/students/1/basic' },
  { name: '상세정보', path: '/mypage/registrations/students/1/detail' },
  { name: '쪽지설정', path: '/mypage/registrations/students/1/settings' },
];

const ALLOWED_FONT_SIZES = new Set([12, 14, 16, 18, 22, 28]);

for (const tab of TABS) {
  console.log(`\n=== Checking ${tab.name} (${tab.path}) ===`);
  loc.hash = `#${tab.path}`;
  const body = renderMypageScreen(tab.path);
  const shell = renderMypageShell(tab.path, body);
  await page.setContent(wrapPage(tab.name, shell), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  // 1. 오른쪽 끝 정렬 (내 공지, 탭 바, 카드)
  const rightBounds = await page.evaluate(() => {
    const notice = document.querySelector('.mypage-notice');
    const tabs = document.querySelector('.mp-room__tabs');
    const cards = Array.from(document.querySelectorAll('.p21-profile__card, .student-form-card, .student-detail-section, .p21-inq-card'));
    const content = document.querySelector('.mypage-content');

    const getRight = (el) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return Math.round(rect.right * 10) / 10;
    };

    return {
      contentRight: getRight(content),
      noticeRight: getRight(notice),
      tabsRight: getRight(tabs),
      cardRights: cards.map(getRight),
    };
  });

  console.log('Right bounds:', rightBounds);
  if (rightBounds.noticeRight && rightBounds.tabsRight) {
    const diff = Math.abs(rightBounds.noticeRight - rightBounds.tabsRight);
    console.log(`  내 공지 ↔ 탭 바 차이: ${diff}px (기준: <= 1px)`);
  }
  if (rightBounds.tabsRight && rightBounds.cardRights.length) {
    for (let i = 0; i < rightBounds.cardRights.length; i++) {
      const diff = Math.abs(rightBounds.tabsRight - rightBounds.cardRights[i]);
      console.log(`  탭 바 ↔ 카드[${i}] 차이: ${diff}px (기준: <= 1px)`);
    }
  }

  // 2. 학생 마이페이지 영역 내 폰트 크기 샘플 검사
  const fontSizes = await page.evaluate(() => {
    const elements = document.querySelectorAll('.mypage-content *');
    const sizes = new Set();
    const oddElements = [];
    for (const el of elements) {
      if (!el.textContent.trim()) continue;
      const fs = Math.round(parseFloat(window.getComputedStyle(el).fontSize));
      sizes.add(fs);
      if (fs === 13 || fs === 19) {
        oddElements.push({ tag: el.tagName, cls: el.className, fs, text: el.textContent.trim().slice(0, 30) });
      }
    }
    return { sizes: Array.from(sizes).sort((a, b) => a - b), oddElements };
  });

  console.log('Font sizes in content:', fontSizes.sizes);
  if (fontSizes.oddElements.length) {
    console.log('  Odd elements:', fontSizes.oddElements);
  }
  const disallowed = fontSizes.sizes.filter((s) => !ALLOWED_FONT_SIZES.has(s));
  if (disallowed.length === 0) {
    console.log('  PASS: 모든 폰트 크기가 {12, 14, 16, 18, 22, 28} 집합을 만족함.');
  } else {
    console.log(`  WARNING: 허용 집합 외 폰트 크기 발견: ${disallowed.join(', ')}px`);
  }
}

await browser.close();
