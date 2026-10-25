/**
 * 마이페이지 내 등록 — 과외쌤 상세등록(tutor-ui) 수업·학력 폼을 그대로 사용.
 * 다른 화면으로 보내지 않는다. 저장은 register.php action save (lesson / career / contact).
 */

import { registerState, apiMasters, isTutorBasicComplete } from '@tutor-ui/state.js';
import { fetchMasters, loadTutor } from '@tutor-ui/register-api.js';
import { s114Alert } from '../../../shared/confirm-dialog.js';
import {
  applyTutorToState,
  syncLessonFromForm,
  syncCareerFromForm,
  syncContactFromForm,
  validateLessonState,
} from '@tutor-ui/form-collect.js';
import { saveAndNavigate, withSaving } from '@tutor-ui/save-flow.js';
import { validatePromoUrls } from '../../../shared/promo-links.js';
import { renderLessonFormHtml, bindLessonEvents } from '@tutor-ui/screens/step-lesson.js';
import { renderContactFormHtml, bindContactEvents } from '@tutor-ui/screens/step-contact.js';
import { hydrateRegistrationsCache, isRegistrationsApiMode } from '../registrations-backend.js';
import { isReturnToRegistrationCheck, tutorSectionPath, tutorHubPath, tutorBlankPath } from './router.js';
import { TRC_COPY } from './registration-check-copy.js';
import { renderTutorProfilePhotoEditor, bindTutorProfilePhotos } from './profile-photos.js';

/** @type {Promise<void>|null} */
let loadPromise = null;
/** @type {number|null} */
let loadedTutorId = null;
let lastViewKey = '';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

export function isEmbeddedTutorReady(tutorId) {
  return loadedTutorId === tutorId && Number(registerState.tutor_id) === tutorId;
}

function shouldReloadEmbeddedTutor(tutorId) {
  const key = `${tutorId}:detail`;
  if (lastViewKey !== key) return true;
  return !isEmbeddedTutorReady(tutorId);
}

function markEmbeddedTutorLoaded(tutorId) {
  lastViewKey = `${tutorId}:detail`;
}

function renderReturnBanner(tutorId) {
  if (!isReturnToRegistrationCheck()) return '';
  const href = tutorSectionPath(tutorId, 'publish');
  return `<div class="rc-return-banner">
    <a class="rc-return-banner__link" href="#${esc(href)}" data-p21-nav="${esc(href)}">${esc(TRC_COPY.returnBanner.label)}</a>
    <p class="rc-return-banner__hint">${esc(TRC_COPY.returnBanner.hint)}</p>
  </div>`;
}

function ensureStateArrays() {
  if (!Array.isArray(registerState.subjects)) registerState.subjects = [];
  if (!Array.isArray(registerState.lesson_places)) registerState.lesson_places = [];
  if (!Array.isArray(registerState.teaching_style_badges)) registerState.teaching_style_badges = [];
}

/**
 * @param {number} tutorId
 * @param {{ force?: boolean }} [opts]
 */
export async function ensureEmbeddedTutor(tutorId, opts = {}) {
  if (!opts.force && isEmbeddedTutorReady(tutorId)) return registerState;
  if (loadPromise && !opts.force) return loadPromise.then(() => registerState);

  loadPromise = (async () => {
    try {
      const masters = await fetchMasters();
      apiMasters.regions = masters?.regions ?? [];
      apiMasters.tutorUnits = masters?.tutor_units ?? [];
    } catch {
      /* masters 실패해도 저장된 상세는 불러온다 */
    }
    try {
      const tutor = await loadTutor();
      if (tutor) {
        applyTutorToState(registerState, tutor);
        registerState.tutor_id = tutor.tutor_id || tutorId;
        registerState.basicComplete = isTutorBasicComplete({
          ...tutor,
          tutor_id: registerState.tutor_id,
        });
      }
    } catch {
      /* 네트워크 실패 시 이미 있던 registerState 를 유지 */
    }
    if (!registerState.tutor_id) registerState.tutor_id = tutorId;
    ensureStateArrays();
    loadedTutorId = tutorId;
    sessionStorage.setItem('study114_tutor_id', String(registerState.tutor_id));
  })().finally(() => {
    loadPromise = null;
  });

  await loadPromise;
  return registerState;
}

function detailFormsHtml(tutor, section) {
  const publish = tutorSectionPath(tutor.id, 'publish');
  const hub = tutorHubPath(tutor.id);
  const detail2 = section === 'detail2';
  const form = detail2
    ? `${renderContactFormHtml({ includeStepNav: false, includeFooterActions: false, embed: true })}
      <div class="p19-field p19-field--full" data-trc-field="profile_image">
        <span class="p19-field__label">프로필 사진</span>
        ${renderTutorProfilePhotoEditor(tutor)}
      </div>`
    : renderLessonFormHtml({ includeStepNav: false, includeFooterActions: false, embed: true });
  return `
    ${renderReturnBanner(tutor.id)}
    <div class="mp-room-embed register-flow" data-embed-section="${detail2 ? 'detail2' : 'detail'}" data-embed-tutor-id="${tutor.id || 0}">
      ${form}
      <div class="register-embed-actions">
        <button type="button" class="btn btn--secondary" data-action="cancel-detail">취소</button>
        <button type="button" class="btn btn--secondary" data-action="save-detail">저장</button>
      </div>
      <div class="register-embed-actions">
        <a class="btn btn--secondary" href="#${esc(publish)}" data-p21-nav="${esc(publish)}">등록점검</a>
        <a class="btn btn--secondary" href="#${esc(hub)}" data-p21-nav="${esc(hub)}">마이프로필</a>
      </div>
    </div>`;
}

function blankDetailHtml() {
  const basic = tutorBlankPath('basic');
  return `
    <div class="mypage-empty">
      <h2 class="p19-list-head__title">과외 프로필이 없습니다</h2>
      <p class="p19-list-head__lead">계정당 과외 프로필은 1개입니다. 기본등록을 마치면 여기에서 운영할 수 있습니다.</p>
      <div class="register-embed-actions">
        <a class="btn btn--secondary" href="#${esc(basic)}" data-p21-nav="${esc(basic)}">기본정보로</a>
      </div>
    </div>`;
}

/** @param {import('./store.js').TutorRecord} tutor @param {'detail'|'detail2'} [section] */
export function renderEmbeddedTutorDetail(tutor, section = 'detail') {
  const tutorId = Number(tutor?.id) || 0;
  if (!tutorId) return blankDetailHtml();

  if (shouldReloadEmbeddedTutor(tutorId)) {
    queueMicrotask(() => {
      ensureEmbeddedTutor(tutorId, { force: true })
        .then(() => {
          markEmbeddedTutorLoaded(tutorId);
          window.dispatchEvent(new Event('hashchange'));
        })
        .catch(() => {
          markEmbeddedTutorLoaded(tutorId);
          window.dispatchEvent(new Event('hashchange'));
        });
    });
    return `
      <div class="mp-room-embed is-loading" data-tutor-embed-pending="${tutorId}">
        <p class="p19-form-section__lead">등록 정보를 불러오는 중…</p>
      </div>`;
  }

  markEmbeddedTutorLoaded(tutorId);
  return detailFormsHtml(tutor, section);
}

/** 탭을 떠나기 전에 입력값을 메모리에 남긴다. 폼에 없는 칸은 비우지 않는다. */
export function syncEmbeddedTutorForms(root) {
  const lesson = root.querySelector('[data-form="lesson"]');
  const contact = root.querySelector('[data-form="contact"]');
  if (lesson) syncLessonFromForm(lesson, registerState);
  if (!contact) return;
  const keepTime = registerState.contact_time_note;
  const keepFeature3 = registerState.feature_3;
  syncCareerFromForm(contact, registerState);
  syncContactFromForm(contact, registerState);
  if (!contact.querySelector('[name="contact_time_note"]')) registerState.contact_time_note = keepTime;
  if (!contact.querySelector('[name="feature_3"]')) registerState.feature_3 = keepFeature3;
}

/**
 * @param {HTMLElement} root
 * @param {() => void} rerender
 */
export function bindEmbeddedTutorDetail(root, rerender) {
  const wrap = root.querySelector('[data-embed-tutor-id]');
  if (!wrap) return;
  const tutorId = Number(wrap.getAttribute('data-embed-tutor-id') || 0);
  if (!tutorId) return;

  bindLessonEvents(wrap, { embed: true, onRefresh: rerender });
  bindContactEvents(wrap, { embed: true, onRefresh: rerender });
  bindTutorProfilePhotos(root, { tutorId, rerender });

  wrap.querySelector('[data-action="cancel-detail"]')?.addEventListener('click', () => {
    ensureEmbeddedTutor(tutorId, { force: true })
      .catch(() => {})
      .finally(() => rerender());
  });

  const saveBtn = wrap.querySelector('[data-action="save-detail"]');
  saveBtn?.addEventListener('click', () => {
    withSaving(saveBtn, async () => {
      const detail2 = wrap.getAttribute('data-embed-section') === 'detail2';
      try {
        if (!detail2) {
          const lesson = wrap.querySelector('[data-form="lesson"]');
          syncLessonFromForm(lesson, registerState);
          const lessonErr = validateLessonState(registerState);
          if (lessonErr) {
            void s114Alert(lessonErr);
            return;
          }
          await saveAndNavigate(registerState, 'lesson', null);
        } else {
          const contact = wrap.querySelector('[data-form="contact"]');
          const keepTime = registerState.contact_time_note;
          const keepFeature3 = registerState.feature_3;
          const keepIntroLong = registerState.intro_long;
          syncCareerFromForm(contact, registerState);
          syncContactFromForm(contact, registerState);
          if (contact && !contact.querySelector('[name="contact_time_note"]')) registerState.contact_time_note = keepTime;
          if (contact && !contact.querySelector('[name="feature_3"]')) registerState.feature_3 = keepFeature3;
          if (contact && !contact.querySelector('[name="intro_long"]')) registerState.intro_long = keepIntroLong;
          const urlErr = validatePromoUrls(registerState);
          if (urlErr) {
            void s114Alert(urlErr);
            return;
          }
          await saveAndNavigate(registerState, 'career', null);
          await saveAndNavigate(registerState, 'contact', null);
        }
      } catch (err) {
        void s114Alert(err instanceof Error ? err.message : '저장에 실패했습니다.');
        return;
      }
      if (isRegistrationsApiMode()) {
        try {
          await hydrateRegistrationsCache();
        } catch {
          /* 저장은 끝났고 목록 캐시만 실패 */
        }
      }
      await s114Alert('저장되었습니다.');
      if (isReturnToRegistrationCheck()) {
        window.location.hash = tutorSectionPath(tutorId, 'publish');
        return;
      }
      rerender();
    });
  });
}
