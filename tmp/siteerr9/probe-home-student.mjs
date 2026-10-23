/**
 * 사이트오류-9 — #/parent 학생 탭 단계별 상태 (읽기 전용).
 * node tmp/siteerr9/probe-home-student.mjs "<lastRegionByHope.tutor>"
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const tutorSaved = process.argv[2] ?? '';
const ROOT = path.resolve(import.meta.dirname, '../..');
const HOME_UI = path.join(ROOT, 'preview/home-ui');
const store = new Map(tutorSaved ? [['study114.studentFind.lastRegionByHope', JSON.stringify({ tutor: tutorSaved })]] : []);
const mem = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };
Object.defineProperty(globalThis, 'localStorage', { value: mem, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: { getItem: () => null, setItem() {}, removeItem() {} }, configurable: true });
const noop = () => {};
const el = () => ({ style: { setProperty: noop }, classList: { add: noop, remove: noop }, setAttribute: noop, getAttribute: () => null, appendChild: noop, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [] });
globalThis.window = globalThis;
globalThis.location = { hash: '#/parent', pathname: '/', search: '', origin: 'https://study114.net', replace: noop, assign: noop };
globalThis.history = { replaceState: noop };
globalThis.addEventListener = noop; globalThis.dispatchEvent = () => true;
globalThis.document = { ...el(), documentElement: el(), head: el(), body: el(), createElement: el, getElementById: () => null };
console.warn = noop; console.error = noop;
globalThis.fetch = async (u) => ({ ok: String(u).includes('me.php'), json: async () => ({ ok: true, authenticated: true, user_id: 1, role_type: 'guardian_student', email_verified: true }) });

const { createServer } = await import(pathToFileURL(path.join(HOME_UI, 'node_modules/vite/dist/node/index.js')).href);
const server = await createServer({ configFile: path.join(HOME_UI, 'vite.config.js'), root: HOME_UI, logLevel: 'silent', server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
const L = (rel) => server.ssrLoadModule(path.join(ROOT, rel));
await (await L('preview/home-ui/src/auth-session.js')).initAuthSession(false);
const S = await L('preview/search-ui/src/search-find-surface.js');
const { createFindState } = await L('preview/home-ui/src/find-state.js');
const LD = await L('preview/shared/location-display.js');

const st = createFindState();
const show = (t) => console.log(`${t}: activeRegionLabel=${JSON.stringify(st.activeRegionLabel)} canon=${JSON.stringify(st.canonicalLocation?.displayLabel ?? null)} src=${st.canonicalLocation?.source} studentHopeType=${JSON.stringify(st.studentHopeType)}`);
console.log(`lastRegionByHope.tutor=${JSON.stringify(tutorSaved)}  axisFromSearchTab('student', null)=${LD.axisFromSearchTab('student', null)}`);
console.log(`normalize(study_room axis).displayLabel=${JSON.stringify(LD.normalizeLocation({ raw: tutorSaved }, 'study_room').displayLabel)}  normalize(tutor axis).displayLabel=${JSON.stringify(LD.normalizeLocation({ raw: tutorSaved }, 'tutor').displayLabel)}`);
show('0 초기');
S.refreshActiveResultItems('student', st, 'parent');
show('1 refreshActiveResultItems(student, parent)');
const regionBar = S.renderCompactRegionBar('student', st, { variant: 'home', role: 'parent' });
show('2 renderCompactRegionBar');
console.log('   regionBar label =', JSON.stringify([...regionBar.matchAll(/parent-home-region__label">([^<]*)</g)].map((m) => m[1])));
const PH = await L('preview/home-ui/src/provider-home.js');
for (const prevTab of [null, 'tutor']) {
  const st2 = createFindState();
  if (prevTab) {
    PH.renderProviderHomeBody('parent', prevTab, st2);
    const { resetFindState } = await L('preview/home-ui/src/find-state.js');
    resetFindState(st2);
  }
  const html = PH.renderProviderHomeBody('parent', 'student', st2);
  console.log(`3 renderProviderHomeBody(student) 이전탭=${prevTab}: label=${JSON.stringify([...html.matchAll(/parent-home-region__label">([^<]*)</g)].map((m) => m[1]))} activeRegionLabel=${JSON.stringify(st2.activeRegionLabel)} canon=${JSON.stringify(st2.canonicalLocation?.displayLabel)} axis=${st2.canonicalLocation?.axis} src=${st2.canonicalLocation?.source}`);
}
await server.close();
process.exit(0);
