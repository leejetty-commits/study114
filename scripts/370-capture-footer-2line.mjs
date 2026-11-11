/**
 * 370-보완2 — 홈 푸터 1920·1280·390 캡처
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../docs/worklog/2026/11/shots-370-2line');
const BASE = process.env.HOME_UI_URL || 'http://127.0.0.1:5174';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

for (const width of [1920, 1280, 390]) {
  await page.setViewportSize({ width, height: width <= 400 ? 844 : 900 });
  await page.goto(`${BASE}/#/guest`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.site-footer__company-row', { timeout: 15000 });
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const name = `home-footer-${width}.png`;
  await page.locator('.site-footer').screenshot({ path: resolve(OUT, name) });
  console.log('wrote', name);
}

const text = await page.locator('.site-footer__company').innerText();
const hosting = /호스팅/.test(text);
const rows = await page.locator('.site-footer__company-row').count();
console.log(JSON.stringify({ rows, hosting, text: text.replace(/\s+/g, ' ') }, null, 2));
await browser.close();
