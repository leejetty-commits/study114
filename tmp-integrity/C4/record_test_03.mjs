import { STATE_FILE, BASE_URL, OUT_DIR, SHOTS_DIR, blockedLogs, chromium, setupSafetyRoute } from './common.mjs';
import path from 'path';
import fs from 'fs';

async function recordTest03() {
  console.log('=== Recording Test 3: Tutor 9 In-Page Edit Analysis ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: STATE_FILE,
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  await setupSafetyRoute(page);

  // 1. hydrate
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 2. 마이페이지 과외 9 메인
  await page.goto(`${BASE_URL}/#/mypage/registrations/tutors/9`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '03-01-tutor9-mypage-hub.png'), fullPage: true });

  // 3. /basic 화면
  await page.goto(`${BASE_URL}/#/mypage/registrations/tutors/9/basic`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '03-02-tutor9-basic-screen.png'), fullPage: true });

  // 4. /detail 화면
  await page.goto(`${BASE_URL}/#/mypage/registrations/tutors/9/detail`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '03-03-tutor9-detail-screen.png'), fullPage: true });

  const report = {
    testItem: '3. 마이페이지 내 등록(과외샤 9) 인페이지 수정',
    actionTaken: '저장하지 않음 (지침 준수: 저장이 지역 재선택을 요구하거나 지역 값을 함께 보내는 구조면 저장하지 말고 요청 본문 구조만 기록해 보고)',
    reasons: [
      {
        factor: '지역 재선택 요구',
        detail: '#/mypage/registrations/tutors/9/basic 진입 시 현재 등록된 지역(서울특별시 시도단위)에 대해 "지역을 다시 선택해 주세요" 안내 문구가 출력되며 지역 재선택을 강제함'
      },
      {
        factor: '지역 값 동시 전송 구조',
        detail: 'frontend inline-save.js의 saveTutorBasicInline() 함수는 기본정보 수정 시 postRegisterSave("basic", ...) 직후 postRegisterSave("regions", tutorId, { saved_regions: ... })를 반드시 연계 호출하여 지역 저장을 수반함'
      },
      {
        factor: '상세정보(/detail) 필수값 블로킹',
        detail: '소개 필드가 위치한 /detail(P21-03b)은 소개 단독 저장이 불가하고 월 과외비, 산정방식, 주 회수, 수업시간, 대상성별, 인원, 장소, 대학/대학원이 모두 필수값으로 묶여 있어 빈 상태의 draft 프로필에서는 소개만 단독 저장할 수 없음'
      }
    ],
    requestPayloadStructure: {
      url: '/api/tutor/register.php',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      bodyFormat: {
        action: 'save',
        step: 'basic',
        tutor_id: 9,
        payload: {
          tutor_display_name: 'string',
          main_subject_note: 'string',
          slogan: 'string',
          intro_short: 'string',
          intro_long: 'string',
          student_gender_group: 'mixed',
          student_count_group: 'solo',
          age_band: 'string',
          gender: 'male|female'
        }
      },
      coupledRegionBodyFormat: {
        action: 'save',
        step: 'regions',
        tutor_id: 9,
        payload: {
          saved_regions: [
            { region_id: 'string(numeric)', scope_type: 'city', is_primary: true }
          ]
        }
      }
    }
  };

  fs.writeFileSync(path.join(OUT_DIR, 'test_03_result.json'), JSON.stringify(report, null, 2));

  await browser.close();
  console.log('=== Test 3 Recording Done ===');
}

recordTest03().catch(console.error);
