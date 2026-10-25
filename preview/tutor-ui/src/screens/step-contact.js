import {
  registerState,
  UNIVERSITY_STATUS_OPTIONS,
  CAREER_YEAR_BAND_OPTIONS,
  TEACHING_STYLE_OPTIONS,
} from '../state.js';
import { syncCareerFromForm, syncContactFromForm } from '../form-collect.js';
import { saveAndNavigate, withSaving } from '../save-flow.js';
import { s114Alert } from '../../../shared/confirm-dialog.js';
import {
  renderRegisterShell,
  renderSectionTitle,
  renderNavButtons,
  renderGuideNotice,
  bindGlobalEvents,
  navigate,
  skipDetailRegistration,
  mypageSubmissionBoardUrl,
} from '../layout.js';
import { validatePromoUrls, renderPromoChannelFields, bindPromoChannelAdds } from '../../../shared/promo-links.js';
import { renderUniversityNameField, bindUniversityNameField } from '../../../shared/korean-universities.js';
import { bindInputFill } from '../../../shared/input-fill.js';
import { TUTOR_DETAIL_GROUP_CAREER, TUTOR_DETAIL_GROUP_PROMO } from '../../../shared/tutor-detail-fields.js';
import { STYLE_LIMIT_NOTE, TIER_MARK_NOTE, teachingStylePickAllowed } from '../../../shared/pickprime-requirements.js';

function radios(name, options, selected) {
  return options
    .map(
      (o) => `
    <label class="form-radio">
      <input type="radio" name="${name}" value="${o.value}" ${selected === o.value ? 'checked' : ''} />
      <span class="form-radio__label">${o.label}</span>
    </label>`,
    )
    .join('');
}

/**
 * @param {{ includeStepNav?: boolean, includeFooterActions?: boolean, embed?: boolean }} [opts]
 * includeStepNav 기본값 true — 상세등록 화면과 같은 HTML.
 * embed 일 때만 가입 안내를 숨긴다.
 */
export function renderContactFormHtml(opts = {}) {
  const includeStepNav = opts.includeStepNav !== false;
  const includeFooterActions = opts.includeFooterActions ?? !includeStepNav;
  const embed = opts.embed === true;
  const s = registerState;
  const badges = TEACHING_STYLE_OPTIONS.map(
    (b) => `
    <label class="form-check">
      <input type="checkbox" name="teaching_style_badges" value="${b.id}" ${s.teaching_style_badges.includes(b.id) ? 'checked' : ''} />
      <span class="form-check__label">${b.label}</span>
    </label>`,
  ).join('');

  const content = `
    ${embed ? '' : renderGuideNotice('상세등록 마지막 단계입니다. 학력·경력과 홍보 채널을 확인한 뒤 등록을 마쳐 주세요.')}
    <form data-form="contact" class="register-form-narrow">
      <p class="form-hint">${TIER_MARK_NOTE}</p>
      ${renderSectionTitle(TUTOR_DETAIL_GROUP_CAREER)}
      <div class="register-grid-2 register-grid-2--tight">
        <div data-trc-field="university">
        ${renderUniversityNameField({
          variant: 'form',
          name: 'university_name',
          value: s.university_name,
          id: 'tutor_univ_contact',
          label: '대학/대학원',
        }).replace(
          '<label class="form-label" for="tutor_univ_contact">대학/대학원</label>',
          '<label class="form-label form-label--tier" for="tutor_univ_contact">대학/대학원</label><span class="form-hint">둘 중 하나</span>',
        )}
        </div>
        <div class="form-group" data-trc-field="major_name"><label class="form-label">전공</label><input class="form-input" name="major_name" value="${s.major_name}" placeholder="학과명 (서술형)" /></div>
      </div>
      <div class="form-group" data-trc-field="university_status">
        <span class="form-label">학적상태</span>
        <div class="form-radio-group">${radios('university_status', UNIVERSITY_STATUS_OPTIONS, s.university_status)}</div>
      </div>
      <div class="form-group" data-trc-field="career_year_band">
        <span class="form-label form-label--tier">경력구간</span>
        <span class="form-hint">둘 중 하나</span>
        <div class="form-radio-group">${radios('career_year_band', CAREER_YEAR_BAND_OPTIONS, s.career_year_band)}</div>
      </div>
      <div class="form-group" data-trc-field="main_material_note"><label class="form-label">주교재</label><input class="form-input" name="main_material_note" value="${s.main_material_note}" /></div>
      <div class="register-grid-2 register-grid-2--tight">
        <div class="form-group" data-trc-field="feature_1"><label class="form-label">특징 1</label><input class="form-input" name="feature_1" value="${s.feature_1}" /></div>
        <div class="form-group" data-trc-field="feature_2"><label class="form-label form-label--tier">특징 2</label><input class="form-input" name="feature_2" value="${s.feature_2}" /></div>
      </div>
      <div class="form-group" data-trc-field="feature_3"><label class="form-label form-label--tier">특징 3</label><input class="form-input" name="feature_3" value="${s.feature_3 || ''}" /></div>
      <div class="form-group" data-trc-field="proof_document_available">
        <label class="form-check">
          <input type="checkbox" name="proof_document_available" ${s.proof_document_available ? 'checked' : ''} />
          <span class="form-check__label">증빙서류 제출 가능</span>
        </label>
        <p class="form-hint">파일은 마이페이지 제출함에서 올립니다. 픽·프라임 카드의 「제출자료 n개」가 여기서 나옵니다.</p>
        <a class="register-mypage-link" href="${mypageSubmissionBoardUrl()}">제출함 열기</a>
      </div>
      <div class="form-group" data-trc-field="teaching_style_badges">
        <span class="form-label form-label--tier">강의스타일</span>
        <p class="form-hint">최대 4개</p>
        <div class="register-check-grid">${badges}</div>
        <p class="form-hint" data-style-limit hidden>${STYLE_LIMIT_NOTE}</p>
      </div>

      <div class="form-group" data-trc-field="intro_long">
        <label class="form-label form-label--tier" for="intro_long">상세 소개</label>
        <textarea class="form-input form-textarea" id="intro_long" name="intro_long" rows="4">${s.intro_long || ''}</textarea>
      </div>
      <div class="form-group" data-trc-field="contact_time_note">
        <label class="form-label" for="contact_time_note">연락 가능 시간</label>
        <input class="form-input" id="contact_time_note" name="contact_time_note" value="${s.contact_time_note || ''}" />
      </div>

      ${renderSectionTitle(TUTOR_DETAIL_GROUP_PROMO)}
      <div data-trc-field="promo_channels">
      ${renderPromoChannelFields(s)}
      </div>
      ${
        includeStepNav
          ? renderNavButtons('/register/lesson', '등록 완료', { skipLabel: '다음에 하기', showSave: true })
          : includeFooterActions
            ? `<div class="register-embed-actions">
              <button type="button" class="btn btn--primary" data-action="save">저장</button>
            </div>`
            : ''
      }
    </form>`;
  return content;
}

export function renderContact() {
  const content = renderContactFormHtml({ includeStepNav: true });
  return renderRegisterShell(content, {
    stepKey: 'contact',
    title: '학력 · 연락',
    subtitle: '상세등록 2/2 · 학력·경력과 홍보 채널을 함께 마무리합니다.',
  });
}

/** 188 재선택. 클릭 비우기·blur 복원은 공유 바인더가 유지한다. */
function bindUniversityNameReselect(root) {
  bindUniversityNameField(root);
}

/** 5번째 선택은 막고, 이미 체크된 5개 이상은 지우지 않는다. */
function bindTeachingStyleLimit(root) {
  const boxes = [...root.querySelectorAll('input[name="teaching_style_badges"]')];
  const hint = root.querySelector('[data-style-limit]');
  boxes.forEach((box) => {
    box.addEventListener('change', () => {
      const checked = boxes.filter((item) => item.checked).length;
      if (box.checked && !teachingStylePickAllowed(checked)) {
        box.checked = false;
        if (hint) hint.hidden = false;
      }
    });
  });
}

/**
 * @param {HTMLElement} root
 * @param {{ embed?: boolean, onSaved?: () => void|Promise<void>, onRefresh?: () => void }} [opts]
 */
export function bindContactEvents(root, opts = {}) {
  if (!opts.embed) bindGlobalEvents(root);
  bindUniversityNameReselect(root);
  const contactForm = () => root.querySelector('[data-form="contact"]');
  bindInputFill(contactForm());
  bindTeachingStyleLimit(root);
  bindPromoChannelAdds(root, registerState, {
    sync: () => syncContactForm(contactForm(), opts.embed),
    refresh: () => {
      if (opts.embed && opts.onRefresh) opts.onRefresh();
      else window.dispatchEvent(new Event('hashchange'));
    },
  });
  root.querySelector('[data-form="contact"] [data-action="prev"]')?.addEventListener('click', () => navigate('/register/lesson'));
  root.querySelector('[data-form="contact"] [data-action="skip-detail"]')?.addEventListener('click', () => skipDetailRegistration());
  const nextBtn = root.querySelector('[data-form="contact"] [data-action="next"]');
  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      const form = contactForm();
      syncCareerFromForm(form, registerState);
      syncContactFromForm(form, registerState);
      const urlErr = validatePromoUrls(registerState);
      if (urlErr) {
        void s114Alert(urlErr);
        return;
      }
      await saveAndNavigate(registerState, 'career', null);
      await saveAndNavigate(registerState, 'contact', '/register/complete');
    });
  });
  const saveBtn = root.querySelector('[data-form="contact"] [data-action="save"]');
  saveBtn?.addEventListener('click', () => {
    withSaving(saveBtn, async () => {
      const form = contactForm();
      syncContactForm(form, true);
      const urlErr = validatePromoUrls(registerState);
      if (urlErr) {
        void s114Alert(urlErr);
        return;
      }
      await saveAndNavigate(registerState, 'career', null);
      await saveAndNavigate(registerState, 'contact', null);
      if (opts.onSaved) await opts.onSaved();
    });
  });
}

/** 임베드만: 폼에 없는 칸은 빈 값으로 덮지 않는다. 상세등록 다음 버튼은 keepHidden=false. */
function syncContactForm(form, keepHidden) {
  const keepTime = registerState.contact_time_note;
  const keepFeature3 = registerState.feature_3;
  const keepIntroLong = registerState.intro_long;
  syncCareerFromForm(form, registerState);
  syncContactFromForm(form, registerState);
  if (!keepHidden || !form) return;
  if (!form.querySelector('[name="contact_time_note"]')) registerState.contact_time_note = keepTime;
  if (!form.querySelector('[name="feature_3"]')) registerState.feature_3 = keepFeature3;
  if (!form.querySelector('[name="intro_long"]')) registerState.intro_long = keepIntroLong;
}
