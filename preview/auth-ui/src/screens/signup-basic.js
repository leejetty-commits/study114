import { signupState } from '../state.js';
import { PREFERRED_LESSON_TYPE_LABELS, MAIN_SUBJECT_OPTIONS } from '../register-enums.js';
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

function regionList() {
  return signupState.regions.length > 0
    ? signupState.regions
    : [{ id: 1, label: '서울특별시 강남구 대치동 (API 로딩 중)' }];
}

/** 시(도) 목록 — 과외 활동시 seed */
function listSidos() {
  const set = new Set();
  regionList().forEach((r) => {
    const sido = String(r.label || '').trim().split(/\s+/)[0];
    if (sido) set.add(sido);
  });
  return [...set];
}

/** 시 라벨 → 대표 region_id (해당 시 첫 행) */
function regionIdForSido(sido) {
  const hit = regionList().find((r) => String(r.label || '').trim().startsWith(sido));
  return hit?.id ?? '';
}

function sidoFromRegionId(regionId) {
  const hit = regionList().find((r) => String(r.id) === String(regionId));
  return hit ? String(hit.label || '').trim().split(/\s+/)[0] : '';
}

function renderRegionSelect(name, selectedId, { required = false } = {}) {
  const regions = regionList();
  const sel = selectedId || '';
  return `
    <select class="form-input" name="${name}" id="${name}" ${required ? 'required' : ''}>
      <option value="">선택</option>
      ${regions
        .map(
          (r) =>
            `<option value="${r.id}" ${String(sel) === String(r.id) ? 'selected' : ''}>${esc(r.label)}</option>`,
        )
        .join('')}
    </select>`;
}

function renderChips(name, options, { selected = [] } = {}) {
  const sel = Array.isArray(selected) ? selected : [selected].filter(Boolean);
  return `
    <div class="chip-group" data-chip-group="${name}">
      ${options
        .map(
          (opt) => `
        <label class="chip">
          <input type="radio" name="${name}" value="${opt.value}" class="chip__input" ${sel.includes(opt.value) ? 'checked' : ''} required />
          <span class="chip__label">${esc(opt.label)}</span>
        </label>`,
        )
        .join('')}
    </div>
  `;
}

/** 주력과목 1개 */
function renderMainSubjectOne(selected = '') {
  const value = selected || '수학';
  return `
    <div class="form-group" data-subject-picker>
      <span class="form-label form-label--required">주력과목 1개</span>
      ${dbField('main_subject_note')}
      ${renderChips('main_subject', MAIN_SUBJECT_OPTIONS, { selected: value })}
      <input
        class="form-input mt-4"
        name="main_subject_other"
        data-subject-other
        value=""
        placeholder="기타 과목 입력"
        ${value === '기타' ? '' : 'hidden'}
      />
    </div>
  `;
}

/** 기본등록 = draft seed 최소 (Notion 14장) — 검색/공개 본체는 상세등록 */
function renderStudentBasic() {
  const addr = signupState.accountAddress || '가입 주소';
  const d = signupState.basicRegister?.student || {};
  return `
    <form data-form="basic-student" class="basic-register">
      <p class="auth-section-title">기본등록 · draft seed</p>
      <p class="form-note mb-4">
        공개·검색에 쓰이는 항목은 <strong>상세등록</strong>에서 완성합니다.
        가입 기본주소(<strong>${esc(addr)}</strong>)와 희망지역은 분리됩니다.
      </p>
      <div class="form-group">
        <span class="form-label form-label--required">희망 유형</span>
        ${dbField('students.preferred_lesson_type')}
        ${renderChips(
          'preferred_lesson_type',
          Object.entries(PREFERRED_LESSON_TYPE_LABELS).map(([value, label]) => ({ value, label })),
          { selected: d.preferred_lesson_type || 'tutor' },
        )}
      </div>
      <div class="form-group">
        <label class="form-label" for="region_id">1차 희망지역 seed (선택)</label>
        ${dbField('preferred_*_region seed → 상세에서 1~3 완성')}
        ${renderRegionSelect('region_id', d.region_id, { required: false })}
        <p class="form-note">공부방/과외 축별 희망지역 1~3은 상세등록에서 받습니다.</p>
      </div>
      <div class="actions-stack">
        <button type="submit" class="btn btn--primary btn--block">draft 저장 · 다음</button>
        <button type="button" class="btn btn--secondary btn--block" data-nav="/signup/role">이전</button>
      </div>
    </form>
  `;
}

function renderStudyRoomBasic() {
  const d = signupState.basicRegister?.study_room || {};
  return `
    <form data-form="basic-study-room" class="basic-register">
      <p class="auth-section-title">기본등록 · draft seed</p>
      <p class="form-note mb-4">공부방명 · 노출지역 1 · 주력과목 1만 받습니다. 나머지는 상세등록입니다.</p>
      <div class="form-group">
        <label class="form-label form-label--required" for="study_room_name">공부방명</label>
        ${dbField('study_rooms.study_room_name')}
        <input class="form-input" id="study_room_name" name="study_room_name" value="${esc(d.study_room_name || '')}" required />
      </div>
      <div class="form-group">
        <label class="form-label form-label--required" for="region_id">노출지역 1번</label>
        ${dbField('study_room_regions.slot=1')}
        ${renderRegionSelect('region_id', d.region_id, { required: true })}
      </div>
      ${renderMainSubjectOne(d.main_subjects?.[0] || d.main_subject_note || '수학')}
      <div class="actions-stack">
        <button type="submit" class="btn btn--primary btn--block">draft 저장 · 다음</button>
        <button type="button" class="btn btn--secondary btn--block" data-nav="/signup/role">이전</button>
      </div>
    </form>
  `;
}

function renderTutorBasic() {
  const d = signupState.basicRegister?.tutor || {};
  const sidos = listSidos();
  const savedSido = d.activity_city || sidoFromRegionId(d.region_id) || sidos[0] || '';
  return `
    <form data-form="basic-tutor" class="basic-register">
      <p class="auth-section-title">기본등록 · draft seed</p>
      <p class="form-note mb-4">표시명 · 활동 시 1 · 주력과목 1만 받습니다. 나머지는 상세등록입니다.</p>
      <div class="form-group">
        <label class="form-label form-label--required" for="tutor_display_name">표시명</label>
        ${dbField('tutors.tutor_display_name')}
        <input class="form-input" id="tutor_display_name" name="tutor_display_name" value="${esc(d.tutor_display_name || '')}" required />
      </div>
      <div class="form-group">
        <label class="form-label form-label--required" for="activity_city">활동 시 1번</label>
        ${dbField('tutor_regions.scope_type=city')}
        <select class="form-input" name="activity_city" id="activity_city" required>
          <option value="">선택</option>
          ${sidos
            .map((s) => `<option value="${esc(s)}" ${s === savedSido ? 'selected' : ''}>${esc(s)}</option>`)
            .join('')}
        </select>
      </div>
      ${renderMainSubjectOne(d.main_subjects?.[0] || d.main_subject_note || '수학')}
      <div class="actions-stack">
        <button type="submit" class="btn btn--primary btn--block">draft 저장 · 다음</button>
        <button type="button" class="btn btn--secondary btn--block" data-nav="/signup/role">이전</button>
      </div>
    </form>
  `;
}

export function renderSignupBasic() {
  const role = signupState.role || 'student';
  const oauthMode = parseHashQuery().from === 'oauth';
  const body =
    role === 'study_room'
      ? renderStudyRoomBasic()
      : role === 'tutor'
        ? renderTutorBasic()
        : renderStudentBasic();

  const content = `
    ${oauthMode ? '' : renderStepIndicator(4, 5)}
    <div class="panel auth-shell__card--wide">
      <h1 class="auth-heading">기본등록</h1>
      <p class="auth-subheading mb-6">
        공개 전 <strong>draft</strong>만 만듭니다. 검색·리스트 항목은 상세등록에서 완성합니다.
      </p>
      ${isReturnImportMode() ? '<p class="form-note form-note--highlight">home-ui 자녀 추가 모드 — 저장 후 마이페이지로 돌아갑니다.</p>' : ''}
      ${renderRoleBadge(role)}
      ${body}
    </div>
  `;

  return renderAuthShell(content, {
    wide: true,
    showBack: true,
    backPath: oauthMode ? '/signup/role?from=oauth' : '/signup/role',
    backLabel: '회원 구분',
  });
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
  if (subject === '기타') {
    const other = String(data.main_subject_other || '').trim();
    if (!other) {
      alert('기타 과목을 입력해 주세요.');
      return null;
    }
    data.main_subjects = [other];
    data.main_subject_note = other;
  } else {
    data.main_subjects = [subject];
    data.main_subject_note = subject;
  }
  delete data.main_subject;
  delete data.main_subject_other;
  return data;
}

export function bindSignupBasicEvents(root) {
  bindGlobalEvents(root);

  const role = signupState.role || 'student';
  const form = root.querySelector('form[data-form^="basic-"]');

  const subjectPicker = form?.querySelector('[data-subject-picker]');
  if (subjectPicker) {
    const otherInput = subjectPicker.querySelector('[data-subject-other]');
    subjectPicker.querySelectorAll('input[name="main_subject"]').forEach((el) => {
      el.addEventListener('change', () => {
        otherInput?.toggleAttribute('hidden', el.value !== '기타' || !el.checked);
      });
    });
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    let data = collectFormData(form);

    if (role === 'student') {
      if (!data.preferred_lesson_type) {
        alert('희망 유형을 선택해 주세요.');
        return;
      }
      const region = regionList().find((r) => String(r.id) === String(data.region_id));
      data.region_label = region?.label || '';
    }

    if (role === 'study_room' || role === 'tutor') {
      data = packMainSubject(data);
      if (!data) return;
    }

    if (role === 'tutor') {
      const city = String(data.activity_city || '').trim();
      if (!city) {
        alert('활동 시를 선택해 주세요.');
        return;
      }
      const regionId = regionIdForSido(city);
      if (!regionId) {
        alert('선택한 시에 매핑된 지역이 없습니다.');
        return;
      }
      data.region_id = regionId;
      data.region_label = city;
      data.activity_city = city;
    }

    if (role === 'study_room') {
      const region = regionList().find((r) => String(r.id) === String(data.region_id));
      data.region_label = region?.label || '';
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

      if (isReturnImportMode() && role === 'student') {
        const region = signupState.regions.find((r) => String(r.id) === String(data.region_id));
        const record = mapAuthFormToStudentRecord(data, {
          studentId: result.student_id || result.id,
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
        submitBtn.textContent = 'draft 저장 · 다음';
      }
    }
  });
}
