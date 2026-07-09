/** @typedef {'student' | 'study_room' | 'tutor'} SignupRoleUi */

const DEV_PASSWORD = 'TestPass123!';

export { DEV_PASSWORD };

export function uniqueEmail(prefix = 'e2e') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@test.local`;
}

/**
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {SignupRoleUi} role
 */
export function buildSignupPayload(role) {
  return {
    email: uniqueEmail(`signup_${role}`),
    password: DEV_PASSWORD,
    password_confirm: DEV_PASSWORD,
    name: 'E2E테스트',
    gender: 'male',
    phone: '01099998888',
    address: '서울특별시 강남구 대치동 123',
    role,
    sms_consent: false,
    email_consent: false,
  };
}

/**
 * @param {import('@playwright/test').APIRequestContext} request
 */
export async function fetchFirstRegionId(request) {
  const res = await request.post('/api/auth/regions.php', { data: { action: 'list' } });
  const body = await res.json();
  if (!res.ok() || !body.ok || !body.regions?.length) {
    throw new Error(`regions API 실패: ${body.message || res.status()}`);
  }
  return body.regions[0].id;
}

/**
 * @param {number} regionId
 * @param {SignupRoleUi} role
 */
export function buildBasicRegisterPayload(regionId, role) {
  if (role === 'student') {
    return {
      preferred_lesson_type: 'tutor',
      region_id: regionId,
      subject_names: '수학',
      school_level: 'middle',
      grade_level: '중2',
      gender: 'male',
      birth_year: 2012,
      lesson_places: ['student_home'],
      lesson_format: 'one_on_one',
      preferred_student_count_group: 'solo',
      lessons_per_week: 2,
      minutes_per_lesson: 90,
      teaching_style_badges: ['meticulous'],
      preferred_fee_amount: 550000,
      preferred_studyroom_fee_amount: 420000,
      request_summary_visibility: 'private',
    };
  }
  if (role === 'study_room') {
    return {
      study_room_name: 'E2E공부방',
      region_id: regionId,
      main_subject_note: '수학',
      price_amount: 420000,
      lesson_place_type: 'academy',
      lesson_operation_type: 'group_by_time_slot',
      capacity_per_time: 'one_to_four',
      school_levels: ['middle'],
      gender: 'male',
      education_office_registered: false,
    };
  }
  return {
    tutor_display_name: 'E2E과외',
    region_id: regionId,
    main_subject_note: '수학',
    student_gender_group: 'mixed',
    student_count_group: 'solo',
    preferred_fee_amount: 480000,
    fee_basis_type: 'monthly_by_weekly_schedule',
    lessons_per_week: 2,
    minutes_per_lesson: 90,
    lesson_places: ['student_home_visit'],
    teaching_style_badges: ['concept_focus'],
    gender: 'male',
  };
}

/**
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {SignupRoleUi} role
 */
export async function signupAndBasicRegister(request, role) {
  const signupRes = await request.post('/api/auth/signup.php', {
    data: buildSignupPayload(role),
  });
  const signupBody = await signupRes.json();
  if (!signupRes.ok() || !signupBody.ok) {
    throw new Error(`signup 실패: ${signupBody.message || signupRes.status()}`);
  }

  const regionId = await fetchFirstRegionId(request);
  const basicRes = await request.post('/api/auth/basic-register.php', {
    data: {
      role,
      payload: buildBasicRegisterPayload(regionId, role),
    },
  });
  const basicBody = await basicRes.json();
  if (!basicRes.ok() || !basicBody.ok) {
    throw new Error(`basic-register 실패: ${basicBody.message || basicRes.status()}`);
  }

  const meRes = await request.get('/api/auth/me.php');
  const meBody = await meRes.json();

  return { signupBody, basicBody, meBody, regionId };
}
