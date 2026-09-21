/**
 * 쪽지설정 저장·재진입·F5 + live 홈 BASIC 폭 실측
 * Usage: node scripts/e2e-inquiry-settings-closeout.mjs
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const LOCAL = process.env.STUDY114_PREVIEW_URL || 'http://127.0.0.1:5174';
const PROD = process.env.STUDY114_PROD_URL || 'https://study114.net';
const OUT = resolve(process.cwd(), 'test-results/inq-closeout');
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
];

function round1(n) {
  return Math.round(Number(n) * 10) / 10;
}

function attachDialogs(page) {
  page.on('dialog', async (d) => {
    await d.accept().catch(() => {});
  });
}

async function measureLiveHomeCard(page, kind) {
  await page.waitForSelector('.home-shell', { timeout: 20000 });
  try {
    await page.waitForFunction(
      () => !document.querySelector('[data-home-basic-status]'),
      null,
      { timeout: 12000 },
    );
  } catch {
    /* keep going; missing cards reported below */
  }
  const sel = `.home-shell .guest-browse-lists .expo-basic--${kind}.expo-hcard`;
  try {
    await page.waitForSelector(sel, { timeout: 12000 });
  } catch {
    return { source: 'missing-live', selector: sel, width: null };
  }
  return page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return { source: 'missing-live', selector: s, width: null };
    return {
      source: 'live',
      selector: s,
      width: el.getBoundingClientRect().width,
    };
  }, sel);
}

async function measureSample(page, kind) {
  const sel = `[data-inq-sample] .expo-basic--${kind}.expo-hcard`;
  await page.waitForSelector(sel, { timeout: 15000 });
  return page.evaluate((s) => {
    const el = document.querySelector(s);
    const btn = document.querySelector('[data-inq-sample].inq-sample--open .item-actions [title^="쪽지"]');
    const svg = document.querySelector('[data-inq-sample].inq-sample--open [data-inq-guide]');
    const callout = document.querySelector('[data-inq-sample].inq-sample--open [data-inq-callout]');
    if (!el) return { width: null, arrow: null, selector: s };
    const r = el.getBoundingClientRect();
    let arrow = null;
    if (btn && svg) {
      const br = btn.getBoundingClientRect();
      const sr = svg.getBoundingClientRect();
      const circle = svg.querySelector('circle');
      const path = svg.querySelector('path[marker-end]');
      const cx = circle ? Number(circle.getAttribute('cx')) + sr.left : NaN;
      const cy = circle ? Number(circle.getAttribute('cy')) + sr.top : NaN;
      const btnCx = br.left + br.width / 2;
      const btnCy = br.top + br.height / 2;
      arrow = {
        dx: Math.round((cx - btnCx) * 10) / 10,
        dy: Math.round((cy - btnCy) * 10) / 10,
        path: path?.getAttribute('d') || '',
        pointsAtButton: Math.abs(cx - btnCx) <= 2 && Math.abs(cy - btnCy) <= 2,
        hasCallout: Boolean(callout),
      };
    }
    return { width: r.width, arrow, selector: s, transform: getComputedStyle(el).transform };
  }, sel);
}

async function openInquiries(page, role) {
  const action = role === 'tutor' ? 'dev-login-tutor' : 'dev-login-room';
  await page.goto(`${LOCAL}/#/guest`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(`[data-action="${action}"]`, { timeout: 15000 });
  await page.click(`[data-action="${action}"]`);
  await page.waitForTimeout(2500);
  const mypageBtn = page.locator('.preview-toolbar__btn', { hasText: '마이페이지' });
  await mypageBtn.click();
  await page.waitForTimeout(2000);
  const tab = page.locator('a.mp-room__tab', { hasText: '쪽지설정' });
  if (!(await tab.count())) {
    throw new Error(`${role}: 쪽지설정 탭 없음 hash=${await page.evaluate(() => location.hash)}`);
  }
  await tab.click();
  await page.waitForSelector('[data-inq-sample] .expo-hcard', { timeout: 20000 });
  await page.waitForTimeout(500);
}

async function readInquiryUi(page) {
  return page.evaluate(() => {
    const badge = document.querySelector('.p21-inq-badge')?.textContent?.trim() || '';
    const receiving = document.querySelector('input[name="p21_inquiry_receiving"]:checked, input[name="p20_inquiry_receiving"]:checked')?.value || '';
    const reason =
      document.querySelector('input[name="p21_inquiry_reason"]:checked, input[name="inquiry_off_reason"]:checked')?.value || '';
    const reasonWrap = document.querySelector('[data-p21-inquiry-reason-wrap], [data-p20-inquiry-reason-wrap]');
    const reasonInactive = Boolean(reasonWrap?.classList.contains('is-inactive'));
    const reasonPointer = reasonWrap ? getComputedStyle(reasonWrap).pointerEvents : '';
    const contactNeed = Boolean(document.querySelector('.p21-inq-block--contact.is-need'));
    const contactDone = Boolean(document.querySelector('.p21-inq-block--contact.is-done'));
    const order = [
      'p21-inq__lead',
      'p21-inq-block--status',
      'p21-inq-block--edit',
      'p21-inq-block--contact',
      'p21-inq-save',
      'p21-inq-block--samples',
    ].map((cls) => document.querySelector(`.${cls}`)?.getBoundingClientRect().top ?? null);
    const otp = Boolean(document.getElementById('p20-phone-verify-modal'));
    return {
      badge,
      receiving,
      reason,
      reasonInactive,
      reasonPointer,
      contactNeed,
      contactDone,
      order,
      otp,
      hash: location.hash,
    };
  });
}

async function chooseReceiving(page, on) {
  const label = on ? '쪽지 받는 중' : '쪽지 안받음';
  await page.locator('label.p21-inq-choice', { hasText: label }).click();
  await page.waitForTimeout(200);
}

async function chooseReason(page, role, value) {
  const name = role === 'tutor' ? 'p21_inquiry_reason' : 'inquiry_off_reason';
  await page.locator(`input[name="${name}"][value="${value}"]`).click({ force: false });
  await page.waitForTimeout(150);
}

async function lastDevOtpCode() {
  const logPath = resolve(process.cwd(), 'storage/logs/sms.log');
  if (!existsSync(logPath)) return null;
  const text = readFileSync(logPath, 'utf8');
  const matches = [...text.matchAll(/인증번호 (\d{6})/g)];
  return matches.at(-1)?.[1] || null;
}

async function completeOtpIfShown(page) {
  const modal = page.locator('#p20-phone-verify-modal');
  if (!(await modal.count())) return { shown: false };
  await page.waitForTimeout(600);
  const code = await lastDevOtpCode();
  if (!code) {
    await page.screenshot({ path: resolve(OUT, 'otp-no-code.png') });
    throw new Error('OTP modal shown but sms.log has no 인증번호');
  }
  await page.fill('[data-p20-phone-otp]', code);
  await page.click('[data-p20-phone-verify-confirm]');
  await page.waitForTimeout(1800);
  const still = await page.locator('#p20-phone-verify-modal').count();
  return { shown: true, completed: still === 0 };
}

async function clickSave(page, role) {
  const sel = role === 'tutor' ? '[data-p21-inquiry-save]' : '[data-p20-inquiry-save]';
  await page.click(sel);
  await page.waitForTimeout(1200);
}

async function reenterInquiries(page) {
  const hub = page.locator('a.mp-room__tab', { hasText: /마이프로필|마이샵/ }).first();
  if (await hub.count()) {
    await hub.click();
    await page.waitForTimeout(700);
  } else {
    await page.locator('a.mp-room__tab').first().click();
    await page.waitForTimeout(700);
  }
  await page.locator('a.mp-room__tab', { hasText: '쪽지설정' }).click();
  await page.waitForSelector('[data-inq-sample] .expo-hcard', { timeout: 20000 });
  await page.waitForTimeout(400);
}

async function persistFlow(page, role, shotPrefix) {
  const log = [];
  await openInquiries(page, role);
  const before = await readInquiryUi(page);
  await page.screenshot({ path: resolve(OUT, `${shotPrefix}-01-before.png`), fullPage: true });
  log.push({ step: 'before', ...before });

  await chooseReceiving(page, true);
  const afterOpenChoice = await readInquiryUi(page);
  log.push({ step: 'choose-open', ...afterOpenChoice });
  await clickSave(page, role);
  await page.waitForTimeout(800);
  if (await page.locator('#p20-phone-verify-modal').count()) {
    await page.screenshot({ path: resolve(OUT, `${shotPrefix}-otp-after-open-save.png`) });
    const otp = await completeOtpIfShown(page);
    log.push({ step: 'otp-open', shown: otp.shown, completed: otp.completed });
    await page.waitForTimeout(800);
  }
  const afterOpenSave = await readInquiryUi(page);
  await page.screenshot({ path: resolve(OUT, `${shotPrefix}-02-after-open-save.png`), fullPage: true });
  log.push({ step: 'after-open-save', ...afterOpenSave });

  await reenterInquiries(page);
  const afterOpenReenter = await readInquiryUi(page);
  await page.screenshot({ path: resolve(OUT, `${shotPrefix}-03-after-open-reenter.png`), fullPage: true });
  log.push({ step: 'after-open-reenter', ...afterOpenReenter });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-inq-sample] .expo-hcard', { timeout: 20000 });
  await page.waitForTimeout(500);
  const afterOpenF5 = await readInquiryUi(page);
  await page.screenshot({ path: resolve(OUT, `${shotPrefix}-04-after-open-f5.png`), fullPage: true });
  log.push({ step: 'after-open-f5', ...afterOpenF5 });

  await chooseReceiving(page, false);
  const closedReason = role === 'tutor' ? 'not_accepting' : 'capacity_full';
  await chooseReason(page, role, closedReason);
  const afterClosedChoice = await readInquiryUi(page);
  log.push({ step: 'choose-closed', ...afterClosedChoice });
  await clickSave(page, role);
  await page.waitForTimeout(800);
  const afterClosedSave = await readInquiryUi(page);
  await page.screenshot({ path: resolve(OUT, `${shotPrefix}-05-after-closed-save.png`), fullPage: true });
  log.push({ step: 'after-closed-save', ...afterClosedSave });

  await reenterInquiries(page);
  const afterClosedReenter = await readInquiryUi(page);
  await page.screenshot({ path: resolve(OUT, `${shotPrefix}-06-after-closed-reenter.png`), fullPage: true });
  log.push({ step: 'after-closed-reenter', ...afterClosedReenter });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-inq-sample] .expo-hcard', { timeout: 20000 });
  await page.waitForTimeout(500);
  const afterClosedF5 = await readInquiryUi(page);
  await page.screenshot({ path: resolve(OUT, `${shotPrefix}-07-after-closed-f5.png`), fullPage: true });
  log.push({ step: 'after-closed-f5', ...afterClosedF5 });

  return log;
}

mkdirSync(OUT, { recursive: true });
const report = {
  widths: { local: {}, prod: {} },
  persist: {},
  errors: [],
};

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
try {
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    attachDialogs(page);

    await page.goto(`${LOCAL}/#/guest`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    report.widths.local[`tutor-home-${vp.name}`] = await measureLiveHomeCard(page, 'tutor');
    report.widths.local[`room-home-${vp.name}`] = await measureLiveHomeCard(page, 'study_room');

    try {
      await page.goto(`${PROD}/#/guest`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      report.widths.prod[`tutor-home-${vp.name}`] = await measureLiveHomeCard(page, 'tutor');
      report.widths.prod[`room-home-${vp.name}`] = await measureLiveHomeCard(page, 'study_room');
    } catch (err) {
      report.errors.push(`prod home ${vp.name}: ${err.message}`);
    }

    await page.close();
  }

  const persistPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  attachDialogs(persistPage);
  try {
    report.persist.tutor = await persistFlow(persistPage, 'tutor', 'tutor');
    const sampleTutor = await measureSample(persistPage, 'tutor');
    report.widths.local['tutor-sample-desktop-after-persist'] = sampleTutor;
    await persistPage.locator('[data-inq-sample].inq-sample--open').screenshot({
      path: resolve(OUT, 'tutor-arrow-desktop.png'),
    });
  } catch (err) {
    report.errors.push(`tutor persist: ${err.message}`);
    report.persist.tutor = { error: err.message };
    await persistPage.screenshot({ path: resolve(OUT, 'tutor-persist-error.png'), fullPage: true }).catch(() => {});
  }

  try {
    report.persist.room = await persistFlow(persistPage, 'study_room', 'room');
    const sampleRoom = await measureSample(persistPage, 'study_room');
    report.widths.local['room-sample-desktop-after-persist'] = sampleRoom;
    await persistPage.locator('[data-inq-sample].inq-sample--open').screenshot({
      path: resolve(OUT, 'room-arrow-desktop.png'),
    });
  } catch (err) {
    report.errors.push(`room persist: ${err.message}`);
    report.persist.room = { error: err.message };
    await persistPage.screenshot({ path: resolve(OUT, 'room-persist-error.png'), fullPage: true }).catch(() => {});
  }
  await persistPage.close();

  for (const vp of VIEWPORTS.filter((v) => v.name !== 'desktop')) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    attachDialogs(page);
    try {
      await openInquiries(page, 'tutor');
      report.widths.local[`tutor-sample-${vp.name}`] = await measureSample(page, 'tutor');
      await page.locator('[data-inq-sample].inq-sample--open').screenshot({
        path: resolve(OUT, `tutor-arrow-${vp.name}.png`),
      });
      await openInquiries(page, 'study_room');
      report.widths.local[`room-sample-${vp.name}`] = await measureSample(page, 'study_room');
      await page.locator('[data-inq-sample].inq-sample--open').screenshot({
        path: resolve(OUT, `room-arrow-${vp.name}.png`),
      });
    } catch (err) {
      report.errors.push(`sample ${vp.name}: ${err.message}`);
    }
    await page.close();
  }
} finally {
  await browser.close();
}

const outFile = resolve(OUT, 'report.json');
writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
console.log(`\nwrote ${outFile}`);
if (report.errors.length) process.exit(1);
