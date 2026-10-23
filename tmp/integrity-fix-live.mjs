import { join } from 'node:path';
import { chromium } from 'playwright';

const BASE = 'https://study114.net';
const browser = await chromium.launch({
  executablePath: join(process.env.LOCALAPPDATA, 'ms-playwright', 'chromium_headless_shell-1228', 'chrome-headless-shell-win64', 'chrome-headless-shell.exe'),
});
const out = [];
const errs = [];
async function visit(path, w = 1440) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const page = await ctx.newPage();
  const reqs = [];
  page.on('request', (r) => reqs.push(r.url()));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(`${path}: ${m.text()}`); });
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2500);
  return { ctx, page, reqs };
}
{
  const { ctx, page, reqs } = await visit('/#/myshop/study-room/999999');
  const txt = (await page.textContent('[data-myshop-public-mount]').catch(() => '')) || '';
  out.push(`없는 공부방 999999: ${txt.includes('이 공부방 소개를 찾을 수 없습니다.') ? 'PASS' : 'FAIL'} (로딩문구 남음=${txt.includes('불러오는 중')})`);
  out.push(`탭 제목(메인): ${await page.title()}`);
  out.push(`tickets.php 요청(공부방 상세): ${reqs.filter((u) => u.includes('/api/support/tickets.php')).length}`);
  await page.screenshot({ path: 'tmp/live-a1.png' });
  await ctx.close();
}
{
  const { ctx, page, reqs } = await visit('/#/support/admin/notices');
  const body = (await page.textContent('body')) || '';
  out.push(`손님 고객센터 관리: 안내=${body.includes('운영자 전용 화면이에요')}`);
  out.push(`tickets.php 요청(고객센터): ${reqs.filter((u) => u.includes('/api/support/tickets.php')).length}`);
  await page.screenshot({ path: 'tmp/live-b2.png' });
  await ctx.close();
}
{
  const { ctx, page } = await visit('/#/community/director', 390);
  const wb = await page.evaluate(() => {
    const el = document.querySelector('.concern-frame__body');
    return el ? getComputedStyle(el).wordBreak : 'none';
  });
  out.push(`고민방 본문 word-break: ${wb}`);
  await page.screenshot({ path: 'tmp/live-a5.png' });
  await ctx.close();
}
{
  const { ctx, page } = await visit('/search/#/search/tutor');
  const ctas = await page.$$eval('.home-mkt__actions a', (as) => as.map((a) => a.textContent.trim()));
  out.push(`과외쌤 찾기 배너 버튼: ${JSON.stringify(ctas)}`);
  out.push(`탭 제목(찾기): ${await page.title()}`);
  await page.screenshot({ path: 'tmp/live-c5.png' });
  await ctx.close();
}
for (const [p, label] of [['/auth/', '가입'], ['/register/room/', '공부방 등록'], ['/register/tutor/', '과외쌤 등록']]) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}${p}`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  out.push(`탭 제목(${label}): ${await page.title()}`);
  await ctx.close();
}
await browser.close();
console.log(out.join('\n'));
console.log('--- console errors with tickets ---');
console.log(errs.filter((e) => e.includes('tickets')).join('\n') || '(none)');
