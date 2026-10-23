/**
 * 292 베이직 카드 배지 자리. 로컬 하네스만 연다.
 * 실행: npm run verify:card-badge-layout
 */
import { execSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { renderPromoBadgeRow, renderTrustBadgeRow } from '../preview/home-ui/src/card-visual.js';
import {
  fitCardTrustRails,
  renderBrowseList,
  renderExposureBox,
} from '../preview/home-ui/src/exposure-render.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = join(process.env.TEMP || process.env.TMPDIR || ROOT, '292-card-badge');
const OLD = '91edd6f8';
const esc = (s) => String(s ?? '');
let failed = 0;

function ok(name, cond, detail = '') {
  if (cond) {
    console.log(`PASS  ${name}`);
    return;
  }
  failed += 1;
  console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
}

function gitText(rev, path) {
  return execSync(`git show ${rev}:${path}`, { cwd: ROOT, encoding: 'utf8' });
}

function functionRanges(src) {
  const ranges = [];
  const re = /^function ([A-Za-z0-9_]+)\(/gm;
  let m;
  while ((m = re.exec(src))) {
    ranges.push({ name: m[1], start: src.slice(0, m.index).split('\n').length });
  }
  for (let i = 0; i < ranges.length; i += 1) {
    ranges[i].end = i + 1 < ranges.length ? ranges[i + 1].start - 1 : src.split('\n').length;
  }
  return ranges;
}

const PROTECTED = [
  'renderStudyRoomMediaOverlay',
  'renderPickStudyRoomMedia',
  'renderTutorOverlayBottomGrid',
  'renderTutorFeeOverlay',
  'renderTutorMediaOverlay',
  'studyRoomTableRows',
  'tutorTableRows',
  'renderPrimeStudyRoom',
  'renderPrimeTutor',
  'renderPickStudyRoom',
  'renderPickTutor',
  'renderExposureBox',
];

const oldRender = gitText(OLD, 'preview/home-ui/src/exposure-render.js');
const protectedRanges = functionRanges(oldRender).filter((r) => PROTECTED.includes(r.name));
const renderDiff = execSync('git diff -U0 91edd6f8 -- preview/home-ui/src/exposure-render.js', {
  cwd: ROOT,
  encoding: 'utf8',
});
const touched = [];
for (const hunk of renderDiff.matchAll(/^@@ -(\d+)(?:,(\d+))?/gm)) {
  const start = Number(hunk[1]);
  const count = hunk[2] === undefined ? 1 : Number(hunk[2]);
  const end = start + Math.max(count, 1) - 1;
  for (const range of protectedRanges) {
    if (start <= range.end && end >= range.start) touched.push(`${range.name}@${start}`);
  }
}
ok('픽·프라임 렌더 함수는 91edd6f8과 같음', touched.length === 0, touched.join(', '));

const promoIn = [
  { id: 'new', label: 'New' },
  { id: 'hot', label: 'Hot' },
];
ok(
  '기본 promo HTML은 91edd6f8과 같음',
  renderPromoBadgeRow(promoIn, esc) ===
    '<div class="card-visual__promo" aria-label="주목·신규 배지"><span class="card-visual__promo-badge card-visual__promo-badge--new">New</span><span class="card-visual__promo-badge card-visual__promo-badge--hot">Hot</span></div>',
);
ok(
  '기본 trust HTML은 91edd6f8과 같음',
  renderTrustBadgeRow(['교육청등록'], esc) ===
    '<div class="card-visual__trust" aria-label="신뢰 배지"><span class="card-visual__trust-badge">교육청등록</span></div>',
);

const design = readFileSync(join(ROOT, 'preview/home-ui/src/styles/design-system.css'), 'utf8');
ok(
  '픽 과외쌤 오른쪽은 .25rem',
  /\.expo-card--pick\.expo-card--tutor \.expo-media-overlay__bl \{\s*right: \.25rem;/.test(design),
);
ok('프라임 과외쌤 오른쪽은 4rem', /\.expo-card--tutor \.expo-media-overlay__bl \{[^}]*right: 4rem;/.test(design));

const day = 24 * 60 * 60 * 1000;
const recent = new Date(Date.now() - 3 * day).toISOString();
const older = new Date(Date.now() - 10 * day).toISOString();

const room = {
  id: 2921,
  study_room_name: '한빛공부방',
  location_label: '강남구',
  price_amount: 300000,
  grade_band: '중등',
  main_subject_note: '수학',
  lesson_place_type: 'offline',
  capacity_per_time: '5_8',
  lesson_operation_type: 'group',
  slogan: '차분한 공부방',
  is_new: true,
  paid_badges: ['hot'],
  education_office_registered: true,
};
const roomMany = {
  ...room,
  id: 2922,
  study_room_name: '배지많은공부방',
  paid_badges: ['hot', 'subject_track'],
  business_registered: true,
  career_years: 12,
  proof_document_available: true,
};
const tutor = {
  id: 2923,
  tutor_display_name: '김선생',
  gender: 'female',
  location_label: '서초구',
  grade_band: '중등',
  main_subject_note: '국어',
  preferred_fee_amount: 250000,
  lessons_per_week: 2,
  minutes_per_lesson: 60,
  is_new: true,
  slogan: '국어는 기초부터',
};
const tutorMany = {
  ...tutor,
  id: 2924,
  tutor_display_name: '배지많은선생',
  paid_badges: ['hot', 'jjokjipge', 'sky'],
  university_status: 'graduated',
  career_year_band: 'y10_plus',
  proof_document_available: true,
};
const student = (publishedAt, id) => ({
  id,
  public_display_name: '김학생',
  location_label: '송파구',
  grade_level: '중2',
  subject_label: '수학',
  published_at: publishedAt,
  budget_amount: 300000,
});
const pickTutor = {
  id: 2925,
  tutor_display_name: '픽선생',
  location_label: '마포구',
  university_status: 'graduated',
  university_name: '점검대학교',
  major_name: '국어국문',
  career_year_band: 'y10_plus',
  lessons_per_week: 3,
  minutes_per_lesson: 90,
  preferred_fee_amount: 350000,
  grade_band: '중등',
  main_subject_note: '국어',
  image_path: '',
};

const stressPromo = renderPromoBadgeRow(
  [
    { id: 'hot', label: 'Hot' },
    { id: 'subject_track', label: '단과' },
    { id: 'jjokjipge', label: '쪽집게' },
    { id: 'sky', label: 'SKY' },
    { id: 'new', label: 'New' },
  ],
  esc,
  { split: true },
);
const stressTrust = renderTrustBadgeRow(['교육청등록', '사업자', '10년 경력', '증빙'], esc, { rail: true });
const stress = `
  <article class="expo-basic expo-basic--study_room expo-hcard" data-many="all">
    <div class="expo-hcard__media-wrap">${stressPromo}</div>
    <div class="expo-hcard__body">
      <div class="expo-hcard__top">
        <h3 class="expo-hcard__name">배지 많은 카드</h3>
        <p class="expo-hcard__price">월 30만원</p>
      </div>
      <ul class="expo-hcard__meta"><li class="expo-hcard__meta-item"><span class="expo-hcard__k">대상</span><span class="expo-hcard__v">중등</span></li></ul>
      <p class="expo-hcard__slogan"><span class="expo-hcard__k">슬로건</span> 한 줄</p>
    </div>
    <div class="expo-hcard__side">
      ${stressTrust}
      <div class="expo-hcard__actions"><div class="item-actions" aria-label="기능"><span>♡</span><span>⇄</span><span>✉</span></div></div>
    </div>
  </article>`;

function withTutorTrust(html) {
  const marker = 'data-provider-id="2924"';
  const start = html.indexOf(marker);
  const end = html.indexOf('</article>', start);
  if (start < 0 || end < 0) return html;
  let slice = html.slice(start, end).replace(marker, `${marker} data-many="tutor"`);
  const rail = '<div class="card-visual__trust card-visual__trust--rail" aria-label="신뢰 배지">';
  slice = slice.replace(rail, `${rail}<span class="card-visual__trust-badge">교육청등록</span>`);
  return html.slice(0, start) + slice + html.slice(end);
}

const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<link rel="stylesheet" href="/preview/home-ui/src/styles/tokens.css">
<link rel="stylesheet" href="/preview/home-ui/src/styles/design-system.css">
<link rel="stylesheet" href="/preview/home-ui/src/styles/home-listings.css">
<link rel="stylesheet" href="/preview/search-ui/src/styles/search-visily.css">
<style>
  body { margin: 0; background: #f8fafc; }
  .col { padding: 12px; }
  h2 { margin: 0 0 8px; font: 600 14px/1.4 sans-serif; }
</style></head><body>
<section id="normal" class="col"><h2>보통</h2>
${renderBrowseList('study_room', [room], { guest: false })}
${renderBrowseList('tutor', [tutor], { guest: false })}
${renderBrowseList('student', [student(recent, 2926)], { guest: false, viewerRole: 'tutor' })}
${renderBrowseList('student', [student(older, 2927)], { guest: false, viewerRole: 'tutor' }).replace('data-student-id="2927"', 'data-student-id="2927" data-student-age="old"')}
</section>
<section id="many" class="col"><h2>배지 많음</h2>
${renderBrowseList('study_room', [roomMany], { guest: false })}
${withTutorTrust(renderBrowseList('tutor', [tutorMany], { guest: false }))}
${stress}
</section>
<section id="pick" class="col"><h2>픽 과외쌤</h2>
${renderExposureBox('tutor', 'pick', pickTutor, '', {})}
${renderExposureBox('tutor', 'prime', pickTutor, '', {})}
${renderExposureBox('study_room', 'pick', room, '', {})}
${renderExposureBox('study_room', 'prime', room, '', {})}
</section>
</body></html>`;

for (const tier of ['pick', 'prime']) {
  for (const kind of ['tutor', 'study_room']) {
    const box = renderExposureBox(kind, tier, kind === 'tutor' ? pickTutor : room, '', {});
    ok(`${kind} ${tier}에 split·rail 클래스 없음`, !box.includes('card-visual__promo--split') && !box.includes('card-visual__trust--rail'));
  }
}

const recentHtml = renderBrowseList('student', [student(recent, 1)], { guest: false, viewerRole: 'tutor' });
const olderHtml = renderBrowseList('student', [student(older, 2)], { guest: false, viewerRole: 'tutor' });
ok('학생 published_at 3일 전 → New', recentHtml.includes('card-visual__promo-badge--new') && !('is_new' in student(recent, 1)));
ok('학생 published_at 10일 전 → New 없음', !olderHtml.includes('card-visual__promo-badge--new'));

function serve(pageHtml) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url || '/', 'http://127.0.0.1');
      if (url.pathname === '/') {
        res.setHeader('content-type', 'text/html; charset=utf-8');
        res.end(pageHtml);
        return;
      }
      const file = join(ROOT, decodeURIComponent(url.pathname.replace(/^\/+/, '')));
      if (!file.startsWith(ROOT)) {
        res.statusCode = 403;
        res.end();
        return;
      }
      try {
        const body = readFileSync(file);
        res.setHeader('content-type', file.endsWith('.css') ? 'text/css; charset=utf-8' : 'application/octet-stream');
        res.end(body);
      } catch {
        res.statusCode = 404;
        res.end();
      }
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function audit(fitSrc) {
  const fit = (0, eval)('(' + fitSrc + ')');
  fit(document);
  const sel = '.card-visual__promo-badge, .card-visual__trust-badge, .expo-overlay-val, .expo-overlay-bl-grid__cell, .card-stats, .item-actions, .expo-hcard__badge, .card-visual__trust-more, .expo-hcard__slogan, .expo-hcard__meta, .expo-hcard__name, .expo-hcard__price, .expo-hcard__loc, .expo-hcard__tags';
  const visibleBox = (el) => {
    if (el.hidden || getComputedStyle(el).display === 'none') return null;
    let rect = el.getBoundingClientRect();
    let node = el.parentElement;
    while (node && node !== document.documentElement) {
      const style = getComputedStyle(node);
      if (/(hidden|clip|scroll|auto)/.test(style.overflow + style.overflowX + style.overflowY)) {
        const host = node.getBoundingClientRect();
        const left = Math.max(rect.left, host.left);
        const top = Math.max(rect.top, host.top);
        const right = Math.min(rect.right, host.right);
        const bottom = Math.min(rect.bottom, host.bottom);
        rect = { left, top, right, bottom, width: right - left, height: bottom - top };
      }
      node = node.parentElement;
    }
    if (rect.width < 0.5 || rect.height < 0.5) return null;
    return rect;
  };
  const overlap = [];
  const clip = [];
  const nodes = [...document.querySelectorAll(sel)];
  nodes.forEach((el) => {
    if (el.hidden || getComputedStyle(el).display === 'none') return;
    if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1) {
      clip.push(el.className);
    }
  });
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      if (a.contains(b) || b.contains(a)) continue;
      const ra = visibleBox(a);
      const rb = visibleBox(b);
      if (!ra || !rb) continue;
      const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
      const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (w > 0.5 && h > 0.5) overlap.push(a.className + ' | ' + b.className);
    }
  }
  const cards = [...document.querySelectorAll('#normal .expo-hcard, #many .expo-hcard')].map((card) => {
    const media = card.querySelector('.expo-hcard__media-wrap');
    const mediaBox = media.getBoundingClientRect();
    const promo = card.querySelector('.card-visual__promo');
    const first = promo?.firstElementChild;
    const neu = card.querySelector('.card-visual__promo-badge--new');
    const neuBox = neu ? visibleBox(neu) : null;
    const paidAll = [...card.querySelectorAll('.card-visual__promo-badge:not(.card-visual__promo-badge--new)')];
    const paid = paidAll
      .map((el) => ({ el, box: visibleBox(el) }))
      .filter((row) => row.box && row.box.height >= 8);
    const tops = [...new Set(paid.map((row) => Math.round(row.box.top)))];
    const trust = [...card.querySelectorAll('.card-visual__trust-badge')];
    const trustVisible = trust.filter((el) => !el.hidden && visibleBox(el));
    const trustTops = [...new Set(trustVisible.map((el) => Math.round(visibleBox(el).top)))];
    const rail = card.querySelector('.card-visual__trust--rail');
    const hiddenTrust = trust.filter((el) => el.hidden).length;
    const more = rail?.querySelector('.card-visual__trust-more');
    return {
      many: card.dataset.many || '',
      normal: Boolean(card.closest('#normal')),
      photoBadges: card.querySelectorAll('.expo-hcard__media-wrap .expo-hcard__badge').length,
      newFirst: Boolean(first && first.classList.contains('card-visual__promo-badge--new')),
      newGold: neu ? getComputedStyle(neu).backgroundColor : '',
      newLeft: neuBox ? (neuBox.left + neuBox.right) / 2 < mediaBox.left + mediaBox.width / 2 && neuBox.top < mediaBox.top + mediaBox.height / 2 : null,
      paidRight: paid.every((row) => (row.box.left + row.box.right) / 2 >= mediaBox.left + mediaBox.width / 2 && row.box.top < mediaBox.top + mediaBox.height / 2),
      paidLines: tops.length,
      paidInside: paid.every((row) => {
        const raw = row.el.getBoundingClientRect();
        return raw.height >= 8
          && raw.left >= mediaBox.left - 1
          && raw.right <= mediaBox.right + 1
          && raw.top >= mediaBox.top - 1
          && raw.bottom <= mediaBox.bottom + 1;
      }),
      paidHidden: paidAll.length - paid.length,
      paidMissing: paidAll.filter((el) => {
        const box = visibleBox(el);
        return !(box && box.height >= 8);
      }).map((el) => el.textContent),
      trustCount: trust.length,
      trustInSide: trustVisible.every((el) => el.closest('.expo-hcard__side')),
      trustInPhoto: card.querySelectorAll('.expo-hcard__media-wrap .card-visual__trust-badge').length,
      trustLines: trustTops.length,
      trustUnderPhoto: trustVisible.length > 0 && trustVisible.every((el) => {
        const raw = el.getBoundingClientRect();
        return raw.top >= mediaBox.bottom - 1
          && raw.left >= mediaBox.left - 2
          && raw.right <= mediaBox.right + 2;
      }),
      hiddenTrust,
      more: more ? more.textContent : '',
      railClip: rail ? rail.scrollWidth > rail.clientWidth + 1 : false,
    };
  });
  const bl = document.querySelector('.expo-card--pick.expo-card--tutor .expo-media-overlay__bl');
  const fee = document.querySelector('.expo-card--pick.expo-card--tutor .expo-overlay-bl-grid__cell:nth-child(4)');
  const sampleNew = document.querySelector('.card-visual__promo-badge--new');
  const samplePaid = document.querySelector('.card-visual__promo-badge--hot');
  return {
    overlap, clip, cards,
    pickRight: bl ? getComputedStyle(bl).right : '',
    feeClip: fee ? fee.scrollWidth > fee.clientWidth + 1 : true,
    newAnim: sampleNew ? getComputedStyle(sampleNew).animationName : '',
    paidAnim: samplePaid ? getComputedStyle(samplePaid, '::after').animationName : '',
    paidAfter: samplePaid ? getComputedStyle(samplePaid, '::after').display : '',
  };
}

mkdirSync(SHOTS, { recursive: true });
const server = await serve(html);
const port = server.address().port;
let browser;
try {
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch {
    browser = await chromium.launch({ headless: true });
  }
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
    const report = await page.evaluate(audit, fitCardTrustRails.toString());
    console.log(`WIDTH ${width}`, JSON.stringify(report));
    ok(`${width} 겹침 0`, report.overlap.length === 0, report.overlap.slice(0, 6).join(' / '));
    ok(`${width} 잘림 0`, report.clip.length === 0, report.clip.slice(0, 6).join(' / '));
    ok(`${width} 사진 배지 0`, report.cards.every((card) => card.photoBadges === 0));
    ok(`${width} New는 첫 자식·왼쪽 위·금색`, report.cards.filter((card) => card.newGold).every((card) => card.newFirst && card.newLeft && card.newGold === 'rgb(232, 185, 49)'));
    ok(`${width} 보통 카드 유료 배지 2줄 이하`, report.cards.filter((card) => card.normal).every((card) => card.paidLines <= 2));
    ok(`${width} 유료 배지 3줄 이하·사진 칸 안`, report.cards.filter((card) => card.paidLines > 0).every((card) => card.paidLines <= 3 && card.paidInside));
    ok(`${width} 유료 배지 숨김 0개`, report.cards.every((card) => card.paidHidden === 0), report.cards.filter((card) => card.paidHidden).map((card) => `${card.many || 'card'}:${card.paidMissing.join('+')}`).join(', '));
    const tutorCard = report.cards.find((card) => card.many === 'tutor');
    ok(`${width} 과외쌤 믿음배지 4개 이상·+N 없음`, Boolean(tutorCard) && tutorCard.trustCount >= 4 && tutorCard.hiddenTrust === 0 && tutorCard.more === '' && tutorCard.railClip === false, JSON.stringify(tutorCard));
    ok(`${width} 신뢰 배지는 사진 밖`, report.cards.every((card) => card.trustInPhoto === 0 && (card.trustLines <= 1 || card.trustUnderPhoto) && !card.railClip));
    const many = report.cards.find((card) => card.many === 'all');
    ok(`${width} 많은 카드 +N은 숨긴 개수와 같음`, Boolean(many) && (many.hiddenTrust === 0 ? many.more === '' : many.more === `+${many.hiddenTrust}`), JSON.stringify(many));
    await page.locator('#normal').screenshot({ path: join(SHOTS, `${width}-normal.png`) });
    await page.locator('#many').screenshot({ path: join(SHOTS, `${width}-many.png`) });
    if (width === 390) {
      ok('390 픽 과외쌤 right 4px', report.pickRight === '4px', report.pickRight);
      ok('390 픽 수업료 칸 안 잘림', report.feeClip === false);
    }
    await page.close();
  }

  const quiet = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const quietPage = await quiet.newPage();
  await quietPage.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
  const motion = await quietPage.evaluate(audit, fitCardTrustRails.toString());
  ok('reduced-motion New animation none', motion.newAnim === 'none', motion.newAnim);
  ok('reduced-motion 유료 ::after animation none', motion.paidAnim === 'none', motion.paidAnim);
  ok('reduced-motion 유료 ::after display none', motion.paidAfter === 'none', motion.paidAfter);
  await quiet.close();

  const tamperPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await tamperPage.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
  const before = await tamperPage.evaluate(audit, fitCardTrustRails.toString());
  await tamperPage.evaluate(() => {
    const card = document.querySelector('[data-many="all"]');
    const promo = card.querySelector('.card-visual__promo');
    promo.appendChild(promo.querySelector('.card-visual__promo-badge--new'));
  });
  const movedNew = await tamperPage.evaluate(audit, fitCardTrustRails.toString());
  await tamperPage.evaluate(() => {
    const card = document.querySelector('[data-many="all"]');
    const trust = card.querySelector('.card-visual__trust');
    card.querySelector('.expo-hcard__media-wrap').appendChild(trust);
  });
  const movedTrust = await tamperPage.evaluate(audit, fitCardTrustRails.toString());
  const manyBefore = before.cards.find((card) => card.many === 'all');
  const manyNew = movedNew.cards.find((card) => card.many === 'all');
  const manyTrust = movedTrust.cards.find((card) => card.many === 'all');
  ok('변조: New를 오른쪽으로 옮기면 검사 실패', manyBefore?.newFirst === true && manyNew?.newFirst === false);
  ok('변조: trust를 사진 안으로 옮기면 검사 실패', manyBefore?.trustInPhoto === 0 && manyTrust?.trustInPhoto > 0);
  await tamperPage.close();
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}

console.log(failed ? `FAIL ${failed}` : 'ALL PASS');
console.log(`SHOTS ${SHOTS}`);
if (failed) process.exit(1);
