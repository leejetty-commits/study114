import {
  LIFECYCLE_FOOTNOTE_REG,
  renderAdminHideOwnerLine,
} from '../lifecycle-copy.js';
import {
  parseTutorRegPath,
  tutorHubPath,
  tutorSectionPath,
  tutorBlankPath,
  TUTOR_REG_TOP_TABS,
  BASE as TUTOR_REG_BASE,
  isReturnToRegistrationCheck,
  tutorHashSearchParams,
} from './router.js';
import { renderUniversityNameField, bindUniversityNameField } from '../../../shared/korean-universities.js';
import { bindInputFill } from '../../../shared/input-fill.js';
import { wonToCheonwonInput, cheonwonInputToWon } from '../../../shared/fee-cheonwon.js';
import { lessonDurationOptions, lessonDurationSelectValue } from '../../../shared/lesson-duration-options.js';
import { lessonWeeklyOptions, lessonWeeklySelectValue } from '../../../shared/lesson-weekly-options.js';
import { getExposureMatrix } from './format.js';
import {
  getTutors,
  getTutor,
  getPublishReadiness,
} from './store.js';
import { saveTutorBasicInline } from './inline-save.js';
import {
  buildTutorRegistrationCheckModel,
} from './registration-check-model.js';
import { renderTutorRegistrationCheck } from './registration-check-render.js';
import { bindTutorRegistrationCheckEvents } from './registration-check-edit.js';
import { renderTutorInquiries } from './inquiries-render.js';
import { bindTutorInquiriesEvents } from './inquiries-edit.js';
import { renderTutorProfileRead } from './profile-read.js';
import { renderEmbeddedTutorDetail, bindEmbeddedTutorDetail, syncEmbeddedTutorForms } from './embedded-panels.js';
import { TRC_COPY } from './registration-check-copy.js';
import { renderMainSubjectSelect } from '../../../shared/main-subjects.js';
import { SCHOOL_LEVEL_FORM_OPTIONS } from '../../../shared/school-grade.js';
import { TUTOR_SLOGAN_MAX } from '../../../shared/tutor-basic-fields.js';
import { tutorDetailTabForFocus } from '../../../shared/tutor-detail-fields.js';
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

function renderReturnToRegistrationCheckBanner(tutorId) {
  if (!isReturnToRegistrationCheck()) return '';
  const href = Number(tutorId) ? tutorSectionPath(tutorId, 'publish') : tutorBlankPath('publish');
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
      : ['hub', 'basic', 'detail', 'detail2', 'publish', 'inquiries'].includes(activeSection)
        ? activeSection
        : 'hub';

  const tabs = TUTOR_REG_TOP_TABS.map((t) => {
    const href = !Number(tutor?.id)
      ? tutorBlankPath(t.key)
      : t.key === 'hub'
        ? tutorHubPath(tutor.id)
        : tutorSectionPath(tutor.id, /** @type {any} */ (t.key));
    const active = section === t.key;
    return `<a href="#${href}" class="mp-room__tab${active ? ' is-active' : ''}" data-p21-nav="${href}">${esc(t.label)}</a>`;
  }).join('');

  return `
    <div class="mp-room"${Number(tutor?.id) ? '' : ' data-blank-reg="1"'}>
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

  if (route.blank) {
    const tutors = getTutors();
    const section = route.section || 'hub';
    if (tutors.length) {
      const tutor = tutors[0];
      const hash = window.location.hash.slice(1) || '';
      const q = hash.includes('?') ? hash.slice(hash.indexOf('?')) : '';
      const focus = new URLSearchParams(q.startsWith('?') ? q.slice(1) : '').get('focus');
      let sectionForTutor = section;
      if ((sectionForTutor === 'detail' || sectionForTutor === 'detail2') && focus) {
        sectionForTutor = tutorDetailTabForFocus(focus);
      }
      const dest = sectionForTutor === 'hub' ? tutorHubPath(tutor.id) : tutorSectionPath(tutor.id, sectionForTutor);
      queueMicrotask(() => {
        const hashPath = (window.location.hash.slice(1) || '').split('?')[0];
        const p = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
        if (p === tutorBlankPath(section) || p === dest) {
          if ((window.location.hash.slice(1) || '') !== `${dest}${q}`) window.location.replace(`#${dest}${q}`);
        }
      });
      if (section === 'basic') return renderBasicBridge(tutor);
      if (section === 'detail' || section === 'detail2') return renderDetailBridge(tutor, sectionForTutor);
      if (section === 'publish') return renderPublish(tutor);
      if (section === 'inquiries') return renderInquiries(tutor);
      return renderHub(tutor);
    }
    return renderBlankTutor(section);
  }

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
    return renderBlankTutor('hub');
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

  let detailTab = route.section === 'detail2' ? 'detail2' : 'detail';
  if ((route.section === 'detail' || route.section === 'detail2') && route.tutorId) {
    const focus = tutorHashSearchParams(path).get('focus');
    const tab = focus ? tutorDetailTabForFocus(focus) : route.section;
    if (focus && tab !== route.section) {
      detailTab = tab;
      const q = path.includes('?') ? path.slice(path.indexOf('?')) : '';
      const dest = `${tutorSectionPath(route.tutorId, tab)}${q}`;
      queueMicrotask(() => {
        if ((window.location.hash.slice(1) || '') !== dest) window.location.replace(`#${dest}`);
      });
    }
  }

  switch (route.screenId) {
    case 'P21-02':
      return renderHub(tutor);
    case 'P21-03a':
      return renderBasicBridge(tutor);
    case 'P21-03b':
      return renderDetailBridge(tutor, detailTab);
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

function tutorNav(tutor, section) {
  if (!Number(tutor?.id)) return tutorBlankPath(section);
  return section === 'hub' ? tutorHubPath(tutor.id) : tutorSectionPath(tutor.id, section);
}

function blankTutor() {
  return {
    id: 0,
    tutor_display_name: '',
    primary_region_label: '',
    location_label: '',
    profile_status: 'draft',
    inquiry_status: '',
    saved_regions: [],
    lesson_places: [],
    profile_images: [],
    detail_completion_status: '',
    deleted_at: null,
  };
}

/** 등록 0건. 탭과 페이지 칸은 두고, 값은 비운다. 저장은 하지 않는다. */
function renderBlankTutor(section) {
  const tutor = blankTutor();
  const sec = section || 'hub';
  if (sec === 'basic') return renderBasicForm(tutor);
  if (sec === 'detail') return renderDetailBridge(tutor);
  if (sec === 'publish') return renderPublish(tutor);
  if (sec === 'inquiries') return renderInquiries(tutor);
  const greeting = renderNeighborhoodGreetingEditor({
    providerType: 'tutor',
    registrationId: 0,
    neighborhood: '',
    displayName: '',
  });
  const body = `${greeting}${renderTutorProfileRead(tutor)}`;
  return `<section class="mypage-panel mp-room-panel">${renderTutorShell(tutor, 'hub', body)}</section>`;
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
  const hideLine = renderAdminHideOwnerLine(tutor.profile_status === 'hidden');
  const body = `${hideLine}${greeting}${renderTutorProfileRead(tutor)}`;
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
    regionId = units.find((u) => activityLabelFromRegionId(u.id, units) === label)?.id || '';
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
    school_level: String(fd.get('school_level') || ''),
    main_subject_note: String(fd.get('main_subject_note') || ''),
    preferred_fee_amount: cheonwonInputToWon(fd.get('preferred_fee_amount')),
    lessons_per_week: String(fd.get('lessons_per_week') || ''),
    minutes_per_lesson: String(fd.get('minutes_per_lesson') || ''),
    slogan: String(fd.get('slogan') || '').trim(),
    primary_region_label: label,
    primary_region_id: primary.region_id,
    saved_regions: slots,
  });
}

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
      : '<p class="p19-field__hint">과외지역 목록을 불러오는 중입니다.</p>';
  const regionSlotsHtml = `${slots
    .map((slot, i) => renderTutorRegionSlot(slot, i, units, { namePrefix: 'p21_' }))
    .join('')}${regionHint}`;
  const formBody = `
    <form class="p19-form p21-inline-form" data-p21-form="basic" data-p21-tutor-id="${tutor.id}">
      ${renderFormSection(
        '기본정보 · 과외지역',
        '기본카드에 나오는 기본정보와 과외지역을 한 화면에서 수정합니다.',
        `
        <div class="register-grid-2">
          <div class="register-basic-col">
            <div class="register-basic-fields">
              <label class="p19-field" data-trc-field="display_name">
                <span class="p19-field__label">표시명</span>
                <input class="p19-input" name="tutor_display_name" value="${esc(tutor.tutor_display_name || '')}" required />
              </label>
              <label class="p19-field" data-trc-field="school_level">
                <span class="p19-field__label">대상(학교급)</span>
                <select class="p19-input" name="school_level" required>${lessonSelectHtml(SCHOOL_LEVEL_FORM_OPTIONS, tutor.school_level)}</select>
              </label>
              <label class="p19-field" data-trc-field="main_subject">
                <span class="p19-field__label">주력과목</span>
                <select class="p19-input" name="main_subject_note" required>
                  ${renderMainSubjectSelect(tutor.main_subject_note || '')}
                </select>
              </label>
              <label class="p19-field" data-trc-field="fee">
                <span class="p19-field__label">월 과외비 (천원)</span>
                <input class="p19-input" type="number" name="preferred_fee_amount" value="${esc(wonToCheonwonInput(tutor.preferred_fee_amount))}" required min="1" />
              </label>
              <label class="p19-field" data-trc-field="lessons_per_week">
                <span class="p19-field__label">주 회수</span>
                <select class="p19-input" name="lessons_per_week" required>${lessonSelectHtml(lessonWeeklyOptions(tutor.lessons_per_week), lessonWeeklySelectValue(tutor.lessons_per_week))}</select>
              </label>
              <label class="p19-field" data-trc-field="minutes">
                <span class="p19-field__label">1회 수업시간</span>
                <select class="p19-input" name="minutes_per_lesson" required>${lessonSelectHtml(lessonDurationOptions(tutor.minutes_per_lesson), lessonDurationSelectValue(tutor.minutes_per_lesson))}</select>
              </label>
              <label class="p19-field" data-trc-field="slogan">
                <span class="p19-field__label">슬로건</span>
                <input class="p19-input" name="slogan" value="${esc(tutor.slogan || '')}" maxlength="${TUTOR_SLOGAN_MAX}" required />
              </label>
            </div>
          </div>
          <div class="register-basic-col" data-trc-field="primary_region">
            <p class="p19-field__label" style="margin:0 0 var(--space-2);">과외지역</p>
            <p class="p19-field__hint" style="margin-bottom:var(--space-3);">지역 1이 대표입니다. 지역 2·3은 선택입니다. 광역시는 시 전체, 도는 시·군까지 고릅니다.</p>
            ${regionSlotsHtml}
          </div>
        </div>`,
      )}
      <p class="p21-save-feedback" data-p21-save-feedback role="status" ${saveFlash ? '' : 'hidden'} style="margin:0 0 0.75rem;padding:0.5rem 0.75rem;border-radius:0.5rem;background:#ecfdf5;border:1px solid #a7f3d0;color:#047857;font-weight:600;">${saveFlash ? esc(saveFlash) : ''}</p>
      <p class="p19-field__hint" data-p21-dirty-hint hidden>변경된 내용이 있습니다. 기본정보 저장을 눌러 주세요.</p>
      ${renderFormFooter(
        '저장해도 검색 노출은 바로 바뀌지 않습니다. 부족한 항목 확인은 등록점검에서 합니다.',
        `<button type="submit" class="btn btn--primary" ${units.length ? '' : 'disabled'}>기본정보 저장</button>
         <a href="#${tutorNav(tutor, 'detail')}" class="btn btn--secondary" data-p21-nav="${tutorNav(tutor, 'detail')}">상세정보로</a>
         <a href="#${tutorNav(tutor, 'publish')}" class="btn btn--ghost" data-p21-nav="${tutorNav(tutor, 'publish')}">등록점검</a>`,
      )}
    </form>`;

  return `<section class="mypage-panel mp-room-panel">${renderTutorShell(tutor, 'basic', `${renderReturnToRegistrationCheckBanner(tutor.id)}${formBody}`)}</section>`;
}

function renderBasicBridge(tutor) {
  return renderBasicForm(tutor);
}

function renderDetailBridge(tutor, section = 'detail') {
  const tab = section === 'detail2' ? 'detail2' : 'detail';
  return `<section class="mypage-panel mp-room-panel">${renderTutorShell(tutor, tab, renderEmbeddedTutorDetail(tutor, tab))}</section>`;
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
    const input = el.matches('input, textarea, select, button')
      ? el
      : el.querySelector('input, textarea, select, button');
    input?.focus?.();
  });
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

function bindTutorBasicDirty(form) {
  const markDirty = () => {
    form.dataset.p21Dirty = '1';
    const hint = form.querySelector('[data-p21-dirty-hint]');
    if (hint) hint.hidden = false;
  };
  form.querySelectorAll('input, textarea, select').forEach((el) => {
    el.addEventListener('input', markDirty);
    el.addEventListener('change', markDirty);
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
  bindUniversityNameReselect(root);
  bindEmbeddedTutorDetail(root, rerender);
  scrollToTutorRcFocus(root);

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
      // 상세 탭 입력만 메모리에 남긴다(L-02). 저장은 각 폼의 저장 버튼에서만 한다.
      syncEmbeddedTutorForms(root);
      window.location.hash = next;
    });
  });

  root.querySelectorAll('[data-p21-form]').forEach((form) => {
    if (form.getAttribute('data-p21-form') === 'basic') {
      bindTutorRegionSlotEvents(form, getTutorCityUnits());
      bindTutorBasicDirty(form);
    }
    bindInputFill(form);
    form.querySelectorAll('.p19-chip input[type="checkbox"]').forEach((input) => {
      input.addEventListener('change', () => {
        input.closest('.p19-chip')?.classList.toggle('is-checked', input.checked);
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = Number(form.dataset.p21TutorId);
      if (!id) return;
      const kind = form.getAttribute('data-p21-form');
      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      try {
        if (kind === 'basic') {
          await persistTutorBasicForm(form);
          basicSaveFlash = '저장되었습니다.';
          markTutorBasicClean(form);
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

  root.querySelectorAll('[data-provider-subscription]').forEach((btn) => {
    btn.addEventListener('click', () => {
      previewState.providerSubscription = /** @type {'free'|'paid'} */ (btn.getAttribute('data-provider-subscription'));
      rerender();
    });
  });
}
