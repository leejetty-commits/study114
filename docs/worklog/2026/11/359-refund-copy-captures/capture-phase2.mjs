/**
 * 359 2단계 캡처 — 실계정 없음. FAQ·정책은 실화면, 접힘·탈퇴는 모듈 원문 렌더.
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const BASE = process.env.S114_CAPTURE_BASE || 'http://127.0.0.1:5174';
const ROOT = join(__dirname, '..', '..', '..', '..', '..');
const MOD = join(ROOT, 'preview', 'home-ui', 'src', 'refund-policy-copy.js');

mkdirSync(OUT, { recursive: true });

const modUrl = pathToFileURL(MOD).href;
const {
  MEMO_TICKET_REFUND_SHORT,
  MEMO_TICKET_REFUND_DETAIL,
  POSITION_REFUND_SHORT,
  POSITION_REFUND_DETAIL,
  FAQ_PAID_VS_TUTOR_FEE_REFUND,
  WITHDRAW_REFUND_HINT,
  REFUND_LATER_EXTENSION_DENY,
} = await import(modUrl);

function fixture(title, body) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"/><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;margin:0;padding:24px;background:#f7f7f5;color:#222;line-height:1.5}
.cap{font-size:12px;color:#666;margin-bottom:12px}details{background:#fff;border:1px solid #ddd;padding:12px 16px;max-width:42rem}
strong{display:block;margin-bottom:8px}.muted{color:#555;font-size:14px}</style></head><body>
<p class="cap">359-2 · 소스/모듈 원문 · 실계정 없음 · ${title}</p>${body}</body></html>`;
}

async function shot(page, name, width) {
  await page.setViewportSize({ width, height: 900 });
  await page.waitForTimeout(350);
  await page.screenshot({ path: join(OUT, `p2-${name}-${width}.png`), fullPage: true });
  console.log('saved', `p2-${name}-${width}.png`);
}

const widths = [1280, 390];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto(`${BASE}/#/support/faq`, { waitUntil: 'networkidle', timeout: 60000 });
  for (const w of widths) await shot(page, 'faq', w);

  await page.goto(`${BASE}/#/support/policies/terms`, { waitUntil: 'networkidle', timeout: 60000 });
  for (const w of widths) await shot(page, 'terms', w);

  await page.setContent(
    fixture(
      '쪽지권 환불 접힘',
      `<details open><summary>환불·소멸 안내</summary><p><strong>${MEMO_TICKET_REFUND_SHORT}</strong></p><p class="muted">${MEMO_TICKET_REFUND_DETAIL}</p></details>`,
    ),
  );
  for (const w of widths) await shot(page, 'access-accordion', w);

  await page.setContent(
    fixture(
      '노출 환불 접힘',
      `<details open><summary>환불·만료 안내</summary><p><strong>${POSITION_REFUND_SHORT}</strong></p><p class="muted">${POSITION_REFUND_DETAIL}</p><p class="muted">잠금문장 확인: ${REFUND_LATER_EXTENSION_DENY}</p></details>`,
    ),
  );
  for (const w of widths) await shot(page, 'position-accordion', w);

  await page.setContent(
    fixture(
      '탈퇴 안내 환불 줄',
      `<ul><li>유료 이용 중이라면 잔여 기간·횟수도 함께 종료됩니다.</li><li>${WITHDRAW_REFUND_HINT}</li></ul><p class="muted">FAQ 확정: ${FAQ_PAID_VS_TUTOR_FEE_REFUND}</p>`,
    ),
  );
  for (const w of widths) await shot(page, 'withdraw-hint', w);

  console.log('module bytes', readFileSync(MOD).length);
  console.log('DONE');
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
