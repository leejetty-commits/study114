import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');
import * as path from 'node:path';

const SHOTS_DIR = 'd:\\work\\study114\\.wt\\integrity\\tmp-integrity\\shots\\guest';

async function checkRoomDetail(id, numPrefix) {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Users\\jetty\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe'
  });

  const url = `https://study114.net/#/myshop/study-room/${id}`;
  const detailReport = { id, url, pc: {}, mobile: {} };

  // PC
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: 'ko-KR',
    });
    const page = await context.newPage();
    const consoleLogs = [];
    const networkErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') consoleLogs.push(`[console.error] ${msg.text()}`);
    });
    page.on('pageerror', err => {
      consoleLogs.push(`[pageerror] ${err.message}`);
    });
    page.on('response', res => {
      if (res.status() >= 400) networkErrors.push(`[${res.status()}] ${res.url()}`);
    });

    console.log(`[PC] Navigating to Room ${id}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 35000 });
    await page.waitForTimeout(3000);

    const shotPath = path.join(SHOTS_DIR, `${numPrefix}-detail-room-${id}-pc.png`);
    await page.screenshot({ path: shotPath, fullPage: true });

    // Extract DOM texts: sections, buttons, contact info
    const pageData = await page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll('section, [class*="section"], [class*="shop-"], .myshop-section')).map(s => ({
        className: s.className,
        heading: s.querySelector('h1, h2, h3, h4')?.innerText?.trim() || ''
      }));

      const inquiryBtn = Array.from(document.querySelectorAll('button, a')).find(el => el.innerText.includes('문의') || el.innerText.includes('쪽지'));
      const inquiryInfo = inquiryBtn ? {
        tag: inquiryBtn.tagName,
        text: inquiryBtn.innerText.trim(),
        href: inquiryBtn.getAttribute('href'),
        disabled: inquiryBtn.hasAttribute('disabled') || inquiryBtn.classList.contains('disabled')
      } : null;

      // Check for forbidden keys (phone, detailed address, email, etc.)
      const bodyText = document.body.innerText;
      const hasPhone = /01[016789]-?\d{3,4}-?\d{4}/.test(bodyText);
      const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(bodyText);

      return {
        title: document.title,
        heading: document.querySelector('h1')?.innerText?.trim(),
        sections,
        inquiryInfo,
        hasPhone,
        hasEmail,
        bodySnippet: bodyText.slice(0, 1500)
      };
    });

    detailReport.pc = {
      ...pageData,
      consoleLogs,
      networkErrors,
      shotPath
    };
    await context.close();
  }

  // Mobile
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      locale: 'ko-KR',
    });
    const page = await context.newPage();
    const consoleLogs = [];
    const networkErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') consoleLogs.push(`[console.error] ${msg.text()}`);
    });
    page.on('pageerror', err => {
      consoleLogs.push(`[pageerror] ${err.message}`);
    });
    page.on('response', res => {
      if (res.status() >= 400) networkErrors.push(`[${res.status()}] ${res.url()}`);
    });

    console.log(`[Mobile] Navigating to Room ${id}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 35000 });
    await page.waitForTimeout(3000);

    const shotPath = path.join(SHOTS_DIR, `${numPrefix}-detail-room-${id}-m.png`);
    await page.screenshot({ path: shotPath, fullPage: true });

    detailReport.mobile = {
      consoleLogs,
      networkErrors,
      shotPath
    };
    await context.close();
  }

  await browser.close();
  return detailReport;
}

async function run() {
  const r6 = await checkRoomDetail(6, '04');
  console.log('Room 6 Summary:', JSON.stringify(r6.pc.inquiryInfo), 'hasPhone:', r6.pc.hasPhone, 'hasEmail:', r6.pc.hasEmail);

  const r7 = await checkRoomDetail(7, '05');
  console.log('Room 7 Summary:', JSON.stringify(r7.pc.inquiryInfo), 'hasPhone:', r7.pc.hasPhone, 'hasEmail:', r7.pc.hasEmail);

  const r8 = await checkRoomDetail(8, '06');
  console.log('Room 8 Summary:', JSON.stringify(r8.pc.inquiryInfo), 'hasPhone:', r8.pc.inquiryInfo, 'hasEmail:', r8.pc.hasEmail);
}

run().catch(console.error);
