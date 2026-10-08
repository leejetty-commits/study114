import {
  registerState,
  PERSONAL_GENDER_OPTIONS,
  GENDER_GROUP_OPTIONS,
  STUDENT_COUNT_OPTIONS,
  TUTOR_PLACE_OPTIONS,
  getTutorUnits,
} from '../state.js';
import { syncBasicFromForm } from '../form-collect.js';
import { saveAndNavigate, withSaving, resolveTutorId } from '../save-flow.js';
import { SCHOOL_LEVEL_FORM_OPTIONS } from '../../../shared/school-grade.js';
import { wonToCheonwonInput } from '../../../shared/fee-cheonwon.js';
import { lessonDurationOptions, lessonDurationSelectValue } from '../../../shared/lesson-duration-options.js';
import { lessonWeeklyOptions, lessonWeeklySelectValue } from '../../../shared/lesson-weekly-options.js';
import {
  TUTOR_FEATURE_MAX,
  TUTOR_SLOGAN_MAX,
  tutorBasicMissing,
  tutorBasicMissingMessage,
} from '../../../shared/tutor-basic-fields.js';
import {
  TUTOR_PROFILE_PHOTO_SPEC,
  prepareTutorProfilePhoto,
  uploadTutorProfilePhotoApi,
} from '../../../shared/tutor-profile-photo.js';
import {
  renderRegisterShell,
  renderSectionTitle,
  renderNavButtons,
  renderGuideNotice,
  mypageRegistrationsUrl,
  bindGlobalEvents,
  isRegisterEditMode,
  getHashQuery,
  navigate,
} from '../layout.js';
import { renderMainSubjectSelect } from '../../../shared/main-subjects.js';
import {
  getCityUnits,
  renderTutorRegionSlot,
  bindTutorRegionSlotEvents,
  collectTutorRegionSlots,
  validateTutorActivityRegions,
} from '../../../shared/tutor-region-slots.js';
import { bindInputFill } from '../../../shared/input-fill.js';

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

/** 고른 프로필 사진(아직 안 올림). 행이 있으면 저장 전에, 새 행이면 저장 직후 같은 화면에서 올린다. */
let pendingPhoto = null;

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function renderSelect(options, selected) {
  const current = String(selected ?? '');
  return [
    '<option value="">선택</option>',
    ...options.map(
      (o) => `<option value="${o.value}" ${current === String(o.value) ? 'selected' : ''}>${o.label}</option>`,
    ),
  ].join('');
}

/** load 응답 images(tutor_images) 중 첫 사진의 사이트 경로 */
function savedPhotoPath(state) {
  const images = Array.isArray(state.images) ? state.images : [];
  const path = String(images.find((img) => String(img?.image_path || '').startsWith('/'))?.image_path || '');
  return path;
}

async function uploadPendingPhoto(tutorId) {
  if (!pendingPhoto) return;
  const image = await uploadTutorProfilePhotoApi(tutorId, pendingPhoto.file, pendingPhoto.crop);
  pendingPhoto = null;
  const path = String(image?.image_path || image?.basic_720_path || '');
  registerState.images = [
    ...(Array.isArray(registerState.images) ? registerState.images : []),
    { image_type: 'profile', sort_order: 1, image_path: path, name: path },
  ];
}

function bindBasicPhoto(root) {
  const box = root.querySelector('[data-tutor-basic-photo]');
  const input = box?.querySelector('#tutor_profile_photo');
  if (!box || !input) return;
  input.addEventListener('change', async () => {
    const file = input.files?.[0] || null;
    if (!file) return;
    const status = box.querySelector('[data-tutor-photo-status]');
    if (status) status.textContent = '사진을 준비하는 중입니다…';
    try {
      pendingPhoto = await prepareTutorProfilePhoto(file);
    } catch (err) {
      input.value = '';
      if (status) status.textContent = err instanceof Error ? err.message : '사진을 준비하지 못했습니다.';
      return;
    }
    let img = box.querySelector('[data-tutor-photo-preview]');
    if (!img) {
      img = document.createElement('img');
      img.setAttribute('data-tutor-photo-preview', '');
      img.alt = '프로필 사진 미리보기';
      img.style.cssText = 'display:block;width:120px;height:120px;object-fit:cover;border-radius:12px;margin:0 0 0.5rem;';
      status?.before(img);
    }
    img.src = pendingPhoto.previewSrc;
    if (status) status.textContent = '고른 사진은 저장 때 함께 올라갑니다.';
  });
}

function returnFromEdit() {
  const raw = getHashQuery().get('return_to');
  if (raw) {
    window.location.assign(decodeURIComponent(raw));
    return true;
  }
  return false;
}

function ensureThreeSlots() {
  const slots = Array.isArray(registerState.saved_regions) ? [...registerState.saved_regions] : [];
  while (slots.length < 3) {
    slots.push({ region_id: '', scope_type: 'city', is_primary: slots.length === 0 });
  }
  if (!slots.some((s) => s.is_primary)) slots[0].is_primary = true;
  registerState.saved_regions = slots.slice(0, 3);
}

/** 기본등록 = 베이직카드 항목(shared/tutor-basic-fields.js) + 성별 + 과외지역(광역시 / 도의 시·군) 한 화면 */
export function renderBasic() {
  const s = registerState;
  const editing = isRegisterEditMode();
  ensureThreeSlots();
  const units = getCityUnits(getTutorUnits());
  const places = TUTOR_PLACE_OPTIONS.map(
    (p) => `
    <label class="form-check">
      <input type="checkbox" name="lesson_places" value="${p.value}" ${s.lesson_places.includes(p.value) ? 'checked' : ''} />
      <span class="form-check__label">${p.label}</span>
    </label>`,
  ).join('');
  const savedPhoto = savedPhotoPath(s);
  const hasSavedPhoto = savedPhoto !== '';
  const photoSrc = pendingPhoto?.previewSrc || savedPhoto;
  const photoStatus = pendingPhoto
    ? '고른 사진은 저장 때 함께 올라갑니다.'
    : hasSavedPhoto
      ? '올린 사진이 있습니다. 사진은 마이페이지 기본정보에서 바꿀 수 있습니다.'
      : '아직 고른 사진이 없습니다.';

  const content = `
    <form data-form="basic">
      ${renderGuideNotice(
        editing
          ? '기본정보와 과외지역을 한 화면에서 수정합니다. 저장하면 마이페이지로 돌아갑니다.'
          : '베이직카드에 나오는 항목과 과외지역을 함께 등록합니다. 과외지역 2·3번 말고는 모두 필수입니다. 광역시는 시 전체, 도는 시·군까지 선택합니다.',
      )}
      <div class="register-grid-2">
        <div class="register-basic-col">
          ${renderSectionTitle('기본정보')}
          <div class="register-basic-fields">
            <div class="form-group">
              <label class="form-label form-label--required" for="tutor_display_name">표시명</label>
              <input class="form-input" id="tutor_display_name" name="tutor_display_name" value="${s.tutor_display_name}" required />
            </div>
            <div class="form-group">
              <label class="form-label form-label--required" for="main_subject_note">주력과목 1개</label>
              <select class="form-input" id="main_subject_note" name="main_subject_note" required>
                ${renderMainSubjectSelect(s.main_subject_note)}
              </select>
            </div>
            <div class="form-group form-group--full">
              <span class="form-label form-label--required">과외쌤 성별</span>
              <div class="form-radio-group">${radios('gender', PERSONAL_GENDER_OPTIONS, s.gender || 'male')}</div>
            </div>
            <div class="form-group">
              <label class="form-label form-label--required" for="school_level">대상(학교급)</label>
              <select class="form-input" id="school_level" name="school_level" required>${renderSelect(SCHOOL_LEVEL_FORM_OPTIONS, s.school_level)}</select>
            </div>
            <div class="form-group">
              <label class="form-label form-label--required" for="preferred_fee_amount">월 대표 과외비 (천원)</label>
              <input class="form-input" type="number" id="preferred_fee_amount" name="preferred_fee_amount" value="${wonToCheonwonInput(s.preferred_fee_amount)}" min="1" required />
            </div>
            <div class="form-group">
              <label class="form-label form-label--required" for="lessons_per_week">주 회수</label>
              <select class="form-input" id="lessons_per_week" name="lessons_per_week" required>${renderSelect(lessonWeeklyOptions(s.lessons_per_week), lessonWeeklySelectValue(s.lessons_per_week))}</select>
            </div>
            <div class="form-group">
              <label class="form-label form-label--required" for="minutes_per_lesson">1회 수업시간</label>
              <select class="form-input" id="minutes_per_lesson" name="minutes_per_lesson" required>${renderSelect(lessonDurationOptions(s.minutes_per_lesson), lessonDurationSelectValue(s.minutes_per_lesson))}</select>
            </div>
            <div class="form-group form-group--full">
              <span class="form-label form-label--required">지도 대상 성별</span>
              <div class="form-radio-group">${radios('student_gender_group', GENDER_GROUP_OPTIONS, s.student_gender_group)}</div>
            </div>
            <div class="form-group form-group--full">
              <span class="form-label form-label--required">수업인원</span>
              <div class="form-radio-group">${radios('student_count_group', STUDENT_COUNT_OPTIONS, s.student_count_group)}</div>
            </div>
            <div class="form-group form-group--full">
              <span class="form-label form-label--required">강의장소</span>
              <div class="register-check-grid">${places}</div>
            </div>
            <div class="form-group form-group--full">
              <label class="form-label form-label--required" for="feature_1">특징 1</label>
              <input class="form-input" id="feature_1" name="feature_1" maxlength="${TUTOR_FEATURE_MAX}" value="${esc(s.feature_1)}" required />
            </div>
            <div class="form-group form-group--full">
              <label class="form-label form-label--required" for="slogan">슬로건</label>
              <input class="form-input" id="slogan" name="slogan" maxlength="${TUTOR_SLOGAN_MAX}" value="${esc(s.slogan)}" placeholder="한 줄로 소개해 주세요" required />
            </div>
          </div>
        </div>
        <div class="register-basic-col">
          ${renderSectionTitle('과외지역')}
          <p class="form-note" style="margin-top:0;">최대 3곳 · 대표 1곳 필수. 광역시는 시 전체, 도는 시·군 단위입니다.</p>
          ${s.saved_regions.map((slot, i) => renderTutorRegionSlot(slot, i, units)).join('')}
        </div>
      </div>
      <div class="form-group form-group--full" data-tutor-basic-photo>
        <label class="form-label form-label--required" for="tutor_profile_photo">프로필 사진</label>
        <p class="form-hint">대표 사진 1장입니다. 사진 2·3번은 마이페이지 기본정보에서 더 올릴 수 있습니다. JPG · PNG · WebP, 파일 최대 4MB. 가운데를 기준으로 맞춥니다.</p>
        ${photoSrc ? `<img src="${esc(photoSrc)}" alt="프로필 사진 미리보기" data-tutor-photo-preview style="display:block;width:120px;height:120px;object-fit:cover;border-radius:12px;margin:0 0 0.5rem;" />` : ''}
        <p class="form-note" data-tutor-photo-status>${esc(photoStatus)}</p>
        ${
          hasSavedPhoto && !pendingPhoto
            ? ''
            : `<input class="form-input" id="tutor_profile_photo" type="file" accept="${TUTOR_PROFILE_PHOTO_SPEC.accept},image/*" />`
        }
      </div>
      ${
        editing
          ? ''
          : `<a class="register-mypage-link" href="${mypageRegistrationsUrl()}">이미 등록한 내용을 수정하려면 마이페이지 · 내 등록</a>`
      }
      ${renderNavButtons(null, editing ? '저장하고 돌아가기' : '다음: 수업·가격')}
    </form>`;
  return renderRegisterShell(content, {
    stepKey: 'basic',
    title: editing ? '기본정보' : '과외쌤 기본등록',
    subtitle: '기본정보와 과외지역을 한 화면에서 입력합니다.',
  });
}

export function bindBasicEvents(root) {
  bindGlobalEvents(root);
  const units = getCityUnits(getTutorUnits());
  bindTutorRegionSlotEvents(root, units);
  bindInputFill(root.querySelector('[data-form="basic"]'));
  bindBasicPhoto(root);

  const nextBtn = root.querySelector('[data-action="next"]');
  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      const form = root.querySelector('[data-form="basic"]');
      syncBasicFromForm(form, registerState);

      registerState.saved_regions = collectTutorRegionSlots(root);
      const checked = validateTutorActivityRegions(registerState.saved_regions);
      if (!checked.ok) {
        alert(checked.message);
        return;
      }

      const missing = tutorBasicMissing({
        ...registerState,
        has_primary_region: true,
        has_profile_image: !!(pendingPhoto || savedPhotoPath(registerState)),
      });
      if (missing.length) {
        alert(tutorBasicMissingMessage(missing));
        return;
      }

      const knownId = await resolveTutorId(registerState);
      if (knownId) {
        // 이미 있는 행은 서버가 사진까지 확인하므로 먼저 올린다.
        await uploadPendingPhoto(knownId);
      }
      await saveAndNavigate(registerState, 'basic', null);
      if (pendingPhoto) {
        try {
          await uploadPendingPhoto(registerState.tutor_id);
        } catch (err) {
          alert(
            `기본정보는 저장했지만 프로필 사진을 올리지 못했습니다. 저장을 한 번 더 눌러 주세요.\n(${err instanceof Error ? err.message : err})`,
          );
          return;
        }
      }
      registerState.basicComplete = true;

      if (isRegisterEditMode()) {
        if (!returnFromEdit()) navigate('/register/lesson');
        return;
      }
      navigate('/register/lesson');
    });
  });
}

/** @deprecated regions 단독 화면 — basic으로 통합 */
export function renderRegions() {
  const q = window.location.hash.includes('?')
    ? window.location.hash.slice(window.location.hash.indexOf('?'))
    : '';
  navigate(`/register/basic${q}`);
  return renderBasic();
}

export function bindRegionsEvents(root) {
  bindBasicEvents(root);
}
