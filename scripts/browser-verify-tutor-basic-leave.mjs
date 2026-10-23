/**
 * 기본정보 이탈 — 저장 게이트 잔존 여부 + 빈 city units에서도 탭 이동 가능
 * Chrome CDP · auth/regions mock
 */
import { spawn } from 'node:child_process';
import { accessSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { readFileSync } from 'node:fs';

const BASE = 'http://127.0.0.1:5174';
const TID = 1;
const PATHS = {
  hub: `/mypage/registrations/tutors/${TID}`,
  basic: `/mypage/registrations/tutors/${TID}/basic`,
  detail: `/mypage/registrations/tutors/${TID}/detail`,
  inquiries: `/mypage/registrations/tutors/${TID}/inquiries`,
  publish: `/mypage/registrations/tutors/${TID}/publish`,
};

const results = [];
const dialogs = [];

function rec(id, result, note, detail) {
  results.push({ id, result, note, detail });
  console.error(`[${result}] ${id}: ${note}`);
}

function resolveBrowser() {
  for (const c of [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ]) {
    try {
      accessSync(c);
      return c;
    } catch {
      /* */
    }
  }
  throw new Error('Chrome/Edge not found');
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      } else if (msg.method === 'Page.javascriptDialogOpening') {
        dialogs.push({ message: msg.params.message, type: msg.params.type });
        this.send('Page.handleJavaScriptDialog', { accept: false }).catch(() => {});
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
}

async function waitForWs(port) {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) return res.json();
    } catch {
      /* */
    }
    await sleep(250);
  }
  throw new Error('CDP not ready');
}

async function evaluate(cdp, expression) {
  const r = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}

async function goto(cdp, url) {
  await cdp.send('Page.navigate', { url });
  await sleep(700);
}

async function snap(cdp) {
  return evaluate(
    cdp,
    `(() => {
      const h = (location.hash.slice(1) || '').split('?')[0];
      const url = h.startsWith('/') ? h : '/' + h;
      const activeTab = document.querySelector('.mp-room__tab.is-active')?.textContent?.trim() || null;
      let marker = 'unknown';
      if (document.querySelector('[data-p21-form="basic"]')) marker = 'basic';
      else if (document.querySelector('[data-p21-form="detail"]')) marker = 'detail';
      else if (document.querySelector('.p21-access-body')) marker = 'inquiries';
      else if (document.querySelector('.p19-publish-body')) marker = 'publish';
      else if (document.querySelector('.p21-hero')) marker = 'hub';
      return { url, activeTab, marker, hasTabs: !!document.querySelector('.mp-room__tabs') };
    })()`,
  );
}

async function clickTab(cdp, label) {
  return evaluate(
    cdp,
    `(() => {
      const el = [...document.querySelectorAll('.mp-room__tab')].find(n => (n.textContent||'').trim() === ${JSON.stringify(label)});
      if (!el) return { ok: false };
      el.click();
      return { ok: true };
    })()`,
  );
}

const MOCK_SOURCE = `(() => {
  if (window.__study114BasicLeaveMock) return;
  const tutorRow = {
    id: 1, tutor_display_name: '김수학', profile_status: 'published',
    detail_completion_status: 'expanded_complete', primary_region_label: '서울특별시',
    main_subject_note: '수학', preferred_fee_amount: 480000, intro_short: '중·고 수학',
    has_primary_region: true, has_primary_subject: true, has_lesson_places: true,
    has_profile_image: true, deleted_at: null,
  };
  const orig = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = String(typeof input === 'string' ? input : input.url || '');
    const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
    if (url.includes('/api/auth/login.php')) {
      return json({ ok: true, user_id: 101, email: 'tutor-owner1@dev.local', role_type: 'tutor', name: '검증과외' });
    }
    if (url.includes('/api/auth/me.php')) {
      return json({ ok: true, authenticated: true, user_id: 101, email: 'tutor-owner1@dev.local', role_type: 'tutor', name: '검증과외', email_verified: true });
    }
    if (url.includes('/api/auth/logout.php')) return json({ ok: true });
    if (url.includes('/api/registrations/tutors.php')) return json({ ok: true, tutors: [tutorRow] });
    if (url.includes('/api/registrations/')) return json({ ok: true, students: [], rooms: [], tutors: [] });
    // 핵심: 과외지역 목록 비움 — 옛 게이트가 있으면 alert 후 차단됨
    if (url.includes('/api/auth/regions.php') || url.includes('action=cities') || url.includes('/cities')) {
      return json({ ok: true, cities: [], units: [], items: [] });
    }
    if (url.includes('/api/')) return json({ ok: true });
    return orig(input, init);
  };
  window.__study114BasicLeaveMock = true;
})();`;

async function run() {
  // static: alert string must not exist in nav binder
  const screens = readFileSync(join(process.cwd(), 'preview/home-ui/src/tutor-reg/screens.js'), 'utf8');
  const hasOldAlert = screens.includes('과외지역 목록을 불러온 뒤 이동해 주세요');
  rec(
    'static:no-leave-alert',
    hasOldAlert ? 'FAIL' : 'PASS',
    hasOldAlert ? 'screens.js still contains leave-gate alert' : 'leave-gate alert string absent',
  );
  const navMatch = screens.match(/root\.querySelectorAll\('\[data-p21-nav\]'\)\.forEach\(\(el\) => \{[\s\S]*?\}\);/);
  const navHasPersist = navMatch && navMatch[0].includes('persistTutorBasicForm');
  rec(
    'static:nav-no-persist',
    navHasPersist ? 'FAIL' : 'PASS',
    navHasPersist ? 'nav still calls persistTutorBasicForm' : 'nav does not call persist',
  );

  const browserPath = resolveBrowser();
  const profile = mkdtempSync(join(tmpdir(), 'study114-basic-leave-'));
  const port = 9231;
  const chrome = spawn(
    browserPath,
    [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--headless=new', `${BASE}/`],
    { stdio: 'ignore' },
  );

  try {
    const list = await waitForWs(port);
    const page = list.find((t) => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.addEventListener('open', res);
      ws.addEventListener('error', rej);
    });
    const cdp = new Cdp(ws);
    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: MOCK_SOURCE });

    await goto(cdp, `${BASE}/`);
    await evaluate(cdp, MOCK_SOURCE);
    await evaluate(cdp, `document.querySelector('[data-action="dev-login-tutor"]')?.click()`);
    await sleep(1500);
    await goto(cdp, `${BASE}/#${PATHS.hub}`);
    await sleep(900);
    let s = await snap(cdp);
    if (!s.hasTabs) throw new Error('hub tabs missing: ' + JSON.stringify(s));

    await clickTab(cdp, '기본정보');
    await sleep(600);
    s = await snap(cdp);
    rec('setup:basic', s.url === PATHS.basic && s.marker === 'basic' ? 'PASS' : 'FAIL', JSON.stringify(s), s);

    // city units length should be 0 under mock
    const unitsLen = await evaluate(
      cdp,
      `(() => {
        try {
          // expose via DOM hint if units empty shows retry button
          return {
            retry: !!document.querySelector('[data-p21-retry-cities]'),
            form: !!document.querySelector('[data-p21-form="basic"]'),
          };
        } catch (e) { return { err: String(e) }; }
      })()`,
    );

    const hops = [
      { label: '마이프로필', expect: PATHS.hub, marker: 'hub', active: '마이프로필' },
      { label: '상세정보', expect: PATHS.detail, marker: 'detail', active: '상세정보' },
      { label: '쪽지설정', expect: PATHS.inquiries, marker: 'inquiries', active: '쪽지설정' },
      { label: '등록점검', expect: PATHS.publish, marker: 'publish', active: '등록점검' },
    ];

    for (const hop of hops) {
      await goto(cdp, `${BASE}/#${PATHS.basic}`);
      await sleep(500);
      const d0 = dialogs.length;
      const t0 = Date.now();
      await clickTab(cdp, hop.label);
      await sleep(500);
      s = await snap(cdp);
      const newDialogs = dialogs.slice(d0);
      const blocked = newDialogs.some((d) => String(d.message).includes('과외지역'));
      const ok =
        !blocked &&
        newDialogs.length === 0 &&
        s.url === hop.expect &&
        s.marker === hop.marker &&
        s.activeTab === hop.active;
      rec(
        `leave:basic→${hop.label}`,
        ok ? 'PASS' : 'FAIL',
        ok
          ? `즉시 이동 ${Date.now() - t0}ms (unitsHint=${JSON.stringify(unitsLen)})`
          : `url=${s.url} marker=${s.marker} active=${s.activeTab} dialogs=${JSON.stringify(newDialogs)}`,
        { s, newDialogs, unitsLen, elapsed: Date.now() - t0 },
      );
    }

    // unsaved observe
    await goto(cdp, `${BASE}/#${PATHS.basic}`);
    await sleep(500);
    const original = await evaluate(
      cdp,
      `document.querySelector('[data-p21-form="basic"] input[name="tutor_display_name"]')?.value || ''`,
    );
    await evaluate(
      cdp,
      `(() => {
        const input = document.querySelector('[data-p21-form="basic"] input[name="tutor_display_name"]');
        if (!input) return false;
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(original + '__DIRTY__')});
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      })()`,
    );
    const d0 = dialogs.length;
    await clickTab(cdp, '상세정보');
    await sleep(500);
    const mid = dialogs.slice(d0);
    await clickTab(cdp, '기본정보');
    await sleep(500);
    const after = await evaluate(
      cdp,
      `document.querySelector('[data-p21-form="basic"] input[name="tutor_display_name"]')?.value || ''`,
    );
    rec(
      'observe:unsaved',
      'OBSERVE',
      mid.length
        ? `dialogs=${JSON.stringify(mid)}`
        : after === original
          ? '경고 없이 이동, 값 소실(리렌더)'
          : `경고 없이 이동, after=${after}`,
      { original, after, mid },
    );

    ws.close();
  } finally {
    chrome.kill();
    await sleep(200);
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      /* */
    }
  }

  const fails = results.filter((r) => r.result === 'FAIL');
  const report = { summary: fails.length ? 'FAIL' : 'PASS', failCount: fails.length, dialogs, results };
  writeFileSync(join(process.cwd(), 'scripts/_browser-verify-basic-leave-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(fails.length ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(2);
});
