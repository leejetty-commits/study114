/**
 * 관리자-159 오늘 할 일 허브 · 화면 라벨.
 * 실행: npx vite-node scripts/verify-admin-today-hub.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ADMIN_PREVIEW_NOTICE,
  ADMIN_TODAY_CARDS,
  ADMIN_TODAY_NOTE,
  A28_MEMBER_ROLE_LABELS,
} from '../preview/home-ui/src/admin/a28-copy.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(root, 'preview', 'home-ui', 'src');

let pass = 0;
let fail = 0;

function ok(name, cond, detail = '') {
  if (cond) {
    pass += 1;
    console.log(`PASS  ${name}`);
  } else {
    fail += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function installShim() {
  const memStore = () => {
    const mem = new Map();
    return {
      getItem: (k) => (mem.has(String(k)) ? mem.get(String(k)) : null),
      setItem: (k, v) => {
        mem.set(String(k), String(v));
      },
      removeItem: (k) => {
        mem.delete(String(k));
      },
      clear: () => {
        mem.clear();
      },
      key: (i) => [...mem.keys()][i] ?? null,
      get length() {
        return mem.size;
      },
    };
  };
  if (typeof globalThis.localStorage === 'undefined') globalThis.localStorage = memStore();
  if (typeof globalThis.sessionStorage === 'undefined') globalThis.sessionStorage = memStore();
  const loc = {
    hash: '#/admin',
    origin: 'http://127.0.0.1:5174',
    href: 'http://127.0.0.1:5174/#/admin',
    pathname: '/',
    search: '',
    host: '127.0.0.1:5174',
    protocol: 'http:',
  };
  if (typeof globalThis.window === 'undefined') globalThis.window = globalThis;
  loc.replace = () => {};
  if (!globalThis.window.location) globalThis.window.location = loc;
  if (!globalThis.location) globalThis.location = globalThis.window.location;
  if (typeof globalThis.window.dispatchEvent !== 'function') globalThis.window.dispatchEvent = () => true;
  if (typeof globalThis.CustomEvent === 'undefined') {
    globalThis.CustomEvent = class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    };
  }
  if (typeof globalThis.document === 'undefined') {
    const el = () => ({
      style: {},
      classList: { add() {}, remove() {}, toggle() {} },
      setAttribute() {},
      appendChild() {},
      addEventListener() {},
      removeEventListener() {},
      querySelector: () => null,
      querySelectorAll: () => [],
    });
    globalThis.document = {
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener() {},
      removeEventListener() {},
      createElement: el,
      documentElement: el(),
      body: el(),
      head: el(),
    };
  }
  if (typeof globalThis.navigator === 'undefined') globalThis.navigator = { userAgent: 'node' };
}

installShim();
let sessionLevel = 'super_admin';
globalThis.fetch = async (url) => {
  const u = String(url);
  if (u.includes('/api/auth/me.php')) {
    return {
      ok: true,
      json: async () => ({
        ok: true,
        authenticated: true,
        email_verified: true,
        user_id: sessionLevel === 'sub_master' ? 2 : 1,
        email: sessionLevel === 'sub_master' ? 'ops@example.com' : 'admin@example.com',
        role_type: 'admin',
        name: sessionLevel === 'sub_master' ? '부마스터' : '최고관리자',
        admin_level: sessionLevel,
        must_change_password: false,
        oauth_role_pending: false,
      }),
    };
  }
  return {
    ok: true,
    json: async () => ({ ok: true, settings: {}, logs: [] }),
  };
};
const { renderA28Screen } = await import('../preview/home-ui/src/admin/a28-screens.js');
const { ensureAdminSettings } = await import('../preview/home-ui/src/admin/site-settings-store.js');
const { initAuthSession } = await import('../preview/home-ui/src/auth-session.js');
await ensureAdminSettings();
await initAuthSession();
const { a28Ui } = await import('../preview/home-ui/src/admin/a28-screens-state.js');

a28Ui.todaySlot = null;
a28Ui.todayInquiryTab = 'tickets';
globalThis.location.hash = '#/admin';

const hub = renderA28Screen('/admin');
const titles = ADMIN_TODAY_CARDS.map((card) => card.title);
const descs = ADMIN_TODAY_CARDS.map((card) => card.desc);
let cursor = 0;
titles.forEach((title, index) => {
  const titleHtml = `<span class="a28-today__card-title">${title}</span>`;
  const descHtml = `<span class="a28-today__card-desc">${descs[index]}</span>`;
  const titleAt = hub.indexOf(titleHtml, cursor);
  const descAt = titleAt >= 0 ? hub.indexOf(descHtml, titleAt) : -1;
  ok(`card-order-${index + 1}`, titleAt >= 0 && descAt > titleAt, `${title} @${titleAt}`);
  ok(`card-once-${index + 1}`, hub.split(titleHtml).length - 1 === 1 && hub.split(descHtml).length - 1 === 1);
  if (descAt >= 0) cursor = descAt + descHtml.length;
});
const noteAt = hub.indexOf(ADMIN_TODAY_NOTE);
ok('note-once', noteAt > cursor && hub.split(ADMIN_TODAY_NOTE).length - 1 === 1, `note@${noteAt} cursor=${cursor}`);
ok('note-after-cards', noteAt > cursor);
ok('hub-no-preview-notice', !hub.includes(ADMIN_PREVIEW_NOTICE));
ok('hub-legacy-allowed', hub.includes('할 수 있는 일') && hub.indexOf('할 수 있는 일') > noteAt);
ok('hub-legacy-forbidden', hub.includes('하지 않는 일'));
ok('hub-title', hub.includes('운영 홈'));

sessionLevel = 'sub_master';
await initAuthSession();
a28Ui.todaySlot = null;
const subHub = renderA28Screen('/admin');
ok('sub-master-no-popup-card', !subHub.includes('홈 팝업') && subHub.includes('회원 정리') && subHub.includes('문의·신고'));
ok('sub-master-three', (subHub.match(/data-today-card="/g) || []).length === 3);

sessionLevel = 'super_admin';
await initAuthSession();
a28Ui.todaySlot = null;
const superHub = renderA28Screen('/admin');
ok('super-four', (superHub.match(/data-today-card="/g) || []).length === 4 && superHub.includes('홈 팝업'));
a28Ui.todaySlot = null;

const members = renderA28Screen('/admin/members').replaceAll('김학부모', '');
ok('members-no-hakbumo', !members.includes('학부모'));
ok('members-role-student', A28_MEMBER_ROLE_LABELS.guardian_student === '학생');
ok('members-option-value', renderA28Screen('/admin/members').includes('value="guardian_student"'));

const joinHtml = renderA28Screen('/admin/settings/join');
ok('join-no-hakbumo', !joinHtml.includes('학부모'));
ok('join-student-label', joinHtml.includes('자녀 정보(학생)') && joinHtml.includes('>학생<'));

const channels = renderA28Screen('/admin/notices/channels');
const roleBox = channels.slice(channels.indexOf('data-allowed-roles'), channels.indexOf('data-allowed-roles') + 800);
ok('channels-role-no-hakbumo', roleBox.includes('data-allowed-role="guardian_student"') && !roleBox.includes('학부모') && roleBox.includes('학생'));
ok('channels-keeps-role-value', channels.includes('data-allowed-role="guardian_student"'));

const promo = renderA28Screen('/admin/promo');
ok('promo-audience-mapped', promo.includes('학생 · 원장') && !promo.includes('학부모 · 원장') && !promo.includes('학생 · 학부모(보조)'));

const copySrc = readFileSync(join(srcRoot, 'admin', 'a28-copy.js'), 'utf8');
const settingsSrc = readFileSync(join(srcRoot, 'admin', 'site-settings-store.js'), 'utf8');
const channelSrc = readFileSync(join(srcRoot, 'board-channel-store.js'), 'utf8');
ok('key-copy', copySrc.includes('guardian_student:'));
ok('key-settings', settingsSrc.includes("id: 'guardian_student'"));
ok('key-channel-store', channelSrc.includes("id: 'guardian_student'"));

const hubSrc = readFileSync(join(srcRoot, 'admin', 'a28-today-hub.js'), 'utf8');
const bindSrc = readFileSync(join(srcRoot, 'admin', 'a28-screens-bind.js'), 'utf8');
ok('hub-no-hash-write', !hubSrc.includes('location.hash ='));
ok('hub-uses-path-guard', hubSrc.includes('canAccessAdminPath('));
ok('hub-no-home-popup-attr', !hubSrc.includes('data-home-popup'));
ok('hub-no-level-backdoor', !hubSrc.includes('__A28_TODAY_LEVEL__') && !hubSrc.includes('getCurrentAdminLevel'));
ok('hub-no-seal', !hubSrc.includes('seal'));
ok('bind-no-seal', !bindSrc.includes('sealExposureHostLoad') && !bindSrc.includes('sealExposure'));

a28Ui.todaySlot = 'popups';
const popupHub = renderA28Screen('/admin');
const aside = popupHub.match(/<aside\b[^>]*>/);
ok('popup-root-no-data-home-popup', Boolean(aside) && !/\sdata-home-popup(?:[\s=]|>)/.test(aside[0]), aside ? aside[0] : 'no aside');
ok('popup-root-no-rail', !popupHub.includes('rail-popup') && !popupHub.includes('class="home-popup"'));
a28Ui.todaySlot = null;

const css = readFileSync(join(srcRoot, 'styles', 'home-admin.css'), 'utf8');
const marker = '/* admin-159 today hub */';
const at = css.indexOf(marker);
ok('css-marker', at > 0 && css.indexOf(marker, at + marker.length) === -1);
const added = at >= 0 ? css.slice(at + marker.length) : '';
const selectors = [...added.matchAll(/([^{}]+)\{/g)].map((m) => m[1].trim()).filter(Boolean);
const mediaHeads = selectors.filter((sel) => /^@media\b/.test(sel));
const rules = selectors.filter((sel) => !/^@media\b/.test(sel));
ok('css-rules-present', rules.length >= 8, `n=${rules.length}`);
rules.forEach((sel, index) => {
  ok(`css-admin-shell-${index + 1}`, sel.startsWith('.admin-shell'), sel);
});
ok('css-no-if', (added.match(/if\(/g) || []).length === 0);
ok(
  'css-media-640',
  mediaHeads.length === 1 && /^\s*@media\s+\(\s*max-width:\s*640px\s*\)\s*$/.test(mediaHeads[0]),
  mediaHeads.join(' | ') || 'none',
);

console.log(`\n${fail === 0 ? 'OK' : 'FAIL'}  pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
