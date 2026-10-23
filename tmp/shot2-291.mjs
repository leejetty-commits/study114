import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const out = 'D:/work/study114/.wt/291-prime-contain-blur/tmp/291-shots';
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
page.setDefaultTimeout(12000);
console.log('go');
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('http://127.0.0.1:5204/preview-291.html', { waitUntil: 'commit', timeout: 12000 });
await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 12000 });
console.log('ready');

async function info() {
  return page.evaluate(() => {
    const prime = document.querySelector('[data-crop-prime]');
    const basic = document.querySelector('[data-crop-basic]');
    const spot = document.querySelector('[data-crop-spot]');
    const contain = prime?.querySelector('.promo-crop-contain');
    const blur = prime?.querySelector('.promo-crop-blur');
    const basicImg = basic?.querySelector('img');
    return {
      scroll: document.documentElement.scrollWidth,
      hint: document.querySelector('.promo-crop-dialog__hint')?.textContent || '',
      primeFit: contain ? getComputedStyle(contain).objectFit : '',
      blur: blur ? getComputedStyle(blur).filter : '',
      basicFit: basicImg ? getComputedStyle(basicImg).objectFit : '',
      spotInBasic: Boolean(basic?.contains(spot)),
      spotInPrime: Boolean(prime?.contains(spot)),
      basicCursor: basic ? getComputedStyle(basic).cursor : '',
      primeCursor: prime ? getComputedStyle(prime).cursor : '',
    };
  });
}

for (const shape of ['wide', 'tall', 'square']) {
  await page.evaluate((s) => { void window.openCrop(s); }, shape);
  await page.waitForSelector('[data-crop-prime]');
  await page.screenshot({ path: `${out}/dialog-${shape}-1280.png`, fullPage: true });
  console.log(shape, JSON.stringify(await info()));
  if (shape === 'wide') {
    const box = await page.locator('[data-crop-basic]').boundingBox();
    await page.mouse.click(box.x + box.width * 0.2, box.y + box.height * 0.3);
    console.log('click', JSON.stringify(await page.evaluate(() => ({
      basic: document.querySelector('[data-crop-basic] img')?.style.objectPosition || '',
      prime: document.querySelector('.promo-crop-contain')?.style.objectPosition || '',
    }))));
  }
  await page.click('[data-crop-cancel]');
}
await page.setViewportSize({ width: 390, height: 900 });
await page.evaluate(() => { void window.openCrop('wide'); });
await page.waitForSelector('[data-crop-prime]');
await page.screenshot({ path: `${out}/dialog-wide-390.png`, fullPage: true });
console.log('390', JSON.stringify({ ...(await info()) }));
await page.click('[data-crop-cancel]');
await page.setViewportSize({ width: 1280, height: 900 });
await page.screenshot({ path: `${out}/cards-1280.png`, fullPage: true });
await page.setViewportSize({ width: 390, height: 900 });
await page.screenshot({ path: `${out}/cards-390.png`, fullPage: true });
console.log('cards', await page.evaluate(() => document.documentElement.scrollWidth));
await browser.close();
