import {
  LIFECYCLE_FOOTNOTE_REG,
} from '../lifecycle-copy.js';
import {
  parseTutorRegPath,
  tutorHubPath,
  tutorSectionPath,
  TUTOR_REG_TOP_TABS,
  BASE as TUTOR_REG_BASE,
  isReturnToRegistrationCheck,
  tutorHashSearchParams,
} from './router.js';
import { renderUniversityNameField, bindUniversityNameField } from '../../../shared/korean-universities.js';
import { wonToCheonwonInput, cheonwonInputToWon } from '../../../shared/fee-cheonwon.js';
import { lessonDurationOptions, lessonDurationSelectValue } from '../../../shared/lesson-duration-options.js';
import { lessonWeeklyOptions, lessonWeeklySelectValue } from '../../../shared/lesson-weekly-options.js';
import { getExposureMatrix } from './format.js';
import {
  getTutors,
  getTutor,
  getPublishReadiness,
  deleteTutor,
} from './store.js';
import { saveTutorBasicInline, saveTutorDetailInline } from './inline-save.js';
import {
  buildTutorRegistrationCheckModel,
} from './registration-check-model.js';
import { renderTutorRegistrationCheck } from './registration-check-render.js';
import { bindTutorRegistrationCheckEvents } from './registration-check-edit.js';
import { renderTutorInquiries } from './inquiries-render.js';
import { bindTutorInquiriesEvents } from './inquiries-edit.js';
import { renderTutorProfileRead } from './profile-read.js';
import { renderTutorProfilePhotoEditor, bindTutorProfilePhotos } from './profile-photos.js';
import { TRC_COPY } from './registration-check-copy.js';
import { renderMainSubjectSelect } from '../../../shared/main-subjects.js';
import {
  renderTutorRegionSlot,
  bindTutorRegionSlotEvents,
  collectTutorRegionSlots,
  syncTutorRegionSlotIds,
  validateTutorActivityRegions,
} from '../../../shared/tutor-region-slots.js';
import { activityLabelFromRegionId } from '../../../shared/korea-sidos.js';
import {
  ensureTutorCityUnits,
  getTutorCityUnits,
  retryTutorCityUnits,
  tutorCityUnitsError,
  tutorCityUnitsReady,
} from './city-units.js';
import {
  bindNeighborhoodGreetingEditor,
  renderNeighborhoodGreetingEditor,
} from '../neighborhood-greeting-ui.js';

function lessonSelectHtml(options, selected) {
  const current = String(selected ?? '');
  return [
    '<option value="">선택</option>',
    ...options.map(
      (o) => `<option value="${esc(o.value)}" ${current === o.value ? 'selected' : ''}>${esc(o.label)}</option>`,
    ),
  ].join('');
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function reqMark() {
  return '<em class="p19-required">필수</em>';
}

function renderReturnToRegistrationCheckBanner(tutorId) {
  if (!isReturnToRegistrationCheck()) return '';
  const href = tutorSectionPath(tutorId, 'publish');
  return `<div class="rc-return-banner">
    <a class="rc-return-banner__link" href="#${href}" data-p21-nav="${href}">${esc(TRC_COPY.returnBanner.label)}</a>
    <p class="rc-return-banner__hint">${esc(TRC_COPY.returnBanner.hint)}</p>
  </div>`;
}

/** @param {import('./store.js').TutorRecord} tutor @param {string} activeSection @param {string} bodyHtml */
function renderTutorShell(tutor, activeSection, bodyHtml) {
  const section =
    activeSection === 'access' || activeSection === 'inquiries'
      ? 'inquiries'
      : ['hub', 'basic', 'detail', 'publish', 'inquiries'].includes(activeSection)
        ? activeSection
        : 'hub';

  const tabs = TUTOR_REG_TOP_TABS.map((t) => {
    const href =
      t.key === 'hub' ? tutorHubPath(tutor.id) : tutorSectionPath(tutor.id, /** @type {any} */ (t.key));
    const active = section === t.key;
    return `<a href="#${href}" class="mp-room__tab${active ? ' is-active' : ''}" data-p21-nav="${href}">${esc(t.label)}</a>`;
  }).join('');

  return `
    <div class="mp-room">
      <header class="mp-room__head">
        <nav class="mp-room__tabs" aria-label="과외쌤 메뉴">${tabs}</nav>
      </header>
      <div class="mp-room__body">${bodyHtml}</div>
    </div>`;
}

/** @param {string} path */
export function renderTutorRegScreen(path) {
  const route = parseTutorRegPath(path);
  if (!route) return '';

  if (route.screenId === 'P21-01') {
    const tutors = getTutors();
    if (route.listTab === 'hidden') {
      const dest = tutors.length ? tutorHubPath(tutors[0].id) : TUTOR_REG_BASE;
      queueMicrotask(() => {
        const hashPath = (window.location.hash.slice(1) || '').split('?')[0];
        const p = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
        if (/\/tab\/hidden$/.test(p)) window.location.replace(`#${dest}`);
      });
    }
    if (tutors.length) {
      // 중간 목록 depth 제거 — 대표(첫) 과외 프로필 허브 직행 · 계정당 1프로필 정책
      const dest = tutorHubPath(tutors[0].id);
      queueMicrotask(() => {
        const hashPath = (window.location.hash.slice(1) || '').split('?')[0];
        const p = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
        if (p === TUTOR_REG_BASE || /^\/mypage\/registrations\/tutors\/tab\//.test(p)) {
          window.location.replace(`#${dest}`);
        }
      });
      return renderHub(tutors[0]);
    }
    return renderEmptyNoProfile();
  }
  if (!route.tutorId) return renderNotFound();

  let tutor = getTutor(route.tutorId);
  if (!tutor || tutor.deleted_at) {
    const first = getTutors()[0];
    if (first) {
      const sec = route.section === 'access' ? 'inquiries' : route.section;
      const dest =
        !sec || sec === 'hub' ? tutorHubPath(first.id) : tutorSectionPath(first.id, /** @type {any} */ (sec));
      queueMicrotask(() => {
        const cur = (window.location.hash.slice(1) || '').split('?')[0];
        const curPath = cur.startsWith('/') ? cur : `/${cur}`;
        if (curPath !== dest) window.location.replace(`#${dest}`);
      });
      tutor = first;
    } else {
      return renderNotFound();
    }
  }

  // 레거시 /access → /inquiries 정규화 (탭 URL·active 일치)
  if (route.section === 'access') {
    const dest = tutorSectionPath(tutor.id, 'inquiries');
    queueMicrotask(() => {
      const cur = (window.location.hash.slice(1) || '').split('?')[0];
      const curPath = cur.startsWith('/') ? cur : `/${cur}`;
      if (curPath.endsWith('/access')) window.location.replace(`#${dest}`);
    });
  }

  switch (route.screenId) {
    case 'P21-02':
      return renderHub(tutor);
    case 'P21-03a':
      return renderBasicBridge(tutor);
    case 'P21-03b':
      return renderDetailBridge(tutor);
    case 'P21-04':
      return renderPublish(tutor);
    case 'P21-05':
      return renderInquiries(tutor);
    case 'P21-06':
      return renderExposure(tutor);
    default:
      return renderHub(tutor);
  }
}

function renderNotFound() {
  return `<section class="mypage-panel mp-room-panel mypage-empty">
    <p>과외 프로필을 찾을 수 없습니다.</p>
    <a href="#/mypage/registrations" class="btn btn--secondary" data-p21-nav="/mypage/registrations">내 등록으로</a>
  </section>`;
}

/** 프로필 0개 — 복수 등록 CTA 없음 */
function renderEmptyNoProfile() {
  return `
    <section class="mypage-panel mp-room-panel mypage-empty">
      <h2 class="p19-list-head__title">과외 프로필이 없습니다</h2>
      <p class="p19-list-head__lead">계정당 과외 프로필은 1개입니다. 기본등록을 마치면 여기에서 운영할 수 있습니다.</p>
      <p class="p19-list-footnote">${LIFECYCLE_FOOTNOTE_REG}</p>
    </section>`;
}

/** @param {ReturnType<typeof getExposureMatrix>} rows */
function renderExposureMatrixRows(rows) {
  return rows
    .map((m) => {
      const status = m.statusText ?? (m.ok ? '가능' : m.reason || '불가');
      return `
    <div class="p20-matrix__row${m.ok ? ' is-ok' : ''}">
      <span class="p20-matrix__label">${esc(m.label)}</span>
      <span class="p20-matrix__status">${esc(status)}</span>
    </div>`;
    })
    .join('');
}

/** @param {import('./store.js').TutorRecord} tutor */
function renderHub(tutor) {
  const greeting = renderNeighborhoodGreetingEditor({
    providerType: 'tutor',
    registrationId: Number(tutor.id),
    neighborhood: tutor.primary_region_label || tutor.location_label || '',
    displayName: tutor.tutor_display_name || '과외쌤',
  });
  const body = `${greeting}${renderTutorProfileRead(tutor)}`;
  return `<section class="mypage-panel mp-room-panel">${renderTutorShell(tutor, 'hub', body)}</section>`;
}

/** @param {string} title @param {string} [lead] @param {string} body */
function renderFormSection(title, lead, body) {
  return `
    <section class="p19-form-section">
      <header class="p19-form-section__head">
        <h3 class="p19-form-section__title">${esc(title)}</h3>
        ${lead ? `<p class="p19-form-section__lead">${lead}</p>` : ''}
      </header>
      <div class="p19-form-section__body">${body}</div>
    </section>`;
}

/** @param {string} [hint] @param {string} buttonsHtml */
function renderFormFooter(hint, buttonsHtml) {
  return `
    <footer class="p19-form-footer">
      ${hint ? `<p class="p19-form-footer__hint">${hint}</p>` : ''}
      <div class="p19-form-actions">${buttonsHtml}</div>
    </footer>`;
}

function tutorRegionSlotsFromRecord(tutor) {
  const saved = Array.isArray(tutor.saved_regions) ? tutor.saved_regions : [];
  const fromSaved = saved
    .map((s) => ({
      region_id: String(s?.region_id || ''),
      scope_type: s?.scope_type || 'city',
      is_primary: !!s?.is_primary,
    }))
    .slice(0, 3);
  if (fromSaved.some((s) => s.region_id)) {
    while (fromSaved.length < 3) {
      fromSaved.push({ region_id: '', scope_type: 'city', is_primary: false });
    }
    if (!fromSaved.some((s) => s.is_primary && s.region_id) && fromSaved[0].region_id) {
      fromSaved[0].is_primary = true;
    }
    return fromSaved;
  }

  const units = getTutorCityUnits();
  const label = String(tutor.primary_region_label || tutor.location_label || '').trim();
  let regionId = tutor.primary_region_id || '';
  if (!regionId && label) {
    const hit =
      units.find((u) => u.label === label) ||
      units.find((u) => `${u.sido_name} ${u.label}` === label) ||
      units.find((u) => label.includes(u.label));
    regionId = hit?.id || '';
  }
  return [
    { region_id: regionId, scope_type: 'city', is_primary: true },
    { region_id: '', scope_type: 'city', is_primary: false },
    { region_id: '', scope_type: 'city', is_primary: false },
  ];
}

let basicSaveFlash = '';

function takeBasicSaveFlash() {
  const message = basicSaveFlash;
  basicSaveFlash = '';
  return message;
}

/** 기본정보 폼 → DB 저장. 도시 목록이 없거나 숫자 region_id가 없으면 저장하지 않는다. */
async function persistTutorBasicForm(form) {
  if (!tutorCityUnitsReady()) {
    throw new Error(
      tutorCityUnitsError() || '과외지역 목록을 불러오지 못했습니다. 다시 불러온 뒤 저장해 주세요.',
    );
  }
  const id = Number(form.dataset.p21TutorId);
  const fd = new FormData(form);
  const units = getTutorCityUnits();
  syncTutorRegionSlotIds(form, units);
  const checked = validateTutorActivityRegions(collectTutorRegionSlots(form));
  if (!checked.ok) throw new Error(checked.message);
  const slots = checked.slots;
  const primary = slots.find((s) => s.is_primary) || slots[0];
  const label = activityLabelFromRegionId(primary.region_id, units);
  if (!label) {
    throw new Error('과외지역 목록을 다시 불러온 뒤 지역 1을 선택해 주세요.');
  }
  await saveTutorBasicInline(id, {
    tutor_display_name: String(fd.get('tutor_display_name') || ''),
    main_subject_note: String(fd.get('main_subject_note') || ''),
    primary_region_label: label,
    primary_region_id: primary.region_id,
    saved_regions: slots,
  });
}

const LESSON_PLACE_OPTS = [
  { value: 'student_home_visit', label: '학생자택방문' },
  { value: 'public_place', label: '공공장소' },
  { value: 'tutor_home', label: '강사자택' },
];

const FEE_BASIS_OPTS = [
  { value: 'monthly_by_weekly_schedule', label: '주간 일정 기준 월액' },
  { value: 'monthly_by_total_sessions', label: '월 총 횟수 기준' },
];

const GENDER_GROUP_OPTS = [
  { value: 'male', label: '남학생' },
  { value: 'female', label: '여학생' },
  { value: 'mixed', label: '혼성' },
];

const UNIVERSITY_STATUS_OPTS = [
  { value: '', label: '선택' },
  { value: 'enrolled', label: '재학' },
  { value: 'leave', label: '휴학' },
  { value: 'completed', label: '수료' },
  { value: 'graduated', label: '졸업' },
];

const STUDENT_COUNT_OPTS = [
  { value: 'solo', label: '단독' },
  { value: 'two', label: '2명' },
  { value: 'three', label: '3명' },
  { value: 'four_plus', label: '4명 이상' },
];

/** @param {import('./store.js').TutorRecord} tutor */
function renderBasicForm(tutor) {
  const units = getTutorCityUnits();
  const slots = tutorRegionSlotsFromRecord(tutor);
  const cityErr = tutorCityUnitsError();
  const saveFlash = takeBasicSaveFlash();
  const regionHint = units.length
    ? ''
    : cityErr
      ? `<p class="p19-field__hint">${esc(cityErr)} <button type="button" class="btn btn--ghost btn--sm" data-p21-retry-cities>다시 불러오기</button></p>`
      : '<p class="p19-field__hint">시 목록을 연결하는 중입니다.</p>';
  const regionSlotsHtml = `${slots
    .map((slot, i) => renderTutorRegionSlot(slot, i, units, { namePrefix: 'p21_' }))
    .join('')}${regionHint}`;
  const formBody = `
    <form class="p19-form p21-inline-form" data-p21-form="basic" data-p21-tutor-id="${tutor.id}">
      ${renderFormSection(
        '기본정보 · 과외지역',
        '표시명·주력과목과 과외지역(시 단위)을 한 화면에서 수정합니다. 광역시는 그 자체, 도는 시까지 선택합니다.',
        `
        <div class="register-grid-2">
          <div class="register-basic-col">
            <div class="register-basic-fields">
              <label class="p19-field" data-trc-field="display_name">
                <span class="p19-field__label">표시명 ${reqMark()}</span>
                <input class="p19-input" name="tutor_display_name" value="${esc(tutor.tutor_display_name || '')}" required />
              </label>
              <label class="p19-field" data-trc-field="main_subject">
                <span class="p19-field__label">주력과목 ${reqMark()}</span>
                <select class="p19-input" name="main_subject_note" required>
                  ${renderMainSubjectSelect(tutor.main_subject_note || '')}
                </select>
              </label>
            </div>
          </div>
          <div class="register-basic-col" data-trc-field="primary_region">
            <p class="p19-field__label" style="margin:0 0 var(--space-2);">과외지역 ${reqMark()}</p>
            <p class="p19-field__hint" style="margin-bottom:var(--space-3);">지역 1이 대표입니다. 지역 2·3은 선택입니다. 기본 단위는 「시」입니다.</p>
            ${regionSlotsHtml}
          </div>
        </div>`,
      )}
      <p class="p21-save-feedback" data-p21-save-feedback role="status" ${saveFlash ? '' : 'hidden'} style="margin:0 0 0.75rem;padding:0.5rem 0.75rem;border-radius:0.5rem;background:#ecfdf5;border:1px solid #a7f3d0;color:#047857;font-weight:600;">${saveFlash ? esc(saveFlash) : ''}</p>
      <p class="p19-field__hint" data-p21-dirty-hint hidden>변경된 내용이 있습니다. 기본정보 저장을 눌러 주세요.</p>
      ${renderFormFooter(
        '저장해도 검색 노출이 바로 바뀌지는 않습니다. 부족한 항목은 등록점검에서 확인합니다.',
        `<button type="submit" class="btn btn--primary" ${units.length ? '' : 'disabled'}>기본정보 저장</button>
         <a href="#${tutorSectionPath(tutor.id, 'detail')}" class="btn btn--secondary" data-p21-nav="${tutorSectionPath(tutor.id, 'detail')}">상세정보로</a>
         <a href="#${tutorSectionPath(tutor.id, 'publish')}" class="btn btn--ghost" data-p21-nav="${tutorSectionPath(tutor.id, 'publish')}">등록점검</a>`,
      )}
    </form>`;

  return `<section class="mypage-panel mp-room-panel">${renderTutorShell(tutor, 'basic', `${renderReturnToRegistrationCheckBanner(tutor.id)}${formBody}`)}</section>`;
}

/** @param {import('./store.js').TutorRecord} tutor */
function renderDetailForm(tutor) {
  const places = tutor.lesson_places || [];
  const placeChecks = LESSON_PLACE_OPTS.map(
    (p) => `
      <label class="p19-chip${places.includes(p.value) ? ' is-checked' : ''}">
        <input type="checkbox" name="lesson_places" value="${esc(p.value)}" ${places.includes(p.value) ? 'checked' : ''} />
        <span>${esc(p.label)}</span>
      </label>`,
  ).join('');
  const feeBasis = tutor.fee_basis_type || 'monthly_by_weekly_schedule';
  const gender = tutor.student_gender_group || 'mixed';
  const count = tutor.student_count_group || 'solo';

  const formBody = `
    <form class="p19-form p21-inline-form" data-p21-form="detail" data-p21-tutor-id="${tutor.id}">
      ${renderFormSection(
        '수업 · 가격',
        '주력과목은 기본등록에서 수정합니다. 여기서는 수업·가격 상세를 채웁니다.',
        `
        <div class="p19-field-grid p19-field-grid--2">
          <label class="p19-field" data-trc-field="fee">
            <span class="p19-field__label">월 과외비 (천원) ${reqMark()}</span>
            <input class="p19-input" type="number" name="preferred_fee_amount" value="${esc(wonToCheonwonInput(tutor.preferred_fee_amount))}" required min="1" />
          </label>
          <label class="p19-field" data-trc-field="fee_basis">
            <span class="p19-field__label">산정방식 ${reqMark()}</span>
            <select class="p19-input" name="fee_basis_type">
              ${FEE_BASIS_OPTS.map((o) => `<option value="${o.value}" ${feeBasis === o.value ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
            </select>
          </label>
          <label class="p19-field" data-trc-field="schedule">
            <span class="p19-field__label">주 회수 ${reqMark()}</span>
            <select class="p19-input" name="lessons_per_week">${lessonSelectHtml(lessonWeeklyOptions(tutor.lessons_per_week), lessonWeeklySelectValue(tutor.lessons_per_week))}</select>
          </label>
          <label class="p19-field" data-trc-field="monthly_session_count">
            <span class="p19-field__label">월 총 횟수</span>
            <input class="p19-input" name="monthly_session_count" value="${esc(tutor.monthly_session_count || '')}" />
          </label>
          <label class="p19-field" data-trc-field="minutes">
            <span class="p19-field__label">1회 수업시간 ${reqMark()}</span>
            <select class="p19-input" name="minutes_per_lesson">${lessonSelectHtml(lessonDurationOptions(tutor.minutes_per_lesson), lessonDurationSelectValue(tutor.minutes_per_lesson))}</select>
          </label>
          <label class="p19-field" data-trc-field="student_target">
            <span class="p19-field__label">지도 대상 성별 ${reqMark()}</span>
            <select class="p19-input" name="student_gender_group">
              ${GENDER_GROUP_OPTS.map((o) => `<option value="${o.value}" ${gender === o.value ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
            </select>
          </label>
          <label class="p19-field" data-trc-field="student_count_group">
            <span class="p19-field__label">수업인원 ${reqMark()}</span>
            <select class="p19-input" name="student_count_group">
              ${STUDENT_COUNT_OPTS.map((o) => `<option value="${o.value}" ${count === o.value ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
            </select>
          </label>
          <label class="p19-field p19-field--full" data-trc-field="lesson_places">
            <span class="p19-field__label">강의장소 ${reqMark()}</span>
            <div class="p19-chip-group">${placeChecks}</div>
          </label>
          <label class="p19-field p19-field--full" data-trc-field="fee_description">
            <span class="p19-field__label">가격 설명</span>
            <textarea class="p19-input p19-textarea" name="fee_description" rows="2">${esc(tutor.fee_description || '')}</textarea>
          </label>
        </div>`,
      )}
      ${renderFormSection(
        '학력 · 소개 · 연락',
        '프로필 사진은 아래에서 최대 3장까지 올릴 수 있습니다. 1번 사진이 베이직카드·픽·프라임 카드 대표 사진입니다.',
        `
        <div class="p19-field-grid p19-field-grid--2">
          <div data-trc-field="university">
          ${renderUniversityNameField({
            variant: 'p19',
            name: 'university_name',
            value: tutor.university_name || '',
            id: `p21_univ_${tutor.id || 'new'}`,
            label: '대학/대학원',
            required: true,
          })}
          </div>
          <label class="p19-field" data-trc-field="major_name">
            <span class="p19-field__label">전공</span>
            <input class="p19-input" name="major_name" value="${esc(tutor.major_name || '')}" placeholder="학과명 (서술형)" />
          </label>
          <label class="p19-field" data-trc-field="university_status">
            <span class="p19-field__label">학적상태</span>
            <select class="p19-input" name="university_status">
              ${UNIVERSITY_STATUS_OPTS.map((o) => `<option value="${o.value}" ${String(tutor.university_status || '') === o.value ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
            </select>
          </label>
          <label class="p19-field" data-trc-field="feature_1">
            <span class="p19-field__label">특징 1 ${reqMark()}</span>
            <input class="p19-input" name="feature_1" value="${esc(tutor.feature_1 || '')}" />
          </label>
          <label class="p19-field" data-trc-field="feature_2">
            <span class="p19-field__label">특징 2</span>
            <input class="p19-input" name="feature_2" value="${esc(tutor.feature_2 || '')}" />
          </label>
          <label class="p19-field" data-trc-field="feature_3">
            <span class="p19-field__label">특징 3</span>
            <input class="p19-input" name="feature_3" value="${esc(tutor.feature_3 || '')}" />
          </label>
          <label class="p19-field p19-field--full" data-trc-field="intro">
            <span class="p19-field__label">짧은 소개 ${reqMark()}</span>
            <textarea class="p19-input p19-textarea" name="intro_short" rows="2">${esc(tutor.intro_short || '')}</textarea>
          </label>
          <div class="p19-field p19-field--full" data-trc-field="profile_image">
            <span class="p19-field__label">프로필 사진 ${reqMark()}</span>
            ${renderTutorProfilePhotoEditor(tutor)}
          </div>
          <label class="p19-field p19-field--full" data-trc-field="intro_long">
            <span class="p19-field__label">상세 소개 ${reqMark()}</span>
            <textarea class="p19-input p19-textarea" name="intro_long" rows="4">${esc(tutor.intro_long || '')}</textarea>
          </label>
          <label class="p19-field" data-trc-field="contact_time_note">
            <span class="p19-field__label">연락 가능 시간</span>
            <input class="p19-input" name="contact_time_note" value="${esc(tutor.contact_time_note || '')}" />
          </label>
        </div>`,
      )}
      ${renderFormFooter(
        '저장 후 등록점검에서 입력 현황을 확인하세요.',
        `<button type="submit" class="btn btn--primary">상세정보 저장</button>
         <a href="#${tutorSectionPath(tutor.id, 'publish')}" class="btn btn--secondary" data-p21-nav="${tutorSectionPath(tutor.id, 'publish')}">등록점검</a>
         <a href="#${tutorHubPath(tutor.id)}" class="btn btn--ghost" data-p21-nav="${tutorHubPath(tutor.id)}">마이프로필</a>`,
      )}
    </form>`;

  return `<section class="mypage-panel mp-room-panel">${renderTutorShell(tutor, 'detail', `${renderReturnToRegistrationCheckBanner(tutor.id)}${formBody}`)}</section>`;
}

function renderBasicBridge(tutor) {
  return renderBasicForm(tutor);
}

function renderDetailBridge(tutor) {
  return renderDetailForm(tutor);
}

/** @param {import('./store.js').TutorRecord} tutor */
function renderPublish(tutor) {
  const r = getPublishReadiness(tutor);
  const vm = buildTutorRegistrationCheckModel(tutor, {
    canPublish: r.canPublish,
    missing: r.missing,
    profileStatus: tutor.profile_status,
  });
  const body = renderTutorRegistrationCheck(vm);
  return `<section class="mypage-panel mp-room-panel">${renderTutorShell(tutor, 'publish', body)}</section>`;
}

/** @param {import('./store.js').TutorRecord} tutor */
function renderInquiries(tutor) {
  const body = renderTutorInquiries(tutor);
  return `<section class="mypage-panel mp-room-panel">${renderTutorShell(tutor, 'inquiries', body)}</section>`;
}

/** @param {import('./store.js').TutorRecord} tutor */
function renderExposure(tutor) {
  const readiness = getPublishReadiness(tutor);
  const matrix = getExposureMatrix(tutor, readiness);
  const pickRow = matrix.find((m) => m.key === 'pick');
  const primeRow = matrix.find((m) => m.key === 'prime');

  const body = `
    <div class="p20-exposure-body" data-p21-tutor-id="${tutor.id}">
      <section class="p20-exposure-section">
        <h3>노출 가능 조건 (§4-5)</h3>
        <div class="p20-matrix">${renderExposureMatrixRows(matrix)}</div>
      </section>
      <section class="p20-exposure-section p20-plans-cta">
        <h3>추천·대표 노출</h3>
        <p class="p19-form-section__lead">대표·추천 노출은 기간형 상품 · 쪽지권은 횟수형 상품</p>
        <div class="p19-form-actions">
          <button type="button" class="btn btn--secondary" ${pickRow?.ok ? '' : 'disabled'}>${esc(pickRow?.statusText || '추천 노출')}</button>
          <button type="button" class="btn btn--secondary" ${primeRow?.ok ? '' : 'disabled'}>${esc(primeRow?.statusText || '대표 노출')}</button>
          <a href="#/plans/positions?provider_type=tutor&provider_id=${tutor.id}" class="btn btn--primary" data-nav="/plans/positions?provider_type=tutor&provider_id=${tutor.id}">유료상품 · 노출</a>
        </div>
      </section>
      <div class="p19-danger-zone" data-p21-tutor-id="${tutor.id}">
        <h3 class="p19-danger-zone__title">삭제</h3>
        <p class="p19-danger-zone__lead">삭제는 복구 불가(soft delete)</p>
        <div class="p19-danger-zone__actions">
          <button type="button" class="btn btn--ghost btn--sm p19-btn-danger" data-p21-delete>삭제</button>
        </div>
      </div>
    </div>`;

  return `<section class="mypage-panel mp-room-panel">${renderTutorShell(tutor, 'exposure', body)}</section>`;
}

function scrollToTutorRcFocus(root) {
  const focus = tutorHashSearchParams().get('focus');
  if (!focus) return;
  const el = root.querySelector(`[data-trc-field="${focus}"]`);
  if (!el) return;
  el.classList.add('is-rc-focus');
  queueMicrotask(() => {
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const input = el.matches('input, textarea, select') ? el : el.querySelector('input, textarea, select');
    input?.focus?.();
  });
}

function tutorBasicFieldEmpty(el) {
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) {
    return true;
  }
  if (el.type === 'hidden' || el.type === 'radio' || el.type === 'checkbox') return true;
  return !String(el.value || '').trim();
}

function paintTutorBasicField(el) {
  if (!(el instanceof HTMLElement)) return;
  if (tutorBasicFieldEmpty(el)) {
    el.style.background = '#fff';
    return;
  }
  el.style.background = document.activeElement === el ? '#fff' : '#f3f4f6';
}

function showTutorBasicFeedback(form, kind, message) {
  const box = form.querySelector('[data-p21-save-feedback]');
  if (!box) return;
  box.hidden = false;
  box.textContent = message;
  if (kind === 'error') {
    box.style.background = '#fef2f2';
    box.style.border = '1px solid #fecaca';
    box.style.color = '#b91c1c';
  } else {
    box.style.background = '#ecfdf5';
    box.style.border = '1px solid #a7f3d0';
    box.style.color = '#047857';
  }
}

function markTutorBasicClean(form) {
  form.dataset.p21Dirty = '';
  const hint = form.querySelector('[data-p21-dirty-hint]');
  if (hint) hint.hidden = true;
}

/** 188 재선택. 클릭 비우기·blur 복원은 공유 바인더가 유지한다. */
function bindUniversityNameReselect(root) {
  bindUniversityNameField(root);
}

function bindTutorBasicFieldChrome(form) {
  const fields = form.querySelectorAll('input, textarea, select');
  const markDirty = () => {
    form.dataset.p21Dirty = '1';
    const hint = form.querySelector('[data-p21-dirty-hint]');
    if (hint) hint.hidden = false;
  };
  fields.forEach((el) => {
    paintTutorBasicField(el);
    el.addEventListener('input', () => {
      paintTutorBasicField(el);
      markDirty();
    });
    el.addEventListener('change', () => {
      paintTutorBasicField(el);
      markDirty();
    });
    el.addEventListener('focus', () => {
      if (el instanceof HTMLElement && el.type !== 'hidden' && el.type !== 'radio' && el.type !== 'checkbox') {
        el.style.background = '#fff';
      }
    });
    el.addEventListener('blur', () => paintTutorBasicField(el));
  });
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindTutorRegEvents(root, rerender) {
  bindNeighborhoodGreetingEditor(root, rerender);
  ensureTutorCityUnits().then((loaded) => {
    if (loaded) rerender();
  });

  bindTutorRegistrationCheckEvents(root);
  bindTutorInquiriesEvents(root, rerender);
  scrollToTutorRcFocus(root);

  bindUniversityNameReselect(root);
  const detailForm = root.querySelector('[data-p21-form="detail"]');
  if (detailForm) {
    bindTutorProfilePhotos(root, {
      tutorId: Number(detailForm.dataset.p21TutorId || 0),
      rerender,
    });
  }

  root.querySelectorAll('[data-p21-retry-cities]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const ok = await retryTutorCityUnits();
      btn.disabled = false;
      if (!ok) {
        const note = btn.closest('.p19-field__hint');
        if (note) note.childNodes[0].textContent = `${tutorCityUnitsError() || '과외지역 목록을 불러오지 못했습니다.'} `;
      }
      rerender();
    });
  });

  root.querySelectorAll('[data-p21-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const raw = el.getAttribute('data-p21-nav') || '/mypage/registrations/tutors';
      const next = raw.startsWith('#') ? raw.slice(1) : raw;
      // 라우팅 무결성 우선 — 탭/메뉴 이탈 시 persist·지역목록 validation·alert 금지.
      // 저장/검증은 form submit(기본정보 저장 버튼)에서만 수행.
      window.location.hash = next;
    });
  });

  root.querySelectorAll('[data-p21-form]').forEach((form) => {
    if (form.getAttribute('data-p21-form') === 'basic') {
      bindTutorRegionSlotEvents(form, getTutorCityUnits());
      bindTutorBasicFieldChrome(form);
    }
    form.querySelectorAll('.p19-chip input[type="checkbox"]').forEach((input) => {
      input.addEventListener('change', () => {
        input.closest('.p19-chip')?.classList.toggle('is-checked', input.checked);
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = Number(form.dataset.p21TutorId);
      const kind = form.getAttribute('data-p21-form');
      const fd = new FormData(form);
      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      try {
        if (kind === 'basic') {
          await persistTutorBasicForm(form);
          basicSaveFlash = '저장되었습니다.';
          markTutorBasicClean(form);
        } else if (kind === 'detail') {
          const current = getTutor(id) || {};
          await saveTutorDetailInline(id, {
            main_subject_note: String(current.main_subject_note || ''),
            preferred_fee_amount: Number(cheonwonInputToWon(fd.get('preferred_fee_amount')) || 0),
            fee_basis_type: String(fd.get('fee_basis_type') || ''),
            lessons_per_week: String(fd.get('lessons_per_week') || ''),
            monthly_session_count: String(fd.get('monthly_session_count') || ''),
            minutes_per_lesson: String(fd.get('minutes_per_lesson') || ''),
            fee_description: String(fd.get('fee_description') || ''),
            student_gender_group: String(fd.get('student_gender_group') || ''),
            student_count_group: String(fd.get('student_count_group') || ''),
            lesson_places: fd.getAll('lesson_places').map(String),
            university_name: String(fd.get('university_name') || '').trim(),
            major_name: String(fd.get('major_name') || '').trim(),
            university_status: String(fd.get('university_status') || ''),
            feature_1: String(fd.get('feature_1') || ''),
            feature_2: String(fd.get('feature_2') || ''),
            feature_3: String(fd.get('feature_3') || ''),
            intro_short: String(fd.get('intro_short') || ''),
            intro_long: String(fd.get('intro_long') || ''),
            contact_time_note: String(fd.get('contact_time_note') || ''),
          });
        }
        if (kind !== 'basic') alert('저장되었습니다.');
        if (isReturnToRegistrationCheck()) {
          basicSaveFlash = '';
          window.location.hash = tutorSectionPath(id, 'publish');
          return;
        }
        rerender();
      } catch (err) {
        if (kind === 'basic') {
          basicSaveFlash = '';
          showTutorBasicFeedback(form, 'error', err instanceof Error ? err.message : '저장에 실패했습니다.');
        } else {
          alert(err instanceof Error ? err.message : '저장에 실패했습니다.');
        }
      } finally {
        if (btn && (kind !== 'basic' || tutorCityUnitsReady())) btn.disabled = false;
      }
    });
  });

  root.querySelectorAll('[data-p21-preview-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-p21-preview-tab');
      const wrap = btn.closest('[data-p21-preview-wrap]');
      if (!wrap || !key) return;
      wrap.querySelectorAll('[data-p21-preview-tab]').forEach((t) => t.classList.toggle('is-active', t === btn));
      wrap.querySelectorAll('[data-p21-preview-panel]').forEach((p) => {
        p.classList.toggle('is-active', p.getAttribute('data-p21-preview-panel') === key);
      });
    });
  });

  root.querySelectorAll('[data-p21-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.closest('[data-p21-tutor-id]')?.dataset.p21TutorId);
      if (!confirm('삭제하시겠습니까? (deleted_at)')) return;
      try {
        await deleteTutor(id);
        window.location.hash = '/mypage/registrations/tutors';
        rerender();
      } catch (err) {
        console.warn('[p21]', err);
        alert('삭제에 실패했습니다.');
      }
    });
  });

  root.querySelectorAll('[data-provider-subscription]').forEach((btn) => {
    btn.addEventListener('click', () => {
      previewState.providerSubscription = /** @type {'free'|'paid'} */ (btn.getAttribute('data-provider-subscription'));
      rerender();
    });
  });
}
