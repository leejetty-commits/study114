/**
 * 학생 「상세정보 이어서 입력하기」 셀프검수 캡처 (1280·390)
 * 전제: API :8080 · auth-ui :5173 · home-ui :5174 · MySQL docker
 * 실행: node scripts/capture-student-detail-continue.mjs
 * @test.local 만 사용. 실이메일·실명 로그 금지.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'node:child_process';
import { chromium, request as pwRequest } from 'playwright';
import {
  DEV_PASSWORD,
  buildSignupPayload,
  buildBasicRegisterPayload,
} from '../e2e/helpers/signup-flow.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs/worklog/2026/11/shots-student-detail-continue');
const AUTH = process.env.STUDY114_AUTH_UI_URL || 'http://127.0.0.1:5173';
const HOME = process.env.STUDY114_HOME_UI_URL || 'http://127.0.0.1:5174';
const API = process.env.STUDY114_API_BASE || 'http://127.0.0.1:8080';

mkdirSync(OUT, { recursive: true });

function mysql(sql) {
  return execFileSync(
    'docker',
    ['exec', 'study114-mysql-dev', 'mysql', '-uroot', '-pstudy114dev', '-N', '-e', sql],
    { encoding: 'utf8' },
  ).trim();
}

async function createStudentViaApi() {
  const api = await pwRequest.newContext({ baseURL: API });
  await api.post('/api/auth/logout.php').catch(() => {});
  const payload = buildSignupPayload('student');
  payload.phone = `010${String(Date.now()).slice(-8)}`;
  const signupRes = await api.post('/api/auth/signup.php', { data: payload });
  const signupBody = await signupRes.json();
  if (!signupRes.ok() || !signupBody.ok) {
    throw new Error(`signup 실패: ${signupBody.message || signupRes.status()}`);
  }
  mysql(
    `UPDATE study114_dev.users SET email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = ${Number(signupBody.user_id)};`,
  );
  // 학생 희망=과외면 region_id는 과외 단위(tutor_units)여야 한다.
  const regionsRes = await api.get('/api/auth/regions.php?action=list&v=1');
  const regionsBody = await regionsRes.json();
  const unitId = Number(regionsBody.tutor_units?.[0]?.id || 0);
  if (!unitId) throw new Error('tutor_units 없음 — 로컬 시드 확인');
  const basicRes = await api.post('/api/auth/basic-register.php', {
    data: { role: 'student', payload: buildBasicRegisterPayload(unitId, 'student') },
  });
  const basicBody = await basicRes.json();
  if (!basicRes.ok() || !basicBody.ok) {
    throw new Error(`basic-register 실패: ${basicBody.message || basicRes.status()}`);
  }
  await api.dispose();
  return {
    email: payload.email,
    password: DEV_PASSWORD,
    studentId: Number(basicBody.id),
    userId: Number(signupBody.user_id),
  };
}

async function login(page, email, password) {
  await page.goto(`${AUTH}/#/login`);
  await page.waitForSelector('#login-email, input[type="email"]', { timeout: 30_000 });
  await page.locator('#login-email, input[type="email"]').first().fill(email);
  await page.locator('#login-password, input[type="password"]').first().fill(password);
  await page.locator('[data-form="login"] button[type="submit"], button[type="submit"]').first().click();
  await page.waitForURL(/5174|mypage|parent|home/, { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(800);
  const me = await page.evaluate(async () => {
    const r = await fetch('/api/auth/me.php', { credentials: 'include' });
    return r.json();
  });
  if (!me.authenticated) throw new Error('로그인 세션 없음');
}

async function gotoCompleteWithState(page, { email, studentId }) {
  await page.goto(`${AUTH}/#/signup/complete`);
  await page.waitForSelector('[data-action="go-detail-register"]', { timeout: 30_000 });
  // Vite dev: 같은 모듈 인스턴스의 signupState에 id를 심어 메모리 경로를 검증
  await page.evaluate(
    async ({ email: em, studentId: id }) => {
      const mod = await import('/src/state.js');
      mod.signupState.role = 'student';
      mod.signupState.lastSignup = {
        userId: 0,
        email: em,
        roleType: 'guardian_student',
        emailSent: true,
      };
      mod.signupState.basicRegisterResult = { ok: true, kind: 'student', id };
      mod.signupState.basicRegister = {
        student: { region_label: '테스트', preferred_lesson_type: 'tutor' },
      };
    },
    { email, studentId },
  );
}

async function assertDetailForm(page) {
  await page.waitForURL(/registrations\/students\/\d+\/detail/, { timeout: 60_000 });
  await page.waitForSelector('text=학생 상세정보', { timeout: 30_000 });
  const body = await page.locator('body').innerText();
  if (body.includes('학생 정보를 찾을 수 없습니다')) {
    throw new Error('상세 폼 대신 not_found');
  }
}

async function shot(page, name) {
  await page.screenshot({ path: join(OUT, name), fullPage: true });
  console.log('shot', name);
}

async function captureViaUi(width, height, tag) {
  const acct = await createStudentViaApi();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  page.setDefaultTimeout(60_000);

  await login(page, acct.email, acct.password);

  // 1) 메모리 id 경로
  await gotoCompleteWithState(page, acct);
  await page.locator('[data-action="go-detail-register"]').click();
  await assertDetailForm(page);
  await shot(page, `01-after-click-${tag}.png`);

  // 2) 새로고침 → signupState 비움 → API 폴백
  await page.goto(`${AUTH}/#/signup/complete`);
  await page.waitForSelector('[data-action="go-detail-register"]', { timeout: 30_000 });
  await page.reload();
  await page.waitForSelector('[data-action="go-detail-register"]', { timeout: 30_000 });
  await page.locator('[data-action="go-detail-register"]').click();
  await assertDetailForm(page);
  await shot(page, `02-after-refresh-click-${tag}.png`);

  // 3) 마이페이지 상세 탭(동일 경로)
  await page.goto(`${HOME}/#/mypage/registrations/students/${acct.studentId}/detail`);
  await assertDetailForm(page);
  await shot(page, `03-mypage-detail-tab-${tag}.png`);

  writeFileSync(
    join(OUT, `meta-${tag}.json`),
    JSON.stringify({ tag, studentId: acct.studentId, method: 'api+state-inject+api-fallback' }, null, 2),
  );

  await browser.close();
}

const health = await fetch(`${API}/api/auth/me.php`).catch(() => null);
if (!health) {
  console.error(`API 없음: ${API}`);
  process.exit(2);
}

console.log('API ok — 캡처 시작 (이메일은 로그에 찍지 않음)');
await captureViaUi(1280, 1600, '1280');
await captureViaUi(390, 1200, '390');
console.log('done →', OUT);
