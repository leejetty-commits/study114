/**
 * ShopPage 케이스 A/B/C + owner/public 스크린샷
 * node scripts/shop-page-screenshots.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'tmp/shop-verify');
const cssPath = path.join(root, 'preview/home-ui/src/styles/myshop.css');
const css = fs.readFileSync(cssPath, 'utf8');

function wrap(title, bodyHtml) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
  body{margin:0;background:#f5f5f4;font-family:Pretendard,sans-serif}
  ${css}
</style></head><body>${bodyHtml}</body></html>`;
}

async function shot(page, name, html) {
  const file = path.join(outDir, `${name}.shot.html`);
  fs.writeFileSync(file, html, 'utf8');
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.setViewportSize({ width: 980, height: 1400 });
  await page.screenshot({
    path: path.join(outDir, `${name}.png`),
    fullPage: true,
  });
}

const browser = await chromium.launch();
const page = await browser.newPage();

for (const name of ['case-A', 'case-B', 'case-C', 'owner', 'public']) {
  const frag = fs.readFileSync(path.join(outDir, `${name}.html`), 'utf8');
  await shot(page, name, wrap(name, frag));
}

// 3열 비교 합성용: 각 케이스 상단만
const compareHtml = wrap(
  'ABC compare',
  `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;padding:16px;align-items:start">
    ${['A', 'B', 'C']
      .map((k) => {
        const frag = fs.readFileSync(path.join(outDir, `case-${k}.html`), 'utf8');
        return `<div><h2 style="font-size:14px;margin:0 0 8px">케이스 ${k}</h2>${frag}</div>`;
      })
      .join('')}
  </div>`,
);
await page.setViewportSize({ width: 1600, height: 2000 });
await page.setContent(compareHtml, { waitUntil: 'domcontentloaded' });
await page.screenshot({
  path: path.join(outDir, 'compare-ABC.png'),
  fullPage: true,
});

await browser.close();
console.log(
  JSON.stringify(
    {
      shots: ['case-A.png', 'case-B.png', 'case-C.png', 'owner.png', 'public.png', 'compare-ABC.png'],
      dir: outDir,
    },
    null,
    2,
  ),
);
