import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');
import * as fs from 'node:fs';
import * as path from 'node:path';

process.env.PLAYWRIGHT_BROWSERS_PATH = 'C:\\Users\\jetty\\AppData\\Local\\ms-playwright';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Users\\jetty\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe'
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'ko-KR',
  });
  const page = await context.newPage();

  const consoleLogs = [];
  const networkErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleLogs.push(`[console.error] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    consoleLogs.push(`[pageerror] ${err.message}`);
  });
  page.on('response', res => {
    if (res.status() >= 400) {
      networkErrors.push(`[${res.status()}] ${res.url()}`);
    }
  });

  console.log('Navigating to https://study114.net ...');
  await page.goto('https://study114.net', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  const title = await page.title();
  const url = page.url();
  console.log('Title:', title);
  console.log('Current URL:', url);

  // Check room cards on home
  const roomCards = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="room"], a[href*="myshop"]'));
    return links.map(a => ({ text: a.innerText.trim().replace(/\n+/g, ' '), href: a.getAttribute('href') }));
  });
  console.log('Room / Myshop links on Home:', JSON.stringify(roomCards, null, 2));

  // Check search link
  const searchLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="search"]'));
    return links.map(a => ({ text: a.innerText.trim().replace(/\n+/g, ' '), href: a.getAttribute('href') }));
  });
  console.log('Search links on Home:', JSON.stringify(searchLinks, null, 2));

  // Search API or items on Search UI
  console.log('\nNavigating to https://study114.net/search/#/search/room ...');
  await page.goto('https://study114.net/search/#/search/room', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const searchItems = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="study-room"], a[href*="myshop"], a[href*="room"]'));
    return links.map(a => ({ text: a.innerText.trim().replace(/\n+/g, ' '), href: a.getAttribute('href') }));
  });
  console.log('Study room links on Search Page:', JSON.stringify(searchItems.slice(0, 10), null, 2));

  console.log('\nConsole Errors:', consoleLogs);
  console.log('\nNetwork Errors:', networkErrors);

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
