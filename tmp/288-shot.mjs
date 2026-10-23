import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'tmp', '288-shots');
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const report = [];

async function shot(page, name, width) {
  await page.setViewportSize({ width, height: 900 });
  await page.waitForTimeout(200);
  const file = join(out, name);
  await page.screenshot({ path: file, fullPage: false });
  const metrics = await page.evaluate(() => {
    const img = document.querySelector('.p24-fit-photo img, .shop-photo img, .p21-photos__frame img, .p21-profile__gallery-item img, .expo-media img');
    const box = img ? img.getBoundingClientRect() : null;
    const fit = img ? getComputedStyle(img).objectFit : '';
    return {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      objectFit: fit,
      img: box ? { w: Math.round(box.width), h: Math.round(box.height) } : null,
      text: document.body.innerText.slice(0, 180),
    };
  });
  report.push({ name, ...metrics });
}

const page = await browser.newPage();
const views = [
  ['room', 'detail-room'],
  ['tutor', 'detail-tutor'],
  ['shop', 'myshop'],
  ['profile', 'profile'],
];
for (const [view, name] of views) {
  for (const orient of ['wide', 'tall']) {
    for (const width of [1280, 390]) {
      await page.goto(`http://127.0.0.1:5199/288-preview.html?view=${view}&orient=${orient}`, { waitUntil: 'networkidle' });
      await shot(page, `${name}-${orient}-${width}.png`, width);
    }
  }
}
await page.goto('http://127.0.0.1:5199/288-preview.html?view=cards&orient=wide', { waitUntil: 'networkidle' });
await page.setViewportSize({ width: 1280, height: 900 });
const fits = await page.evaluate(() =>
  [...document.querySelectorAll('[data-card]')].map((el) => ({
    card: el.getAttribute('data-card'),
    fit: getComputedStyle(el.querySelector('img')).objectFit,
  })),
);
report.push({ name: 'cards', fits });
await page.screenshot({ path: join(out, 'cards-wide-1280.png') });
await writeFile(join(out, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
