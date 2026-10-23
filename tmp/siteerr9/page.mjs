/**
 * 사이트오류-9 — 페이지 1회 로드 흉내 (읽기 전용, 소스 수정 없음).
 * node tmp/siteerr9/page.mjs <lsFile> <page> [tabs...]
 *   page = home  : #/parent 첫 화면(공부방) → 과외쌤 → 학생 탭 순서로 렌더 (탭 전환 = resetParentFind)
 *   page = search: 같은 SPA 안에서 tabs 순서대로 찾기 화면 렌더 (탭 이동 = hash 변경, previewState 공유)
 * localStorage 는 lsFile(JSON) 에서 읽고 끝나면 다시 쓴다. 한 번 실행 = 브라우저 새로고침 1회.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [lsFile, page, ...tabs] = process.argv.slice(2);
const ROOT = path.resolve(import.meta.dirname, '../..');
const HOME_UI = path.join(ROOT, 'preview/home-ui');

class MemStorage {
  constructor(init = {}) { this.m = new Map(Object.entries(init)); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
  clear() { this.m.clear(); }
  key(i) { return [...this.m.keys()][i] ?? null; }
  get length() { return this.m.size; }
  toJSON() { return Object.fromEntries(this.m); }
}
const ls = new MemStorage(fs.existsSync(lsFile) ? JSON.parse(fs.readFileSync(lsFile, 'utf8') || '{}') : {});
Object.defineProperty(globalThis, 'localStorage', { value: ls, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: new MemStorage(), configurable: true });

const loc = {
  hash: '', pathname: '/', search: '', origin: 'https://study114.net', host: 'study114.net', hostname: 'study114.net', protocol: 'https:',
  get href() { return `${this.origin}${this.pathname}${this.search}${this.hash}`; },
  replace(u) { setHash(u); }, assign(u) { setHash(u); }, reload() {},
};
function setHash(u) { const s = String(u); const i = s.indexOf('#'); if (i >= 0) loc.hash = s.slice(i); }
const noop = () => {};
const fakeEl = () => ({
  style: { setProperty: noop }, classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
  setAttribute: noop, getAttribute: () => null, appendChild: noop, remove: noop, addEventListener: noop,
  querySelector: () => null, querySelectorAll: () => [], dataset: {}, innerHTML: '', textContent: '',
});
globalThis.window = globalThis;
globalThis.location = loc;
globalThis.history = { replaceState: (_a, _b, u) => setHash(u), pushState: (_a, _b, u) => setHash(u) };
globalThis.addEventListener = noop; globalThis.removeEventListener = noop; globalThis.dispatchEvent = () => true;
globalThis.document = { ...fakeEl(), documentElement: fakeEl(), head: fakeEl(), body: fakeEl(), createElement: fakeEl, getElementById: () => null, cookie: '', readyState: 'complete' };
globalThis.alert = noop; globalThis.confirm = () => true;
globalThis.matchMedia = () => ({ matches: false, addEventListener: noop, removeEventListener: noop });
console.warn = noop; console.error = noop;

const ME = { ok: true, authenticated: true, user_id: 9001, email: 'stu@x', role_type: 'guardian_student', name: '학생', email_verified: true };
globalThis.fetch = async (url) => {
  const me = String(url).includes('/api/auth/me.php');
  return { ok: me, status: me ? 200 : 404, json: async () => (me ? ME : { ok: false }), text: async () => '' };
};

const { createServer } = await import(pathToFileURL(path.join(HOME_UI, 'node_modules/vite/dist/node/index.js')).href);
const server = await createServer({
  configFile: path.join(HOME_UI, 'vite.config.js'), root: HOME_UI, logLevel: 'silent',
  server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] },
});
const L = (rel) => server.ssrLoadModule(path.join(ROOT, rel));
const auth = await L('preview/home-ui/src/auth-session.js');
await auth.initAuthSession(false);

const KEYS = ['study114.studentFind.lastRegionByHope', 'study114-find-canonical-v1', 'study114-find-filters-v1'];
function lsView() {
  const out = {};
  for (const k of KEYS) {
    const raw = ls.getItem(k);
    if (raw == null) { out[k] = null; continue; }
    const v = JSON.parse(raw);
    out[k] = k === 'study114-find-canonical-v1'
      ? Object.fromEntries(Object.entries(v).map(([t, c]) => [t, `${c?.displayLabel ?? ''}|src=${c?.source}`]))
      : v;
  }
  return out;
}
const pick = (html, re) => [...html.matchAll(re)].map((x) => x[1].trim());
const out = [];
const log = (s) => out.push(s);

if (page === 'home') {
  const { previewState, setParentTab, resetParentFind } = await L('preview/home-ui/src/state.js');
  const ph = await L('preview/home-ui/src/provider-home.js');
  log(`  auth=${auth.getAuthUser()?.role_type} parentFind.role=${JSON.stringify(previewState.parentFind.role)}`);
  for (const tab of tabs.length ? tabs : ['study_room', 'tutor', 'student']) {
    setParentTab(tab); resetParentFind(); loc.hash = '#/parent';
    const html = ph.renderProviderHomeBody('parent', tab, previewState.parentFind);
    log(`  home tab=${tab}: badge=${JSON.stringify(pick(html, /parent-home-region__badge">([^<]*)</g))} label=${JSON.stringify(pick(html, /parent-home-region__label">([^<]*)</g))} tutorTabs=${(html.match(/data-tutor-region=/g) || []).length} mapTitle=${JSON.stringify(pick(html, /hero-map__dong">([^<]*)</g))} mapLat=${JSON.stringify(pick(html, /data-map-lat="([^"]*)"/g))} 대치=${/대치/.test(html)} 신곡=${/신곡/.test(html)} prompt=${html.includes('위치를 선택해 주세요')}`);
  }
} else {
  const ss = await L('preview/search-ui/src/state.js');
  const sp = await L('preview/search-ui/src/screens/search-page.js');
  for (const tab of tabs) {
    loc.hash = `#/search/${tab}?role=parent`;
    const html = sp.renderSearchPage({ sessionReady: true });
    const st = ss.previewState;
    log(`  search tab=${tab} role=${st.role}: 현재위치=${JSON.stringify(pick(html, /현재위치 <strong>([^<]*)<\/strong>/g)[0] ?? null)} mapTitle=${JSON.stringify(pick(html, /hero-map__dong">([^<]*)</g))} state.canon=${JSON.stringify(st.canonicalLocation?.displayLabel ?? null)}(src=${st.canonicalLocation?.source}) 신곡=${/신곡/.test(html)} 대치=${/대치/.test(html)}`);
  }
}
log(`  LS → ${JSON.stringify(lsView())}`);
fs.writeFileSync(lsFile, JSON.stringify(ls.toJSON()));
process.stdout.write(out.join('\n') + '\n');
await server.close();
process.exit(0);
