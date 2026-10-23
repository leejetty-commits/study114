/**
 * 281 스크린샷 — 비회원 노출탭 접근 막이 (1280·390). 8080 꺼짐 → 로그인 장면은 이 스크립트 범위 밖.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const phase = process.argv[2] === 'after' ? 'after' : 'before';
const outDir = join(root, 'docs/worklog/2026/10/assets', `281-${phase}`);
mkdirSync(outDir, { recursive: true });

const base = process.env.HOME_UI_BASE || 'http://127.0.0.1:5175';
const paths = [
  { name: 'guest-tutor-exposure', hash: '#/mypage/registrations/tutors/1/exposure' },
  { name: 'guest-room-exposure', hash: '#/mypage/registrations/study-rooms/1/exposure' },
  { name: 'guest-mypage', hash: '#/mypage' },
];

const chromePath =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
});
for (const viewport of [
  { w: 1280, h: 900, tag: '1280' },
  { w: 390, h: 844, tag: '390' },
]) {
  const page = await browser.newPage({ viewport: { width: viewport.w, height: viewport.h } });
  for (const p of paths) {
    await page.goto(`${base}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.evaluate((hash) => {
      window.location.hash = hash.replace(/^#/, '');
    }, p.hash);
    await page.waitForTimeout(1500);
    await page.waitForSelector('text=마이페이지', { timeout: 10000 }).catch(() => {});
    // 1280: 세로 스크롤 막대가 보이게
    if (viewport.w === 1280) {
      await page.evaluate(() => {
        document.querySelector('[data-281-scroll-pad]')?.remove();
        const pad = document.createElement('div');
        pad.style.height = '1200px';
        pad.setAttribute('data-281-scroll-pad', '1');
        document.body.appendChild(pad);
      });
    }
    const file = join(outDir, `${p.name}-${viewport.tag}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log('wrote', file, await page.title(), page.url());
  }
  await page.close();
}
await browser.close();
console.log('done', phase);
