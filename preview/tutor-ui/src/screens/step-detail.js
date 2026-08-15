/**
 * 마이페이지 「상세정보」수정용 — 수업+학력+연락을 한 페이지에서 편집
 */
import {
  registerState,
  SCHOOL_LEVELS,
  GRADE_BAND_OPTIONS,
  FEE_BASIS_OPTIONS,
  TUTOR_PLACE_OPTIONS,
  GENDER_GROUP_OPTIONS,
  STUDENT_COUNT_OPTIONS,
  AGE_BAND_OPTIONS,
  UNIVERSITY_STATUS_OPTIONS,
  CAREER_YEAR_BAND_OPTIONS,
  TEACHING_STYLE_OPTIONS,
  emptySubject,
} from '../state.js';
import { syncLessonFromForm, syncCareerFromForm, syncContactFromForm, validateLessonState, validateCareerState, validateIntroState } from '../form-collect.js';
import { saveAndNavigate, withSaving } from '../save-flow.js';
import {
  renderRegisterShell,
  renderSectionTitle,
  renderGuideNotice,
  bindGlobalEvents,
  getHashQuery,
} from '../layout.js';
import { validatePromoUrls } from '../../../shared/promo-links.js';
import { HOME_UI_BASE } from '../../../shared/preview-links.js';
import { renderUniversityNameField } from '../../../shared/korean-universities.js';

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

function subjectRow(sub, idx) {
  const levels = SCHOOL_LEVELS.map(
    (l) => `<option value="${l.value}" ${sub.school_level === l.value ? 'selected' : ''}>${l.label}</option>`,
  ).join('');
  const grades = [
    `<option value="">학년대</option>`,
    ...GRADE_BAND_OPTIONS.map(
      (g) => `<option value="${g.value}" ${sub.grade_band === g.value ? 'selected' : ''}>${g.label}</option>`,
    ),
  ].join('');
  return `
    <div class="register-subject-row" data-subject-idx="${idx}">
      <select class="form-input" data-field="school_level">${levels}</select>
      <select class="form-input" data-field="grade_band">${grades}</select>
      <input class="form-input" data-field="subject_name" value="${sub.subject_name}" placeholder="예: 미적분2, 확률과 통계" />
      <label class="form-check"><input type="checkbox" data-field="is_primary" ${sub.is_primary ? 'checked' : ''} /> 주력</label>
    </div>`;
}

function returnToMypage() {
  const raw = getHashQuery().get('return_to');
  if (raw) {
    window.location.assign(decodeURIComponent(raw));
    return;
  }
  window.location.assign(`${HOME_UI_BASE}/#/mypage/registrations`);
}

export function renderDetail() {
  const s = registerState;
  const places = TUTOR_PLACE_OPTIONS.map(
    (p) => `
    <label class="form-check">
      <input type="checkbox" name="lesson_places" value="${p.value}" ${s.lesson_places.includes(p.value) ? 'checked' : ''} />
      <span class="form-check__label">${p.label}</span>
    </label>`,
  ).join('');
  const feeBasis = FEE_BASIS_OPTIONS.map(
    (o) => `
    <label class="form-radio">
      <input type="radio" name="fee_basis_type" value="${o.value}" ${s.fee_basis_type === o.value ? 'checked' : ''} />
      <span class="form-radio__label">${o.label}</span>
    </label>`,
  ).join('');
  const badges = TEACHING_STYLE_OPTIONS.map(
    (b) => `
    <label class="form-check">
      <input type="checkbox" name="teaching_style_badges" value="${b.id}" ${s.teaching_style_badges.includes(b.id) ? 'checked' : ''} />
      <span class="form-check__label">${b.label}</span>
    </label>`,
  ).join('');

  const content = `
    ${renderGuideNotice('상세정보 전체를 한 화면에서 수정합니다. 저장하면 마이페이지로 돌아갑니다.')}
    <form data-form="detail-all">
      ${renderSectionTitle('수업 · 과목 · 가격')}
      ${s.main_subject_note ? `<p class="form-hint">주력과목(기본등록): <strong>${s.main_subject_note}</strong></p>` : ''}
      <div class="register-grid-2">
        <div class="form-group">
          <span class="form-label form-label--required">지도 대상 성별</span>
          <div class="form-radio-group">${radios('student_gender_group', GENDER_GROUP_OPTIONS, s.student_gender_group)}</div>
        </div>
        <div class="form-group">
          <span class="form-label form-label--required">수업인원</span>
          <div class="form-radio-group">${radios('student_count_group', STUDENT_COUNT_OPTIONS, s.student_count_group)}</div>
        </div>
      </div>
      <div class="form-group">
        <span class="form-label">과외쌤 연령대</span>
        <div class="form-radio-group">${radios('age_band', AGE_BAND_OPTIONS, s.age_band)}</div>
      </div>
      <div data-subjects-list>${s.subjects.map(subjectRow).join('')}</div>
      <button type="button" class="btn btn--secondary btn--sm" data-action="add-subject">+ 과목 추가</button>
      <div class="register-grid-2" style="margin-top:var(--space-4);">
        <div class="form-group">
          <label class="form-label form-label--required" for="preferred_fee_amount">월 대표 과외비</label>
          <input class="form-input" type="number" id="preferred_fee_amount" name="preferred_fee_amount" value="${s.preferred_fee_amount}" min="1" />
        </div>
        <div class="form-group">
          <span class="form-label form-label--required">산정방식</span>
          <div class="form-radio-group">${feeBasis}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">주 횟수</label><input class="form-input" name="lessons_per_week" value="${s.lessons_per_week}" /></div>
        <div class="form-group"><label class="form-label">월 총 횟수</label><input class="form-input" name="monthly_session_count" value="${s.monthly_session_count}" /></div>
        <div class="form-group"><label class="form-label">1회(분)</label><input class="form-input" name="minutes_per_lesson" value="${s.minutes_per_lesson}" /></div>
      </div>
      <div class="form-group">
        <label class="form-label" for="fee_description">가격 설명</label>
        <textarea class="form-input form-textarea" name="fee_description" rows="2">${s.fee_description}</textarea>
      </div>
      <div class="form-group">
        <span class="form-label form-label--required">강의장소</span>
        <div class="register-check-grid">${places}</div>
      </div>

      <div class="register-form-narrow">
        ${renderSectionTitle('학력 · 경력 · 특징')}
        <div class="register-grid-2 register-grid-2--tight">
          ${renderUniversityNameField({
            variant: 'form',
            name: 'university_name',
            value: s.university_name,
            id: 'tutor_univ_detail',
          })}
          <div class="form-group"><label class="form-label">전공</label><input class="form-input" name="major_name" value="${s.major_name}" placeholder="학과명 (서술형)" /></div>
        </div>
        <div class="form-group">
          <span class="form-label">학적상태</span>
          <div class="form-radio-group">${radios('university_status', UNIVERSITY_STATUS_OPTIONS, s.university_status)}</div>
        </div>
        <div class="form-group">
          <span class="form-label">경력구간</span>
          <div class="form-radio-group">${radios('career_year_band', CAREER_YEAR_BAND_OPTIONS, s.career_year_band)}</div>
        </div>
        <div class="form-group"><label class="form-label">주교재</label><input class="form-input" name="main_material_note" value="${s.main_material_note}" /></div>
        <div class="register-grid-2 register-grid-2--tight">
          <div class="form-group"><label class="form-label">특징 1</label><input class="form-input" name="feature_1" value="${s.feature_1}" /></div>
          <div class="form-group"><label class="form-label">특징 2</label><input class="form-input" name="feature_2" value="${s.feature_2}" /></div>
        </div>
        <div class="form-group">
          <label class="form-check">
            <input type="checkbox" name="proof_document_available" ${s.proof_document_available ? 'checked' : ''} />
            <span class="form-check__label">증빙서류 제출 가능</span>
          </label>
        </div>
        <div class="form-group">
          <span class="form-label">강의스타일</span>
          <div class="register-check-grid">${badges}</div>
        </div>

        ${renderSectionTitle('연락 · 공개')}
        <div class="register-grid-2 register-grid-2--tight">
          <div class="form-group">
            <label class="form-label" for="contact_time_note">연락 가능 시간</label>
            <input class="form-input" id="contact_time_note" name="contact_time_note" value="${s.contact_time_note}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="profile_status">공개 상태</label>
            <select class="form-input" id="profile_status" name="profile_status">
              <option value="draft" ${s.profile_status === 'draft' || s.profile_status === 'pending' ? 'selected' : ''}>저장만 (아직 비공개)</option>
              <option value="published" ${s.profile_status === 'published' ? 'selected' : ''}>공개</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="youtube_url">유튜브</label>
            <input class="form-input" type="url" id="youtube_url" name="youtube_url" value="${s.youtube_url}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="facebook_url">페이스북</label>
            <input class="form-input" type="url" id="facebook_url" name="facebook_url" value="${s.facebook_url}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="instagram_url">인스타그램</label>
            <input class="form-input" type="url" id="instagram_url" name="instagram_url" value="${s.instagram_url}" />
          </div>
        </div>
      </div>

      <div class="register-nav">
        <button type="button" class="btn btn--secondary" data-action="back-mypage">돌아가기</button>
        <button type="button" class="btn btn--primary" data-action="save-detail">수정 저장</button>
      </div>
    </form>`;
  return renderRegisterShell(content, {
    stepKey: 'contact',
    title: '상세정보 수정',
    subtitle: '수업·학력·연락을 한 페이지에서 수정합니다.',
  });
}

export function bindDetailEvents(root) {
  bindGlobalEvents(root);
  root.querySelector('[data-action="back-mypage"]')?.addEventListener('click', () => returnToMypage());
  root.querySelector('[data-action="add-subject"]')?.addEventListener('click', () => {
    registerState.subjects.push(emptySubject());
    window.dispatchEvent(new Event('hashchange'));
  });
  root.querySelector('[data-action="save-detail"]')?.addEventListener('click', () => {
    const btn = root.querySelector('[data-action="save-detail"]');
    withSaving(btn, async () => {
      const form = root.querySelector('[data-form="detail-all"]');
      syncLessonFromForm(form, registerState);
      syncCareerFromForm(form, registerState);
      syncContactFromForm(form, registerState);
      const lessonErr = validateLessonState(registerState);
      if (lessonErr) {
        alert(lessonErr);
        return;
      }
      const careerErr = validateCareerState(registerState);
      if (careerErr) {
        alert(careerErr);
        return;
      }
      const introErr = validateIntroState(registerState);
      if (introErr) {
        alert(introErr);
        return;
      }
      const urlErr = validatePromoUrls(registerState);
      if (urlErr) {
        alert(urlErr);
        return;
      }
      await saveAndNavigate(registerState, 'lesson', null);
      await saveAndNavigate(registerState, 'career', null);
      await saveAndNavigate(registerState, 'contact', null);
      alert('상세정보가 저장되었습니다.');
      returnToMypage();
    });
  });
}
