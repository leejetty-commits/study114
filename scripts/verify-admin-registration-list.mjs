/**
 * 관리자-159-c 등록 목록 화면·메뉴·범위.
 * 실행: npx vite-node scripts/verify-admin-registration-list.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(root, 'preview', 'home-ui', 'src');

const ALLOWED = new Set([
  'preview/home-ui/src/admin/a28-copy.js',
  'preview/home-ui/src/admin/a28-screens.js',
  'preview/home-ui/src/admin/a28-screens-bind.js',
  'preview/home-ui/src/admin/a28-registration-list.js',
  'preview/home-ui/src/admin/registration-list-api.js',
  'preview/home-ui/src/admin/a28-registration-list-copy.js',
  'preview/home-ui/src/styles/home-admin.css',
  'public/api/admin/registrations.php',
  'src/Admin/AdminRegistrationListRepository.php',
  'src/Registration/BasicCardRegisteredQuery.php',
  'src/Report/ReportPeriod.php',
  'scripts/verify-admin-registration-list.mjs',
  'scripts/verify-admin-registration-list.php',
]);

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
    hash: '#/admin/registrations',
    origin: 'http://127.0.0.1:5174',
    href: 'http://127.0.0.1:5174/#/admin/registrations',
    pathname: '/',
    search: '',
    host: '127.0.0.1:5174',
    protocol: 'http:',
    replace() {},
  };
  if (typeof globalThis.window === 'undefined') globalThis.window = globalThis;
  if (!globalThis.window.location) globalThis.window.location = loc;
  if (!globalThis.location) globalThis.location = globalThis.window.location;
  if (typeof globalThis.window.dispatchEvent !== 'function') globalThis.window.dispatchEvent = () => true;
  if (typeof globalThis.window.addEventListener !== 'function') globalThis.window.addEventListener = () => {};
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

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' });
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
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
  return { ok: true, json: async () => ({ ok: true, items: [], total: 0 }) };
};

const {
  A28_MENU,
  ADMIN_PREVIEW_PATHS,
  ADMIN_TODAY_CARDS,
  flattenAdminNav,
} = await import('../preview/home-ui/src/admin/a28-copy.js');
const { canAccessAdminPath } = await import('../preview/home-ui/src/admin/admin-guard.js');
const { initAuthSession } = await import('../preview/home-ui/src/auth-session.js');
const { renderA28Screen } = await import('../preview/home-ui/src/admin/a28-screens.js');
const { a28Ui } = await import('../preview/home-ui/src/admin/a28-screens-state.js');

const leaves = flattenAdminNav().filter((item) => item.path === '/admin/registrations');
ok('nav-one', leaves.length === 1, `n=${leaves.length}`);
ok('nav-label', leaves[0]?.label === '등록 목록', String(leaves[0]?.label || ''));
ok('nav-screen', leaves[0]?.screenId === 'A28-159c');
ok('nav-menu-id', leaves[0]?.menuId === 'registrations');

const membersGroup = A28_MENU.find((group) => group.id === 'grp-members');
const childLabels = (membersGroup?.children || []).map((child) => child.label);
ok('group-order', childLabels[0] === '회원 목록' && childLabels[1] === '등록 목록', childLabels.join(','));
ok('not-in-preview', !ADMIN_PREVIEW_PATHS.includes('/admin/registrations'));
ok('preview-len-17', ADMIN_PREVIEW_PATHS.length === 17, `n=${ADMIN_PREVIEW_PATHS.length}`);
ok('today-cards-4', ADMIN_TODAY_CARDS.length === 4, `n=${ADMIN_TODAY_CARDS.length}`);
ok(
  'today-no-reg',
  !ADMIN_TODAY_CARDS.some((card) => card.path === '/admin/registrations' || String(card.title || '').includes('등록 목록')),
);

await initAuthSession();
ok('access-super', canAccessAdminPath('/admin/registrations') === true);
sessionLevel = 'sub_master';
await initAuthSession();
ok('access-sub', canAccessAdminPath('/admin/registrations') === true);
sessionLevel = 'super_admin';
await initAuthSession();

globalThis.location.hash = '#/admin/registrations';
const html = renderA28Screen('/admin/registrations');
const title = html.match(/<h2 class="sup-panel-card__title">([^<]+)/);
ok('title', title && title[1].trim() === '등록 목록', title ? title[1] : '');
ok('tab-room', html.includes('>공부방<'));
ok('tab-tutor', html.includes('>과외쌤<'));
ok('tab-student', html.includes('>학생<'));
ok('tab-count', (html.match(/data-reg-role="/g) || []).length === 3);
ok('col-name', html.includes('>이름<'));
ok('col-date', html.includes('>등록일<'));
ok('col-status', html.includes('>노출 상태<'));
ok('no-request', !html.includes('의뢰'));
ok('no-hakbumo', !html.includes('학부모'));
ok('no-board', !html.includes('보드'));
ok('no-preview-prefix', !html.includes('미리보기 ·'));

globalThis.location.hash = '#/admin/registrations?role=tutor';
const tutorHtml = renderA28Screen('/admin/registrations');
ok('tutor-region-word', tutorHtml.includes('과외지역') && !tutorHtml.includes('의뢰'));
globalThis.location.hash = '#/admin/registrations?role=student';
const studentHtml = renderA28Screen('/admin/registrations');
ok('student-region-word', studentHtml.includes('희망지역') && studentHtml.includes('>학생<'));
globalThis.location.hash = '#/admin';

const hub = renderA28Screen('/admin');
ok('hub-four', (hub.match(/data-today-card="/g) || []).length === 4);
ok('hub-no-reg-card', !hub.includes('등록 목록') && !hub.includes('/admin/registrations'));

a28Ui.openMemberId = 1;
const membersHtml = renderA28Screen('/admin/members');
ok('member-inquiry-kept', membersHtml.includes('운영문의'));
a28Ui.openMemberId = null;

const apiSrc = readFileSync(join(srcRoot, 'admin', 'registration-list-api.js'), 'utf8');
ok('api-get-1', (apiSrc.match(/method:\s*'GET'/g) || []).length === 1);
ok('api-no-post', !/method:\s*'POST'/.test(apiSrc));
ok('api-no-patch', !/method:\s*'PATCH'/.test(apiSrc));
ok('api-no-put', !/method:\s*'PUT'/.test(apiSrc));
ok('api-no-delete', !/method:\s*'DELETE'/.test(apiSrc));

const cssDiff = git(['diff', '-U0', '2723c5f', '--', 'preview/home-ui/src/styles/home-admin.css']);
const addedCss = cssDiff
  .split('\n')
  .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
  .map((line) => line.slice(1))
  .join('\n');
const addedSelectors = [...addedCss.matchAll(/([^{}]+)\{/g)].map((match) => match[1].trim());
ok('css-added-shell', addedSelectors.length > 0 && addedSelectors.every((sel) => sel.startsWith('.admin-shell')), addedSelectors.join(' | '));
ok('css-no-media', !addedCss.includes('@media'));

for (const file of [
  'preview/home-ui/src/admin/a28-copy.js',
  'preview/home-ui/src/admin/a28-screens.js',
  'preview/home-ui/src/admin/a28-screens-bind.js',
]) {
  const diff = git(['diff', '-U0', '2723c5f', '--', file]);
  const removed = diff.split('\n').filter((line) => line.startsWith('-') && !line.startsWith('---'));
  ok(`diff-no-delete ${file.split('/').pop()}`, removed.length === 0, removed.join('\n'));
}

const names = new Set(
  git(['diff', '--name-only', '2723c5f'])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean),
);
const untracked = git(['ls-files', '--others', '--exclude-standard'])
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);
for (const name of untracked) names.add(name);
const outside = [...names].filter((name) => !ALLOWED.has(name));
ok('diff-allowed', outside.length === 0, outside.join(','));
ok('diff-has-api', names.has('public/api/admin/registrations.php'));

const productFiles = [
  'preview/home-ui/src/admin/a28-registration-list.js',
  'preview/home-ui/src/admin/a28-registration-list-copy.js',
  'preview/home-ui/src/admin/registration-list-api.js',
  'preview/home-ui/src/admin/a28-copy.js',
  'public/api/admin/registrations.php',
  'src/Admin/AdminRegistrationListRepository.php',
  'src/Registration/BasicCardRegisteredQuery.php',
];
const joined = productFiles.map((file) => readFileSync(join(root, file), 'utf8')).join('\n');
ok('no-users-created', !joined.includes('users.created_at'));
ok('render-no-users-created', !html.includes('users.created_at') && !tutorHtml.includes('users.created_at'));
const phpJoined = [
  'public/api/admin/registrations.php',
  'src/Admin/AdminRegistrationListRepository.php',
  'src/Registration/BasicCardRegisteredQuery.php',
  'src/Report/ReportPeriod.php',
]
  .map((file) => stripComments(readFileSync(join(root, file), 'utf8')))
  .join('\n');
ok('no-date-fn', !phpJoined.includes('DATE('));
ok('no-week-range-call', !readFileSync(join(root, 'src/Admin/AdminRegistrationListRepository.php'), 'utf8').includes('weekRange'));
ok('copy-no-hakbumo', !readFileSync(join(srcRoot, 'admin', 'a28-registration-list-copy.js'), 'utf8').includes('학부모'));
ok('state-untouched', !names.has('preview/home-ui/src/admin/a28-screens-state.js'));

console.log(`\n${fail === 0 ? 'OK' : 'FAIL'}  pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
