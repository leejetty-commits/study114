/**
 * 홈 BASIC 카드 vs 쪽지설정 샘플 카드 폭·화살표 실측 (Playwright)
 * Usage: node scripts/measure-inquiry-basic-cards.mjs
 */
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const BASE = process.env.STUDY114_PREVIEW_URL || 'http://127.0.0.1:5174';
const OUT = resolve(process.cwd(), 'test-results/inq-measure');
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
];

function round1(n) {
  return Math.round(Number(n) * 10) / 10;
}

async function measureHomeCard(page, kind) {
  await page.waitForSelector('.home-shell .home-body.home-body--with-promo > .home-main', { timeout: 20000 });
  const sel = `.home-shell .guest-browse-lists .expo-basic--${kind}.expo-hcard`;
  try {
    await page.waitForFunction(
      () => !document.querySelector('[data-home-basic-status]'),
      null,
      { timeout: 12000 },
    );
  } catch {
    /* status hint may remain on error */
  }
  try {
    await page.waitForSelector(sel, { timeout: 12000 });
  } catch {
    return { source: 'missing-live', selector: sel, width: null, listWidth: null };
  }
  return page.evaluate((s) => {
    const live = document.querySelector(s);
    if (!live) return { source: 'missing-live', selector: s, width: null, listWidth: null };
    const r = live.getBoundingClientRect();
    return {
      source: 'live',
      selector: s,
      width: r.width,
      listWidth: live.closest('.browse-list--table')?.getBoundingClientRect().width ?? null,
    };
  }, sel);
}

async function injectAndMeasureSample(page, kind) {
  return page.evaluate(async (k) => {
    const { bindInquirySampleGuides } = await import('/src/inquiry-settings/sample-ui.js');
    const { renderInquirySampleCard } = await import('/src/inquiry-settings/sample-cards.js');

    const host = document.createElement('div');
    host.id = `inq-measure-host-${k}`;
    host.style.cssText = 'width:max-content;max-width:none;padding:12px;background:#fff;';
    host.innerHTML = renderInquirySampleCard({
      kind: k,
      receiving: true,
      kicker: '쪽지 받는 중',
      callout: '여기가 쪽지 관련 표시 위치입니다. 받는 중이면 ✉가 활성입니다.',
    });
    document.body.appendChild(host);
    bindInquirySampleGuides(host);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise((r) => setTimeout(r, 80));

    const card = host.querySelector(`.expo-basic--${k}.expo-hcard`) || host.querySelector('.expo-hcard');
    const btn = host.querySelector('.item-actions [title^="쪽지"]');
    const svg = host.querySelector('[data-inq-guide]');
    const callout = host.querySelector('[data-inq-callout]');
    const homeList = host.querySelector('.inq-sample__home-context .browse-list');
    if (!card) return { width: 0, arrow: null, selector: '[data-inq-sample] .expo-hcard' };

    const cr = card.getBoundingClientRect();
    let arrow = null;
    if (btn && svg && callout) {
      const br = btn.getBoundingClientRect();
      const sr = svg.getBoundingClientRect();
      const circle = svg.querySelector('circle');
      const path = svg.querySelector('path[marker-end]');
      const cx = circle ? Number(circle.getAttribute('cx')) + sr.left : NaN;
      const cy = circle ? Number(circle.getAttribute('cy')) + sr.top : NaN;
      const btnCx = br.left + br.width / 2;
      const btnCy = br.top + br.height / 2;
      const line = path ? path.getAttribute('d') : '';
      const call = callout.getBoundingClientRect();
      arrow = {
        btnCenter: { x: round(btnCx), y: round(btnCy) },
        circleCenter: { x: round(cx), y: round(cy) },
        dx: round(cx - btnCx),
        dy: round(cy - btnCy),
        path: line,
        calloutTop: round(call.top),
        btnBottom: round(br.bottom),
        continuous: Boolean(circle && path && line && !line.includes('NaN') && !line.includes('undefined')),
        pointsAtButton: Math.abs(cx - btnCx) <= 2 && Math.abs(cy - btnCy) <= 2,
        calloutUnderLine: Math.abs(call.left + call.width / 2 - btnCx) <= 24,
        clipped: cr.width > 8 && (circle.getBoundingClientRect?.() ? false : false),
      };
    }
    function round(n) {
      return Math.round(n * 10) / 10;
    }
    return {
      selector: `[data-inq-sample] .expo-basic--${k}.expo-hcard`,
      width: cr.width,
      listWidth: homeList?.getBoundingClientRect().width ?? null,
      transform: getComputedStyle(card).transform,
      maxWidth: getComputedStyle(card).maxWidth,
      arrow,
    };
  }, kind);
}

async function tryRealInquiries(page, role) {
  const action = role === 'tutor' ? 'dev-login-tutor' : 'dev-login-room';
  await page.goto(`${BASE}/#/guest`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(`[data-action="${action}"]`, { timeout: 15000 });
  await page.click(`[data-action="${action}"]`);
  await page.waitForTimeout(1800);
  const mypageBtn = page.locator('.preview-toolbar__btn', { hasText: '마이페이지' });
  if (await mypageBtn.count()) {
    await mypageBtn.click();
    await page.waitForTimeout(1200);
  }
  const tab = page.locator('a.mp-room__tab', { hasText: '쪽지설정' });
  if (await tab.count()) {
    await tab.click();
  } else {
    const dest = await page.evaluate((r) => {
      const hash = location.hash || '';
      const tm = hash.match(/tutors\/(\d+)/);
      if (r === 'tutor' && tm) return `#/mypage/registrations/tutors/${tm[1]}/inquiries`;
      const rm = hash.match(/study-rooms\/(\d+)/);
      if (r !== 'tutor' && rm) return `#/mypage/registrations/study-rooms/${rm[1]}/inquiries`;
      const a = document.querySelector(r === 'tutor' ? 'a[href*="/tutors/"]' : 'a[href*="/study-rooms/"]');
      const href = a?.getAttribute('href') || '';
      const idm = href.match(/\/(\d+)/);
      if (idm) {
        return r === 'tutor'
          ? `#/mypage/registrations/tutors/${idm[1]}/inquiries`
          : `#/mypage/registrations/study-rooms/${idm[1]}/inquiries`;
      }
      return null;
    }, role);
    if (!dest) {
      return { ok: false, reason: 'no-inquiries-href', hash: await page.evaluate(() => location.hash) };
    }
    await page.goto(`${BASE}/${dest}`);
  }
  try {
    await page.waitForSelector('[data-inq-sample] .expo-hcard', { timeout: 20000 });
  } catch {
    return { ok: false, reason: 'sample-not-rendered', hash: await page.evaluate(() => location.hash) };
  }
  await page.waitForTimeout(600);
  const kind = role === 'tutor' ? 'tutor' : 'study_room';
  const receiving = page.locator(`label.p21-inq-choice:has-text("쪽지 받는 중")`);
  if (await receiving.count()) {
    await receiving.click();
    await page.waitForTimeout(200);
  }
  const measured = await page.evaluate((k) => {
    const card = document.querySelector(`[data-inq-sample] .expo-basic--${k}.expo-hcard`);
    const btnEl = document.querySelector('[data-inq-sample].inq-sample--open .item-actions [title^="쪽지"]');
    const svg = document.querySelector('[data-inq-sample].inq-sample--open [data-inq-guide]');
    const callout = document.querySelector('[data-inq-sample].inq-sample--open [data-inq-callout]');
    if (!card) return { width: 0 };
    const cr = card.getBoundingClientRect();
    let arrow = null;
    if (btnEl && svg && callout) {
      const br = btnEl.getBoundingClientRect();
      const sr = svg.getBoundingClientRect();
      const circle = svg.querySelector('circle');
      const path = svg.querySelector('path[marker-end]');
      const cx = circle ? Number(circle.getAttribute('cx')) + sr.left : NaN;
      const cy = circle ? Number(circle.getAttribute('cy')) + sr.top : NaN;
      const btnCx = br.left + br.width / 2;
      const btnCy = br.top + br.height / 2;
      arrow = {
        dx: Math.round((cx - btnCx) * 10) / 10,
        dy: Math.round((cy - btnCy) * 10) / 10,
        path: path?.getAttribute('d') || '',
        continuous: Boolean(circle && path),
        pointsAtButton: Math.abs(cx - btnCx) <= 2 && Math.abs(cy - btnCy) <= 2,
      };
    }
    const order = [
      'p21-inq__lead',
      'p21-inq-block--status',
      'p21-inq-block--edit',
      'p21-inq-block--contact',
      'p21-inq-save',
      'p21-inq-block--samples',
    ].map((cls) => {
      const el = document.querySelector(`.${cls}, [class~="${cls}"]`);
      return el ? el.getBoundingClientRect().top : null;
    });
    return { width: cr.width, arrow, structureTops: order, selector: `[data-inq-sample] .expo-basic--${k}.expo-hcard` };
  }, kind);
  return { ok: true, ...measured };
}

mkdirSync(OUT, { recursive: true });

const results = {
  tutorHome: {},
  roomHome: {},
  tutorSample: {},
  roomSample: {},
  tutorPage: {},
  roomPage: {},
};

let failed = 0;
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ headless: true, executablePath: chromePath });
try {
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(`${BASE}/#/guest`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('.home-shell', { timeout: 20000 });
    await page.waitForTimeout(800);

    const homeShot = page.locator('.home-shell .guest-browse-lists').first();
    if (await homeShot.count()) {
      await homeShot.screenshot({ path: resolve(OUT, `home-lists-${vp.name}.png`) }).catch(() => {});
    }

    results.tutorHome[vp.name] = await measureHomeCard(page, 'tutor');
    results.roomHome[vp.name] = await measureHomeCard(page, 'study_room');
    results.tutorSample[vp.name] = await injectAndMeasureSample(page, 'tutor');
    results.roomSample[vp.name] = await injectAndMeasureSample(page, 'study_room');

    await page.locator('#inq-measure-host-tutor, #inq-measure-host-study_room').first().screenshot({
      path: resolve(OUT, `guest-sample-${vp.name}.png`),
    }).catch(() => page.screenshot({ path: resolve(OUT, `guest-sample-${vp.name}.png`) }));

    const tutorPage = await tryRealInquiries(page, 'tutor');
    results.tutorPage[vp.name] = tutorPage;
    if (tutorPage.ok) {
      await page.locator('[data-inq-sample].inq-sample--open').screenshot({
        path: resolve(OUT, `tutor-inquiries-sample-${vp.name}.png`),
      }).catch(() => {});
      await page.screenshot({ path: resolve(OUT, `tutor-inquiries-${vp.name}.png`), fullPage: true });
    }

    await page.goto(`${BASE}/#/guest`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    const roomPage = await tryRealInquiries(page, 'study_room');
    results.roomPage[vp.name] = roomPage;
    if (roomPage.ok) {
      await page.locator('[data-inq-sample].inq-sample--open').screenshot({
        path: resolve(OUT, `room-inquiries-sample-${vp.name}.png`),
      }).catch(() => {});
      await page.screenshot({ path: resolve(OUT, `room-inquiries-${vp.name}.png`), fullPage: true });
    }
    await page.close();
  }
} finally {
  await browser.close();
}

function w(obj) {
  return obj && Number.isFinite(obj.width) ? round1(obj.width) : 'n/a';
}

console.log('\n=== CARD WIDTH (px) ===');
console.log('화면 | 셀렉터 | desktop | tablet | mobile | source');
const rows = [
  ['과외쌤 홈 BASIC', results.tutorHome],
  ['과외쌤 샘플(주입)', results.tutorSample],
  ['공부방 홈 BASIC', results.roomHome],
  ['공부방 샘플(주입)', results.roomSample],
];
for (const [name, set] of rows) {
  console.log(
    [
      name,
      set.desktop?.selector || '',
      w(set.desktop),
      w(set.tablet),
      w(set.mobile),
      set.desktop?.source || '',
    ].join(' | '),
  );
}

console.log('\n=== DIFF sample - home ===');
for (const kind of ['tutor', 'room']) {
  const home = kind === 'tutor' ? results.tutorHome : results.roomHome;
  const sample = kind === 'tutor' ? results.tutorPage : results.roomPage;
  for (const vp of VIEWPORTS) {
    const homeW = home[vp.name];
    const sampleW = sample[vp.name];
    if (homeW?.source !== 'live' || !Number.isFinite(homeW?.width)) {
      failed += 1;
      console.log(`${kind} ${vp.name}: HOME_LIVE_MISSING source=${homeW?.source || 'n/a'}`);
      continue;
    }
    if (!sampleW?.ok || !Number.isFinite(sampleW.width)) {
      failed += 1;
      console.log(`${kind} ${vp.name}: SAMPLE_MISSING ${sampleW?.reason || ''}`);
      continue;
    }
    const d = round1(sampleW.width - homeW.width);
    const match = d === 0 ? 'WIDTH_MATCH' : 'WIDTH_MISMATCH';
    if (d !== 0) failed += 1;
    console.log(
      `${kind} ${vp.name}: home=${round1(homeW.width)} sample=${round1(sampleW.width)} diff=${d}px ${match} homeSource=${homeW.source}`,
    );
  }
}

console.log('\n=== ARROW (inquiries page sample) ===');
for (const kind of ['tutor', 'room']) {
  const set = kind === 'tutor' ? results.tutorPage : results.roomPage;
  for (const vp of VIEWPORTS) {
    const arrow = set[vp.name]?.arrow;
    const ok = Boolean(arrow?.continuous && arrow?.pointsAtButton);
    if (!ok) failed += 1;
    console.log(`${kind} ${vp.name}: ${ok ? 'ALIGNED' : 'NOT_ALIGNED'} ${JSON.stringify(arrow)}`);
  }
}

console.log('\n=== REAL INQUIRIES PAGE ===');
for (const kind of ['tutor', 'room']) {
  const set = kind === 'tutor' ? results.tutorPage : results.roomPage;
  for (const vp of VIEWPORTS) {
    const row = set[vp.name];
    if (!row?.ok) {
      failed += 1;
      console.log(`${kind} ${vp.name}: PAGE_UNAVAILABLE ${row?.reason || ''} ${row?.hash || ''}`);
      continue;
    }
    const home = kind === 'tutor' ? results.tutorHome[vp.name] : results.roomHome[vp.name];
    if (home?.source !== 'live' || !Number.isFinite(home?.width)) {
      failed += 1;
      console.log(`${kind} ${vp.name}: HOME_LIVE_MISSING source=${home?.source || 'n/a'}`);
      continue;
    }
    const d = round1((row.width || 0) - (home?.width || 0));
    const widthMatch = d === 0;
    const arrowOk = Boolean(row.arrow?.continuous && row.arrow?.pointsAtButton);
    if (!widthMatch || !arrowOk) failed += 1;
    console.log(
      `${kind} ${vp.name}: width=${round1(row.width)} diff=${d} ${widthMatch ? 'WIDTH_MATCH' : 'WIDTH_MISMATCH'} arrow=${arrowOk ? 'ALIGNED' : 'NOT_ALIGNED'} ${JSON.stringify(row.arrow)} tops=${JSON.stringify(row.structureTops)}`,
    );
  }
}

console.log(`\nscreenshots: ${OUT}`);
if (failed) {
  console.error(`\nmeasure FAILED (${failed})`);
  process.exit(1);
}
console.log('\nmeasure OK');
