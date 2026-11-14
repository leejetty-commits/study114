/**
 * 359 1단계 — 고객 노출 환불 문구 화면 캡처 (테스트 계정·비밀값 없음)
 * 로그인 게이트 화면은 소스 원문 HTML을 같은 미리보기 CSS로 렌더해 캡처한다.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const BASE = process.env.S114_CAPTURE_BASE || 'http://127.0.0.1:5174';

mkdirSync(OUT, { recursive: true });

const ACCESS_ACCORDION = `
<details class="plans-policy-acc" open>
  <summary>환불·소멸 안내</summary>
  <div class="plans-policy-acc__body">
    <ul class="plans-tier-list">
      <li>1회 즉시권: 7일 이내 미발송 시 전액 · 발송 완료 또는 7일 경과 시 0원</li>
      <li>5회권·10회권: 결제 후 7일 이내 · 사용 구간별 환불표(약관 기준)</li>
      <li>120일 만료 시 잔여 소멸(환불액 0) · 연장 없음</li>
      <li>회사 귀책 발송 실패는 횟수 복구를 우선합니다</li>
    </ul>
    <p class="mypage-muted">환불 가능 여부와 금액은 요청하시면 확인해 안내해요.</p>
  </div>
</details>`;

const POSITION_ACCORDION = `
<details class="plans-policy-acc" open>
  <summary>환불·만료 안내</summary>
  <div class="plans-policy-acc__body">
    <ul class="plans-tier-list">
      <li>시작 전: 전액 환불</li>
      <li>시작 후: 요청일 다음 날부터 남은 미사용 기간을 실제 결제금액 기준 일할 계산(배지 포함·같이 회수)</li>
      <li>만료 후 베이직카드(기본 노출)로 복귀 · 공부방/과외쌤 페이지는 유지</li>
      <li>자동연장 없음</li>
    </ul>
    <p class="mypage-muted">환불 금액은 최종 결제 내역 기준으로 산정합니다. 화면 안내는 참고용입니다.</p>
  </div>
</details>
<p>자동연장 없음 · 환불은 시작 전 전액, 시작 후 일할 계산(배지 포함·같이 회수)</p>`;

const REFUND_PANEL = `
<div class="plans-hist-row__panel-inner" style="padding:1rem;border:1px solid #ddd;max-width:36rem">
  <b>환불 가능</b>
  <div class="refund-formula">환불 예정액: <strong>2,250원</strong> · 사용 0회</div>
  <p>사유를 고른 뒤 신청할 수 있습니다. (테스트 캡처 · 실명·실주문 없음)</p>
  <button type="button" class="btn btn--primary btn--sm" disabled>환불 신청</button>
</div>
<p style="margin-top:1rem;max-width:36rem">서버 denyMessage 예시(356): 「뒤에 이어진 연장 결제가 있어 이 건은 환불할 수 없습니다. 연장 건을 먼저 환불해 주세요.」</p>`;

function fixtureHtml(title, body) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"/>
<title>${title}</title>
<link rel="stylesheet" href="${BASE}/src/styles.css"/>
<style>
  body{font-family:system-ui,sans-serif;margin:0;padding:24px;background:#f7f7f5;color:#222}
  .cap-note{font-size:12px;color:#666;margin-bottom:12px}
  .plans-policy-acc{background:#fff;border:1px solid #ddd;padding:12px 16px;max-width:40rem}
  .plans-tier-list{margin:8px 0;padding-left:1.2rem}
  .mypage-muted{color:#666;font-size:14px}
  .btn{display:inline-block;padding:6px 12px;border:1px solid #888;background:#eee}
</style></head><body>
<p class="cap-note">359 캡처 · 소스 원문 렌더 · 로그인·실계정 미사용 · ${title}</p>
${body}
</body></html>`;
}

async function shot(page, name, width) {
  await page.setViewportSize({ width, height: 900 });
  await page.waitForTimeout(400);
  const file = `${name}-${width}.png`;
  await page.screenshot({
    path: join(OUT, file),
    fullPage: true,
  });
  console.log('saved', file);
}

async function shotUrl(page, name, url, widths) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  for (const w of widths) await shot(page, name, w);
}

async function shotHtml(page, name, html, widths) {
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  for (const w of widths) await shot(page, name, w);
}

const widths = [1280, 390];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await shotUrl(page, '01-terms', `${BASE}/#/support/policies/terms`, widths);
  await shotUrl(page, '02-faq', `${BASE}/#/support/faq`, widths);
  await shotUrl(page, '03-support', `${BASE}/#/support`, widths);
  await shotUrl(page, '04-guide-safe', `${BASE}/#/guide/safe`, widths);
  await shotHtml(page, '05-checkout-access-accordion', fixtureHtml('쪽지권 환불 접힘(order-blocks)', ACCESS_ACCORDION), widths);
  await shotHtml(page, '06-checkout-position-accordion', fixtureHtml('노출 환불 접힘·체크아웃 노트(order-blocks/screens)', POSITION_ACCORDION), widths);
  await shotHtml(page, '07-history-refund-panel', fixtureHtml('구매이력 환불 패널 UI 골격(screens)', REFUND_PANEL), widths);
  console.log('DONE');
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
