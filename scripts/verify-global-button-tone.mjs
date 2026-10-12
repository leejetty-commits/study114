/**
 * 전역 버튼 톤 (2026-10-09 종현 확정) — 화면에서 잰 값으로 판정.
 * 서버를 스스로 띄우지 않는다. 안 떠 있으면 SKIP 이유를 적고 exit 1.
 *
 *   node scripts/verify-global-button-tone.mjs
 *
 * HOME_URL 기본 http://127.0.0.1:5174
 * SEARCH_URL 5176 · AUTH_URL 5173 · ROOM_URL 5175 · TUTOR_URL 5177
 */
import { chromium } from '@playwright/test';

const HOME = process.env.HOME_URL || 'http://127.0.0.1:5174';
const SEARCH = process.env.SEARCH_URL || 'http://127.0.0.1:5176';
const AUTH = process.env.AUTH_URL || 'http://127.0.0.1:5173';
const ROOM = process.env.ROOM_URL || 'http://127.0.0.1:5175';
const TUTOR = process.env.TUTOR_URL || 'http://127.0.0.1:5177';

const FILL = { bg: 'rgb(114, 159, 217)', fg: 'rgb(11, 37, 69)' };
const STRONG = { bg: 'rgb(38, 107, 196)', fg: 'rgb(255, 255, 255)' };

let passed = 0;
let failed = 0;
let manual = 0;

function pass(name) {
  passed += 1;
  console.log(`PASS  ${name}`);
}
function fail(name, detail) {
  failed += 1;
  console.error(`FAIL  ${name} — ${detail}`);
}
function note(name) {
  manual += 1;
  console.log(`수동  ${name}`);
}

function lum(channel) {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function contrast(bg, fg) {
  const parse = (rgb) => rgb.match(/\d+/g).slice(0, 3).map(Number);
  const [br, bgg, bb] = parse(bg);
  const [fr, fgG, fb] = parse(fg);
  const L1 = 0.2126 * lum(br) + 0.7152 * lum(bgg) + 0.0722 * lum(bb);
  const L2 = 0.2126 * lum(fr) + 0.7152 * lum(fgG) + 0.0722 * lum(fb);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

async function probe(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
    return res.status < 500;
  } catch (e) {
    return false;
  }
}

async function readBox(locator) {
  const handle = await locator.elementHandle();
  if (!handle) return null;
  return handle.evaluate((el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const after = getComputedStyle(el, '::after');
    const pad = (v) => Math.round(parseFloat(v) * 10) / 10;
    return {
      tag: el.tagName,
      text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
      height: Math.round(r.height * 10) / 10,
      width: Math.round(r.width * 10) / 10,
      fontSize: s.fontSize,
      fontWeight: String(s.fontWeight),
      radius: s.borderRadius,
      padLeft: pad(s.paddingLeft),
      bg: s.backgroundColor,
      color: s.color,
      afterH: after.content === 'none' ? 0 : Math.round(parseFloat(after.height) * 10) / 10,
      scrollW: el.scrollWidth,
      clientW: el.clientWidth,
    };
  });
}

function near(n, expect, tol = 0.6) {
  return Math.abs(n - expect) <= tol;
}

function checkFill(name, box, height, pad) {
  if (!box) return fail(name, '버튼 없음');
  const bits = [];
  if (!near(box.height, height)) bits.push(`높이 ${box.height} (기대 ${height})`);
  if (box.fontSize !== '14px') bits.push(`글자 ${box.fontSize}`);
  if (box.fontWeight !== '600') bits.push(`굵기 ${box.fontWeight}`);
  if (!String(box.radius).startsWith('6px')) bits.push(`모서리 ${box.radius}`);
  if (!near(box.padLeft, pad, 1)) bits.push(`좌우 ${box.padLeft} (기대 ${pad})`);
  if (box.bg !== FILL.bg) bits.push(`바탕 ${box.bg}`);
  if (box.color !== FILL.fg) bits.push(`글자색 ${box.color}`);
  const ratio = contrast(box.bg, box.color);
  if (ratio < 4.5) bits.push(`대비 ${ratio.toFixed(2)}`);
  if (bits.length) fail(name, bits.join(', '));
  else pass(`${name} ${box.height}px ${box.fontSize}`);
}

function checkWhite(name, box, height, pad) {
  if (!box) return fail(name, '버튼 없음');
  const bits = [];
  if (!near(box.height, height)) bits.push(`높이 ${box.height} (기대 ${height})`);
  if (box.fontSize !== '14px') bits.push(`글자 ${box.fontSize}`);
  if (box.fontWeight !== '600') bits.push(`굵기 ${box.fontWeight}`);
  if (!String(box.radius).startsWith('6px')) bits.push(`모서리 ${box.radius}`);
  if (!near(box.padLeft, pad, 1)) bits.push(`좌우 ${box.padLeft} (기대 ${pad})`);
  if (box.bg === FILL.bg) bits.push('흰 버튼이 파란 채움으로 바뀜');
  if (bits.length) fail(name, bits.join(', '));
  else pass(`${name} ${box.height}px 흰 바탕`);
}

function checkStrong(name, box, height) {
  if (!box) return fail(name, '버튼 없음');
  const bits = [];
  if (!near(box.height, height, 1)) bits.push(`높이 ${box.height} (기대 ${height})`);
  if (box.bg !== STRONG.bg) bits.push(`바탕 ${box.bg}`);
  if (box.color !== STRONG.fg) bits.push(`글자색 ${box.color}`);
  if (bits.length) fail(name, bits.join(', '));
  else pass(`${name} 진한 파랑 유지 ${box.height}px`);
}

async function open(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(400);
}

async function btnText(page, text) {
  const loc = page.locator('a.btn, button.btn');
  const count = await loc.count();
  for (let i = 0; i < count; i++) {
    const label = (await loc.nth(i).innerText()).replace(/\s+/g, ' ').trim();
    if (label === text) return readBox(loc.nth(i));
  }
  return null;
}

const homeUp = await probe(HOME);
const searchUp = await probe(SEARCH);
const authUp = await probe(AUTH);
const roomUp = await probe(ROOM);
const tutorUp = await probe(TUTOR);

if (!homeUp) {
  console.error(`SKIP  홈 미리보기 서버가 안 떠 있음 (${HOME}). 서버를 띄운 뒤 다시 실행.`);
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await desktop.newPage();
const phone = await mobile.newPage();

try {
  await open(page, `${HOME}/#/guest`);
  const plans = await btnText(page, '유료상품 보기');
  checkFill('1 유료상품 보기', plans, 30, 14);
  const login = await btnText(page, '로그인');
  checkFill('2 로그인', login, 26, 12);
  const join = await btnText(page, '회원가입');
  checkWhite('2 회원가입', join, 26, 12);

  const tokens = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      brand: s.getPropertyValue('--brand-blue').trim(),
      btnH: s.getPropertyValue('--btn-h').trim(),
      inputH: s.getPropertyValue('--input-h').trim(),
    };
  });
  if (tokens.brand === '#266bc4' && tokens.btnH === '2.75rem' && tokens.inputH === '2.75rem') {
    pass('C-8 기존 높이·브랜드 파랑 토큰 유지');
  } else fail('C-8 토큰', JSON.stringify(tokens));

  await open(page, `${HOME}/#/support`);
  checkFill('10 자주 묻는 질문', await btnText(page, '자주 묻는 질문'), 30, 14);
  checkWhite('10 운영문의 남기기', await btnText(page, '운영문의 남기기'), 30, 14);

  await open(page, `${HOME}/#/guide`);
  checkFill('14 공부방 찾기 시작', await btnText(page, '공부방 찾기 시작'), 30, 14);
  checkWhite('14 과외쌤 찾기 시작', await btnText(page, '과외쌤 찾기 시작'), 30, 14);

  await open(page, `${HOME}/`);
  const hero = page.locator('.hero-map__cta').first();
  const heroBox = (await hero.count()) ? await readBox(hero) : null;
  if (!heroBox) fail('4 히어로', '버튼 없음');
  else {
    const bits = [];
    if (!near(heroBox.height, 30)) bits.push(`높이 ${heroBox.height}`);
    if (heroBox.fontSize !== '12px') bits.push(`글자 ${heroBox.fontSize} (12px 유지)`);
    if (heroBox.bg !== FILL.bg) bits.push(`바탕 ${heroBox.bg}`);
    if (heroBox.color !== FILL.fg) bits.push(`글자색 ${heroBox.color}`);
    if (bits.length) fail('4 히어로', bits.join(', '));
    else pass(`4 히어로 ${heroBox.height}px 글자 ${heroBox.fontSize}`);
  }

  if (searchUp) {
    await open(page, `${SEARCH}/`);
    const searchBtn = page.locator('.btn--search').first();
    const searchBox = (await searchBtn.count()) ? await readBox(searchBtn) : null;
    if (!searchBox) fail('5 검색', '버튼 없음');
    else {
      const bits = [];
      if (!near(searchBox.height, 30)) bits.push(`높이 ${searchBox.height}`);
      if (searchBox.width < 72) bits.push(`폭 ${searchBox.width} (최소 72)`);
      if (searchBox.bg !== FILL.bg) bits.push(`바탕 ${searchBox.bg}`);
      if (bits.length) fail('5 검색', bits.join(', '));
      else pass(`5 검색 ${searchBox.height}px 폭 ${searchBox.width}`);
    }
    const sort = page.locator('select.list-sort-bar__select').first();
    const sortBox = (await sort.count()) ? await readBox(sort) : null;
    if (!sortBox) note('3 최신순 — 이 화면에 정렬이 없어 수동 확인');
    else if (near(sortBox.height, 30) && sortBox.fontSize === '14px' && sortBox.bg !== FILL.bg) {
      pass(`3 최신순 ${sortBox.height}px ${sortBox.fontSize}`);
    } else fail('3 최신순', `h=${sortBox.height} fs=${sortBox.fontSize} bg=${sortBox.bg}`);
  } else note(`5·3 검색 화면 — 서버 없음 (${SEARCH})`);

  if (authUp) {
    await open(page, `${AUTH}/`);
    const submit = page.locator('button[type="submit"]').first();
    const submitBox = (await submit.count()) ? await readBox(submit) : null;
    if (!submitBox) note('X1 로그인 제출 — 버튼을 못 찾음, 수동 확인');
    else if (submitBox.bg === STRONG.bg && submitBox.color === STRONG.fg && near(submitBox.height, 44, 2)) {
      pass(`X1 로그인 제출 유지 ${submitBox.height}px`);
    } else fail('X1 로그인 제출', `h=${submitBox.height} bg=${submitBox.bg} c=${submitBox.color}`);
  } else note(`X1 로그인 제출 — 서버 없음 (${AUTH})`);

  if (roomUp) {
    await open(page, `${ROOM}/`);
    const next = page.locator('[data-action="next"]').first();
    const nextBox = (await next.count()) ? await readBox(next) : null;
    if (!nextBox) note('X2 다음 — 이 화면에 없음, 수동 확인');
    else checkStrong('X2 다음', nextBox, 40);
  } else note(`X2 공부방 등록 — 서버 없음 (${ROOM})`);

  await open(phone, `${HOME}/#/guest`);
  const mPlans = await btnText(phone, '유료상품 보기');
  if (!mPlans) fail('모바일 유료상품 보기', '버튼 없음');
  else if (mPlans.afterH >= 44 && near(mPlans.height, 30, 1)) pass(`모바일 유료상품 보기 보임 ${mPlans.height}px 누름 ${mPlans.afterH}px`);
  else fail('모바일 유료상품 보기', `보임 ${mPlans.height} 누름 ${mPlans.afterH}`);

  if (mPlans) {
    const point = await phone.evaluate(() => {
      const el = [...document.querySelectorAll('a.btn,button.btn')].find((n) => (n.textContent || '').trim() === '유료상품 보기');
      if (!el) return null;
      el.scrollIntoView({ block: 'center' });
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { ok: hit === el || (hit && el.contains(hit)), hit: hit ? (hit.className || hit.tagName) : 'none' };
    });
    if (point?.ok) pass('C-6 유료상품 보기 한가운데를 누르면 그 버튼');
    else fail('C-6', `한가운데가 ${point?.hit || '없음'} 으로 감`);
  }

  await browser.close();
} catch (e) {
  console.error(`FAIL  실행 오류 — ${e?.message || e}`);
  failed += 1;
  await browser.close().catch(() => {});
}

console.log(`\n결과  pass ${passed}  fail ${failed}  수동 ${manual}`);
if (!searchUp || !authUp || !roomUp || !tutorUp) {
  console.log('참고  일부 미리보기 서버가 없어 그 화면은 수동으로 남겼습니다.');
}
process.exit(failed ? 1 : 0);
