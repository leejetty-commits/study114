import {
  P21_LIST_TABS,
  P21_ACCESS_CTA,
} from './tutor-reg-copy.js';
import {
  LIFECYCLE_FOOTNOTE_REG,
  LIFECYCLE_PUBLISH_CONFIRM_DIRECT,
  LIFECYCLE_PUBLISH_CONFIRM_NOTE,
} from '../lifecycle-copy.js';
import { renderBrowseList, renderExposureBox } from '../exposure-render.js';
import { TUTOR_REGISTER_URL } from '../nav-config.js';
import { formatSubmissionDocSummary, getSubmissionDocs } from '../mypage/preview-data.js';
import {
  parseTutorRegPath,
  tutorHubPath,
  tutorSectionPath,
  tutorListTabPath,
  TUTOR_REG_TOP_TABS,
} from './router.js';
import { renderUniversityNameField } from '../../../shared/korean-universities.js';
import {
  formatTutorSummaryLine,
  profileStatusLabel,
  tutorToExposureRow,
  getExposureMatrix,
  getAccessMatrix,
  getThreeGauges,
  getHubCtas,
  getUnlockCards,
  getProductApplyHint,
  getRequiredCertGauge,
} from './format.js';
import {
  getTutorsByTab,
  getTutor,
  getPublishReadiness,
  publishTutor,
  hideTutor,
  deleteTutor,
  getTutorSummaryCounts,
  isPaidProvider,
  getMemoCreditsRemaining,
} from './store.js';
import { saveTutorBasicInline, saveTutorDetailInline } from './inline-save.js';
import { showEmailVerifyOverlay } from '../email-verify-overlay.js';
import { previewState } from '../state.js';
import { renderMainSubjectSelect } from '../../../shared/main-subjects.js';
import {
  getCityUnits,
  renderTutorRegionSlot,
  bindTutorRegionSlotEvents,
  collectTutorRegionSlots,
} from '../../../shared/tutor-region-slots.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/** @param {import('./store.js').TutorRecord} tutor @param {string} activeSection @param {string} bodyHtml */
function renderTutorShell(tutor, activeSection, bodyHtml) {
  const tabKey = ['hub', 'basic', 'detail', 'publish'].includes(activeSection)
    ? activeSection
    : 'hub';

  const tabs = TUTOR_REG_TOP_TABS.map((t) => {
    const href =
      t.key === 'hub' ? tutorHubPath(tutor.id) : tutorSectionPath(tutor.id, /** @type {any} */ (t.key));
    const active = tabKey === t.key ? ' is-active' : '';
    return `<a href="#${href}" class="p21-reg-tabs__link${active}" data-p21-nav="${href}" role="tab" aria-selected="${tabKey === t.key}">${esc(t.label)}</a>`;
  }).join('');

  return `
    <div class="p21-reg-frame">
      <nav class="p21-reg-tabs" aria-label="내 등록 메뉴" role="tablist">${tabs}</nav>
      <div class="p21-reg-frame__body">${bodyHtml}</div>
    </div>`;
}

/** @param {string} path */
export function renderTutorRegScreen(path) {
  const route = parseTutorRegPath(path);
  if (!route) return '';

  if (route.screenId === 'P21-01') return renderList(route.listTab || 'all');
  if (!route.tutorId) return renderNotFound();

  const tutor = getTutor(route.tutorId);
  if (!tutor || tutor.deleted_at) return renderNotFound();

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
      return renderAccess(tutor);
    case 'P21-06':
      return renderExposure(tutor);
    default:
      return renderHub(tutor);
  }
}

function renderNotFound() {
  return `<section class="mypage-panel p19-panel mypage-empty">
    <p>과외 프로필을 찾을 수 없습니다.</p>
    <a href="#/mypage/registrations/tutors" class="btn btn--secondary" data-p21-nav="/mypage/registrations/tutors">목록으로</a>
  </section>`;
}

/** @param {'all'|'draft'|'published'|'hidden'|'not_ready'} tab */
function renderList(tab) {
  const tutors = getTutorsByTab(tab);
  const counts = getTutorSummaryCounts();
  const docSummary = formatSubmissionDocSummary(getSubmissionDocs('tutor'));
  const tabs = P21_LIST_TABS.map((t) => ({
    ...t,
    count:
      t.key === 'all'
        ? counts.published + counts.draft + counts.hidden
        : t.key === 'draft'
          ? counts.draft
          : t.key === 'published'
            ? counts.published
            : t.key === 'hidden'
              ? counts.hidden
              : counts.notReady,
  }));

  const tabHtml = tabs
    .map(
      (t) =>
        `<a href="#${tutorListTabPath(/** @type {any} */ (t.key))}" class="p19-tab${t.key === tab ? ' is-active' : ''}" data-p21-nav="${tutorListTabPath(/** @type {any} */ (t.key))}">${esc(t.label)} <span class="p19-tab__count">${t.count}</span></a>`,
    )
    .join('');

  const cards =
    tutors.length === 0
      ? `<p class="mypage-empty">해당 상태의 과외 프로필이 없습니다.</p>`
      : `<div class="p19-card-grid">
        ${tutors
          .map((t) => {
            const readiness = getPublishReadiness(t);
            const badge = readiness.canPublish
              ? profileStatusLabel(t.profile_status)
              : '공개 준비 미완료';
            const badgeClass = readiness.canPublish ? t.profile_status : 'draft';
            const boostHint = getProductApplyHint(t);
            return `
          <a href="#${tutorHubPath(t.id)}" class="p19-child-card" data-p21-nav="${tutorHubPath(t.id)}">
            <div class="p19-child-card__head">
              <strong>${esc(t.tutor_display_name)}</strong>
              <span class="mypage-badge mypage-badge--${badgeClass}">${esc(badge)}</span>
            </div>
            <p class="p19-child-card__meta">${esc(formatTutorSummaryLine(t))}</p>
            <p class="p19-child-card__meta p21-card-sub">${esc(docSummary)} · ${esc(boostHint)}</p>
            <span class="p19-child-card__cta">운영하기 →</span>
          </a>`;
          })
          .join('')}
      </div>`;

  return `
    <section class="mypage-panel p19-panel p19-panel--list">
      <header class="p19-list-head">
        <div>
          <h2 class="p19-list-head__title">과외쌤 운영</h2>
          <p class="p19-list-head__lead">프로필별로 공개·학생 접근·노출 상태를 관리합니다. 입력은 tutor-ui에서 합니다.</p>
        </div>
        <a href="${TUTOR_REGISTER_URL}" class="btn btn--primary btn--sm" data-same-tab-href="${TUTOR_REGISTER_URL}">+ 과외 등록</a>
      </header>
      <div class="p19-tabs" role="tablist">${tabHtml}</div>
      ${cards}
      <p class="p19-list-footnote">${LIFECYCLE_FOOTNOTE_REG}</p>
    </section>`;
}

/** @param {ReturnType<typeof getAccessMatrix>[number][]} rows */
function renderMatrixRows(rows, lockedClass = 'p20-matrix') {
  return rows
    .map(
      (m) => `
    <div class="${lockedClass}__row${m.ok ? ' is-ok' : ' is-locked'}">
      <span class="${lockedClass}__label">${m.ok ? '✓' : '🔒'} ${esc(m.label)}</span>
      <span class="${lockedClass}__status">${m.ok ? '가능' : esc(m.reason || '불가')}</span>
    </div>`,
    )
    .join('');
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

/** @param {NonNullable<ReturnType<typeof getUnlockCards>[number]>} card @param {number} tutorId */
function renderUnlockCard(card, tutorId) {
  const steps = card.conditions
    .map(
      (c) =>
        `<li class="p21-unlock-step${c.ok ? ' is-done' : ''}"><span>${c.ok ? '✓' : '△'}</span> ${esc(c.label)}</li>`,
    )
    .join('');
  let cta = '';
  if (card.ctaExternal) {
    cta = `<a href="${card.ctaExternal}" class="btn btn--secondary btn--sm" data-mypage-nav="${card.ctaExternal.replace('#', '')}">${esc(card.ctaLabel)}</a>`;
  } else if (card.ctaPath) {
    const href = tutorSectionPath(tutorId, /** @type {any} */ (card.ctaPath));
    cta = `<a href="#${href}" class="btn btn--secondary btn--sm" data-p21-nav="${href}">${esc(card.ctaLabel)}</a>`;
  }
  return `
    <div class="p21-unlock-card">
      <strong class="p21-unlock-card__title">${esc(card.label)}</strong>
      <p class="p21-unlock-card__remain">조건 ${card.missingCount}개 남음</p>
      <ul class="p21-unlock-steps">${steps}</ul>
      ${cta}
    </div>`;
}

function renderProviderSubToggle() {
  const freeActive = previewState.providerSubscription === 'free' ? ' is-active' : '';
  const paidActive = previewState.providerSubscription === 'paid' ? ' is-active' : '';
  return `
    <div class="p21-sub-toggle msg-toolbar-demo" role="group" aria-label="유료 등급 프리뷰">
      <span class="p21-sub-toggle__label">공급자 구독 (프리뷰)</span>
      <button type="button" class="preview-toolbar__btn${freeActive}" data-provider-subscription="free">무료</button>
      <button type="button" class="preview-toolbar__btn${paidActive}" data-provider-subscription="paid">유료</button>
      <span class="p21-sub-toggle__hint">학생에게 먼저 보내는 쪽지 권한 체험</span>
    </div>`;
}

/** @param {{ ok: boolean, label: string }[]} items */
function renderChecklist(items) {
  return `<ul class="p21-check-grid">${items
    .map(
      (i) =>
        `<li class="p21-check-grid__item${i.ok ? ' is-done' : ''}"><span class="p21-check-grid__ico" aria-hidden="true">${i.ok ? '✓' : '○'}</span><span>${esc(i.label)}</span></li>`,
    )
    .join('')}</ul>`;
}

/**
 * @param {string} title
 * @param {string} bodyHtml
 * @param {{ open?: boolean, hint?: string }} [opts]
 */
function renderAccordion(title, bodyHtml, opts = {}) {
  return `
    <details class="p21-acc"${opts.open ? ' open' : ''}>
      <summary class="p21-acc__summary">
        <span class="p21-acc__title">${esc(title)}</span>
        ${opts.hint ? `<span class="p21-acc__hint">${esc(opts.hint)}</span>` : ''}
      </summary>
      <div class="p21-acc__body">${bodyHtml}</div>
    </details>`;
}

function renderHubHeroSentence(tutor) {
  if (tutor.profile_status === 'published') return '현재 프로필이 공개 상태입니다';
  if (tutor.profile_status === 'hidden') return '현재 프로필이 숨김 상태입니다';
  return '현재 프로필이 미공개 상태입니다';
}

/** @param {import('./store.js').TutorRecord} tutor */
function renderHubCtaBlock(tutor) {
  const ctas = getHubCtas(tutor).slice(0, 3);
  return ctas
    .map((c) => {
      if (c.external) {
        const isMypage = c.external.startsWith('#/mypage');
        const navAttr = isMypage ? ` data-mypage-nav="${c.external.replace('#', '')}"` : '';
        return `<a href="${c.external}" class="btn ${c.primary ? 'btn--primary' : 'btn--secondary'}"${navAttr}>${esc(c.label)}</a>`;
      }
      const href = tutorSectionPath(tutor.id, /** @type {any} */ (c.path));
      return `<a href="#${href}" class="btn ${c.primary ? 'btn--primary' : 'btn--secondary'}" data-p21-nav="${href}">${esc(c.label)}</a>`;
    })
    .join('');
}

/** @param {import('./store.js').TutorRecord} tutor */
function renderHub(tutor) {
  const readiness = getPublishReadiness(tutor);
  const gauges = getThreeGauges(tutor);
  const certs = getRequiredCertGauge(tutor);
  const accessMatrix = getAccessMatrix(tutor);
  const exposureMatrix = getExposureMatrix(tutor, readiness);
  const badge = profileStatusLabel(tutor.profile_status);
  const readinessDone = readiness.doneCount;
  const readinessTotal = readiness.totalCount;

  const body = `
    <div class="p21-hub p21-hub--ops">
      <section class="p21-hero" aria-label="등록 상태 요약">
        <span class="p21-hero__badge">${esc(badge)}</span>
        <h2 class="p21-hero__title">${esc(renderHubHeroSentence(tutor))}</h2>
        <div class="p21-hero__stats">
          <p>공개 준비도: <strong>${readinessDone} / ${readinessTotal} 항목 완료</strong></p>
          <p>필수 인증: <strong>${certs.done} / ${certs.total} 완료</strong></p>
        </div>
        <div class="p21-hero__actions">${renderHubCtaBlock(tutor)}</div>
      </section>

      <div class="p21-mid-grid" aria-label="진행 축 요약">
        <article class="p21-mid-card">
          <div class="p21-mid-card__text">
            <h3 class="p21-mid-card__title">공개 준비도</h3>
            <p class="p21-mid-card__desc">필수 정보 ${readinessTotal}개 중 ${readinessDone}개 입력됨</p>
          </div>
          <span class="p21-mid-card__ico" aria-hidden="true">◎</span>
        </article>
        <article class="p21-mid-card">
          <div class="p21-mid-card__text">
            <h3 class="p21-mid-card__title">프로필·신뢰 요약</h3>
            <p class="p21-mid-card__desc">서류 인증 ${gauges.trustInfo.total}개 중 ${gauges.trustInfo.done}개 완료</p>
          </div>
          <span class="p21-mid-card__ico" aria-hidden="true">▣</span>
        </article>
      </div>

      <div class="p21-acc-stack">
        ${renderAccordion(
          '프로필 완성도 상세',
          `<div class="p21-acc__meter"><span>${gauges.completion.done}/${gauges.completion.total}</span>
            <div class="p21-acc__bar" role="progressbar" aria-valuenow="${Math.round((gauges.completion.done / gauges.completion.total) * 100)}" aria-valuemin="0" aria-valuemax="100">
              <i style="width:${Math.round((gauges.completion.done / gauges.completion.total) * 100)}%"></i>
            </div>
          </div>
          ${renderChecklist(gauges.completion.items)}`,
          { open: true },
        )}
        ${renderAccordion('신뢰정보(학력/자격 등)', renderChecklist(gauges.trustInfo.items))}
        ${renderAccordion(
          '노출 준비도 / 상품 연동 상태',
          `<div class="p20-matrix p20-matrix--soft">${renderExposureMatrixRows(exposureMatrix)}</div>
           ${
             readiness.qualityHints.length
               ? `<p class="p21-acc__note">${esc(readiness.qualityHints.join(' · '))}</p>`
               : ''
           }`,
        )}
        ${renderAccordion(
          '접근·쪽지 매트릭스 상세',
          `<p class="p21-acc__note">회원 등급·공개 상태에 따른 이용 가능 여부를 확인합니다.</p>
           <div class="p20-matrix p20-matrix--soft">${renderMatrixRows(accessMatrix)}</div>
           <p class="p21-acc__note"><a href="#${tutorSectionPath(tutor.id, 'access')}" data-p21-nav="${tutorSectionPath(tutor.id, 'access')}">학생 접근·쪽지 화면 열기 →</a></p>`,
          { hint: '이용 가능 여부 확인' },
        )}
      </div>
    </div>`;

  return `<section class="mypage-panel p19-panel p19-panel--hub p19-panel--hub-ops">${renderTutorShell(tutor, 'hub', body)}</section>`;
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
  const units = getCityUnits([]);
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

function displayLabelForRegionId(regionId, units) {
  const u = (units || []).find((x) => String(x.id) === String(regionId));
  if (!u) return '';
  return u.kind === 'metro' ? u.label : `${u.sido_name} ${u.label}`;
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

const STUDENT_COUNT_OPTS = [
  { value: 'solo', label: '단독' },
  { value: 'two', label: '2명' },
  { value: 'three', label: '3명' },
  { value: 'four_plus', label: '4명 이상' },
];

/** @param {import('./store.js').TutorRecord} tutor */
function renderBasicForm(tutor) {
  const units = getCityUnits([]);
  const slots = tutorRegionSlotsFromRecord(tutor);
  const formBody = `
    <form class="p19-form p21-inline-form" data-p21-form="basic" data-p21-tutor-id="${tutor.id}">
      ${renderFormSection(
        '기본정보 · 과외지역',
        '표시명·주력과목과 과외지역(시 단위)을 한 화면에서 수정합니다. 광역시는 그 자체, 도는 시까지 선택합니다.',
        `
        <div class="register-grid-2">
          <div class="register-basic-col">
            <div class="register-basic-fields">
              <label class="p19-field">
                <span class="p19-field__label">표시명 <em class="p19-required">필수</em></span>
                <input class="p19-input" name="tutor_display_name" value="${esc(tutor.tutor_display_name || '')}" required />
              </label>
              <label class="p19-field">
                <span class="p19-field__label">주력과목 <em class="p19-required">필수</em></span>
                <select class="p19-input" name="main_subject_note" required>
                  ${renderMainSubjectSelect(tutor.main_subject_note || '')}
                </select>
              </label>
            </div>
          </div>
          <div class="register-basic-col">
            <p class="p19-field__label" style="margin:0 0 var(--space-2);">과외지역</p>
            <p class="p19-field__hint" style="margin-bottom:var(--space-3);">최대 3곳 · 대표 1곳. 기본 단위는 「시」입니다.</p>
            ${slots.map((slot, i) => renderTutorRegionSlot(slot, i, units, { namePrefix: 'p21_' })).join('')}
          </div>
        </div>`,
      )}
      ${renderFormFooter(
        '저장해도 바로 공개되지 않습니다. 공개는 「미리보기·공개」에서 합니다.',
        `<button type="submit" class="btn btn--primary">기본정보 저장</button>
         <a href="#${tutorSectionPath(tutor.id, 'detail')}" class="btn btn--secondary" data-p21-nav="${tutorSectionPath(tutor.id, 'detail')}">상세정보로</a>
         <a href="#${tutorHubPath(tutor.id)}" class="btn btn--ghost" data-p21-nav="${tutorHubPath(tutor.id)}">운영홈</a>`,
      )}
    </form>`;

  return `<section class="mypage-panel p19-panel p19-panel--form">${renderTutorShell(tutor, 'basic', formBody)}</section>`;
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
          <label class="p19-field">
            <span class="p19-field__label">월 과외비 <em class="p19-required">필수</em></span>
            <input class="p19-input" type="number" name="preferred_fee_amount" value="${esc(tutor.preferred_fee_amount || '')}" required min="1" />
          </label>
          <label class="p19-field">
            <span class="p19-field__label">산정방식</span>
            <select class="p19-input" name="fee_basis_type">
              ${FEE_BASIS_OPTS.map((o) => `<option value="${o.value}" ${feeBasis === o.value ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
            </select>
          </label>
          <label class="p19-field">
            <span class="p19-field__label">주 횟수</span>
            <input class="p19-input" name="lessons_per_week" value="${esc(tutor.lessons_per_week || '')}" />
          </label>
          <label class="p19-field">
            <span class="p19-field__label">1회(분)</span>
            <input class="p19-input" name="minutes_per_lesson" value="${esc(tutor.minutes_per_lesson || '')}" />
          </label>
          <label class="p19-field">
            <span class="p19-field__label">지도 대상 성별</span>
            <select class="p19-input" name="student_gender_group">
              ${GENDER_GROUP_OPTS.map((o) => `<option value="${o.value}" ${gender === o.value ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
            </select>
          </label>
          <label class="p19-field">
            <span class="p19-field__label">수업인원</span>
            <select class="p19-input" name="student_count_group">
              ${STUDENT_COUNT_OPTS.map((o) => `<option value="${o.value}" ${count === o.value ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
            </select>
          </label>
          <label class="p19-field p19-field--full">
            <span class="p19-field__label">강의장소 <em class="p19-required">필수</em></span>
            <div class="p19-chip-group">${placeChecks}</div>
          </label>
          <label class="p19-field p19-field--full">
            <span class="p19-field__label">가격 설명</span>
            <textarea class="p19-input p19-textarea" name="fee_description" rows="2">${esc(tutor.fee_description || '')}</textarea>
          </label>
        </div>`,
      )}
      ${renderFormSection(
        '학력 · 소개 · 연락',
        '',
        `
        <div class="p19-field-grid p19-field-grid--2">
          ${renderUniversityNameField({
            variant: 'p19',
            name: 'university_name',
            value: tutor.university_name || '',
            id: `p21_univ_${tutor.id || 'new'}`,
            label: '출신대학',
          })}
          <label class="p19-field">
            <span class="p19-field__label">전공</span>
            <input class="p19-input" name="major_name" value="${esc(tutor.major_name || '')}" placeholder="학과명 (서술형)" />
          </label>
          <label class="p19-field">
            <span class="p19-field__label">학적상태</span>
            <input class="p19-input" name="university_status" value="${esc(tutor.university_status || '')}" placeholder="재학/휴학/졸업 등" />
          </label>
          <label class="p19-field">
            <span class="p19-field__label">특징 1</span>
            <input class="p19-input" name="feature_1" value="${esc(tutor.feature_1 || '')}" />
          </label>
          <label class="p19-field p19-field--full">
            <span class="p19-field__label">짧은 소개</span>
            <textarea class="p19-input p19-textarea" name="intro_short" rows="2">${esc(tutor.intro_short || '')}</textarea>
          </label>
          <label class="p19-field p19-field--full">
            <span class="p19-field__label">상세 소개</span>
            <textarea class="p19-input p19-textarea" name="intro_long" rows="4">${esc(tutor.intro_long || '')}</textarea>
          </label>
          <label class="p19-field">
            <span class="p19-field__label">연락 가능 시간</span>
            <input class="p19-input" name="contact_time_note" value="${esc(tutor.contact_time_note || '')}" />
          </label>
        </div>`,
      )}
      ${renderFormFooter(
        '저장 후 운영홈·미리보기에서 공개 상태를 확인하세요.',
        `<button type="submit" class="btn btn--primary">상세정보 저장</button>
         <a href="#${tutorSectionPath(tutor.id, 'publish')}" class="btn btn--secondary" data-p21-nav="${tutorSectionPath(tutor.id, 'publish')}">미리보기·공개</a>
         <a href="#${tutorHubPath(tutor.id)}" class="btn btn--ghost" data-p21-nav="${tutorHubPath(tutor.id)}">운영홈</a>`,
      )}
    </form>`;

  return `<section class="mypage-panel p19-panel p19-panel--form">${renderTutorShell(tutor, 'detail', formBody)}</section>`;
}

function renderBasicBridge(tutor) {
  return renderBasicForm(tutor);
}

function renderDetailBridge(tutor) {
  return renderDetailForm(tutor);
}

/** @param {import('./store.js').TutorRecord} tutor */
function renderPublishPreviewModes(tutor) {
  const row = tutorToExposureRow(tutor);
  const modes = [
    {
      key: 'basic',
      label: '기본 노출 목록',
      html: renderBrowseList('tutor', [row], { guest: false, showCompare: false }),
    },
    {
      key: 'pick',
      label: '추천 노출 카드',
      html: `<div class="expo-grid--5">${renderExposureBox('tutor', 'pick', row, '추천 노출 미리보기', { guest: false })}</div>`,
    },
    {
      key: 'detail',
      label: '상세페이지',
      html: `<div class="expo-grid--5">${renderExposureBox('tutor', 'prime', row, '상세 미리보기', { guest: false })}</div>`,
    },
    {
      key: 'compare',
      label: '비교검색 행',
      html: renderBrowseList('tutor', [row], { guest: false, showCompare: true }),
    },
  ];

  const tabs = modes
    .map(
      (m, i) =>
        `<button type="button" class="p21-preview-tab${i === 0 ? ' is-active' : ''}" data-p21-preview-tab="${m.key}">${esc(m.label)}</button>`,
    )
    .join('');

  const panels = modes
    .map(
      (m, i) =>
        `<div class="p21-preview-panel${i === 0 ? ' is-active' : ''}" data-p21-preview-panel="${m.key}">
        <p class="p19-search-preview__label">${esc(m.label)} (11·13장)</p>
        <div class="p19-search-preview__frame">${m.html}</div>
      </div>`,
    )
    .join('');

  return `<div class="p21-preview-modes" data-p21-preview-wrap><div class="p21-preview-tabs" role="tablist">${tabs}</div>${panels}</div>`;
}

/** @param {import('./store.js').TutorRecord} tutor */
function renderPublish(tutor) {
  const r = getPublishReadiness(tutor);
  const preview = renderPublishPreviewModes(tutor);

  const checklist = r.missing.length
    ? r.missing
        .map(
          (m) => `<li class="p19-checklist__item p19-checklist__miss">
        <span class="p19-checklist__icon">△</span><span>${esc(m)}</span>
        <a href="#${tutorSectionPath(tutor.id, m.includes('상세') ? 'detail' : 'basic')}" data-p21-nav="${tutorSectionPath(tutor.id, m.includes('상세') ? 'detail' : 'basic')}">확인 →</a>
      </li>`,
        )
        .join('')
    : '<li class="p19-checklist__item p19-checklist__ok"><span class="p19-checklist__icon">✓</span><span>필수 항목이 모두 충족되었습니다.</span></li>';

  const body = `
    <div class="p19-publish-body" data-p21-tutor-id="${tutor.id}">
      ${preview}
      <div class="p19-checklist-card">
        <h3 class="p19-checklist-card__title">공개 필수 체크리스트</h3>
        <ul class="p19-checklist">${checklist}</ul>
      </div>
      <div class="p20-confirm-card" data-p21-tutor-id="${tutor.id}">
        <h3 class="p20-confirm-card__title">자기확인 — 학부모에게 이렇게 보입니다</h3>
        <label class="p20-confirm-check"><input type="checkbox" data-p21-confirm="region" /> 활동 지역·과목·대상 학생군 노출을 확인했습니다</label>
        <label class="p20-confirm-check"><input type="checkbox" data-p21-confirm="fee" /> 과외비·수업 방식 표시를 확인했습니다</label>
        <label class="p20-confirm-check"><input type="checkbox" data-p21-confirm="trust" /> 소개문·신뢰정보(공개 선택 범위) 노출을 확인했습니다</label>
        <label class="p20-confirm-check"><input type="checkbox" data-p21-confirm="direct" /> 외부 연락처 직접 노출 없음 · ${LIFECYCLE_PUBLISH_CONFIRM_DIRECT}</label>
      </div>
      <div class="p19-form-actions p19-form-actions--publish">
        <button type="button" class="btn btn--primary btn--lg" data-p21-publish ${r.canPublish ? '' : 'disabled'}>공개하기 (published)</button>
        ${
          tutor.profile_status === 'hidden'
            ? '<button type="button" class="btn btn--secondary" data-p21-publish>다시 공개</button>'
            : ''
        }
      </div>
      <p class="p19-publish-footnote">${LIFECYCLE_PUBLISH_CONFIRM_NOTE}</p>
    </div>`;

  return `<section class="mypage-panel p19-panel p19-panel--publish">${renderTutorShell(tutor, 'publish', body)}</section>`;
}

/** @param {import('./store.js').TutorRecord} tutor */
function resolveAccessNextAction(tutor) {
  const published = tutor.profile_status === 'published';
  const paid = isPaidProvider();
  const memos = getMemoCreditsRemaining();
  const publishHref = `#${tutorSectionPath(tutor.id, 'publish')}`;
  const reviewHref = '#/mypage/student-review';
  const plansHref = '#/mypage/plans';

  if (!published) {
    return {
      status: '쪽지 준비 필요',
      reason: '프로필 공개 후 쪽지를 보낼 수 있어요',
      label: '공개하기',
      href: publishHref,
      navAttr: ` data-p21-nav="${tutorSectionPath(tutor.id, 'publish')}"`,
    };
  }
  if (!paid || memos <= 0) {
    return {
      status: '쪽지 준비 필요',
      reason: !paid ? '유료 이용과 메모권이 필요해요' : '메모권이 부족해요. 이용권을 확인해 주세요',
      label: P21_ACCESS_CTA.plans,
      href: plansHref,
      navAttr: ' data-mypage-nav="/mypage/plans"',
    };
  }
  return {
    status: '쪽지 가능',
    reason: '검토 중인 학생에게 쪽지를 보낼 수 있어요',
    label: '쪽지 보내기',
    href: reviewHref,
    navAttr: ' data-mypage-nav="/mypage/student-review"',
  };
}

/** @param {import('./store.js').TutorRecord} tutor */
function renderAccess(tutor) {
  const accessMatrix = getAccessMatrix(tutor);
  const unlockCards = getUnlockCards(tutor);
  const paid = isPaidProvider();
  const memos = getMemoCreditsRemaining();
  const published = tutor.profile_status === 'published';
  const next = resolveAccessNextAction(tutor);

  const rulesDetails = `
    <details class="p21-access-rules">
      <summary>이용권·접근 규칙 자세히</summary>
      ${renderProviderSubToggle()}
      <section class="p20-exposure-section">
        <h3>현재 이용 가능한 범위</h3>
        <div class="p20-matrix">${renderMatrixRows(accessMatrix)}</div>
      </section>
      ${
        unlockCards.length
          ? `<section class="p20-exposure-section"><h3>잠금 해제</h3><div class="p21-unlock-grid">${unlockCards.map((c) => renderUnlockCard(c, tutor.id)).join('')}</div></section>`
          : ''
      }
      <p class="p19-form-section__lead">
        <a href="#/mypage/plans" data-mypage-nav="/mypage/plans">${esc(P21_ACCESS_CTA.plans)}</a>
        · <a href="#/mypage/submission-docs" data-mypage-nav="/mypage/submission-docs">${esc(P21_ACCESS_CTA.submissionDocs)}</a>
        · 학부모가 먼저 보낸 쪽지의 답장은 무료 · 학생에게 먼저 보내는 쪽지는 유료
      </p>
    </details>`;

  const body = `
    <div class="p21-access-body" data-p21-tutor-id="${tutor.id}">
      <section class="p20-exposure-section">
        <h3>쪽지 현황</h3>
        <p class="p19-form-section__lead"><strong>${esc(next.status)}</strong> · ${esc(next.reason)}</p>
        <div class="p19-summary-grid">
          <dl class="p19-summary-card"><dt>공개</dt><dd>${published ? '공개중' : '미공개'}</dd></dl>
          <dl class="p19-summary-card"><dt>남은 메모권</dt><dd>${memos}회</dd></dl>
          <dl class="p19-summary-card"><dt>유료 이용</dt><dd>${paid ? '이용 중' : '이용 안 함'}</dd></dl>
        </div>
        <div class="p19-form-actions" style="margin-top:var(--space-3)">
          <a href="${next.href}" class="btn btn--primary"${next.navAttr}>${esc(next.label)}</a>
        </div>
      </section>
      ${rulesDetails}
    </div>`;

  return `<section class="mypage-panel p19-panel p19-panel--form">${renderTutorShell(tutor, 'access', body)}</section>`;
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
        <p class="p19-form-section__lead">대표·추천 노출은 기간형 상품 · 쪽지권/열람권은 횟수형 상품</p>
        <div class="p19-form-actions">
          <button type="button" class="btn btn--secondary" ${pickRow?.ok ? '' : 'disabled'}>${esc(pickRow?.statusText || '추천 노출')}</button>
          <button type="button" class="btn btn--secondary" ${primeRow?.ok ? '' : 'disabled'}>${esc(primeRow?.statusText || '대표 노출')}</button>
          <a href="#/plans/positions?provider_type=tutor&provider_id=${tutor.id}" class="btn btn--primary" data-nav="/plans/positions?provider_type=tutor&provider_id=${tutor.id}">유료상품 · 노출</a>
        </div>
      </section>
      <div class="p19-danger-zone" data-p21-tutor-id="${tutor.id}">
        <h3 class="p19-danger-zone__title">공개 중단·삭제</h3>
        <p class="p19-danger-zone__lead">숨김은 검색 미노출 · 삭제는 복구 불가(soft delete)</p>
        <div class="p19-danger-zone__actions">
          <button type="button" class="btn btn--secondary btn--sm" data-p21-hide ${tutor.profile_status === 'hidden' ? 'disabled' : ''}>숨김</button>
          <button type="button" class="btn btn--ghost btn--sm p19-btn-danger" data-p21-delete>삭제</button>
        </div>
      </div>
    </div>`;

  return `<section class="mypage-panel p19-panel p19-panel--form">${renderTutorShell(tutor, 'exposure', body)}</section>`;
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindTutorRegEvents(root, rerender) {
  root.querySelectorAll('[data-p21-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.getAttribute('data-p21-nav') || '/mypage/registrations/tutors';
    });
  });

  root.querySelectorAll('[data-p21-form]').forEach((form) => {
    if (form.getAttribute('data-p21-form') === 'basic') {
      bindTutorRegionSlotEvents(form, getCityUnits([]));
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
          const units = getCityUnits([]);
          const slots = collectTutorRegionSlots(form);
          const primary = slots.find((s) => s.is_primary && s.region_id) || slots.find((s) => s.region_id);
          if (!primary?.region_id) {
            throw new Error('과외지역을 1곳 이상 선택해 주세요. (도는 시까지 선택)');
          }
          await saveTutorBasicInline(id, {
            tutor_display_name: String(fd.get('tutor_display_name') || ''),
            main_subject_note: String(fd.get('main_subject_note') || ''),
            primary_region_label: displayLabelForRegionId(primary.region_id, units),
            primary_region_id: primary.region_id,
            saved_regions: slots,
          });
        } else if (kind === 'detail') {
          const current = getTutor(id) || {};
          await saveTutorDetailInline(id, {
            main_subject_note: String(current.main_subject_note || ''),
            preferred_fee_amount: Number(fd.get('preferred_fee_amount') || 0),
            fee_basis_type: String(fd.get('fee_basis_type') || ''),
            lessons_per_week: String(fd.get('lessons_per_week') || ''),
            minutes_per_lesson: String(fd.get('minutes_per_lesson') || ''),
            fee_description: String(fd.get('fee_description') || ''),
            student_gender_group: String(fd.get('student_gender_group') || ''),
            student_count_group: String(fd.get('student_count_group') || ''),
            lesson_places: fd.getAll('lesson_places').map(String),
            university_name: String(fd.get('university_name') || '').trim(),
            major_name: String(fd.get('major_name') || '').trim(),
            university_status: String(fd.get('university_status') || ''),
            feature_1: String(fd.get('feature_1') || ''),
            intro_short: String(fd.get('intro_short') || ''),
            intro_long: String(fd.get('intro_long') || ''),
            contact_time_note: String(fd.get('contact_time_note') || ''),
          });
        }
        rerender();
      } catch (err) {
        alert(err instanceof Error ? err.message : '저장에 실패했습니다.');
      } finally {
        if (btn) btn.disabled = false;
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

  root.querySelectorAll('[data-p21-publish]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const wrap = btn.closest('[data-p21-tutor-id]') || btn.closest('.p19-publish-body');
      const id = Number(wrap?.dataset.p21TutorId || root.querySelector('[data-p21-tutor-id]')?.dataset.p21TutorId);
      const confirms = root.querySelectorAll('[data-p21-confirm]');
      const allChecked = [...confirms].every((c) => /** @type {HTMLInputElement} */ (c).checked);
      if (!allChecked) {
        alert('자기확인 항목을 모두 체크해 주세요.');
        return;
      }
      try {
        const result = await publishTutor(id);
        if (!result.ok) {
          alert(`공개 불가:\n${result.missing?.join('\n') || result.reason}`);
          return;
        }
        alert('공개되었습니다. (profile_status: published)');
        rerender();
      } catch (err) {
        console.warn('[p21]', err);
        if (err?.code === 'email_verify_required') {
          showEmailVerifyOverlay();
          return;
        }
        alert('공개 처리에 실패했습니다.');
      }
    });
  });

  root.querySelectorAll('[data-p21-hide]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.closest('[data-p21-tutor-id]')?.dataset.p21TutorId);
      if (!confirm('과외 프로필을 숨김 처리하시겠습니까?')) return;
      try {
        await hideTutor(id);
        rerender();
      } catch (err) {
        console.warn('[p21]', err);
        alert('숨김 처리에 실패했습니다.');
      }
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
