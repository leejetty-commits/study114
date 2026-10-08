/**
 * 관리자-162 보고서 화면·메뉴·인쇄 포맷·운영홈 배치 검증.
 * 실행: npx vite-node scripts/verify-admin-162-settlement.mjs
 */
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
  if (typeof globalThis.window.requestAnimationFrame !== 'function') {
    globalThis.window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  }
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
const { renderSettlementDetail, renderSettlementView, defaultLines, formatPrintTitle, computeWeekRange } = await import('../preview/home-ui/src/admin/a28-settlement.js');

await initAuthSession();

// 1. 좌측 메뉴 검증: 보고서는 마켓·결제에서 제거됨
const commerce = A28_MENU.find((group) => group.id === 'grp-commerce');
const commerceSettlement = commerce?.children?.find((c) => c.id === 'settlement' || c.path === '/admin/settlement');
ok('commerce-no-settlement', !commerceSettlement);

// 2. 메뉴 순서 검증: '홍보 런치'(grp-promo)가 '공지·안내 글'(grp-board) 바로 뒤이고 '마켓·결제'(grp-commerce) 바로 앞
const boardIdx = A28_MENU.findIndex((g) => g.id === 'grp-board');
const promoIdx = A28_MENU.findIndex((g) => g.id === 'grp-promo');
const commerceIdx = A28_MENU.findIndex((g) => g.id === 'grp-commerce');
ok('menu-order-promo-after-board', promoIdx === boardIdx + 1, `boardIdx=${boardIdx}, promoIdx=${promoIdx}`);
ok('menu-order-promo-before-commerce', promoIdx === commerceIdx - 1, `promoIdx=${promoIdx}, commerceIdx=${commerceIdx}`);

// 3. 직접 주소(/admin/settlement) 접근 및 권한 유지
ok('not-preview', !ADMIN_PREVIEW_PATHS.includes('/admin/settlement'));
ok('super-access', canAccessAdminPath('/admin/settlement') === true);
sessionLevel = 'sub_master';
await initAuthSession();
ok('sub-access', canAccessAdminPath('/admin/settlement') === true);
ok('sub-blocks-settings', canAccessAdminPath('/admin/settings/popups') === false);
sessionLevel = 'super_admin';
await initAuthSession();

// 4. 단독 화면 렌더링 유지
const html = renderA28Screen('/admin/settlement');
ok('title', html.includes('보고서') && /<h2 class="sup-panel-card__title">보고서 /.test(html));
ok('tabs-3', (html.match(/data-settlement-tab="/g) || []).length === 3);
ok('tab-day', html.includes('일간') && html.includes('주간') && html.includes('월간'));
ok('print-one', (html.match(/data-settlement-print>/g) || []).length === 1 && html.includes('인쇄'));
ok('lines-5', (html.match(/data-settlement-line="/g) || []).length === 5);
ok('daily-title', html.includes('일일정산서'));
ok('drawer-host', html.includes('data-today-drawer-host'));
ok('no-preview-word', !html.includes('미리보기 · '));

// 5. 운영 홈(/admin) 화면에서 보고서가 오늘 할 일 바로 위에 위치
const hubHtml = renderA28Screen('/admin');
ok('hub-has-settlement', hubHtml.includes('data-settlement-root'));
ok('hub-has-today', hubHtml.includes('data-today-root'));
const posSettlement = hubHtml.indexOf('data-settlement-root');
const posToday = hubHtml.indexOf('data-today-root');
ok('hub-settlement-above-today', posSettlement >= 0 && posToday >= 0 && posSettlement < posToday, `settlement=${posSettlement}, today=${posToday}`);

// 6. 인쇄 포맷: 빈 데이터(missing / in_progress / 오류)에서도 3기간 포맷 유지 검증
const dayEmpty = renderSettlementView({ period: 'day', state: 'missing', lines: defaultLines('day') });
ok('day-empty-title', dayEmpty.includes('일일정산서'));
ok('day-empty-lines', dayEmpty.includes('① 결제 내역 없음') && dayEmpty.includes('② 남은 응대 내역 없음') && dayEmpty.includes('⑤ 홈 팝업 내역 없음'));

const weekEmpty = renderSettlementView({ period: 'week', state: 'missing', date: '2026-10-05', lines: defaultLines('week') });
ok('week-empty-title', weekEmpty.includes('주간 보고서') && weekEmpty.includes('2026-10-05 ~ 2026-10-11'));
ok('week-empty-lines', weekEmpty.includes('① 결제 내역 없음') && weekEmpty.includes('② 새 응대 내역 없음') && weekEmpty.includes('⑤ 기간 마지막 홈 팝업 내역 없음'));

const monthEmpty = renderSettlementView({ period: 'month', state: 'missing', date: '2026-10-01', lines: defaultLines('month') });
ok('month-empty-title', monthEmpty.includes('월간 보고서') && monthEmpty.includes('2026-10'));
ok('month-empty-lines', monthEmpty.includes('① 결제 내역 없음') && monthEmpty.includes('② 새 응대 내역 없음') && monthEmpty.includes('⑤ 기간 마지막 홈 팝업 내역 없음'));

// 7. ready 상태 포맷 검증
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

// 8. API 소스 무결성 검증
const apiSrc = readFileSync(join(root, 'preview/home-ui/src/admin/a28-settlement-api.js'), 'utf8');
ok('api-no-write', !/method:\s*['"]POST['"]/.test(apiSrc) && !/PATCH/.test(apiSrc) && !/PUT/.test(apiSrc) && !/DELETE/.test(apiSrc));
ok('api-get-two', (apiSrc.match(/fetch\(/g) || []).length === 2 && apiSrc.includes('settlement-report.php') && apiSrc.includes('settlement-lines.php'));

// 9. CSS 규칙 검증
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
ok('css-print-disabled', css.includes('[data-settlement-print]:disabled'));

// 10. 소스 코드 패턴 검증
const screenSrc = readFileSync(join(root, 'preview/home-ui/src/admin/a28-settlement.js'), 'utf8');
const bindSrc = screenSrc.slice(screenSrc.indexOf('export function bindSettlement'));
const afterprintHits = bindSrc.match(/window\.addEventListener\(\s*'afterprint'/g) || [];
ok('afterprint-once', afterprintHits.length === 1 && /addEventListener\(\s*'afterprint'[\s\S]*?\{ once: true \}/.test(bindSrc) && bindSrc.includes("addEventListener('hashchange'"));
ok('load-uses-default-lines', screenSrc.includes('defaultLines'));
ok('load-always-enables-print', screenSrc.includes('printBtn.disabled = false'));

ok('backfill-detail', renderSettlementDetail('inquiry', [], 1, 0, '/admin/tickets', true).includes(SETTLEMENT_COPY.backfill)
  && renderSettlementDetail('report', [], 1, 0, '/admin/moderation', true).includes(SETTLEMENT_COPY.backfill)
  && renderSettlementDetail('popup', [], 1, 0, '/admin/settings/popups', true).includes(SETTLEMENT_COPY.backfill)
  && renderSettlementDetail('pay', [], 1, 0, '/admin/commerce', true).includes(SETTLEMENT_COPY.emptyDetail));

for (const key of ['missing', 'inProgress', 'backfill', 'emptyDetail', 'schemaMissing', 'weeklyPrint', 'monthlyPrint', 'noRecord']) {
  ok(`copy-${key}`, typeof SETTLEMENT_COPY[key] === 'string' && SETTLEMENT_COPY[key].length >= 3);
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

console.log(`\n${fail === 0 ? 'OK' : 'FAIL'}  pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
