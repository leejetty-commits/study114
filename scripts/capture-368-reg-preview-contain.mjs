/**
 * 368-내등록미리보기 — 1280 캡처 (테스트 픽스처, 실명 금지)
 * node scripts/capture-368-reg-preview-contain.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'docs/worklog/2026/11/shots-368-reg-preview-contain');
fs.mkdirSync(outDir, { recursive: true });

const css = fs.readFileSync(path.join(root, 'preview/study-room-ui/src/styles/register.css'), 'utf8');
const landPath = path.join(root, 'docs/worklog/2026/11/shots-368/663x380-fit_1280.webp');
const portPath = path.join(root, 'docs/worklog/2026/11/shots-368/portrait-fit_1280.webp');
const land = `data:image/webp;base64,${fs.readFileSync(landPath).toString('base64')}`;
const port = `data:image/webp;base64,${fs.readFileSync(portPath).toString('base64')}`;

const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>368 reg promo preview</title>
<style>
  body{margin:0;padding:1.25rem;font-family:system-ui,sans-serif;background:#fff;color:#0f172a}
  h1{font-size:1rem;margin:0 0 .5rem}
  .note{font-size:.8rem;color:#64748b;margin:0 0 1rem}
  ${css}
</style></head><body>
  <h1>내등록 · 홍보사진 편집 미리보기 (테스트rm1)</h1>
  <p class="note">fit 원본 · contain · 단색 바탕. 픽셀 숫자 비노출.</p>
  <div class="register-photo-block" data-photo-grid>
    <div class="register-photo-grid">
      <article class="register-photo-card">
        <div class="register-photo-card__frame"><img src="${land}" alt="홍보사진 1" /></div>
        <div class="register-photo-card__meta"><span class="form-label">가로 비율</span></div>
      </article>
      <article class="register-photo-card">
        <div class="register-photo-card__frame"><img src="${port}" alt="홍보사진 2" /></div>
        <div class="register-photo-card__meta"><span class="form-label">세로 비율</span></div>
      </article>
    </div>
  </div>
</body></html>`;

fs.writeFileSync(path.join(outDir, '368-reg-preview-1280.html'), html, 'utf8');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });
await page.setContent(html, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(150);

const metrics = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('.register-photo-card__frame img')];
  return imgs.map((img) => {
    const frame = img.parentElement;
    const cs = getComputedStyle(img);
    const fcs = getComputedStyle(frame);
    return {
      objectFit: cs.objectFit,
      frameBg: fcs.backgroundColor,
      natural: { w: img.naturalWidth, h: img.naturalHeight },
      rendered: {
        w: Math.round(img.getBoundingClientRect().width),
        h: Math.round(img.getBoundingClientRect().height),
      },
      frame: {
        w: Math.round(frame.getBoundingClientRect().width),
        h: Math.round(frame.getBoundingClientRect().height),
      },
    };
  });
});

await page.screenshot({ path: path.join(outDir, '368-reg-preview-1280.png'), fullPage: true });
await browser.close();

const report = {
  outDir,
  metrics,
  asserts: {
    allContain: metrics.every((m) => m.objectFit === 'contain'),
    solidBg: metrics.every((m) => m.frameBg.includes('226, 232, 240') || m.frameBg === 'rgb(226, 232, 240)'),
  },
};
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.asserts.allContain) process.exit(1);
