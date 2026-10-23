/**
 * 281 스크린샷용 — 새 테스트 계정만 만들고 노출 탭/경고 띠를 찍는다.
 * 커밋하지 않음. Chrome + Playwright.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const API = process.env.STUDY114_API_BASE || 'http://127.0.0.1:8080';
const UI = process.env.HOME_UI_BASE || 'http://127.0.0.1:5176';
const PASS = 'TestPass123!';
const phase = process.argv[2] === 'before' ? 'before' : 'after';
const outDir = join(root, 'docs/worklog/2026/10/assets', phase === 'before' ? '281-before' : '281-after');
mkdirSync(outDir, { recursive: true });

const chromePath =
  process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function jar() {
  /** @type {Map<string, string>} */
  const map = new Map();
  return {
    /** @param {Response} res */
    store(res) {
      const raw = res.headers.getSetCookie?.() || [];
      for (const line of raw) {
        const part = String(line).split(';')[0];
        const i = part.indexOf('=');
        if (i > 0) map.set(part.slice(0, i), part.slice(i + 1));
      }
    },
    header() {
      return [...map.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
    },
  };
}

async function api(path, { method = 'GET', body, cookies } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookies ? { Cookie: cookies } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { res, data, setCookie: res.headers.getSetCookie?.() || [] };
}

function email(tag) {
  return `281_${tag}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@test.local`;
}

async function signup(role, tag) {
  const c = jar();
  const mail = email(tag);
  const { res, data } = await api('/api/auth/signup.php', {
    method: 'POST',
    body: {
      email: mail,
      password: PASS,
      password_confirm: PASS,
      name: `281${tag}`,
      gender: 'male',
      phone: '01012345678',
      address: '서울특별시 강남구 테헤란로 1',
      address_zip: '06236',
      address_line2: '',
      role,
      sms_consent: false,
      email_consent: true,
    },
  });
  c.store(res);
  if (!data.ok) throw new Error(`signup ${tag}: ${JSON.stringify(data)}`);
  // 로컬 전용: 새 테스트 계정 이메일 인증 처리(기존 시드 계정 미사용)
  mysql(
    `UPDATE users SET email_verified_at=NOW() WHERE id=${Number(data.user_id)} LIMIT 1`,
  );
  // regions
  // 로컬 DB에서 역할별 허용 단위 직접 고름(regions API는 dong 위주)
  // 과외: 메트로는 unit_level=sido + official_code. 공부방: dong.
  const regionSql =
    role === 'tutor'
      ? "SELECT id FROM regions WHERE unit_level='sido' AND official_code IS NOT NULL AND is_active=1 ORDER BY id LIMIT 1"
      : "SELECT id FROM regions WHERE unit_level='dong' AND dong_name<>'' AND is_active=1 ORDER BY id LIMIT 1";
  const idOut = execSync(
    `docker exec study114-mysql-dev mysql -uroot -pstudy114dev -N study114_dev -e "${regionSql}"`,
    { encoding: 'utf8' },
  )
    .trim()
    .split(/\r?\n/)
    .pop();
  const regionId = Number(idOut);
  if (!regionId) throw new Error(`regions ${tag}: no row (${role})`);
  const payload =
    role === 'tutor'
      ? {
          tutor_display_name: `281${tag}`,
          region_id: regionId,
          main_subject_note: '수학',
          school_level: 'middle',
          slogan: '281테스트슬로건',
          student_gender_group: 'mixed',
          student_count_group: 'solo',
          preferred_fee_amount: 480000,
          fee_basis_type: 'monthly_by_weekly_schedule',
          lessons_per_week: 2,
          minutes_per_lesson: 90,
          lesson_places: ['student_home_visit'],
          teaching_style_badges: [],
          gender: 'male',
        }
      : {
          study_room_name: `281${tag}`,
          region_id: regionId,
          main_subject_note: '수학',
          price_amount: 420000,
          lesson_place_type: 'academy',
          lesson_operation_type: 'group_by_time_slot',
          capacity_per_time: 'one_to_four',
          primary_school_levels: ['middle'],
          gender: 'male',
          education_office_registered: false,
          slogan: '281테스트슬로건',
          home_address: '서울특별시 강남구 테헤란로 1',
          home_address_zip: '06236',
          address_text: '서울특별시 강남구 테헤란로 1',
          region_basis_type: 'dong',
          saved_regions: [{ region_id: regionId, region_basis_type: 'dong' }],
        };
  const basic = await api('/api/auth/basic-register.php', {
    method: 'POST',
    body: { role, payload },
    cookies: c.header(),
  });
  c.store(basic.res);
  if (!basic.data.ok) throw new Error(`basic ${tag}: ${JSON.stringify(basic.data)}`);
  let id = Number(basic.data.id || 0);
  if (!id) {
    const listPath =
      role === 'tutor' ? '/api/registrations/tutors.php' : '/api/registrations/study-rooms.php';
    const list = await api(listPath, { cookies: c.header() });
    c.store(list.res);
    const rows = role === 'tutor' ? list.data.tutors : list.data.study_rooms || list.data.rooms;
    id = Number(rows?.[0]?.id || 0);
  }
  if (!id) throw new Error(`list id ${tag}: ${JSON.stringify(basic.data)}`);
  return { email: mail, password: PASS, role, id, userId: Number(data.user_id), cookies: c.header() };
}

function mysql(sql) {
  const oneLine = String(sql).replace(/\s+/g, ' ').trim();
  execSync(
    `docker exec study114-mysql-dev mysql -uroot -pstudy114dev --default-character-set=utf8mb4 study114_dev -e ${JSON.stringify(oneLine)}`,
    { stdio: 'pipe' },
  );
}

async function fillTutorPick(acc) {
  // 픽: 학교·학과 또는 경력 + 강의스타일
  mysql(
    `UPDATE tutors SET university_name='서울대', career_year_band=NULL WHERE id=${acc.id} AND user_id=${acc.userId}`,
  );
  mysql(`DELETE FROM tutor_teaching_style_badges WHERE tutor_id=${acc.id}`);
  mysql(
    `INSERT INTO tutor_teaching_style_badges (tutor_id, badge_name, display_order) VALUES (${acc.id}, 'concept_focus', 1)`,
  );
}

async function fillRoomPick(acc) {
  // 픽: cover, intro_short, fee, teaching_style — fee는 basic의 price_amount로 이미 있을 수 있음
  mysql(
    `UPDATE study_rooms SET intro_short='한줄소개', teaching_style='kind', price_amount=420000 WHERE id=${acc.id} AND user_id=${acc.userId}`,
  );
  mysql(`DELETE FROM study_room_images WHERE study_room_id=${acc.id}`);
  mysql(
    `INSERT INTO study_room_images (study_room_id, image_type, sort_order, image_path, original_filename, is_system_default) VALUES (${acc.id}, 'cover', 1, '/uploads/281-test-cover.jpg', '281-test-cover.jpg', 0)`,
  );
}

async function grantPick(acc) {
  // 로컬 DB 컬럼(039 이후): duration_* · started_on · end_exclusive_on 필수
  mysql(
    `INSERT INTO provider_position_subscriptions
      (user_id, sku_code, duration_type, duration_value, period_days,
       started_on, end_exclusive_on, starts_at, ends_at, source)
     VALUES (
       ${acc.userId}, 'pick', 'day', 14, 14,
       CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY),
       NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY), 'manual')`,
  );
}

async function loginPage(page, acc) {
  // Vite 프록시 오리진으로 로그인 후 쿠키를 브라우저 컨텍스트에 심는다.
  await page.context().clearCookies();
  const res = await page.request.post(`${UI}/api/auth/login.php`, {
    data: { email: acc.email, password: acc.password },
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`login ${acc.email}: ${JSON.stringify(data)}`);
  const rawCookies = res.headersArray().filter((h) => h.name.toLowerCase() === 'set-cookie');
  const ui = new URL(UI);
  for (const h of rawCookies) {
    const part = h.value.split(';')[0];
    const eq = part.indexOf('=');
    if (eq < 1) continue;
    await page.context().addCookies([
      {
        name: part.slice(0, eq),
        value: part.slice(eq + 1),
        domain: ui.hostname,
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
  }
  await page.goto(`${UI}/#/mypage`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  const logged = await page.evaluate(async () => {
    const r = await fetch('/api/auth/me.php', { credentials: 'include' });
    const j = await r.json();
    return !!(j && j.ok && j.authenticated);
  });
  if (!logged) throw new Error(`me not logged: ${acc.email}`);
}

async function shot(page, name, hash, { waitSel } = {}) {
  const h = hash.startsWith('#') ? hash : `#${hash}`;
  await page.goto(`${UI}/${h}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  if (waitSel) {
    await page.waitForSelector(waitSel, { timeout: 8000 }).catch(() => {});
  }
  // 티어 하이드레이트·허브 경고 띠
  await page.waitForTimeout(1500);
  if (page.viewportSize()?.width === 1280) {
    await page.evaluate(() => {
      document.querySelector('[data-281-scroll-pad]')?.remove();
      const pad = document.createElement('div');
      pad.style.height = '1600px';
      pad.setAttribute('data-281-scroll-pad', '1');
      document.body.appendChild(pad);
    });
  }
  const file = join(outDir, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log('wrote', file, page.url());
  return file;
}

const stateFile = join(__dir, '281-accounts.json');
let accounts;
if (!existsSync(stateFile)) {
  console.log('seeding accounts...');
  const tutorEmpty = await signup('tutor', 'tutor_empty');
  const tutorPick = await signup('tutor', 'tutor_pick');
  await fillTutorPick(tutorPick);
  const roomEmpty = await signup('study_room', 'room_empty');
  const roomPick = await signup('study_room', 'room_pick');
  await fillRoomPick(roomPick);
  const tutorWarn = await signup('tutor', 'tutor_warn');
  // 이용 중 픽 + 상세 비움 → 경고 띠
  await grantPick(tutorWarn);
  const roomWarn = await signup('study_room', 'room_warn');
  await grantPick(roomWarn);
  accounts = { tutorEmpty, tutorPick, roomEmpty, roomPick, tutorWarn, roomWarn };
  writeFileSync(stateFile, JSON.stringify(accounts, null, 2));
  console.log('saved', stateFile);
} else {
  accounts = JSON.parse(await import('node:fs').then((fs) => fs.readFileSync(stateFile, 'utf8')));
  console.log('reuse accounts', Object.keys(accounts).map((k) => `${k}:${accounts[k].id}`).join(' '));
}

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const suffix = phase === 'before' ? '전' : '후';

/** @type {{ key: string, name: string, hash: string, waitSel: string }[]} */
const shots = [
  {
    key: 'tutorEmpty',
    name: `281-과외쌤노출-빈`,
    hash: `#/mypage/registrations/tutors/${accounts.tutorEmpty.id}/exposure`,
    waitSel: '.p20-matrix, .p20-exposure-body',
  },
  {
    key: 'tutorPick',
    name: `281-과외쌤노출-픽만`,
    hash: `#/mypage/registrations/tutors/${accounts.tutorPick.id}/exposure`,
    waitSel: '.p20-matrix, .p20-exposure-body',
  },
  // 공부방: /exposure → inquiries 리다이렉트. 등록점검(publish)에서 픽/프라임 조건 확인.
  {
    key: 'roomEmpty',
    name: `281-공부방노출-빈`,
    hash: `#/mypage/registrations/study-rooms/${accounts.roomEmpty.id}/publish`,
    waitSel: '.rc-page, .mp-room-panel',
  },
  {
    key: 'roomPick',
    name: `281-공부방노출-픽만`,
    hash: `#/mypage/registrations/study-rooms/${accounts.roomPick.id}/publish`,
    waitSel: '.rc-page, .mp-room-panel',
  },
  {
    key: 'tutorWarn',
    name: `281-과외쌤경고띠`,
    hash: `#/mypage/registrations/tutors/${accounts.tutorWarn.id}`,
    waitSel: '[data-tier-missing-warn], .mp-room-panel',
  },
  {
    key: 'roomWarn',
    name: `281-공부방경고띠`,
    hash: `#/mypage/registrations/study-rooms/${accounts.roomWarn.id}`,
    waitSel: '[data-tier-missing-warn], .mp-room-panel',
  },
];

for (const vp of [
  { w: 1280, h: 900, tag: '1280' },
  { w: 390, h: 844, tag: '390' },
]) {
  for (const s of shots) {
    const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await context.newPage();
    const acc = accounts[s.key];
    console.log('shot', s.name, vp.tag, acc.email, 'id', acc.id, '→', s.hash);
    await loginPage(page, acc);
    await shot(page, `${s.name}-${vp.tag}-${suffix}.png`, s.hash, { waitSel: s.waitSel });
    await context.close();
  }
}

await browser.close();
console.log('done', phase);
