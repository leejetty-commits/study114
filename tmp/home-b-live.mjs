import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const outDir = 'D:/work/study114/tmp/home-b-deploy';
fs.mkdirSync(outDir, { recursive: true });

const html = await fetch('https://study114.net/?nocache=' + Date.now(), { cache: 'no-store' }).then((r) => r.text());
const assets = [...html.matchAll(/assets\/[^"' ]+\.css/g)].map((m) => m[0]);
const cssHits = [];
for (const asset of assets) {
  const css = await fetch('https://study114.net/' + asset + '?nocache=' + Date.now(), { cache: 'no-store' }).then((r) => r.text());
  cssHits.push({
    asset,
    bestHot: css.includes('.live-rail-slot--best{--rail-tone:var(--rail-tone-hot)}') || css.includes('.live-rail-slot--best {\n  --rail-tone: var(--rail-tone-hot);'),
    bestOpen: css.includes('.live-rail-best__open'),
    len: css.length,
  });
}
fs.writeFileSync(path.join(outDir, 'css.json'), JSON.stringify({ assets, cssHits }, null, 2));
console.log('CSS', JSON.stringify(cssHits));

function measure() {
  const s = document.querySelector('.live-rail-slot--best');
  if (!s) return { missing: true, hash: location.hash, loggedOut: !document.body.innerText.includes('로그아웃') };
  const b = s.querySelector('.live-rail-slot__band');
  const t = s.querySelector('.live-rail-slot__title');
  const first = document.querySelector('[data-right-rail-slot] .live-rail-slot');
  return {
    hash: location.hash,
    loggedOut: ![...document.querySelectorAll('a,button')].some((e) => (e.textContent || '').trim() === '로그아웃'),
    tag: b.tagName,
    bg: getComputedStyle(b).backgroundColor,
    fg: getComputedStyle(t).color,
    title: t.textContent.trim(),
    state: s.dataset.railState,
    first: first === s,
    openTags: [...s.querySelectorAll('[data-concern-best-open]')].map((e) => e.tagName),
    emptyText: (s.querySelector('.live-rail-empty') || {}).textContent || '',
    rooms: [...document.querySelectorAll('.live-rail-slot--room .live-rail-slot__band')].map((e) => getComputedStyle(e).backgroundColor),
    order: [...document.querySelectorAll('[data-right-rail-slot] .live-rail-slot')].map((e) => e.className.replace('live-rail-slot ', '')).join('|'),
    itemCount: s.querySelectorAll('.live-rail-best__item').length,
  };
}
function measurePop() {
  const p = document.querySelector('.rail-popup');
  if (!p) return null;
  const h = p.querySelector('.rail-popup__head');
  return {
    kind: p.dataset.railPopupKind,
    bg: h ? getComputedStyle(h).backgroundColor : null,
    text: p.innerText.slice(0, 240).replace(/\n/g, ' / '),
    guest: !!p.querySelector('.rail-popup__guest'),
    login: !!p.querySelector('.rail-popup__login'),
  };
}

const browser = await chromium.launch({ channel: 'chrome' });
const results = {};
for (const w of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 1100 } });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', (e) => errors.push(String(e)));
  pg.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await pg.goto('https://study114.net/?nocache=' + Date.now() + '#/guest', { waitUntil: 'domcontentloaded' });
  await pg.waitForSelector('.live-rail-slot--best', { timeout: 15000 });
  await pg.waitForTimeout(1500);
  const rail = await pg.evaluate(measure);
  const d = { rail, errors: [] };
  await pg.screenshot({ path: path.join(outDir, `rail-${w}.png`) });
  if (rail.state === 'empty' || rail.tag === 'BUTTON') {
    const band = pg.locator('.live-rail-slot--best .live-rail-slot__band');
    await band.scrollIntoViewIfNeeded();
    await band.click();
    await pg.waitForTimeout(800);
    d.clickBand = await pg.evaluate(measurePop);
    await pg.screenshot({ path: path.join(outDir, `empty-band-${w}.png`) });
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(300);
    d.focusBack = await pg.evaluate(() => document.activeElement && document.activeElement.className);
    const emptyBtn = pg.locator('.live-rail-slot--best button.live-rail-empty');
    if (await emptyBtn.count()) {
      await emptyBtn.first().focus();
      await pg.keyboard.press('Enter');
      await pg.waitForTimeout(700);
      d.enter = await pg.evaluate(measurePop);
      await pg.keyboard.press('Escape');
      await pg.waitForTimeout(300);
    }
    await pg.evaluate(() => {
      const b = document.querySelector('.live-rail-slot--best .live-rail-slot__band');
      if (b) b.focus({ focusVisible: true });
    });
    d.ring = await pg.evaluate(() => {
      const b = document.activeElement;
      const cs = getComputedStyle(b);
      return { className: b.className, focusVisible: b.matches(':focus-visible'), outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor };
    });
    if (w === 1280) await pg.screenshot({ path: path.join(outDir, 'focus-ring-1280.png') });
    await pg.keyboard.press(' ');
    await pg.waitForTimeout(700);
    d.space = await pg.evaluate(measurePop);
  } else {
    const item = pg.locator('.live-rail-best__item').first();
    if (await item.count()) {
      await item.scrollIntoViewIfNeeded();
      await item.click();
      await pg.waitForTimeout(1200);
      d.clickItem = await pg.evaluate(measurePop);
      await pg.screenshot({ path: path.join(outDir, `posts-popup-${w}.png`) });
    }
  }
  d.errors = errors.filter((e) => !/Failed to load resource/i.test(e) || /best|rail|popup/i.test(e));
  d.errorCount = errors.length;
  d.errorSample = [...new Set(errors)].slice(0, 8);
  results[w] = d;
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(outDir, 'live.json'), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
