/**
 * 336 헤더 태그라인 캡처·실측 — 홈·찾기·공부방·과외쌤 × 1920·1280·390
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs/worklog/2026/11/shots-336-header-tagline');
mkdirSync(OUT, { recursive: true });

const PAGES = [
  { key: 'home', url: 'http://127.0.0.1:5174/#/guest' },
  { key: 'find', url: 'http://127.0.0.1:5176/' },
  { key: 'study-room', url: 'http://127.0.0.1:5175/' },
  { key: 'tutor', url: 'http://127.0.0.1:5177/' },
];
const WIDTHS = [1920, 1280, 390];

async function measure(page) {
  return page.evaluate(() => {
    const header = document.querySelector('.home-header');
    const main = document.querySelector('.home-header__main, .home-header__inner');
    const inner = document.querySelector('.home-header__inner');
    const logo = document.querySelector('.home-header__logo');
    const symbol = document.querySelector('.home-header__symbol');
    const wordmark = document.querySelector('.home-header__wordmark');
    const tagline = document.querySelector('.home-header__tagline');
    const gnb = document.querySelector('.home-gnb__item');
    const r = (el) => (el ? el.getBoundingClientRect() : null);
    const cs = (el) => (el ? getComputedStyle(el) : null);
    const tagCs = cs(tagline);
    const gnbCs = cs(gnb);
    return {
      headerH: r(header)?.height ?? null,
      innerH: r(inner)?.height ?? null,
      mainH: r(main)?.height ?? null,
      symbol: symbol ? { w: r(symbol).width, h: r(symbol).height } : null,
      wordmark: wordmark ? { w: r(wordmark).width, h: r(wordmark).height } : null,
      tagline: tagline
        ? {
            text: tagline.textContent?.trim(),
            visible: tagCs.display !== 'none' && r(tagline).width > 0,
            fontSize: tagCs.fontSize,
            fontWeight: tagCs.fontWeight,
            color: tagCs.color,
            bottom: r(tagline).bottom,
          }
        : null,
      wordmarkBottom: wordmark ? r(wordmark).bottom : null,
      gapWordmarkTagline:
        wordmark && tagline && tagCs.display !== 'none'
          ? r(tagline).left - r(wordmark).right
          : null,
      gnbFontSize: gnbCs?.fontSize ?? null,
      gnbWrap: (() => {
        const nav = document.querySelector('.home-gnb');
        if (!nav) return null;
        return nav.scrollHeight > nav.clientHeight + 2;
      })(),
      logoHref: logo?.getAttribute('href') || null,
      wordmarkAlt: wordmark?.getAttribute('alt') || null,
    };
  });
}

const report = {};
const browser = await chromium.launch({ headless: true });

for (const width of WIDTHS) {
  const height = width === 390 ? 844 : 900;
  for (const { key, url } of PAGES) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 }).catch(() => {});
    await page.waitForSelector('.home-header__logo', { timeout: 30_000 });
    await page.waitForTimeout(400);
    const m = await measure(page);
    const name = `${key}-${width}.png`;
    await page.screenshot({ path: join(OUT, name), fullPage: false });
    report[`${key}-${width}`] = m;
    console.log(name, JSON.stringify(m));
    await context.close();
  }
}

await browser.close();
writeFileSync(join(OUT, 'measure.json'), JSON.stringify(report, null, 2));
console.log('done →', OUT);
