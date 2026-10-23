import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const out = 'D:/work/study114/.wt/279-detail-step-buttons/tmp/279-shots';
await mkdir(out, { recursive: true });

function meBody(role) {
  return JSON.stringify({
    ok: true,
    authenticated: true,
    needs_basic_register: false,
    user: {
      user_id: 910279,
      email: role === 'tutor' ? 'tutor279@example.com' : 'room279@example.com',
      role_type: role === 'tutor' ? 'tutor' : 'study_room_owner',
      name: role === 'tutor' ? '검수과외' : '검수공부방',
      email_verified: true,
      needs_account_contact: false,
    },
  });
}

async function openPage(browser, role) {
  const page = await browser.newPage();
  page.on('dialog', (dialog) => {
    page._lastDialog = { type: dialog.type(), message: dialog.message() };
    dialog.dismiss().catch(() => {});
  });
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/api/auth/me.php')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: meBody(role),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, message: 'local api off' }),
    });
  });
  return page;
}

async function measure(page, url, file) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.register-nav', { timeout: 15000 });
  await page.locator('.register-nav').scrollIntoViewIfNeeded();
  const info = await page.evaluate(() => {
    const nav = document.querySelector('.register-nav');
    const buttons = [...nav.querySelectorAll('button')].map((b) => {
      const r = b.getBoundingClientRect();
      return {
        text: b.textContent.replace(/\s+/g, ' ').trim(),
        action: b.getAttribute('data-action'),
        x: Math.round(r.x),
        y: Math.round(r.y),
        right: Math.round(r.right),
        bottom: Math.round(r.bottom),
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    });
    const nr = nav.getBoundingClientRect();
    const innerWidth = window.innerWidth;
    const overflowing = buttons.filter((b) => b.x < -1 || b.right > innerWidth + 1);
    return {
      buttons,
      navRight: Math.round(nr.right),
      innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      buttonOverflow: overflowing,
    };
  });
  await page.locator('.register-nav').screenshot({ path: `${out}/${file}.png` });
  return info;
}

const browser = await chromium.launch({ headless: true });
const shots = [
  { role: 'room', base: 'http://127.0.0.1:5185', path: '/#/register/lesson', name: 'room-lesson' },
  { role: 'room', base: 'http://127.0.0.1:5185', path: '/#/register/facility', name: 'room-facility' },
  { role: 'tutor', base: 'http://127.0.0.1:5187', path: '/#/register/lesson', name: 'tutor-lesson' },
  { role: 'tutor', base: 'http://127.0.0.1:5187', path: '/#/register/contact', name: 'tutor-contact' },
  { role: 'tutor', base: 'http://127.0.0.1:5187', path: '/#/register/basic', name: 'tutor-basic' },
];
const viewports = [
  { w: 1280, h: 900, tag: '1280' },
  { w: 390, h: 844, tag: '390' },
];

const report = [];
for (const shot of shots) {
  for (const vp of viewports) {
    const page = await openPage(browser, shot.role);
    await page.setViewportSize({ width: vp.w, height: vp.h });
    try {
      const info = await measure(page, `${shot.base}${shot.path}`, `${shot.name}-${vp.tag}`);
      let dialog = null;
      if (shot.name !== 'tutor-basic' && vp.tag === '1280') {
        const skip = page.locator('[data-action="skip-detail"]');
        if (await skip.count()) {
          await skip.click();
          await page.waitForTimeout(200);
          dialog = page._lastDialog || null;
        }
      }
      report.push({ ...shot, viewport: vp.tag, info, dialog, error: null });
    } catch (err) {
      report.push({ ...shot, viewport: vp.tag, error: String(err) });
    }
    await page.close();
  }
}
await browser.close();
console.log(JSON.stringify(report, null, 2));
