/**
 * 370 — 홈 푸터 1280·390 캡처 + 사업자정보 확인 링크 target=_blank 확인
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../docs/worklog/2026/11/shots-370');
const BASE = process.env.HOME_UI_URL || 'http://127.0.0.1:5174';

mkdirSync(OUT, { recursive: true });

async function shot(page, width, name) {
  await page.setViewportSize({ width, height: width <= 400 ? 844 : 900 });
  await page.goto(`${BASE}/#/guest`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.site-footer__company', { timeout: 15000 });
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.locator('.site-footer').screenshot({
    path: resolve(OUT, name),
  });
  console.log('wrote', name);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await shot(page, 1280, 'home-footer-1280.png');
await shot(page, 390, 'home-footer-390.png');

const check = page.locator('.site-footer__biz-check');
const href = await check.getAttribute('href');
const target = await check.getAttribute('target');
const rel = await check.getAttribute('rel');
console.log(
  JSON.stringify(
    {
      bizCheckHref: href,
      target,
      rel,
      ok:
        !!href &&
        href.includes('ftc.go.kr') &&
        href.includes('4712901819') &&
        target === '_blank',
    },
    null,
    2,
  ),
);

const text = await page.locator('.site-footer').innerText();
console.log('--- footer text ---');
console.log(text);

await browser.close();
