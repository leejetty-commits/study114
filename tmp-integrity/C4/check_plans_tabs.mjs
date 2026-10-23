import { STATE_FILE, BASE_URL, OUT_DIR, SHOTS_DIR, chromium, setupSafetyRoute } from './common.mjs';
import path from 'path';
import fs from 'fs';

async function checkPlansTabs() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STATE_FILE, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await setupSafetyRoute(page);

  await page.goto(`${BASE_URL}/#/plans`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 1. 노출상품 클릭
  console.log('Navigating to 노출상품...');
  const exposureLink = await page.$('a:has-text("노출상품"), button:has-text("노출상품")');
  if (exposureLink) {
    await exposureLink.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SHOTS_DIR, '10-08-plans-exposure.png'), fullPage: true });
  }

  const buttonsOnExposure = await page.$$eval('button, a.btn, input[type="submit"]', els => els.map(e => ({
    text: e.innerText.trim(),
    tag: e.tagName,
    disabled: e.disabled || e.getAttribute('aria-disabled') === 'true',
    href: e.getAttribute('href')
  })));
  console.log('Buttons on 노출상품:', buttonsOnExposure);

  // 2. 쪽지권 클릭
  console.log('Navigating to 쪽지권...');
  const msgTicketLink = await page.$('a:has-text("쪽지권"), button:has-text("쪽지권")');
  if (msgTicketLink) {
    await msgTicketLink.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SHOTS_DIR, '10-09-plans-ticket.png'), fullPage: true });
  }

  const buttonsOnTicket = await page.$$eval('button, a.btn, input[type="submit"]', els => els.map(e => ({
    text: e.innerText.trim(),
    tag: e.tagName,
    disabled: e.disabled || e.getAttribute('aria-disabled') === 'true',
    href: e.getAttribute('href')
  })));
  console.log('Buttons on 쪽지권:', buttonsOnTicket);

  await browser.close();
}

checkPlansTabs().catch(console.error);
