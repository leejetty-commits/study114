import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const out = 'D:/work/study114/.wt/291-prime-contain-blur/tmp/291-shots';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ timeout: 20000 });
console.log('launched');
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));
page.on('console', (msg) => errors.push(`console ${msg.type()}: ${msg.text()}`));

async function shot(name, width) {
  await page.setViewportSize({ width, height: 900 });
  await page.screenshot({ path: `${out}/${name}-${width}.png`, fullPage: true });
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
  const info = await page.evaluate(() => {
    const prime = document.querySelector('[data-crop-prime]');
    const basic = document.querySelector('[data-crop-basic]');
    const spot = document.querySelector('[data-crop-spot]');
    const contain = prime?.querySelector('.promo-crop-contain');
    const blur = prime?.querySelector('.promo-crop-blur');
    const basicImg = basic?.querySelector('img');
    const read = (el) => (el ? getComputedStyle(el).objectFit : '');
    return {
      scroll: document.documentElement.scrollWidth,
      hint: document.querySelector('.promo-crop-dialog__hint')?.textContent || '',
      primeFit: read(contain),
      blurFilter: blur ? getComputedStyle(blur).filter : '',
      basicFit: read(basicImg),
      spotInBasic: Boolean(basic?.contains(spot)),
      spotInPrime: Boolean(prime?.contains(spot)),
      basicCursor: basic ? getComputedStyle(basic).cursor : '',
      primeCursor: prime ? getComputedStyle(prime).cursor : '',
    };
  });
  console.log(JSON.stringify({ name, width, scroll, errors, ...info }));
}

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('http://127.0.0.1:5204/preview-291.html', { waitUntil: 'commit', timeout: 15000 });
try {
  await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 15000 });
} catch (e) {
  console.log(JSON.stringify({ errors, body: await page.locator('body').innerText().catch(() => '') }));
  throw e;
}
for (const shape of ['wide', 'tall', 'square']) {
  await page.evaluate((s) => window.openCrop(s), shape);
  await page.waitForSelector('[data-crop-prime]');
  await shot(`dialog-${shape}`, 1280);
  if (shape === 'wide') {
    const box = await page.locator('[data-crop-basic]').boundingBox();
    await page.mouse.click(box.x + box.width * 0.2, box.y + box.height * 0.3);
    const pos = await page.evaluate(() => {
      const img = document.querySelector('[data-crop-basic] img');
      const contain = document.querySelector('.promo-crop-contain');
      return { basic: img?.style.objectPosition || '', prime: contain?.style.objectPosition || '' };
    });
    console.log(JSON.stringify({ click: pos }));
  }
  await page.click('[data-crop-cancel]');
}
await page.setViewportSize({ width: 390, height: 900 });
await page.evaluate(() => window.openCrop('wide'));
await page.waitForSelector('[data-crop-prime]');
await shot('dialog-wide', 390);
await page.click('[data-crop-cancel]');
await shot('cards', 1280);
await page.setViewportSize({ width: 390, height: 900 });
await shot('cards', 390);
await browser.close();
