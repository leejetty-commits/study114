import { signupState } from '../state.js';
import {
  PREFERRED_LESSON_TYPE_LABELS,
  PERSONAL_GENDER_OPTIONS,
  SCHOOL_LEVEL_OPTIONS,
  LESSON_FORMAT_OPTIONS,
  STUDENT_COUNT_OPTIONS,
} from '../register-enums.js';
import { fetchMeApi, basicRegisterApi } from '../auth-api.js';
import { resolveAfterAuthUrl, resolveUiRoleForBasicRegister } from '../../../shared/auth-redirect.js';
import {
  buildHomeStudentImportUrl,
  isReturnImportMode,
  mapAuthFormToStudentRecord,
} from '../../../shared/student-auth-bridge.js';
import { renderAuthShell, renderStepIndicator, renderRoleBadge, bindGlobalEvents, navigate } from '../layout.js';
import { parseHashQuery } from '../../../shared/preview-links.js';
import { resolvePostLoginUrl } from '../../../shared/auth-redirect.js';
import {
  activityLabelForUnit,
  activityLabelFromRegionId,
  KOREA_METROS,
  KOREA_PROVINCES,
  regionIdFromActivityLabel,
  renderProvinceCityOptions,
  renderRegionParentOptions,
  resolveCitySelection,
} from '../../../shared/korea-sidos.js';
import { renderMainSubjectSelect } from '../../../shared/main-subjects.js';
import {
  getCityUnits,
  renderTutorRegionSlot,
  bindTutorRegionSlotEvents,
  collectTutorRegionSlots,
  validateTutorActivityRegions,
  setTutorRegionSlotError,
  clearTutorRegionSlotError,
} from '../../../shared/tutor-region-slots.js';
import {
  renderStudyRoomBasicFields,
  bindStudyRoomBasicFields,
  collectStudyRoomBasicFields,
  validateStudyRoomBasicFields,
  renderStudentHopeRegion,
  bindStudentHopeRegion,
  readStudentHopeRegion,
} from '../../../shared/study-room-basic-form.js';

function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function dbField(name) {
  return '';
}

/** 저장된 과외 희망지역 → 1차(광역|도)와 2차(시·군) */
function savedTutorParent(draft) {
  const units = getCityUnits(signupState.cities || []);
  const byId = resolveCitySelection(draft?.region_id || '', units);
  if (byId.parent) return byId;
  const label = String(draft?.activity_city || '').trim();
  const hit = units.find((u) => activityLabelForUnit(u) === label);
  if (hit) return resolveCitySelection(hit.id, units);
  const parts = label.split(/\s+/);
  if (parts.length >= 2) {
    const prov = KOREA_PROVINCES.find((p) => p.label === parts[0]);
    if (prov) return { parent: `prov:${prov.code}`, cityLabel: parts.slice(1).join(' ') };
  }
  const metro = KOREA_METROS.find((m) => m.label === label);
  if (metro) return { parent: `metro:${metro.code}`, cityLabel: metro.label };
  return { parent: '', cityLabel: '' };
}

/** 화면 라벨(경기도 의정부시) → 시 단위 region_id. 행정동 목록은 쓰지 않는다. */
function regionIdForSido(activityLabel) {
  return regionIdFromActivityLabel(activityLabel, getCityUnits(signupState.cities || []));
}

function sidoFromRegionId(regionId) {
  return activityLabelFromRegionId(regionId, getCityUnits(signupState.cities || []));
}

function renderChips(name, options, { selected = [], required = true } = {}) {
  const sel = Array.isArray(selected) ? selected : [selected].filter(Boolean);
  return `
    <div class="chip-group" data-chip-group="${name}">
      ${options
        .map(
          (opt) => `
        <label class="chip">
          <input type="radio" name="${name}" value="${opt.value}" class="chip__input" ${sel.includes(opt.value) ? 'checked' : ''} ${required ? 'required' : ''} />
          <span class="chip__label">${esc(opt.label)}</span>
        </label>`,
        )
        .join('')}
    </div>
  `;
}

/** 주력과목 1개 */
function renderMainSubjectOne(selected = '') {
  const value = selected || '';
  return `
    <div class="form-group">
      <label class="form-label form-label--required" for="main_subject">주력과목 1개</label>
      ${dbField('main_subject_note')}
      <select class="form-input" name="main_subject" id="main_subject" required>
        ${renderMainSubjectSelect(value, { includeEmpty: true, emptyLabel: '과목 선택' })}
      </select>
    </div>
  `;
}

/** 학생 기본정보 9축. 저장 필드는 students·student_subject_targets 기존 컬럼만. */
function renderStudentBasic() {
  const d = signupState.basicRegister?.student || {};
  const hope = d.preferred_lesson_type || 'tutor';
  const displayName = d.public_display_name || d.student_name || '';
  const lessonFormat = d.lesson_format || '';
  const count = lessonFormat === 'one_on_one' ? 'solo' : d.preferred_student_count_group || '';
  const hopeParent = savedTutorParent(d);
  const savedTutor = {
    hope: hopeParent,
    isProv: String(hopeParent.parent).startsWith('prov:'),
    provCode: String(hopeParent.parent).startsWith('prov:') ? hopeParent.parent.slice(5) : '',
    label: d.activity_city || sidoFromRegionId(d.region_id) || '',
  };
  return `
    <form data-form="basic-student" class="basic-register student-basic">
      <div class="student-basic__field">
        <label class="form-label" for="public_display_name">표시명</label>
        <input class="form-input" id="public_display_name" name="public_display_name" value="${esc(displayName)}" maxlength="40" autocomplete="nickname" />
        <p class="form-hint">Basic 카드에 보이는 이름입니다.</p>
      </div>
      <div class="student-basic__field">
        <span class="form-label">학교급 / 학년</span>
        ${renderChips('school_level', SCHOOL_LEVEL_OPTIONS, { selected: d.school_level || '', required: false })}
        <div class="student-basic__sub">
          <label class="form-label" for="grade_level">학년</label>
          <input class="form-input" id="grade_level" name="grade_level" value="${esc(d.grade_level || '')}" maxlength="20" placeholder="예: 중2" />
        </div>
        <p class="form-hint">학교급을 고르고, 학년은 중2처럼 적습니다.</p>
      </div>
      <div class="student-basic__field">
        <span class="form-label form-label--required">희망 유형</span>
        ${renderChips(
          'preferred_lesson_type',
          Object.entries(PREFERRED_LESSON_TYPE_LABELS).map(([value, label]) => ({ value, label })),
          { selected: hope },
        )}
        <p class="form-hint">과외쌤과 공부방 중 먼저 찾을 쪽을 고릅니다.</p>
      </div>
      <div class="student-basic__field" data-student-studyroom-block ${hope === 'study_room' ? '' : 'hidden'}>
        ${renderStudentHopeRegion(d)}
        <p class="form-hint">주소 검색으로 행정동 또는 아파트단지를 고릅니다.</p>
      </div>
      <div class="student-basic__field" data-student-tutor-block ${hope === 'tutor' ? '' : 'hidden'}>
        <label class="form-label form-label--required" for="activity_parent">희망지역</label>
        <select class="form-input" id="activity_parent" data-student-activity-parent>
          ${renderRegionParentOptions(savedTutor.hope.parent)}
        </select>
        <div class="student-basic__sub" data-student-city-wrap ${savedTutor.isProv ? '' : 'hidden'}>
          <label class="form-label form-label--required" for="activity_locality">시·군</label>
          <select class="form-input" id="activity_locality" data-student-activity-locality>
            ${savedTutor.isProv ? renderProvinceCityOptions(savedTutor.provCode, savedTutor.hope.cityLabel, getCityUnits(signupState.cities || [])) : '<option value="">시·군 선택</option>'}
          </select>
        </div>
        <input type="hidden" name="activity_city" id="activity_city" value="${esc(savedTutor.label)}" />
        <p class="form-hint">광역시는 그 선택으로 끝납니다. 도는 시·군까지 고릅니다.</p>
      </div>
      <div class="student-basic__field">
        <label class="form-label" for="subject_names">희망과목</label>
        <select class="form-input" id="subject_names" name="subject_names">
          ${renderMainSubjectSelect(d.subject_names || '', { emptyLabel: '과목 선택' })}
        </select>
        <p class="form-hint">Basic 카드에 먼저 보일 과목입니다.</p>
      </div>
      <div class="student-basic__field">
        <span class="form-label">수업형태</span>
        ${renderChips('lesson_format', LESSON_FORMAT_OPTIONS, { selected: lessonFormat, required: false })}
        <p class="form-hint">단독과외와 그룹과외 중 고릅니다. 단독과외는 수업인원이 단독으로 저장됩니다.</p>
      </div>
      <div class="student-basic__field">
        <span class="form-label">수업인원</span>
        ${renderChips('preferred_student_count_group', STUDENT_COUNT_OPTIONS, { selected: count, required: false })}
        <p class="form-hint">함께 수업할 인원입니다.</p>
      </div>
      <div class="student-basic__field" data-student-tutor-budget ${hope === 'tutor' ? '' : 'hidden'}>
        <label class="form-label" for="preferred_fee_amount">예산</label>
        <input class="form-input" id="preferred_fee_amount" name="preferred_fee_amount" type="number" min="0" step="1" inputmode="numeric" value="${esc(d.preferred_fee_amount ?? '')}" ${hope === 'tutor' ? '' : 'disabled'} />
        <p class="form-hint">과외쌤 수업의 월 예산입니다.</p>
      </div>
      <div class="student-basic__field" data-student-studyroom-budget ${hope === 'study_room' ? '' : 'hidden'}>
        <label class="form-label" for="preferred_studyroom_fee_amount">예산</label>
        <input class="form-input" id="preferred_studyroom_fee_amount" name="preferred_studyroom_fee_amount" type="number" min="0" step="1" inputmode="numeric" value="${esc(d.preferred_studyroom_fee_amount ?? '')}" ${hope === 'study_room' ? '' : 'disabled'} />
        <p class="form-hint">공부방 수업의 월 예산입니다.</p>
      </div>
      <div class="student-basic__field">
        <label class="form-label" for="request_summary">한 줄 요청문</label>
        <input class="form-input" id="request_summary" name="request_summary" maxlength="200" value="${esc(d.request_summary || '')}" />
        <p class="form-hint">카드에 한 줄로 보일 요청입니다.</p>
      </div>
      <div class="student-basic__actions">
        <button type="submit" class="btn btn--primary btn--block">다음</button>
      </div>
    </form>
  `;
}

function renderStudyRoomBasic() {
  const d = signupState.basicRegister?.study_room || {};
  const draft = signupState.accountDraft || {};
  const values = {
    lesson_place_type: d.lesson_place_type || '',
    study_room_name: d.study_room_name || '',
    primary_school_levels: d.primary_school_levels || [],
    main_subject_note: d.main_subjects?.[0] || d.main_subject_note || '',
    gender: d.gender || signupState.profileGender || '',
    slogan: d.slogan || '',
    home_address: d.home_address || draft.address || signupState.accountAddress || '',
    home_address_zip: d.home_address_zip || draft.address_zip || '',
    home_address_line2: d.home_address_line2 || draft.address_line2 || '',
    address_text: d.address_text || '',
    address_zip: d.address_zip || '',
    address_line2: d.address_line2 || '',
    region_id: d.region_id || '',
    complex_id: d.complex_id || '',
    region_basis_type: d.region_basis_type || d.region_basis || 'dong',
    complex_name: d.complex_name || '',
    saved_regions: d.saved_regions,
  };
  return `
    <form data-form="basic-study-room" class="basic-register">
      <p class="auth-section-title">기본등록</p>
      <p class="form-note mb-4">교습형태 · 이름 · 주대상 · 주력과목 · 원장성별 · 슬로건 · 집주소 · 사업장주소 · 홍보지역 1번은 필수입니다. 홍보 2·3번은 선택입니다.</p>
      ${renderStudyRoomBasicFields({
        values,
        genderOptions: PERSONAL_GENDER_OPTIONS,
      })}
      <div class="actions-stack">
        <button type="submit" class="btn btn--primary btn--block">저장 · 다음</button>
      </div>
    </form>
  `;
}

function renderTutorBasic() {
  const d = signupState.basicRegister?.tutor || {};
  const units = getCityUnits(signupState.cities || []);
  const saved = Array.isArray(d.saved_regions) ? d.saved_regions : [];
  const slots = [0, 1, 2].map((i) => ({
    region_id: saved[i]?.region_id || (i === 0 ? d.region_id || '' : ''),
    scope_type: 'city',
    is_primary: i === 0,
  }));
  const citiesReady = units.some((u) => /^\d+$/.test(String(u.id)));
  return `
    <form data-form="basic-tutor" class="basic-register">
      <p class="auth-section-title">과외쌤 가입정보</p>
      <p class="form-note mb-4">과외 활동을 시작하기 위한 정보를 입력해 주세요.</p>
      ${
        citiesReady
          ? ''
          : '<p class="form-note form-note--error mb-4">활동지역 목록을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.</p>'
      }
      <div class="register-grid-2">
        <div class="register-basic-col">
          <div class="register-basic-fields">
            <div class="form-group form-group--full">
              <label class="form-label form-label--required" for="tutor_display_name">표시명</label>
              ${dbField('tutors.tutor_display_name')}
              <input class="form-input" id="tutor_display_name" name="tutor_display_name" value="${esc(d.tutor_display_name || '')}" required />
              <p class="form-note form-note--error" data-field-error="tutor_display_name" hidden></p>
            </div>
            <div class="form-group form-group--full">
              ${renderMainSubjectOne(d.main_subjects?.[0] || d.main_subject_note || '')}
              <p class="form-note form-note--error" data-field-error="main_subject" hidden></p>
            </div>
          </div>
        </div>
        <div class="register-basic-col">
          <span class="form-label form-label--required">활동지역 (시 기준 · 최대 3곳)</span>
          ${dbField('tutor_regions.scope_type=city')}
          <p class="form-note mb-2">1번은 필수, 2·3번은 선택입니다. 가입 후 마이페이지 기본등록에 그대로 표시됩니다.</p>
          ${slots.map((slot, i) => renderTutorRegionSlot(slot, i, units, { showPrimary: false, labelPrefix: '활동지역' })).join('')}
        </div>
      </div>
      <div class="actions-stack">
        <button type="submit" class="btn btn--primary btn--block">가입정보 저장</button>
      </div>
    </form>
  `;
}

export function renderSignupBasic() {
  const qRole = parseHashQuery().role;
  // URL role은 힌트일 뿐 — 허용값만 반영. 서버 역할은 bind에서 최종 확정.
  const role =
    qRole === 'student' || qRole === 'study_room' || qRole === 'tutor'
      ? qRole
      : signupState.role || 'student';
  if (role && signupState.role !== role) {
    signupState.role = role;
  }
  const oauthMode = parseHashQuery().from === 'oauth';
  const body =
    role === 'study_room'
      ? renderStudyRoomBasic()
      : role === 'tutor'
        ? renderTutorBasic()
        : renderStudentBasic();

  const shellOptions = {
    wide: true,
    showBack: true,
    // 계정 생성 후 회원구분 재선택은 금지. OAuth 역할 미선택만 role 화면으로.
    backPath: oauthMode ? '/signup/role?from=oauth' : '/signup/verify-email',
    backLabel: oauthMode ? '회원 구분' : '이메일 확인',
  };

  if (role === 'student') {
    const content = `
      ${oauthMode ? '' : renderStepIndicator(4, 5)}
      <h1 class="auth-heading">학생 기본정보</h1>
      <p class="auth-subheading">학생 Basic 카드에 먼저 보일 핵심 정보를 입력합니다.</p>
      ${body}
    `;
    return renderAuthShell(content, { ...shellOptions, cardClass: 'student-basic-panel' });
  }

  const content = `
    ${oauthMode ? '' : renderStepIndicator(4, 5)}
    <div class="panel auth-shell__card--wide">
      <h1 class="auth-heading">${role === 'tutor' ? '과외쌤 가입정보 입력' : '기본등록'}</h1>
      <p class="auth-subheading mb-6">
        ${
          role === 'tutor'
            ? '과외 활동을 시작하기 위한 정보를 입력해 주세요.'
            : '검색·목록에 바로 공개되지 않습니다. 검색에 쓰이는 항목은 상세등록에서 완성합니다.'
        }
      </p>
      ${renderRoleBadge(role)}
      ${body}
    </div>
  `;

  return renderAuthShell(content, shellOptions);
}

function collectFormData(form) {
  const fd = new FormData(form);
  const data = {};
  for (const [key, val] of fd.entries()) {
    data[key] = val;
  }
  return data;
}

function packMainSubject(data) {
  const subject = String(data.main_subject || '').trim();
  if (!subject) {
    alert('주력과목을 선택해 주세요.');
    return null;
  }
  data.main_subjects = [subject];
  data.main_subject_note = subject;
  delete data.main_subject;
  delete data.main_subject_other;
  return data;
}

export function bindSignupBasicEvents(root) {
  bindGlobalEvents(root);

  let roleReady = false;
  let role =
    parseHashQuery().role === 'student' ||
    parseHashQuery().role === 'study_room' ||
    parseHashQuery().role === 'tutor'
      ? parseHashQuery().role
      : signupState.role || 'student';

  fetchMeApi()
    .then((me) => {
      if (!me.authenticated) {
        navigate('/login');
        return;
      }
      if (!me.email_verified || me.needs_account_contact || me.oauth_role_pending) {
        window.location.href = resolveAfterAuthUrl(me);
        return;
      }
      // 완료 행 있으면 기본등록 재진입 금지
      if (!me.needs_basic_register) {
        window.location.href = resolveAfterAuthUrl(me);
        return;
      }
      const serverRole = resolveUiRoleForBasicRegister(parseHashQuery().role || '', me);
      if (!serverRole) {
        window.location.href = resolveAfterAuthUrl(me);
        return;
      }
      const qRole = parseHashQuery().role;
      if (qRole && qRole !== serverRole) {
        // URL 조작 거부 — 서버 역할 화면으로 정상화
        navigate(`/signup/basic?role=${encodeURIComponent(serverRole)}`);
        return;
      }
      if (signupState.role !== serverRole || role !== serverRole) {
        signupState.role = serverRole;
        if (role !== serverRole) {
          navigate(`/signup/basic?role=${encodeURIComponent(serverRole)}`);
          return;
        }
      }
      role = serverRole;
      roleReady = true;
    })
    .catch(() => navigate('/login'));

  if (role && signupState.role !== role) {
    signupState.role = role;
  }
  const form = root.querySelector('form[data-form^="basic-"]');

  if (role === 'tutor') {
    bindTutorRegionSlotEvents(root, getCityUnits(signupState.cities || []));
  }

  if (role === 'study_room') {
    bindStudyRoomBasicFields(form || root, {
      regions: signupState.regions || [],
      onRegion(region) {
        if (!signupState.regions.some((r) => String(r.id) === String(region.id))) {
          signupState.regions.push(region);
        }
      },
    });
  }

  if (role === 'student') {
    bindStudentHopeRegion(form || root, {
      onRegion(region) {
        if (!signupState.regions.some((r) => String(r.id) === String(region.id))) {
          signupState.regions.push(region);
        }
      },
    });
  }

  function syncStudentHopeBlocks() {
    const hope = form?.querySelector('input[name="preferred_lesson_type"]:checked')?.value || 'tutor';
    const study = form?.querySelector('[data-student-studyroom-block]');
    const tutor = form?.querySelector('[data-student-tutor-block]');
    study?.toggleAttribute('hidden', hope !== 'study_room');
    tutor?.toggleAttribute('hidden', hope !== 'tutor');
    const tutorBudget = form?.querySelector('[data-student-tutor-budget]');
    const studyBudget = form?.querySelector('[data-student-studyroom-budget]');
    tutorBudget?.toggleAttribute('hidden', hope !== 'tutor');
    studyBudget?.toggleAttribute('hidden', hope !== 'study_room');
    tutorBudget?.querySelector('input')?.toggleAttribute('disabled', hope !== 'tutor');
    studyBudget?.querySelector('input')?.toggleAttribute('disabled', hope !== 'study_room');
  }

  function syncLessonCountLock() {
    const format = form?.querySelector('input[name="lesson_format"]:checked')?.value || '';
    const solo = format === 'one_on_one';
    form?.querySelectorAll('input[name="preferred_student_count_group"]').forEach((el) => {
      const lock = solo && el.value !== 'solo';
      el.disabled = lock;
      if (solo && el.value === 'solo') el.checked = true;
    });
  }

  form?.querySelectorAll('input[name="preferred_lesson_type"]').forEach((el) => {
    el.addEventListener('change', syncStudentHopeBlocks);
  });
  form?.querySelectorAll('input[name="lesson_format"]').forEach((el) => {
    el.addEventListener('change', syncLessonCountLock);
  });

  function syncStudentTutorLocality() {
    const parentSel = form?.querySelector('[data-student-activity-parent]');
    const citySel = form?.querySelector('[data-student-activity-locality]');
    const wrap = form?.querySelector('[data-student-city-wrap]');
    const hidden = form?.querySelector('#activity_city');
    if (!parentSel || !hidden) return;
    const parent = parentSel.value || '';
    const isProv = parent.startsWith('prov:');
    if (wrap) wrap.hidden = !isProv;
    const units = getCityUnits(signupState.cities || []);
    if (isProv && citySel) {
      const prev = citySel.value;
      citySel.innerHTML = renderProvinceCityOptions(parent.slice(5), prev, units);
    }
    const cityLabel = isProv ? citySel?.value || '' : '';
    if (parent.startsWith('metro:')) {
      const metro = KOREA_METROS.find((m) => m.code === parent.slice(6));
      hidden.value = metro?.label || '';
      return;
    }
    if (isProv && cityLabel) {
      const prov = KOREA_PROVINCES.find((p) => p.code === parent.slice(5));
      hidden.value = prov ? `${prov.label} ${cityLabel}` : '';
      return;
    }
    hidden.value = '';
  }

  form?.querySelector('[data-student-activity-parent]')?.addEventListener('change', syncStudentTutorLocality);
  form?.querySelector('[data-student-activity-locality]')?.addEventListener('change', syncStudentTutorLocality);
  syncStudentTutorLocality();

  syncStudentHopeBlocks();
  syncLessonCountLock();

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!roleReady) {
      alert('계정 역할을 확인하는 중입니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    role = signupState.role || role;
    if (role !== 'student' && role !== 'study_room' && role !== 'tutor') {
      alert('계정 역할을 확인할 수 없습니다. 새로고침 후 다시 시도해 주세요.');
      return;
    }
    let data = collectFormData(form);

    if (role === 'study_room') {
      data = collectStudyRoomBasicFields(form);
      const err = validateStudyRoomBasicFields(data);
      if (err) {
        alert(err);
        return;
      }
      data.main_subjects = [data.main_subject_note];
      data.region_basis = data.region_basis_type;
    } else if (role === 'student') {
      const displayName = String(data.public_display_name || '').trim();
      if (displayName) {
        data.public_display_name = displayName;
        data.student_name = displayName;
      }
      if (!data.preferred_lesson_type) {
        alert('희망 유형을 선택해 주세요.');
        return;
      }
      if (data.preferred_lesson_type === 'study_room') {
        const hopeRegion = readStudentHopeRegion(form);
        const basis = hopeRegion?.region_basis === 'complex' ? 'complex' : 'dong';
        data.region_basis = basis;
        data.region_id = hopeRegion?.region_id || '';
        data.region_label = hopeRegion?.region_label || '';
        data.complex_id = '';
        data.complex_address = '';
        data.complex_label = '';
        data.complex_name = '';
        if (basis === 'dong') {
          if (!data.region_id) {
            alert('행정동을 찾지 못했습니다. 주소 검색으로 다시 선택해 주세요.');
            return;
          }
        } else {
          const place = String(hopeRegion?.complex_name || '').trim();
          if (!place) {
            alert('아파트·단지 이름이 있는 주소로 다시 검색해 주세요.');
            return;
          }
          data.complex_label = place;
          data.complex_name = place;
          data.region_label = place;
        }
      } else {
        const city = String(data.activity_city || '').trim();
        if (!city) {
          alert('희망지역을 선택해 주세요.');
          return;
        }
        const regionId = regionIdForSido(city);
        if (!regionId) {
          alert('선택한 시·군에 매핑된 지역이 없습니다.');
          return;
        }
        data.region_id = regionId;
        data.region_label = city;
        data.activity_city = city;
        data.region_basis = '';
        data.complex_id = '';
      }
    }

    if (role === 'tutor') {
      const nameEl = form.querySelector('#tutor_display_name');
      const nameErr = form.querySelector('[data-field-error="tutor_display_name"]');
      const subjectErr = form.querySelector('[data-field-error="main_subject"]');
      form.querySelectorAll('[data-region-slot]').forEach((el) => clearTutorRegionSlotError(el));
      if (nameErr) {
        nameErr.hidden = true;
        nameErr.textContent = '';
      }
      if (subjectErr) {
        subjectErr.hidden = true;
        subjectErr.textContent = '';
      }

      const displayName = String(data.tutor_display_name || '').trim();
      if (!displayName) {
        if (nameErr) {
          nameErr.hidden = false;
          nameErr.textContent = '표시명을 입력해 주세요.';
        } else {
          alert('표시명을 입력해 주세요.');
        }
        nameEl?.focus();
        return;
      }
      data.tutor_display_name = displayName;

      data = packMainSubject(data);
      if (!data) {
        if (subjectErr) {
          subjectErr.hidden = false;
          subjectErr.textContent = '주력과목을 선택해 주세요.';
        }
        return;
      }

      const units = getCityUnits(signupState.cities || []);
      if (!units.some((u) => /^\d+$/.test(String(u.id)))) {
        alert('활동지역 목록을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.');
        return;
      }

      const rawSlots = collectTutorRegionSlots(form).map((s, i) => ({
        region_id: String(s.region_id || '').trim(),
        scope_type: 'city',
        is_primary: i === 0,
      }));
      const checked = validateTutorActivityRegions(rawSlots);
      if (!checked.ok) {
        const slotEl = form.querySelector(`[data-region-slot="${checked.index}"]`);
        if (slotEl) setTutorRegionSlotError(slotEl, checked.message);
        else alert(checked.message);
        return;
      }

      // 서버·마이페이지 계약: 빈 슬롯 포함 최대 3칸 순서 유지
      data.saved_regions = rawSlots.map((s, i) => ({
        region_id: /^\d+$/.test(s.region_id) ? s.region_id : '',
        scope_type: 'city',
        is_primary: i === 0 && /^\d+$/.test(s.region_id),
      }));
      const primary = checked.slots[0];
      data.region_id = primary.region_id;
      const unit = units.find((u) => String(u.id) === String(primary.region_id));
      const label = unit
        ? unit.kind === 'metro'
          ? unit.label
          : `${unit.sido_name} ${unit.label}`
        : '';
      data.region_label = label;
      data.activity_city = label;
    }

    if (role === 'tutor') {
      /* tutor subject/regions already validated above */
    }

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

      // 홈 기본값용 — 공부방은 홍보지역 1 (사업장 region_id와 분리)
      try {
        const promo1 =
          role === 'study_room' && Array.isArray(data.saved_regions) ? data.saved_regions[0] || {} : null;
        sessionStorage.setItem(
          'study114.regionRegister.seed',
          JSON.stringify({
            role,
            at: Date.now(),
            preferred_lesson_type: data.preferred_lesson_type || null,
            region_basis: promo1
              ? promo1.region_basis_type || data.region_basis || null
              : data.region_basis || null,
            region_id: promo1 ? promo1.region_id || null : data.region_id || null,
            complex_id: promo1 ? promo1.complex_id || null : data.complex_id || null,
            region_label: promo1
              ? promo1.region_label || promo1.complex_name || null
              : data.region_label || null,
            activity_city: data.activity_city || null,
          }),
        );
      } catch {
        /* ignore */
      }

      if (isReturnImportMode() && role === 'student') {
        const record = mapAuthFormToStudentRecord(data, {
          studentId: result.student_id || result.id,
          regionLabel: data.region_label,
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
        const record = mapAuthFormToStudentRecord(data, {
          regionLabel: data.region_label,
          apiOk: false,
        });
        const go = confirm(
          `서버 저장 실패: ${err instanceof Error ? err.message : err}\n\n화면 확인용으로 마이페이지에만 반영할까요?`,
        );
        if (go) {
          window.location.href = buildHomeStudentImportUrl(record);
          return;
        }
      } else {
        alert(err instanceof Error ? err.message : '가입정보 저장에 실패했습니다.');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent =
          role === 'tutor' ? '가입정보 저장' : role === 'student' ? '다음' : '저장 · 다음';
      }
    }
  });
}
