/**
 * 관리자 미연동 17화면 미리보기 표시.
 * 17개 PASS · 실도구 접두/안내 0 · 문구는 a28-copy.js 한곳.
 *
 * 실행: npx vite-node scripts/verify-admin-preview-labels.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  A28_MENU,
  ADMIN_PREVIEW_NOTICE,
  ADMIN_PREVIEW_PATHS,
  ADMIN_PREVIEW_PREFIX,
  ADMIN_PREVIEW_SMS_EXTRA,
  adminPreviewNoticeText,
  flattenAdminNav,
  isAdminNotifyPreviewPath,
  isAdminPreviewPath,
  withAdminPreviewLabel,
} from '../preview/home-ui/src/admin/a28-copy.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(root, 'preview', 'home-ui', 'src');

const PANEL_BASE = {
  '/admin/market/overview': '마켓 현황',
  '/admin/market/listings': '공부방·과외 목록',
  '/admin/market/stats': '매출·순위',
  '/admin/market/reviews': '이용 후기',
  '/admin/market/incomplete': '미완료 결제',
  '/admin/notify/settings': '문자 기본설정',
  '/admin/notify/sync': '회원번호 동기화',
  '/admin/notify/templates': '문구 템플릿',
  '/admin/notify/phones': '수신번호 관리',
  '/admin/notify/send': '문자 보내기',
  '/admin/notify/logs': '전송내역(건별)',
  '/admin/notify/logs-phone': '전송내역(번호별)',
  '/admin/addons': '부가서비스',
  '/admin/addons/pg': '카드·전자결제',
  '/admin/addons/sms': '문자·메시징',
  '/admin/addons/identity': '본인인증',
  '/admin/promo': '홍보 런치 데스크',
};

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
  if (!globalThis.window.location) globalThis.window.location = loc;
  if (!globalThis.location) globalThis.location = globalThis.window.location;
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

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(js|mjs|css)$/.test(name)) out.push(p);
  }
  return out;
}

function panelTitle(html) {
  const m = String(html).match(/<h2 class="sup-panel-card__title">([^<]+)/);
  return m ? m[1].trim() : '';
}

function hubCardSpecs() {
  const cards = [];
  for (const g of A28_MENU) {
    if (g.id === 'hub') continue;
    if (g.children?.length) cards.push({ label: g.label, path: g.children[0].path });
    else if (g.path) cards.push({ label: g.label, path: g.path });
  }
  return cards;
}

installShim();
const { renderA28Screen } = await import('../preview/home-ui/src/admin/a28-screens.js');

const leaves = flattenAdminNav();
const leafByPath = new Map(leaves.map((item) => [item.path, item]));
const previewPaths = [...ADMIN_PREVIEW_PATHS];
const realLeaves = leaves.filter((item) => !isAdminPreviewPath(item.path));

ok('preview-count-17', previewPaths.length === 17, `count=${previewPaths.length}`);
ok('preview-paths-unique', new Set(previewPaths).size === 17);

for (const path of previewPaths) {
  const leaf = leafByPath.get(path);
  ok(`preview-menu ${path}`, Boolean(leaf) && withAdminPreviewLabel(path, leaf.label) === `${ADMIN_PREVIEW_PREFIX}${leaf.label}` && !String(leaf.label).startsWith(ADMIN_PREVIEW_PREFIX));
  ok(`preview-stored-label ${path}`, Boolean(leaf) && !String(leaf.label).includes(ADMIN_PREVIEW_PREFIX));
}

for (const g of A28_MENU) {
  if (!g.children?.length) continue;
  ok(`group-label ${g.id}`, !String(g.label).startsWith(ADMIN_PREVIEW_PREFIX), g.label);
}

let previewPass = 0;
for (const path of previewPaths) {
  const base = PANEL_BASE[path];
  const html = renderA28Screen(path);
  const title = panelTitle(html);
  const noticeHits = html.split(ADMIN_PREVIEW_NOTICE).length - 1;
  const extraHits = html.split(ADMIN_PREVIEW_SMS_EXTRA).length - 1;
  const wantExtra = isAdminNotifyPreviewPath(path);
  const titleOk = title === `${ADMIN_PREVIEW_PREFIX}${base}`;
  const noticeOk = noticeHits === 1 && html.includes('a28-preview-notice') && adminPreviewNoticeText(path).length > 0;
  const extraOk = wantExtra ? extraHits === 1 : extraHits === 0;
  ok(`preview-title ${path}`, titleOk, title);
  ok(`preview-notice ${path}`, noticeOk, `hits=${noticeHits}`);
  ok(`preview-sms-extra ${path}`, extraOk, `hits=${extraHits} want=${wantExtra ? 1 : 0}`);
  if (titleOk && noticeOk && extraOk) previewPass += 1;
}
ok('preview-screens-17', previewPass === 17, `pass=${previewPass}`);

ok(
  'stats-body-kept',
  renderA28Screen('/admin/market/stats').includes('미리보기용 예시 숫자입니다.'),
);
ok(
  'send-body-kept',
  renderA28Screen('/admin/notify/send').includes('실제로 문자를 보내지 않습니다.'),
);

let realPrefixHits = 0;
for (const leaf of realLeaves) {
  const shown = withAdminPreviewLabel(leaf.path, leaf.label);
  const menuOk = shown === leaf.label && !shown.includes(ADMIN_PREVIEW_PREFIX);
  ok(`real-menu ${leaf.path}`, menuOk, shown);
  const html = renderA28Screen(leaf.path);
  const title = panelTitle(html);
  const titleOk = !title.startsWith(ADMIN_PREVIEW_PREFIX) && !title.includes(ADMIN_PREVIEW_PREFIX);
  const noticeOk = !html.includes(ADMIN_PREVIEW_NOTICE) && !html.includes('a28-preview-notice');
  const bodyPrefixOk = leaf.path === '/admin' ? true : !html.includes(ADMIN_PREVIEW_PREFIX);
  ok(`real-title ${leaf.path}`, titleOk, title);
  ok(`real-notice ${leaf.path}`, noticeOk);
  ok(`real-body ${leaf.path}`, bodyPrefixOk);
  if (!menuOk || !titleOk || !noticeOk || !bodyPrefixOk) realPrefixHits += 1;
}
ok('real-tools-0', realPrefixHits === 0, `hits=${realPrefixHits}`);

const hubHtml = renderA28Screen('/admin');
ok('hub-title', panelTitle(hubHtml) === '운영 홈', panelTitle(hubHtml));
ok('hub-notice-0', !hubHtml.includes(ADMIN_PREVIEW_NOTICE));
ok('hub-desk-link', hubHtml.includes(`${ADMIN_PREVIEW_PREFIX}데스크 →`));

for (const card of hubCardSpecs()) {
  const shown = withAdminPreviewLabel(card.path, card.label);
  if (isAdminPreviewPath(card.path)) {
    ok(`hub-card ${card.path}`, shown === `${ADMIN_PREVIEW_PREFIX}${card.label}`, shown);
  } else {
    ok(`hub-card-real ${card.path}`, shown === card.label && !shown.includes(ADMIN_PREVIEW_PREFIX), shown);
  }
}

const quotedPrefix = `'${ADMIN_PREVIEW_PREFIX}'`;
const quotedHits = [];
const sentenceHits = [];
const adminPrefixHits = [];
for (const file of walk(srcRoot)) {
  const text = readFileSync(file, 'utf8');
  const rel = relative(root, file).replaceAll('\\', '/');
  if (text.includes(quotedPrefix) || text.includes(`"${ADMIN_PREVIEW_PREFIX}"`)) quotedHits.push(rel);
  if (text.includes(ADMIN_PREVIEW_NOTICE) || text.includes(ADMIN_PREVIEW_SMS_EXTRA)) sentenceHits.push(rel);
}
for (const file of walk(join(srcRoot, 'admin'))) {
  const text = readFileSync(file, 'utf8');
  if (!text.includes(ADMIN_PREVIEW_PREFIX)) continue;
  adminPrefixHits.push(relative(root, file).replaceAll('\\', '/'));
}
const copyRel = 'preview/home-ui/src/admin/a28-copy.js';
ok(
  'copy-single-source',
  quotedHits.length === 1 &&
    quotedHits[0] === copyRel &&
    sentenceHits.length === 1 &&
    sentenceHits[0] === copyRel &&
    adminPrefixHits.length === 1 &&
    adminPrefixHits[0] === copyRel,
  `quoted=${quotedHits.join(', ') || 'none'} sentence=${sentenceHits.join(', ') || 'none'} admin=${adminPrefixHits.join(', ') || 'none'}`,
);

const shellSrc = readFileSync(join(srcRoot, 'admin', 'shell.js'), 'utf8');
const screenSrc = readFileSync(join(srcRoot, 'admin', 'a28-screens.js'), 'utf8');
const sharedSrc = readFileSync(join(srcRoot, 'admin', 'a28-screens-shared.js'), 'utf8');
const labsSrc = readFileSync(join(srcRoot, 'admin', 'a28-screens-labs.js'), 'utf8');
ok('shell-uses-helper', shellSrc.includes('withAdminPreviewLabel(c.path, c.label)'));
ok('shell-group-raw', shellSrc.includes('${esc(group.label)}'));
ok('hub-uses-helper', screenSrc.includes('withAdminPreviewLabel(kids[0].path, g.label)'));
ok('panel-uses-helper', sharedSrc.includes('withAdminPreviewLabel(adminPanelPath, title)'));
ok('notice-render-once', (sharedSrc.match(/function renderAdminPreviewNotice/g) || []).length === 1);
ok('screen-sets-path', screenSrc.includes('setAdminPanelPath(path)'));
ok('labs-no-prefix-literal', !labsSrc.includes(ADMIN_PREVIEW_PREFIX));
ok('screens-no-prefix-literal', !screenSrc.includes(ADMIN_PREVIEW_PREFIX));

const css = readFileSync(join(srcRoot, 'styles', 'home-admin.css'), 'utf8');
const noticeCss = css.match(/\.a28-preview-notice\s*\{[^}]+\}/);
const previewLinkCss = css.match(/\.admin-sidebar__sublink--preview\s*\{[^}]+\}/);
ok('notice-css', Boolean(noticeCss) && noticeCss[0].includes('var(--gray-600)') && !/#(b91c1c|991b1b|dc2626|ef4444)|red/i.test(noticeCss[0]));
ok('menu-gray-token', Boolean(previewLinkCss) && previewLinkCss[0].includes('var(--gray-400)'));

console.log(`\n${fail === 0 ? 'OK' : 'FAIL'}  pass=${pass} fail=${fail} previewScreens=${previewPass} realHits=${realPrefixHits}`);
process.exit(fail === 0 ? 0 : 1);
