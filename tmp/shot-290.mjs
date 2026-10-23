import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const out = 'D:/work/study114/.wt/290-photo-nofit-square-fallback/tmp/290-shots';
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));
for (const width of [1280, 390]) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('http://127.0.0.1:5203/preview-290.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 20000 });
  const info = await page.evaluate(() => {
    const frames = [...document.querySelectorAll('.p24-fit-photo, .shop-photo__area, .expo-media')].map((el) => {
      const img = el.querySelector('img');
      const cs = getComputedStyle(el);
      const imgCs = img ? getComputedStyle(img) : null;
      return {
        cls: el.className,
        ratio: cs.aspectRatio,
        fit: imgCs ? imgCs.objectFit : '',
        w: Math.round(el.getBoundingClientRect().width),
        h: Math.round(el.getBoundingClientRect().height),
      };
    });
    return { scroll: document.documentElement.scrollWidth, frames };
  });
  await page.screenshot({ path: `${out}/nofit-${width}.png`, fullPage: true });
  console.log(JSON.stringify({ width, errors, ...info }));
}
await browser.close();
