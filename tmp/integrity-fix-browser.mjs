import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';

const root = join(process.cwd(), 'public');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json' };
const consoleErrors = [];
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname.startsWith('/api/')) {
    if (url.pathname === '/api/auth/me.php') {
      res.writeHead(401, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ ok: false }));
    }
    res.writeHead(404, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: false, error: 'not_found' }));
  }
  let p = url.pathname.endsWith('/') ? `${url.pathname}index.html` : url.pathname;
  try {
    const buf = await readFile(join(root, p));
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' });
    res.end(buf);
  } catch {
    res.writeHead(404);
    res.end('nf');
  }
});
await new Promise((r) => server.listen(5199, r));
const browser = await chromium.launch({
  executablePath: join(process.env.LOCALAPPDATA, 'ms-playwright', 'chromium_headless_shell-1228', 'chrome-headless-shell-win64', 'chrome-headless-shell.exe'),
});
const out = [];
async function visit(path, w = 1440) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  const reqs = [];
  page.on('request', (r) => reqs.push(r.url()));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`${path}: ${m.text()}`); });
  await page.goto(`http://localhost:5199${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  return { page, reqs };
}
{
  const { page } = await visit('/#/myshop/study-room/999999');
  await page.waitForTimeout(1500);
  const txt = await page.textContent('[data-myshop-public-mount]').catch(() => '');
  out.push(`A1 없는 공부방: ${txt.includes('이 공부방 소개를 찾을 수 없습니다.') ? 'PASS' : 'FAIL'} / 로딩문구 남음=${txt.includes('불러오는 중')}`);
  out.push(`탭 제목(메인): ${await page.title()}`);
  await page.screenshot({ path: 'tmp/shot-a1.png' });
  await page.close();
}
{
  const { page, reqs } = await visit('/#/support/admin/notices');
  const body = await page.textContent('body');
  out.push(`고객센터 관리(손님): 안내=${body.includes('운영자 전용 화면이에요')} / 관리폼 보임=${body.includes('공지 관리') && (await page.$('form[data-form], [data-notice-form]')) !== null}`);
  const ticketReq = reqs.filter((u) => u.includes('/api/support/tickets.php'));
  out.push(`부트 문의 목록 요청 수: ${ticketReq.length} ${ticketReq.join(' ')}`);
  await page.screenshot({ path: 'tmp/shot-b2.png' });
  await page.close();
}
{
  const { page, reqs } = await visit('/#/guest');
  const ticketReq = reqs.filter((u) => u.includes('/api/support/tickets.php'));
  out.push(`손님 홈 문의 목록 요청 수: ${ticketReq.length}`);
  await page.close();
}
{
  const { page } = await visit('/#/community/director', 390);
  const wb = await page.evaluate(() => {
    const el = document.querySelector('.concern-frame__body');
    return el ? getComputedStyle(el).wordBreak : 'none';
  });
  out.push(`고민방 본문 word-break: ${wb}`);
  await page.screenshot({ path: 'tmp/shot-a5.png', fullPage: false });
  await page.close();
}
for (const [p, label] of [['/search/', '찾기'], ['/auth/', '가입'], ['/register/study-room/', '공부방 등록'], ['/register/tutor/', '과외쌤 등록']]) {
  const page = await browser.newPage();
  await page.goto(`http://localhost:5199${p}`).catch(() => {});
  out.push(`탭 제목(${label}): ${await page.title()}`);
  await page.close();
}
await browser.close();
server.close();
console.log(out.join('\n'));
console.log('--- console errors (tickets) ---');
console.log(consoleErrors.filter((e) => e.includes('tickets')).join('\n') || '(none)');
