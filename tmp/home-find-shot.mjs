import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1100 } });
const pg = await ctx.newPage();
await pg.addInitScript(
  `sessionStorage.setItem('study114-right-rail-slot-definitions-v1', JSON.stringify([{slotKey:'search_right_rail',sourceBoardKey:'faq',sourceBoardKeys:['faq','library-template','safe-guide']}]))`,
);
await pg.route('**/api/**', (route) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }),
);
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
await pg.goto('http://127.0.0.1:5193/#/search/student');
await pg.waitForTimeout(2200);
await pg.screenshot({
  path: 'D:/work/study114/.wt/home-find-main/docs/worklog/2026/10/img/2026-10-15-find-rail-six-studyroom-libold-1280.png',
});
await browser.close();
