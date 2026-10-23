import { chromium } from 'playwright';
const port = process.argv[2] || '5192';
const width = Number(process.argv[3] || 1023);
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width, height: 1100 } });
const pg = await ctx.newPage();
await pg.route('**/api/auth/me.php', (route) =>
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      ok: true,
      authenticated: true,
      email_verified: true,
      role_type: 'study_room_owner',
      user_id: 1,
      email: 't@t',
      name: 't',
      phone_verified: true,
    }),
  }),
);
const t0 = Date.now();
await pg.goto(`http://127.0.0.1:${port}/#/study-room`, { waitUntil: 'domcontentloaded' });
for (let i = 0; i < 8; i++) {
  await pg.waitForTimeout(500);
  const n = await pg.evaluate(() => document.querySelectorAll('[data-right-rail-slot]').length);
  console.log('t', Date.now() - t0, 'rails', n);
  if (n) break;
}
await browser.close();
