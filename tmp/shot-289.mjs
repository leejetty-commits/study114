import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const out = 'D:/work/study114/.wt/289-tutor-photo-nocrop-exif/tmp/289-shots';
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));
for (const width of [1280, 390]) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('http://127.0.0.1:5201/preview-289.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 20000 });
  const text = await page.locator('#log').innerText();
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
  await page.screenshot({ path: `${out}/upload-${width}.png`, fullPage: true });
  console.log(JSON.stringify({ width, scroll, text, errors }));
}
await browser.close();
