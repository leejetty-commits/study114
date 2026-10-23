/**
 * PR #10 브라우저 실검 — 시스템 Chrome CDP (의존성 추가 없음)
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = 'http://127.0.0.1:5174';
const TID = 1;
const PATHS = {
  hub: `/mypage/registrations/tutors/${TID}`,
  basic: `/mypage/registrations/tutors/${TID}/basic`,
  detail: `/mypage/registrations/tutors/${TID}/detail`,
  inquiries: `/mypage/registrations/tutors/${TID}/inquiries`,
  publish: `/mypage/registrations/tutors/${TID}/publish`,
  access: `/mypage/registrations/tutors/${TID}/access`,
  badId: `/mypage/registrations/tutors/99999/basic`,
};

const CHROME =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const results = [];
const dialogsSeen = [];

function rec(id, result, note, detail) {
  results.push({ id, result, note, detail });
  console.error(`[${result}] ${id}: ${note}`);
}

function findChrome() {
  const candidates = [
    CHROME,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const c of candidates) {
    try {
      // eslint-disable-next-line no-unused-expressions
      require('node:fs').accessSync(c);
      return c;
    } catch {
      /* try next */
    }
  }
  throw new Error('Chrome/Edge not found');
}

// ESM-friendly exists check
import { accessSync } from 'node:fs';
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
    this.events = [];
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
        if (this.onEvent) this.onEvent(msg);
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

async function waitForWs(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res.json();
    } catch {
      /* */
    }
    await sleep(250);
  }
  throw new Error(`CDP not ready: ${url}`);
}

async function connectPage(port) {
  const list = await waitForWs(`http://127.0.0.1:${port}/json/list`);
  let page = list.find((t) => t.type === 'page' && t.url.includes('127.0.0.1:5174'));
  if (!page) page = list.find((t) => t.type === 'page');
  if (!page?.webSocketDebuggerUrl) throw new Error('No page target');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });
  const cdp = new Cdp(ws);
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `(() => {
      if (window.__study114RouteVerifyMock) return;
      const tutorRow = {
        id: 1,
        tutor_display_name: '김수학',
        profile_status: 'published',
        detail_completion_status: 'expanded_complete',
        location_label: '서울특별시',
        primary_region_label: '서울특별시',
        main_subject_note: '수학',
        preferred_fee_amount: 480000,
        intro_short: '중·고 수학',
        has_primary_region: true,
        has_primary_subject: true,
        has_lesson_places: true,
        has_profile_image: true,
        deleted_at: null,
      };
      const orig = window.fetch.bind(window);
      window.fetch = async (input, init = {}) => {
        const url = String(typeof input === 'string' ? input : input.url || '');
        const json = (body, status = 200) =>
          new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
        if (url.includes('/api/auth/login.php')) {
          return json({ ok: true, user_id: 101, email: 'tutor-owner1@dev.local', role_type: 'tutor', name: '검증과외', admin_level: null, must_change_password: false });
        }
        if (url.includes('/api/auth/me.php')) {
          return json({ ok: true, authenticated: true, user_id: 101, email: 'tutor-owner1@dev.local', role_type: 'tutor', name: '검증과외', email_verified: true, phone_verified: true, admin_level: null, must_change_password: false });
        }
        if (url.includes('/api/auth/logout.php')) return json({ ok: true });
        if (url.includes('/api/registrations/tutors.php')) return json({ ok: true, tutors: [tutorRow] });
        if (url.includes('/api/registrations/students.php')) return json({ ok: true, students: [] });
        if (url.includes('/api/registrations/study-rooms.php')) return json({ ok: true, rooms: [] });
        if (url.includes('/api/')) return json({ ok: true });
        return orig(input, init);
      };
      window.__study114RouteVerifyMock = true;
    })();`,
  });
  // capture dialogs
  await cdp.send('Page.setInterceptFileChooserDialog', { enabled: false }).catch(() => {});
  cdp.onEvent = (msg) => {
    if (msg.method === 'Page.javascriptDialogOpening') {
      dialogsSeen.push({ message: msg.params.message, type: msg.params.type });
      cdp.send('Page.handleJavaScriptDialog', { accept: false }).catch(() => {});
    }
  };
  return { cdp, ws };
}

async function evaluate(cdp, expression) {
  const r = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.exceptionDetails) {
    throw new Error(r.exceptionDetails.text || 'eval error');
  }
  return r.result.value;
}

async function goto(cdp, url) {
  await cdp.send('Page.navigate', { url });
  await sleep(500);
  // wait ready
  for (let i = 0; i < 30; i++) {
    const state = await evaluate(cdp, 'document.readyState');
    if (state === 'complete' || state === 'interactive') break;
    await sleep(100);
  }
  await sleep(300);
}

async function snapshot(cdp) {
  return evaluate(
    cdp,
    `(() => {
      const h = (location.hash.slice(1) || '').split('?')[0];
      const url = h.startsWith('/') ? h : '/' + h;
      const activeTab = document.querySelector('.mp-room__tab.is-active');
      const activeNav = [...document.querySelectorAll('.mypage-nav__link.is-active')].map(a => a.textContent.trim());
      let marker = 'unknown';
      if (document.querySelector('[data-p21-form="basic"]')) marker = 'basic';
      else if (document.querySelector('[data-p21-form="detail"]')) marker = 'detail';
      else if (document.querySelector('.p21-access-body')) marker = 'inquiries';
      else if (document.querySelector('.p19-publish-body')) marker = 'publish';
      else if (document.querySelector('.p21-hero')) marker = 'hub';
      return {
        url,
        activeTab: activeTab ? activeTab.textContent.trim() : null,
        activeNav,
        marker,
        hasTabs: !!document.querySelector('.mp-room__tabs'),
        title: document.querySelector('h1')?.textContent?.trim() || '',
      };
    })()`,
  );
}

async function waitUrl(cdp, expect, timeoutMs = 5000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const s = await snapshot(cdp);
    if (s.url === expect) return s;
    await sleep(100);
  }
  return snapshot(cdp);
}

async function clickText(cdp, selector, text) {
  return evaluate(
    cdp,
    `(() => {
      const nodes = [...document.querySelectorAll(${JSON.stringify(selector)})];
      const el = nodes.find(n => (n.textContent || '').trim() === ${JSON.stringify(text)} || (n.textContent || '').includes(${JSON.stringify(text)}));
      if (!el) return { ok: false, reason: 'not found' };
      el.click();
      return { ok: true, text: (el.textContent || '').trim() };
    })()`,
  );
}

/** 로컬 API(:8080) 부재 시 — 실 UI 라우팅만 검증하기 위한 최소 auth/등록 mock */
async function installApiMock(cdp) {
  await evaluate(
    cdp,
    `(() => {
      if (window.__study114RouteVerifyMock) return 'already';
      const tutorRow = {
        id: 1,
        tutor_display_name: '김수학',
        profile_status: 'published',
        detail_completion_status: 'expanded_complete',
        location_label: '서울특별시 · 대치·도곡',
        primary_region_label: '서울특별시',
        main_subject_note: '수학',
        preferred_fee_amount: 480000,
        intro_short: '중·고 수학',
        has_primary_region: true,
        has_primary_subject: true,
        has_lesson_places: true,
        has_profile_image: true,
        deleted_at: null,
      };
      const orig = window.fetch.bind(window);
      window.fetch = async (input, init = {}) => {
        const url = String(typeof input === 'string' ? input : input.url || '');
        const json = (body, status = 200) =>
          new Response(JSON.stringify(body), {
            status,
            headers: { 'Content-Type': 'application/json' },
          });
        if (url.includes('/api/auth/login.php')) {
          return json({
            ok: true,
            user_id: 101,
            email: 'tutor-owner1@dev.local',
            role_type: 'tutor',
            name: '검증과외',
            admin_level: null,
            must_change_password: false,
          });
        }
        if (url.includes('/api/auth/me.php')) {
          return json({
            ok: true,
            authenticated: true,
            user_id: 101,
            email: 'tutor-owner1@dev.local',
            role_type: 'tutor',
            name: '검증과외',
            email_verified: true,
            phone_verified: true,
            admin_level: null,
            must_change_password: false,
          });
        }
        if (url.includes('/api/auth/logout.php')) {
          return json({ ok: true });
        }
        if (url.includes('/api/registrations/tutors.php')) {
          return json({ ok: true, tutors: [tutorRow] });
        }
        if (url.includes('/api/registrations/students.php')) {
          return json({ ok: true, students: [] });
        }
        if (url.includes('/api/registrations/study-rooms.php')) {
          return json({ ok: true, rooms: [] });
        }
        if (url.includes('/api/')) {
          return json({ ok: true });
        }
        return orig(input, init);
      };
      window.__study114RouteVerifyMock = true;
      return 'installed';
    })()`,
  );
}

async function ensureTutor(cdp) {
  await goto(cdp, `${BASE}/`);
  await sleep(500);
  await installApiMock(cdp);
  await evaluate(
    cdp,
    `(() => {
      const btn = document.querySelector('[data-action="dev-login-tutor"]');
      if (btn) btn.click();
      return !!btn;
    })()`,
  );
  await sleep(1800);
  await goto(cdp, `${BASE}/#${PATHS.hub}`);
  await sleep(1000);
  let s = await snapshot(cdp);
  if (!s.hasTabs) {
    await installApiMock(cdp);
    await evaluate(cdp, `document.querySelector('[data-action="dev-login-tutor"]')?.click()`);
    await sleep(1800);
    await goto(cdp, `${BASE}/#${PATHS.hub}`);
    await sleep(1000);
    s = await snapshot(cdp);
  }
  if (!s.hasTabs) {
    throw new Error('tutor hub tabs not mounted after mock login: ' + JSON.stringify(s));
  }
  return s;
}

async function run() {
  const browserPath = resolveBrowser();
  const profile = mkdtempSync(join(tmpdir(), 'study114-cdp-'));
  const port = 9229;
  const chrome = spawn(
    browserPath,
    [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--headless=new',
      `${BASE}/`,
    ],
    { stdio: 'ignore' },
  );

  try {
    const { cdp, ws } = await connectPage(port);
    await ensureTutor(cdp);

    // A hops — start at basic
    {
      const c = await clickText(cdp, '.mp-room__tab', '기본정보');
      if (!c.ok) throw new Error('cannot click 기본정보');
      await waitUrl(cdp, PATHS.basic);
    }

    const hops = [
      { to: '상세정보', expect: PATHS.detail, marker: 'detail', active: '상세정보', id: 'A:기본정보→상세정보' },
      { to: '마이프로필', expect: PATHS.hub, marker: 'hub', active: '마이프로필', id: 'A:상세정보→마이프로필' },
      { to: '쪽지설정', expect: PATHS.inquiries, marker: 'inquiries', active: '쪽지설정', id: 'A:마이프로필→쪽지설정' },
      { to: '등록점검', expect: PATHS.publish, marker: 'publish', active: '등록점검', id: 'A:쪽지설정→등록점검' },
      { to: '기본정보', expect: PATHS.basic, marker: 'basic', active: '기본정보', id: 'A:등록점검→기본정보' },
    ];
    // insert 등록점검 hop from inquiries via going to publish then to basic — adjust sequence to match requested:
    // User asked: 기본→상세, 상세→마이프로필, 마이프로필→쪽지설정, 등록점검→기본정보
    // So after 쪽지설정, go to 등록점검 first then to 기본정보.
    for (const hop of hops) {
      // special: before last hop ensure we are on publish — already sequenced
      const d0 = dialogsSeen.length;
      const t0 = Date.now();
      const click = await clickText(cdp, '.mp-room__tab', hop.to);
      const s = await waitUrl(cdp, hop.expect, 4000);
      const elapsed = Date.now() - t0;
      const newDialogs = dialogsSeen.slice(d0);
      const ok =
        click.ok &&
        s.url === hop.expect &&
        s.marker === hop.marker &&
        s.activeTab === hop.active &&
        newDialogs.length === 0;
      rec(
        hop.id,
        ok ? 'PASS' : 'FAIL',
        ok ? `즉시 이동 (${elapsed}ms)` : `url=${s.url} marker=${s.marker} active=${s.activeTab} click=${click.ok} dialogs=${JSON.stringify(newDialogs)}`,
        { ...s, elapsed, click, newDialogs },
      );
    }

    // B history — build stack with clicks
    await goto(cdp, `${BASE}/#${PATHS.hub}`);
    await waitUrl(cdp, PATHS.hub);
    await clickText(cdp, '.mp-room__tab', '기본정보');
    await waitUrl(cdp, PATHS.basic);
    await clickText(cdp, '.mp-room__tab', '상세정보');
    await waitUrl(cdp, PATHS.detail);
    await clickText(cdp, '.mp-room__tab', '쪽지설정');
    await waitUrl(cdp, PATHS.inquiries);

    await evaluate(cdp, 'history.back()');
    await sleep(500);
    const back1 = await snapshot(cdp);
    await evaluate(cdp, 'history.back()');
    await sleep(500);
    const back2 = await snapshot(cdp);
    await evaluate(cdp, 'history.forward()');
    await sleep(500);
    const fwd1 = await snapshot(cdp);
    const histOk =
      back1.url === PATHS.detail &&
      back1.marker === 'detail' &&
      back1.activeTab === '상세정보' &&
      back2.url === PATHS.basic &&
      back2.marker === 'basic' &&
      back2.activeTab === '기본정보' &&
      fwd1.url === PATHS.detail &&
      fwd1.marker === 'detail';
    rec('B:history', histOk ? 'PASS' : 'FAIL', histOk ? '뒤로/앞으로 동기' : 'mismatch', { back1, back2, fwd1 });

    // C refresh
    for (const [key, path, active, marker] of [
      ['basic', PATHS.basic, '기본정보', 'basic'],
      ['inquiries', PATHS.inquiries, '쪽지설정', 'inquiries'],
      ['publish', PATHS.publish, '등록점검', 'publish'],
      ['hub', PATHS.hub, '마이프로필', 'hub'],
    ]) {
      await goto(cdp, `${BASE}/#${path}`);
      await waitUrl(cdp, path);
      await cdp.send('Page.reload', { ignoreCache: false });
      let s = null;
      for (let i = 0; i < 40; i++) {
        await sleep(200);
        s = await snapshot(cdp);
        if (s.hasTabs && s.url === path && s.marker === marker) break;
      }
      if (!s?.hasTabs) {
        await ensureTutor(cdp);
        await goto(cdp, `${BASE}/#${path}`);
        await cdp.send('Page.reload', { ignoreCache: false });
        for (let i = 0; i < 40; i++) {
          await sleep(200);
          s = await snapshot(cdp);
          if (s.hasTabs && s.url === path) break;
        }
      }
      const ok = s.url === path && s.marker === marker && s.activeTab === active;
      rec(`C:refresh:${key}`, ok ? 'PASS' : 'FAIL', ok ? '유지' : `url=${s.url} marker=${s.marker} active=${s.activeTab}`, s);
    }

    // D direct
    for (const [key, path, active, marker] of [
      ['hub', PATHS.hub, '마이프로필', 'hub'],
      ['basic', PATHS.basic, '기본정보', 'basic'],
      ['detail', PATHS.detail, '상세정보', 'detail'],
      ['inquiries', PATHS.inquiries, '쪽지설정', 'inquiries'],
      ['publish', PATHS.publish, '등록점검', 'publish'],
    ]) {
      await goto(cdp, `${BASE}/#${path}`);
      await sleep(500);
      const s = await snapshot(cdp);
      const ok = s.url === path && s.marker === marker && s.activeTab === active;
      rec(`D:direct:${key}`, ok ? 'PASS' : 'FAIL', ok ? '직접 진입 OK' : `url=${s.url} marker=${s.marker} active=${s.activeTab}`, s);
    }

    // E menus
    const menus = [
      { label: '내 등록', check: (u) => u === PATHS.hub || u.startsWith('/mypage/registrations/tutors/') },
      { label: '쪽지·후기함', check: (u) => u === '/mypage/messages' || u.startsWith('/mypage/messages/') },
      { label: '최근열람', check: (u) => u === '/mypage/recent' },
      { label: '찜한학생', check: (u) => u === '/mypage/student-review' },
      { label: '구매이력', check: (u) => u === '/mypage/plans' || u.startsWith('/mypage/plans') },
      { label: '계정설정', check: (u) => u === '/mypage/account' },
    ];
    for (const menu of menus) {
      await goto(cdp, `${BASE}/#${PATHS.hub}`);
      await sleep(400);
      const d0 = dialogsSeen.length;
      const click = await clickText(cdp, '.mypage-nav__link', menu.label);
      await sleep(700);
      const s = await snapshot(cdp);
      const activeOk = (s.activeNav || []).some((t) => t.includes(menu.label));
      const clickOk = click.ok && menu.check(s.url) && activeOk && dialogsSeen.length === d0;

      const directPath = menu.label === '내 등록' ? '/mypage/registrations' : {
        '쪽지·후기함': '/mypage/messages',
        최근열람: '/mypage/recent',
        찜한학생: '/mypage/student-review',
        구매이력: '/mypage/plans',
        계정설정: '/mypage/account',
      }[menu.label];
      await goto(cdp, `${BASE}/#${directPath}`);
      await sleep(700);
      const d = await snapshot(cdp);
      const directOk = menu.check(d.url);
      rec(
        `E:menu:${menu.label}`,
        clickOk && directOk ? 'PASS' : 'FAIL',
        clickOk && directOk ? '클릭·직접진입 일치' : `click=${s.url} direct=${d.url} active=${activeOk} found=${click.ok}`,
        { click: s, direct: d, activeOk },
      );
    }

    // F access
    await goto(cdp, `${BASE}/#${PATHS.access}`);
    await sleep(900);
    const access = await snapshot(cdp);
    const accessOk = access.url === PATHS.inquiries && access.marker === 'inquiries' && access.activeTab === '쪽지설정';
    rec('F:access', accessOk ? 'PASS' : 'FAIL', accessOk ? 'canonicalize OK' : JSON.stringify(access), access);

    // G bad id
    const histBefore = await evaluate(cdp, 'history.length');
    await goto(cdp, `${BASE}/#${PATHS.badId}`);
    await sleep(1000);
    const bad = await snapshot(cdp);
    const histAfter = await evaluate(cdp, 'history.length');
    const badOk = bad.url === PATHS.basic && bad.marker === 'basic' && bad.activeTab === '기본정보';
    rec(
      'G:badId',
      badOk ? 'PASS' : 'FAIL',
      badOk ? `대표로 정리 history ${histBefore}→${histAfter}` : JSON.stringify(bad),
      { bad, histBefore, histAfter },
    );

    // H unsaved observation
    await goto(cdp, `${BASE}/#${PATHS.basic}`);
    await waitUrl(cdp, PATHS.basic);
    const original = await evaluate(
      cdp,
      `document.querySelector('[data-p21-form="basic"] input[name="tutor_display_name"]')?.value || ''`,
    );
    const dirty = `${original}__DIRTY_TEST__`;
    await evaluate(
      cdp,
      `(() => {
        const input = document.querySelector('[data-p21-form="basic"] input[name="tutor_display_name"]');
        if (!input) return false;
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(input, ${JSON.stringify(dirty)});
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return input.value;
      })()`,
    );
    const d0 = dialogsSeen.length;
    await clickText(cdp, '.mp-room__tab', '상세정보');
    await waitUrl(cdp, PATHS.detail);
    const midDialogs = dialogsSeen.slice(d0);
    await clickText(cdp, '.mp-room__tab', '기본정보');
    await waitUrl(cdp, PATHS.basic);
    const after = await evaluate(
      cdp,
      `document.querySelector('[data-p21-form="basic"] input[name="tutor_display_name"]')?.value || ''`,
    );
    const unsaved = {
      movedWithoutAlert: midDialogs.length === 0,
      original,
      dirty,
      after,
      retained: after === dirty,
      lost: after === original,
    };
    rec(
      'H:unsaved',
      'OBSERVE',
      unsaved.movedWithoutAlert
        ? unsaved.retained
          ? '경고 없이 이동, 값 유지'
          : unsaved.lost
            ? '경고 없이 이동, 값 소실(리렌더)'
            : `경고 없이 이동, after=${after}`
        : `dialog=${JSON.stringify(midDialogs)}`,
      unsaved,
    );

    ws.close();
  } finally {
    chrome.kill();
    await sleep(300);
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      /* */
    }
  }

  const fails = results.filter((r) => r.result === 'FAIL');
  const report = { summary: fails.length ? 'FAIL' : 'PASS', failCount: fails.length, dialogsSeen, results };
  writeFileSync(join(process.cwd(), 'scripts/_browser-verify-tutor-route-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(fails.length ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(2);
});
