import { signupState, ROLE_LABELS } from '../state.js';
import {
  AGE_BAND_OPTIONS,
  CAREER_YEAR_BAND_OPTIONS,
  CAPACITY_PER_TIME_OPTIONS,
  FEE_BASIS_OPTIONS,
  GENDER_GROUP_OPTIONS,
  LESSON_FORMAT_OPTIONS,
  LESSON_OPERATION_OPTIONS,
  LESSON_PLACE_TYPE_OPTIONS,
  PERSONAL_GENDER_OPTIONS,
  PREFERRED_LESSON_TYPE_LABELS,
  SCHOOL_LEVEL_OPTIONS,
  STUDENT_COUNT_OPTIONS,
  STUDENT_GENDER_GROUP_OPTIONS,
  STUDENT_PLACE_OPTIONS,
  TEACHING_STYLE_OPTIONS,
  TUTOR_PLACE_OPTIONS,
  UNIVERSITY_STATUS_OPTIONS,
  VISIBILITY_OPTIONS,
} from '../register-enums.js';
import { basicRegisterApi } from '../auth-api.js';
import {
  buildHomeStudentImportUrl,
  isReturnImportMode,
  mapAuthFormToStudentRecord,
} from '../../../shared/student-auth-bridge.js';
import { renderAuthShell, renderStepIndicator, renderRoleBadge, bindGlobalEvents, navigate } from '../layout.js';
import { parseHashQuery } from '../../../shared/preview-links.js';
import { resolvePostLoginUrl } from '../../../shared/auth-redirect.js';

function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function dbField(name) {
  return `<span class="field-db-name">${esc(name)}</span>`;
}

function renderRegionSelect(name, selectedId) {
  const regions =
    signupState.regions.length > 0
      ? signupState.regions
      : [{ id: 1, label: '서울특별시 강남구 대치동 (API 로딩 중)' }];
  const sel = selectedId || regions[0]?.id || '';
  return `
    <select class="form-input" name="${name}" id="${name}" required>
      ${regions
        .map(
          (r) =>
            `<option value="${r.id}" ${String(sel) === String(r.id) ? 'selected' : ''}>${esc(r.label)}</option>`,
        )
        .join('')}
    </select>`;
}

function renderChips(name, options, { multiple = false, selected = [] } = {}) {
  const sel = Array.isArray(selected) ? selected : [selected].filter(Boolean);
  const inputType = multiple ? 'checkbox' : 'radio';
  return `
    <div class="chip-group" data-chip-group="${name}">
      ${options
        .map(
          (opt) => `
        <label class="chip">
          <input type="${inputType}" name="${name}" value="${opt.value}" class="chip__input" ${sel.includes(opt.value) ? 'checked' : ''} ${multiple ? '' : 'required'} />
          <span class="chip__label">${esc(opt.label)}</span>
        </label>`,
        )
        .join('')}
    </div>
  `;
}

function renderStudentBasic() {
  const addr = signupState.accountAddress || '서울특별시 강남구 대치동 (가입 주소)';
  const d = signupState.basicRegister?.student || {};
  return `
    <form data-form="basic-student" class="basic-register">
      <p class="auth-section-title">검색 핵심축 (14장 §4-1)</p>
      <div class="form-group">
        <span class="form-label form-label--required">희망 유형</span>
        ${dbField('students.preferred_lesson_type')}
        ${renderChips('preferred_lesson_type', Object.entries(PREFERRED_LESSON_TYPE_LABELS).map(([value, label]) => ({ value, label })), { selected: d.preferred_lesson_type || 'tutor' })}
      </div>
      <div class="form-group">
        <label class="form-label form-label--required" for="region_id">희망 지역</label>
        ${dbField('preferred_studyroom_region_id / preferred_tutor_region_id')}
        ${renderRegionSelect('region_id', d.region_id)}
        <input class="form-input mt-4" name="preferred_region_note" value="${esc(d.preferred_region_note || '')}" placeholder="지역 보조 메모 (선택)" />
        ${dbField('students.preferred_region_note')}
      </div>
      <div class="form-group">
        <label class="form-label form-label--required" for="subject_names">희망 과목</label>
        ${dbField('student_subject_targets + subject_masters')}
        <input class="form-input" id="subject_names" name="subject_names" value="${esc(d.subject_names || '수학')}" placeholder="복수 선택 · 주력 1개 (프리뷰: 쉼표 구분)" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <span class="form-label form-label--required">학교급</span>
          ${dbField('students.school_level')}
          ${renderChips('school_level', SCHOOL_LEVEL_OPTIONS, { selected: d.school_level || 'middle' })}
        </div>
        <div class="form-group">
          <label class="form-label form-label--required" for="grade_level">학년</label>
          ${dbField('students.grade_level')}
          <input class="form-input" id="grade_level" name="grade_level" value="${esc(d.grade_level || '중2')}" placeholder="예: 중2" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <span class="form-label form-label--required">학생 성별</span>
          ${dbField('students.gender')}
          ${renderChips(
            'gender',
            [
              { value: 'male', label: '남' },
              { value: 'female', label: '여' },
            ],
            { selected: d.gender || 'male' },
          )}
        </div>
        <div class="form-group">
          <label class="form-label form-label--required" for="birth_year">출생연도</label>
          ${dbField('students.birth_year')}
          <input
            class="form-input"
            type="number"
            id="birth_year"
            name="birth_year"
            min="1990"
            max="2025"
            step="1"
            value="${esc(d.birth_year ?? 2012)}"
            placeholder="예: 2012"
            required
          />
        </div>
      </div>
      <div class="form-group">
        <span class="form-label form-label--required">희망 수업장소</span>
        ${dbField('student_preferred_lesson_places.place_type')}
        ${renderChips('lesson_places', STUDENT_PLACE_OPTIONS, { multiple: true, selected: d.lesson_places || ['student_home'] })}
      </div>
      <div class="form-group">
        <span class="form-label form-label--required">수업형태</span>
        ${dbField('students.lesson_format')}
        ${renderChips('lesson_format', LESSON_FORMAT_OPTIONS, { selected: d.lesson_format || 'one_on_one' })}
      </div>
      <div class="form-group" data-student-group-only ${d.lesson_format === 'group' ? '' : 'hidden'}>
        <span class="form-label form-label--required">그룹 구성</span>
        ${dbField('students.student_gender_group')}
        ${renderChips('student_gender_group', STUDENT_GENDER_GROUP_OPTIONS, { selected: d.student_gender_group || 'mixed' })}
        <p class="form-note">그룹과외 선택 시에만 입력 · 남 / 여 / 남여</p>
      </div>
      <div class="form-group" data-student-count-group ${d.lesson_format === 'one_on_one' ? 'hidden' : ''}>
        <span class="form-label form-label--required">희망 수업인원</span>
        ${dbField('students.preferred_student_count_group')}
        ${renderChips('preferred_student_count_group', STUDENT_COUNT_OPTIONS, { selected: d.preferred_student_count_group || (d.lesson_format === 'one_on_one' ? 'solo' : 'two') })}
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label form-label--required" for="lessons_per_week">주 횟수</label>
          ${dbField('students.lessons_per_week')}
          <input class="form-input" type="number" id="lessons_per_week" name="lessons_per_week" min="1" max="7" value="${esc(d.lessons_per_week ?? 2)}" />
        </div>
        <div class="form-group">
          <label class="form-label form-label--required" for="minutes_per_lesson">1회 시간(분)</label>
          ${dbField('students.minutes_per_lesson')}
          <input class="form-input" type="number" id="minutes_per_lesson" name="minutes_per_lesson" min="30" step="10" value="${esc(d.minutes_per_lesson ?? 90)}" />
        </div>
      </div>
      <div class="form-group">
        <span class="form-label form-label--required">희망 강의스타일</span>
        ${dbField('student_preferred_teaching_style_badges')}
        ${renderChips('teaching_style_badges', TEACHING_STYLE_OPTIONS, { multiple: true, selected: d.teaching_style_badges || ['meticulous'] })}
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label form-label--required" for="preferred_fee_amount">수업예산 (과외)</label>
          ${dbField('students.preferred_fee_amount')}
          <input class="form-input" type="number" id="preferred_fee_amount" name="preferred_fee_amount" value="${esc(d.preferred_fee_amount ?? 550000)}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="preferred_studyroom_fee_amount">수업예산 (공부방)</label>
          ${dbField('students.preferred_studyroom_fee_amount')}
          <input class="form-input" type="number" id="preferred_studyroom_fee_amount" name="preferred_studyroom_fee_amount" value="${esc(d.preferred_studyroom_fee_amount ?? 420000)}" />
        </div>
      </div>
      <div class="form-group form-group--extension">
        <label class="form-label" for="request_summary">요청문 (선택)</label>
        ${dbField('students.request_summary')}
        <textarea class="form-input form-textarea" id="request_summary" name="request_summary" rows="2">${esc(d.request_summary || '')}</textarea>
        <span class="form-label mt-4">요청문 공개</span>
        ${dbField('students.request_summary_visibility')}
        ${renderChips('request_summary_visibility', VISIBILITY_OPTIONS, { selected: d.request_summary_visibility || 'private' })}
      </div>
      <div class="actions-stack">
        <button type="submit" class="btn btn--primary btn--block">기본등록 완료</button>
        <button type="button" class="btn btn--secondary btn--block" data-nav="/signup/form">이전</button>
      </div>
    </form>
  `;
}

function renderStudyRoomBasic() {
  const d = signupState.basicRegister?.study_room || {};
  const genderDefault = d.gender || signupState.profileGender || 'male';
  return `
    <form data-form="basic-study-room" class="basic-register">
      <p class="auth-section-title">검색 핵심축 (14장 §4-2)</p>
      <div class="form-group">
        <label class="form-label form-label--required" for="study_room_name">공부방명</label>
        ${dbField('study_rooms.study_room_name')}
        <input class="form-input" id="study_room_name" name="study_room_name" value="${esc(d.study_room_name || '대치 우등생 공부방')}" required />
      </div>
      <div class="form-group">
        <span class="form-label form-label--required">원장 성별</span>
        ${dbField('user_profiles.gender')}
        <p class="form-note">매칭·검색 needs에 사용</p>
        ${renderChips('gender', PERSONAL_GENDER_OPTIONS, { selected: genderDefault })}
      </div>
      <div class="form-group">
        <label class="form-label form-label--required" for="region_id">대표지역</label>
        ${dbField('study_rooms.region_id')}
        ${renderRegionSelect('region_id', d.region_id)}
      </div>
      <div class="form-group">
        <label class="form-label form-label--required" for="main_subject_note">주력과목</label>
        ${dbField('study_rooms.main_subject_note')}
        <input class="form-input" id="main_subject_note" name="main_subject_note" value="${esc(d.main_subject_note || '수학·영어')}" />
      </div>
      <div class="form-group">
        <span class="form-label form-label--required">대상 학교급</span>
        ${dbField('study_room_subject_targets.school_level')}
        ${renderChips('school_levels', SCHOOL_LEVEL_OPTIONS, { multiple: true, selected: d.school_levels || ['middle'] })}
      </div>
      <div class="form-group">
        <label class="form-label form-label--required" for="price_amount">대표 가격 (월)</label>
        ${dbField('study_rooms.price_amount')}
        <input class="form-input" type="number" id="price_amount" name="price_amount" value="${esc(d.price_amount ?? 420000)}" />
      </div>
      <div class="form-group">
        <span class="form-label form-label--required">수업장소</span>
        ${dbField('study_rooms.lesson_place_type')}
        ${renderChips('lesson_place_type', LESSON_PLACE_TYPE_OPTIONS, { selected: d.lesson_place_type || 'study_room' })}
      </div>
      <div class="form-group">
        <span class="form-label form-label--required">수업운영형태</span>
        ${dbField('study_rooms.lesson_operation_type')}
        ${renderChips('lesson_operation_type', LESSON_OPERATION_OPTIONS, { selected: d.lesson_operation_type || 'group_by_time_slot' })}
      </div>
      <div class="form-group">
        <span class="form-label form-label--required">타임별 원생수</span>
        ${dbField('study_rooms.capacity_per_time')}
        ${renderChips('capacity_per_time', CAPACITY_PER_TIME_OPTIONS, { selected: d.capacity_per_time || 'one_to_four' })}
      </div>
      <div class="form-group">
        <label class="form-check">
          <input class="form-check__input" type="checkbox" name="education_office_registered" ${d.education_office_registered !== false ? 'checked' : ''} />
          <span class="form-check__label">교육청 등록</span>
        </label>
        ${dbField('study_rooms.education_office_registered')}
      </div>
      <div class="actions-stack">
        <button type="submit" class="btn btn--primary btn--block">기본등록 완료</button>
        <button type="button" class="btn btn--secondary btn--block" data-nav="/signup/form">이전</button>
      </div>
    </form>
  `;
}

function renderTutorBasic() {
  const d = signupState.basicRegister?.tutor || {};
  const genderDefault = d.gender || signupState.profileGender || 'male';
  return `
    <form data-form="basic-tutor" class="basic-register">
      <p class="auth-section-title">검색 핵심축 (14장 §4-3)</p>
      <div class="form-group">
        <label class="form-label form-label--required" for="tutor_display_name">표시명</label>
        ${dbField('tutors.tutor_display_name')}
        <input class="form-input" id="tutor_display_name" name="tutor_display_name" value="${esc(d.tutor_display_name || '김수학')}" required />
      </div>
      <div class="form-group">
        <span class="form-label form-label--required">과외쌤 성별</span>
        ${dbField('user_profiles.gender')}
        <p class="form-note">매칭·검색 needs에 사용</p>
        ${renderChips('gender', PERSONAL_GENDER_OPTIONS, { selected: genderDefault })}
      </div>
      <div class="form-group">
        <label class="form-label form-label--required" for="region_id">대표 활동 지역</label>
        ${dbField('tutor_regions.region_id (is_primary)')}
        ${renderRegionSelect('region_id', d.region_id)}
      </div>
      <div class="form-group">
        <label class="form-label form-label--required" for="main_subject_note">주력과목</label>
        ${dbField('tutor_subject_targets')}
        <input class="form-input" id="main_subject_note" name="main_subject_note" value="${esc(d.main_subject_note || '수학')}" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <span class="form-label form-label--required">지도 대상 성별</span>
          ${dbField('tutors.student_gender_group')}
          ${renderChips('student_gender_group', GENDER_GROUP_OPTIONS, { selected: d.student_gender_group || 'mixed' })}
        </div>
        <div class="form-group">
          <span class="form-label form-label--required">수업인원</span>
          ${dbField('tutors.student_count_group')}
          ${renderChips('student_count_group', STUDENT_COUNT_OPTIONS, { selected: d.student_count_group || 'solo' })}
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label form-label--required" for="preferred_fee_amount">대표 과외비 (월)</label>
          ${dbField('tutors.preferred_fee_amount')}
          <input class="form-input" type="number" id="preferred_fee_amount" name="preferred_fee_amount" value="${esc(d.preferred_fee_amount ?? 480000)}" />
        </div>
        <div class="form-group">
          <span class="form-label form-label--required">산정방식</span>
          ${dbField('tutors.fee_basis_type')}
          ${renderChips('fee_basis_type', FEE_BASIS_OPTIONS, { selected: d.fee_basis_type || 'monthly_by_weekly_schedule' })}
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="lessons_per_week">주 횟수</label>
          ${dbField('tutors.lessons_per_week')}
          <input class="form-input" type="number" name="lessons_per_week" value="${esc(d.lessons_per_week ?? 2)}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="monthly_session_count">월 총 횟수</label>
          ${dbField('tutors.monthly_session_count')}
          <input class="form-input" type="number" name="monthly_session_count" value="${esc(d.monthly_session_count ?? 8)}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="minutes_per_lesson">1회 시간(분)</label>
          ${dbField('tutors.minutes_per_lesson')}
          <input class="form-input" type="number" name="minutes_per_lesson" value="${esc(d.minutes_per_lesson ?? 90)}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="university_name">출신대학명</label>
          ${dbField('tutors.university_name')}
          <input class="form-input" name="university_name" value="${esc(d.university_name || '서울대학교')}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="major_name">전공명</label>
          ${dbField('tutors.major_name')}
          <input class="form-input" name="major_name" value="${esc(d.major_name || '수학과')}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <span class="form-label">학적상태</span>
          ${dbField('tutors.university_status')}
          ${renderChips('university_status', UNIVERSITY_STATUS_OPTIONS, { selected: d.university_status || 'graduated' })}
        </div>
        <div class="form-group">
          <span class="form-label">경력구간</span>
          ${dbField('tutors.career_year_band')}
          ${renderChips('career_year_band', CAREER_YEAR_BAND_OPTIONS, { selected: d.career_year_band || 'y7_10' })}
        </div>
        <div class="form-group">
          <span class="form-label">연령대</span>
          ${dbField('tutors.age_band')}
          ${renderChips('age_band', AGE_BAND_OPTIONS, { selected: d.age_band || 'early_30s' })}
        </div>
      </div>
      <div class="form-group">
        <span class="form-label form-label--required">강의장소</span>
        ${dbField('tutor_lesson_places')}
        ${renderChips('lesson_places', TUTOR_PLACE_OPTIONS, { multiple: true, selected: d.lesson_places || ['student_home_visit'] })}
      </div>
      <div class="form-group">
        <label class="form-label" for="main_material_note">주교재</label>
        ${dbField('tutors.main_material_note')}
        <input class="form-input" name="main_material_note" value="${esc(d.main_material_note || '')}" placeholder="짧은 서술" />
      </div>
      <div class="form-group">
        <span class="form-label">강의스타일 배지</span>
        ${dbField('tutor_teaching_style_badges')}
        ${renderChips('teaching_style_badges', TEACHING_STYLE_OPTIONS, { multiple: true, selected: d.teaching_style_badges || ['concept_focus'] })}
      </div>
      <div class="actions-stack">
        <button type="submit" class="btn btn--primary btn--block">기본등록 완료</button>
        <button type="button" class="btn btn--secondary btn--block" data-nav="/signup/form">이전</button>
      </div>
    </form>
  `;
}

export function renderSignupBasic() {
  const role = signupState.role || 'student';
  const oauthMode = parseHashQuery().from === 'oauth';
  const roleLabel = ROLE_LABELS[role];
  const body =
    role === 'study_room'
      ? renderStudyRoomBasic()
      : role === 'tutor'
        ? renderTutorBasic()
        : renderStudentBasic();

  const content = `
    ${oauthMode ? '' : renderStepIndicator(4)}
    <div class="panel auth-shell__card--wide">
      <h1 class="auth-heading">기본등록</h1>
      <p class="auth-subheading mb-6">14장 — 검색·비교에 필요한 핵심 정보를 입력해 주세요.</p>
      ${isReturnImportMode() ? '<p class="form-note form-note--highlight">home-ui 자녀 추가 모드 — 저장 후 마이페이지로 돌아갑니다.</p>' : ''}
      ${renderRoleBadge(role)}
      ${body}
      <p class="form-note mt-6">상세 소개·시설·증빙 등은 가입 후 <strong>상세등록</strong>에서 이어서 작성합니다.</p>
    </div>
  `;

  return renderAuthShell(content, {
    wide: true,
    showBack: true,
    backPath: oauthMode ? '/signup/role?from=oauth' : '/signup/form',
    backLabel: oauthMode ? '회원 구분' : '공통 가입',
  });
}

function collectFormData(form) {
  const fd = new FormData(form);
  const data = {};
  for (const [key, val] of fd.entries()) {
    if (data[key] !== undefined) {
      if (!Array.isArray(data[key])) data[key] = [data[key]];
      data[key].push(val);
    } else {
      data[key] = val;
    }
  }
  const checkboxes = form.querySelectorAll('input[type="checkbox"]:not([name="education_office_registered"])');
  const multiNames = new Set(
    [...form.querySelectorAll('.chip-group[data-chip-group] input[type="checkbox"]')].map((el) => el.name),
  );
  multiNames.forEach((name) => {
    if (!Array.isArray(data[name])) data[name] = data[name] ? [data[name]] : [];
  });
  if (form.querySelector('[name="education_office_registered"]')) {
    data.education_office_registered = fd.get('education_office_registered') === 'on';
  }
  return data;
}

export function bindSignupBasicEvents(root) {
  bindGlobalEvents(root);

  const role = signupState.role || 'student';
  const form = root.querySelector('form[data-form^="basic-"]');

  if (role === 'student' && form) {
    const groupOnly = form.querySelector('[data-student-group-only]');
    const countGroup = form.querySelector('[data-student-count-group]');
    const syncLessonFormat = () => {
      const selected = form.querySelector('input[name="lesson_format"]:checked')?.value || 'one_on_one';
      const isGroup = selected === 'group';
      groupOnly?.toggleAttribute('hidden', !isGroup);
      countGroup?.toggleAttribute('hidden', !isGroup);
      if (!isGroup) {
        const solo = form.querySelector('input[name="preferred_student_count_group"][value="solo"]');
        solo?.click();
      }
    };
    form.querySelectorAll('input[name="lesson_format"]').forEach((el) => {
      el.addEventListener('change', syncLessonFormat);
    });
    syncLessonFormat();
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = collectFormData(form);
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '저장 중…';
    }
    try {
      const result = await basicRegisterApi(role, data);
      if (!signupState.basicRegister) signupState.basicRegister = {};
      signupState.basicRegister[role] = data;
      signupState.basicRegisterResult = result;

      if (isReturnImportMode() && role === 'student') {
        const region = signupState.regions.find((r) => String(r.id) === String(data.region_id));
        const record = mapAuthFormToStudentRecord(data, {
          studentId: result.student_id,
          regionLabel: region?.label,
          apiOk: true,
        });
        window.location.href = buildHomeStudentImportUrl(record);
        return;
      }
      if (parseHashQuery().from === 'oauth') {
        const roleType =
          role === 'study_room' ? 'study_room_owner' : role === 'tutor' ? 'tutor' : 'guardian_student';
        window.location.href = resolvePostLoginUrl(roleType);
        return;
      }
      navigate('/signup/complete');
    } catch (err) {
      if (isReturnImportMode() && role === 'student') {
        const region = signupState.regions.find((r) => String(r.id) === String(data.region_id));
        const record = mapAuthFormToStudentRecord(data, {
          regionLabel: region?.label,
          apiOk: false,
        });
        const go = confirm(
          `API 저장 실패: ${err instanceof Error ? err.message : err}\n\n프리뷰용으로 home-ui에만 반영할까요?`,
        );
        if (go) {
          window.location.href = buildHomeStudentImportUrl(record);
          return;
        }
      } else {
        alert(err instanceof Error ? err.message : '기본등록 실패');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '기본등록 완료';
      }
    }
  });
}
