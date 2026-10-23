import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const out = 'D:/work/study114/.wt/276-card-photo-logo/tmp/276-shots';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = [];

for (const vp of [
  { w: 1280, h: 900, tag: '1280' },
  { w: 390, h: 900, tag: '390' },
]) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  await page.goto('http://127.0.0.1:5194/276-preview.html', { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-shot]');
  await page.waitForTimeout(400);
  const info = await page.evaluate(() => {
    const sections = [...document.querySelectorAll('[data-shot]')].map((section) => {
      const wrap = section.querySelector('.expo-hcard__media-wrap, .expo-media--prime, .expo-media');
      const img = section.querySelector('img');
      const initial = section.querySelector('.expo-media__ph-initial');
      const box = wrap ? wrap.getBoundingClientRect() : null;
      return {
        name: section.getAttribute('data-shot'),
        src: img ? img.getAttribute('src') : '',
        srcset: img ? img.getAttribute('srcset') || '' : '',
        initial: initial ? initial.textContent : '',
        w: box ? Math.round(box.width) : 0,
        h: box ? Math.round(box.height) : 0,
        right: box ? Math.round(box.right) : 0,
      };
    });
    return {
      sections,
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    };
  });
  await page.screenshot({ path: `${out}/all-${vp.tag}.png`, fullPage: true });
  const empty = page.locator('[data-shot="공부방 없음"] article');
  const photo = page.locator('[data-shot="공부방 사진"] article');
  if (await empty.count()) await empty.screenshot({ path: `${out}/room-empty-${vp.tag}.png` });
  if (await photo.count()) await photo.screenshot({ path: `${out}/room-photo-${vp.tag}.png` });
  const tutorEmpty = page.locator('[data-shot="과외 없음"] article');
  const student = page.locator('[data-shot="학생 손님"] article');
  if (vp.tag === '1280') {
    if (await tutorEmpty.count()) await tutorEmpty.screenshot({ path: `${out}/tutor-empty-1280.png` });
    if (await student.count()) await student.screenshot({ path: `${out}/student-guest-1280.png` });
  }
  report.push({ viewport: vp.tag, errors, ...info });
  await page.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 2));
