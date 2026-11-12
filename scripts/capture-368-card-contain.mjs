/**
 * 368-card-contain — 1280 캡처 (카드·상세·마이샵 사진 칸)
 * 실서버 로그인 없이, 실제 CSS + 비율 다른 픽스처 이미지로 contain·단색 확인.
 * node scripts/capture-368-card-contain.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'docs/worklog/2026/11/shots-368-card-contain');
fs.mkdirSync(outDir, { recursive: true });

const listingsCss = fs.readFileSync(path.join(root, 'preview/home-ui/src/styles/home-listings.css'), 'utf8');
const myshopCss = fs.readFileSync(path.join(root, 'preview/home-ui/src/styles/myshop.css'), 'utf8');

/* 기존 368 픽스처 — 가로(663×380)·세로(portrait) 비율이 칸과 다름 */
const landscape = path.join(root, 'docs/worklog/2026/11/shots-368/663x380-fit_1280.webp');
const portrait = path.join(root, 'docs/worklog/2026/11/shots-368/portrait-fit_1280.webp');
const landData = `data:image/webp;base64,${fs.readFileSync(landscape).toString('base64')}`;
const portData = `data:image/webp;base64,${fs.readFileSync(portrait).toString('base64')}`;

function pageHtml() {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>368-card-contain 1280</title>
<style>
  :root { --gray-100: #f1f5f9; --space-2: 0.5rem; }
  body { margin: 0; background: #fff; font-family: system-ui, sans-serif; color: #0f172a; }
  h1 { font-size: 1.1rem; margin: 0 0 0.5rem; }
  h2 { font-size: 0.95rem; margin: 1.25rem 0 0.5rem; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; padding: 1rem 1.25rem 2rem; max-width: 1280px; }
  .note { font-size: 0.8rem; color: #64748b; margin: 0 0 0.75rem; }
  .label { font-size: 0.75rem; font-weight: 650; margin: 0 0 0.35rem; }
  /* 카드 목록 미디어 */
  ${listingsCss}
  /* 마이샵 */
  ${myshopCss}
  .demo-card { border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.75rem; background: #fff; }
  .p24-dl { display: grid; grid-template-columns: 4rem 1fr; gap: 0.5rem 0.75rem; align-items: start; }
  .p24-dl dt { font-size: 0.8rem; color: #64748b; }
  .p24-dl dd { margin: 0; }
</style></head><body>
  <div class="row">
    <section>
      <h1>테스트rm1 · 비율 다른 사진 (가로 fit)</h1>
      <p class="note">칸 가로 맞춤 · 잘림 없음 · 단색 바탕(흐림 없음). 픽셀 숫자 비노출.</p>

      <h2>홈/찾기 카드 · 프라임 칸</h2>
      <div class="demo-card">
        <div class="label">expo-media--prime</div>
        <div class="expo-media-wrap">
          <div class="expo-media expo-media--prime"><img src="${landData}" alt="테스트rm1 홍보" /></div>
        </div>
      </div>

      <h2>홈/찾기 카드 · 픽/기본 정사각 칸</h2>
      <div class="demo-card">
        <div class="label">expo-media--pick / list</div>
        <div style="display:flex;gap:1rem;align-items:flex-start">
          <div class="expo-media expo-media--pick"><img src="${landData}" alt="픽 칸" /></div>
          <div class="expo-media expo-media--list" style="width:5.5rem"><img src="${landData}" alt="리스트 칸" /></div>
        </div>
      </div>

      <h2>펼친 상세 사진 칸</h2>
      <div class="demo-card">
        <dl class="p24-dl">
          <dt>사진</dt>
          <dd><div class="p24-fit-photo"><img src="${landData}" alt="상세" /></div></dd>
        </dl>
      </div>
    </section>

    <section>
      <h1>「우리 동네에 새로 왔어요」류 · 세로 비율</h1>
      <p class="note">세로가 칸보다 길면 전체가 보이게 담고 좌우 단색.</p>

      <h2>카드 · 프라임 / 픽</h2>
      <div class="demo-card">
        <div class="expo-media-wrap" style="margin-bottom:0.75rem">
          <div class="expo-media expo-media--prime"><img src="${portData}" alt="세로 프라임" /></div>
        </div>
        <div class="expo-media expo-media--pick"><img src="${portData}" alt="세로 픽" /></div>
      </div>

      <h2>상세</h2>
      <div class="demo-card">
        <div class="p24-fit-photo"><img src="${portData}" alt="세로 상세" /></div>
      </div>

      <h2>마이샵 (4:3 · 1:1)</h2>
      <div class="demo-card">
        <div class="shop-photos shop-photos--top" style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem">
          <button type="button" class="shop-photo shop-photo--framed">
            <span class="shop-photo__area"><img src="${landData}" alt="" /></span>
          </button>
          <button type="button" class="shop-photo shop-photo--framed">
            <span class="shop-photo__area"><img src="${portData}" alt="" /></span>
          </button>
        </div>
        <div class="shop-photos shop-photos--bottom" style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem;margin-top:0.5rem">
          <button type="button" class="shop-photo"><img src="${landData}" alt="" /></button>
          <button type="button" class="shop-photo"><img src="${portData}" alt="" /></button>
          <div class="shop-photo shop-photo--empty" aria-hidden="true"></div>
        </div>
      </div>
    </section>
  </div>
</body></html>`;
}

const htmlPath = path.join(outDir, '368-card-contain-1280.html');
fs.writeFileSync(htmlPath, pageHtml(), 'utf8');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 1600 });
await page.setContent(pageHtml(), { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(200);

const metrics = await page.evaluate(() => {
  const check = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const img = el.tagName === 'IMG' ? el : el.querySelector('img');
    if (!img) return null;
    const box = el.getBoundingClientRect();
    const cs = getComputedStyle(img);
    return {
      sel,
      box: { w: Math.round(box.width), h: Math.round(box.height) },
      objectFit: cs.objectFit,
      natural: { w: img.naturalWidth, h: img.naturalHeight },
      rendered: { w: Math.round(img.getBoundingClientRect().width), h: Math.round(img.getBoundingClientRect().height) },
    };
  };
  return [
    check('.expo-media--prime img'),
    check('.p24-fit-photo img'),
    check('.shop-photo__area img'),
    check('.shop-photos--bottom .shop-photo img'),
  ].filter(Boolean);
});

await page.screenshot({
  path: path.join(outDir, '368-card-contain-1280.png'),
  fullPage: true,
});

/* 섹션별 크롭 */
const shots = [
  { name: '368-card-prime-landscape-1280.png', sel: 'section:first-of-type .demo-card:nth-of-type(1)' },
  { name: '368-card-pick-landscape-1280.png', sel: 'section:first-of-type .demo-card:nth-of-type(2)' },
  { name: '368-detail-landscape-1280.png', sel: 'section:first-of-type .demo-card:nth-of-type(3)' },
  { name: '368-card-portrait-1280.png', sel: 'section:last-of-type .demo-card:nth-of-type(1)' },
  { name: '368-detail-portrait-1280.png', sel: 'section:last-of-type .demo-card:nth-of-type(2)' },
  { name: '368-myshop-mixed-1280.png', sel: 'section:last-of-type .demo-card:nth-of-type(3)' },
];

for (const s of shots) {
  const loc = page.locator(s.sel).first();
  await loc.screenshot({ path: path.join(outDir, s.name) });
}

await browser.close();

const report = {
  outDir,
  full: '368-card-contain-1280.png',
  shots: shots.map((s) => s.name),
  metrics,
  asserts: {
    allContain: metrics.every((m) => m.objectFit === 'contain'),
    noPixelLabelsInHtml: !pageHtml().includes('663') && !pageHtml().includes('1280×'),
  },
};
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.asserts.allContain) process.exit(1);
