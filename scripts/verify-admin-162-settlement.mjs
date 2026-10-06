/**
 * 관리자-162 보고서 화면·메뉴·글자·범위.
 * 실행: npx vite-node scripts/verify-admin-162-settlement.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
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
    hash: '#/admin/settlement',
    origin: 'http://127.0.0.1:5174',
    href: 'http://127.0.0.1:5174/#/admin/settlement',
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
  if (typeof globalThis.window.print !== 'function') globalThis.window.print = () => {};
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
  return { ok: true, json: async () => ({ ok: true }) };
};

const { A28_MENU, ADMIN_PREVIEW_PATHS, flattenAdminNav } = await import('../preview/home-ui/src/admin/a28-copy.js');
const { renderA28Screen } = await import('../preview/home-ui/src/admin/a28-screens.js');
const { canAccessAdminPath } = await import('../preview/home-ui/src/admin/admin-guard.js');
const { initAuthSession } = await import('../preview/home-ui/src/auth-session.js');
const { SETTLEMENT_COPY } = await import('../preview/home-ui/src/admin/a28-settlement-copy.js');
const { renderSettlementDetail, renderSettlementView } = await import('../preview/home-ui/src/admin/a28-settlement.js');

await initAuthSession();

const leaves = flattenAdminNav();
const settlement = leaves.filter((item) => item.path === '/admin/settlement');
ok('nav-one', settlement.length === 1);
ok('nav-label', settlement[0]?.label === '보고서', settlement[0]?.label);
const commerce = A28_MENU.find((group) => group.id === 'grp-commerce');
const last = commerce?.children?.[commerce.children.length - 1];
ok('commerce-last', last?.path === '/admin/settlement' && last?.id === 'settlement' && last?.menuId === 'settlement');
ok('screen-id', last?.screenId === 'A28-162');
ok('not-preview', !ADMIN_PREVIEW_PATHS.includes('/admin/settlement'));
ok('help-one-line', typeof last?.help === 'string' && !last.help.includes('\n'));

ok('super-access', canAccessAdminPath('/admin/settlement') === true);
sessionLevel = 'sub_master';
await initAuthSession();
ok('sub-access', canAccessAdminPath('/admin/settlement') === true);
ok('sub-blocks-settings', canAccessAdminPath('/admin/settings/popups') === false);
sessionLevel = 'super_admin';
await initAuthSession();

const html = renderA28Screen('/admin/settlement');
ok('title', html.includes('보고서') && /<h2 class="sup-panel-card__title">보고서 /.test(html));
ok('tabs-3', (html.match(/data-settlement-tab="/g) || []).length === 3);
ok('tab-day', html.includes('일간') && html.includes('주간') && html.includes('월간'));
ok('print-one', (html.match(/data-settlement-print>/g) || []).length === 1 && html.includes('인쇄'));
ok('lines-5', (html.match(/data-settlement-line="/g) || []).length === 5);
ok('daily-title', html.includes('일일정산서'));
ok('drawer-host', html.includes('data-today-drawer-host'));
ok('no-preview-word', !html.includes('미리보기 · '));

const sampleLines = [
  '① 결제 5건 500,000원 (공부방 3건 200,000원 · 과외쌤 2건 300,000원 · 학생 0건 0원)',
  '② 남은 응대 문의 4 · 신고 1',
  '③ 등록 공부방 1 · 과외쌤 0 · 학생 2',
  '④ 탈퇴 공부방 0 · 과외쌤 0 · 학생 1 / 관리자 삭제 공부방 0 · 과외쌤 1 · 학생 0',
  '⑤ 홈 팝업 2개',
];
const detail = renderSettlementDetail('pay', [{
  time: '2026-10-06 12:00',
  member: 'payer@example.com',
  role: '공부방',
  product: '기본',
  amount: '100,000원',
}], 1, 1, '/admin/commerce');
const inquiryDetail = renderSettlementDetail('inquiry', [{
  ticket_no: 'T-1',
  time: '2026-10-06 09:00',
  category: '오류·장애',
  status: '접수',
  role: '학생',
}], 1, 1, '/admin/tickets');
const deleteDetail = renderSettlementDetail('delete', [{
  time: '2026-10-06 11:00',
  target: '9',
  roles: '학생 · 공부방',
}], 1, 1, '/admin/members');
const view = renderSettlementView({
  period: 'day',
  date: '2026-10-06',
  state: 'ready',
  lines: sampleLines,
  printTitle: '일일정산서 2026-10-06',
  detailHtml: `<div data-settlement-detail-body>${detail}${inquiryDetail}${deleteDetail}</div>`,
});
const banned = ['학부모', 'parent', 'guardian', '보드'];
for (const word of banned) {
  ok(`screen-no-${word}`, !view.includes(word));
}
ok('view-has-lines', sampleLines.every((line) => view.includes(line)));
ok('print-title-date', view.includes('일일정산서 2026-10-06'));

const hostStart = view.indexOf('data-today-drawer-host');
const host = hostStart >= 0 ? view.slice(hostStart) : '';
ok('popup-host', host.includes('data-today-drawer-host'));
ok('popup-no-input', !/<input\b/i.test(host) && !/<select\b/i.test(host) && !/<textarea\b/i.test(host));
const actionButtons = [...host.matchAll(/<button\b[^>]*>([^<]*)<\/button>/g)]
  .map((match) => match[1].trim())
  .filter((text) => text === '저장' || text === '삭제' || text.startsWith('저장'));
ok('popup-no-save-delete', actionButtons.length === 0, actionButtons.join(','));
ok('delete-tab-role', host.includes('role="tab"') && host.includes('관리자 삭제'));

const apiSrc = readFileSync(join(root, 'preview/home-ui/src/admin/a28-settlement-api.js'), 'utf8');
ok('api-no-write', !/method:\s*['"]POST['"]/.test(apiSrc) && !/PATCH/.test(apiSrc) && !/PUT/.test(apiSrc) && !/DELETE/.test(apiSrc));
ok('api-get-two', (apiSrc.match(/fetch\(/g) || []).length === 2 && apiSrc.includes('settlement-report.php') && apiSrc.includes('settlement-lines.php'));

const css = readFileSync(join(root, 'preview/home-ui/src/styles/admin-settlement.css'), 'utf8');
const cssBody = css.replace(/\/\*[\s\S]*?\*\//g, '');
const selectors = [];
const withoutMedia = cssBody.replace(/@media[^{]+\{([\s\S]*?)\n\}/g, (_, inner) => {
  selectors.push(...selectorList(inner));
  return '';
});
selectors.push(...selectorList(withoutMedia));
ok('css-selectors', selectors.length > 0 && selectors.every((sel) => sel.startsWith('.admin-shell') || sel.startsWith('html.is-settlement-printing')), selectors.filter((sel) => !sel.startsWith('.admin-shell') && !sel.startsWith('html.is-settlement-printing')).join(' | '));

const gridRule = 'html.is-settlement-printing .home-body .admin-shell';
const gridDecl = 'grid-template-columns: minmax(0, 1fr) !important';
const mediaInner = (css.match(/@media print \{([\s\S]*)\n\}/) || ['', ''])[1];
const screenCss = css.replace(/@media print \{[\s\S]*\n\}/, '');
ok('css-grid-screen', screenCss.includes(gridRule) && screenCss.includes(gridDecl));
ok('css-grid-print', mediaInner.includes(gridRule) && mediaInner.includes(gridDecl));
ok('print-disabled-initial', /disabled[^>]*data-settlement-print>/.test(html));

const screenSrc = readFileSync(join(root, 'preview/home-ui/src/admin/a28-settlement.js'), 'utf8');
const bindSrc = screenSrc.slice(screenSrc.indexOf('export function bindSettlement'));
const afterprintHits = bindSrc.match(/window\.addEventListener\(\s*'afterprint'/g) || [];
ok('load-clears-print', screenSrc.includes("title.textContent = ''") && screenSrc.includes("printLines.innerHTML = ''") && screenSrc.includes('printBtn.disabled = true'));
ok('load-ready-only', screenSrc.includes("data.state === 'ready'") && screenSrc.includes('printBtn.disabled = false') && screenSrc.indexOf('printBtn.disabled = false') > screenSrc.indexOf("data.state === 'ready'"));
ok(
  'afterprint-once',
  afterprintHits.length === 1
    && /addEventListener\(\s*'afterprint'[\s\S]*?\{ once: true \}/.test(bindSrc)
    && bindSrc.includes("addEventListener('hashchange'")
    && bindSrc.includes("classList.remove('is-settlement-printing')")
    && !/window\.addEventListener\(\s*'afterprint'\s*,\s*\(\)\s*=>\s*\{[^}]*\}\s*\)/.test(bindSrc),
);
ok('backfill-detail', renderSettlementDetail('inquiry', [], 1, 0, '/admin/tickets', true).includes(SETTLEMENT_COPY.backfill)
  && renderSettlementDetail('report', [], 1, 0, '/admin/moderation', true).includes(SETTLEMENT_COPY.backfill)
  && renderSettlementDetail('popup', [], 1, 0, '/admin/settings/popups', true).includes(SETTLEMENT_COPY.backfill)
  && renderSettlementDetail('pay', [], 1, 0, '/admin/commerce', true).includes(SETTLEMENT_COPY.emptyDetail));

for (const key of ['missing', 'inProgress', 'backfill', 'emptyDetail', 'schemaMissing']) {
  ok(`copy-${key}`, typeof SETTLEMENT_COPY[key] === 'string' && SETTLEMENT_COPY[key].length > 8);
}
ok('copy-missing-text', viewIncludes(SETTLEMENT_COPY.missing));
ok('copy-progress-text', renderSettlementView({ state: 'in_progress', message: SETTLEMENT_COPY.inProgress }).includes(SETTLEMENT_COPY.inProgress));
ok('copy-backfill-text', SETTLEMENT_COPY.backfill.includes('그때 기록'));
ok('copy-empty-text', renderSettlementDetail('pay', [], 1, 0, '/admin/commerce').includes(SETTLEMENT_COPY.emptyDetail));
ok('copy-schema-text', SETTLEMENT_COPY.schemaMissing.includes('077'));

function viewIncludes(text) {
  return renderSettlementView({ state: 'missing', message: text }).includes(text);
}

function selectorList(block) {
  const out = [];
  const parts = block.split('}');
  for (const part of parts) {
    const head = part.split('{')[0] || '';
    if (!head.trim() || head.includes('@')) continue;
    for (const sel of head.split(',')) {
      const trimmed = sel.trim();
      if (trimmed) out.push(trimmed);
    }
  }
  return out;
}

function deletedLines(file) {
  const diff = execFileSync('git', ['diff', '-U0', '11b0c0d', '--', file], { cwd: root, encoding: 'utf8' });
  return diff.split('\n').filter((line) => line.startsWith('-') && !line.startsWith('---'));
}

const sharedFiles = [
  'preview/home-ui/src/admin/a28-copy.js',
  'preview/home-ui/src/admin/a28-screens.js',
  'preview/home-ui/src/admin/a28-screens-bind.js',
];
for (const file of sharedFiles) {
  const removed = deletedLines(file);
  ok(`no-delete ${file}`, removed.length === 0, removed.join('\n'));
}
const sharedChanged = sharedFiles.filter((file) => execFileSync('git', ['diff', '--name-only', '02dd20e', '--', file], { cwd: root, encoding: 'utf8' }).trim() !== '');
ok('shared-frozen-02dd20e', sharedChanged.length === 0, sharedChanged.join(','));

const allow = new Set([
  'preview/home-ui/src/admin/a28-settlement.js',
  'preview/home-ui/src/admin/a28-settlement-api.js',
  'preview/home-ui/src/admin/a28-settlement-copy.js',
  'preview/home-ui/src/styles/admin-settlement.css',
  'preview/home-ui/src/admin/a28-copy.js',
  'preview/home-ui/src/admin/a28-screens.js',
  'preview/home-ui/src/admin/a28-screens-bind.js',
  'src/Report/ReportPeriod.php',
  'src/Report/SettlementReportRepository.php',
  'src/Report/SettlementReportService.php',
  'src/Report/SettlementLinesQuery.php',
  'src/Report/SettlementMailer.php',
  'src/Registration/BasicCardRegisteredQuery.php',
  'public/api/admin/settlement-report.php',
  'public/api/admin/settlement-lines.php',
  'public/api/cron/settlement-report.php',
  'public/.htaccess',
  '.github/workflows/deploy.yml',
  'config/dothome.env.example',
  'sql/schema/077_admin_settlement_reports.sql',
  'scripts/verify-admin-162-settlement.mjs',
  'scripts/verify-admin-162-settlement.php',
]);
const names = execFileSync('git', ['diff', '--name-only', '11b0c0d'], { cwd: root, encoding: 'utf8' })
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);
const outside = names.filter((name) => !allow.has(name));
ok('diff-inside-allow', outside.length === 0, outside.join(','));
ok('diff-has-menu', names.includes('preview/home-ui/src/admin/a28-copy.js'));

console.log(`\n${fail === 0 ? 'OK' : 'FAIL'}  pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
