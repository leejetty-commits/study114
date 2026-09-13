/**
 * 과외쌤 마이프로필 — 입력값 열람 전용.
 * 공개/완성도/인증/노출/쪽지 판정 UI를 넣지 않는다.
 */

import { formatTutorFeeCard } from '../exposure-format.js';
import { formatTeachingStyleBadges } from '../exposure-format.js';
import { CAREER_YEAR_BAND_LABELS, TUTOR_PLACE_LABELS, UNIVERSITY_STATUS_LABELS } from '../tutor-enums.js';
import { tutorSectionPath } from './router.js';
import { normalizeTutorProfileImages, tutorPhotoPreviewSrc } from './profile-photos.js';

const GENDER_GROUP_LABELS = { male: '남학생', female: '여학생', mixed: '혼성' };
const STUDENT_COUNT_LABELS = { solo: '단독', two: '2명', three: '3명', four_plus: '4명 이상' };

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function blank(v) {
  return String(v ?? '').trim();
}

/** 값이 없으면 빈 문자열 — 부족/미완료 문구로 바꾸지 않음 */
function display(v) {
  return blank(v);
}

function lessonPlacesLabel(tutor) {
  const places = Array.isArray(tutor?.lesson_places) ? tutor.lesson_places : [];
  return places.map((p) => TUTOR_PLACE_LABELS[p] || p).filter(Boolean).join(' · ');
}

function feeBasisLabel(tutor) {
  if (blank(tutor?.fee_basis_type) === 'monthly_by_total_sessions') return '월 총 횟수 기준';
  if (blank(tutor?.fee_basis_type) === 'monthly_by_weekly_schedule') return '주 횟수 기준';
  return '';
}

function feeLabel(tutor) {
  return Number(tutor?.preferred_fee_amount) > 0 ? formatTutorFeeCard(tutor) : '';
}

function weeklyLabel(tutor) {
  const n = Number(tutor?.lessons_per_week);
  return n > 0 ? `주 ${n}회` : '';
}

function monthlyLabel(tutor) {
  const n = Number(tutor?.monthly_session_count);
  return n > 0 ? `월 ${n}회` : '';
}

function minutesLabel(tutor) {
  const n = Number(tutor?.minutes_per_lesson);
  return n > 0 ? `${n}분` : '';
}

function yesNoBlank(flag, yes = '등록됨') {
  return flag ? yes : '';
}

function publicChoice(flag) {
  if (flag === true) return '공개';
  if (flag === false) return '비공개';
  return '';
}

/**
 * @param {import('./store.js').TutorRecord} tutor
 * @returns {{ id: string, title: string, editSection: 'basic'|'detail'|null, rows: { label: string, value: string }[] }[]}
 */
export function buildTutorProfileReadSections(tutor) {
  const t = tutor && typeof tutor === 'object' ? tutor : {};
  const styles = formatTeachingStyleBadges(t.teaching_style_badges, 99);
  const career = CAREER_YEAR_BAND_LABELS[t.career_year_band] || display(t.career_year_band);

  return [
    {
      id: 'basic',
      title: '기본정보',
      editSection: 'basic',
      rows: [
        { label: '표시명', value: display(t.tutor_display_name) },
        { label: '주력과목', value: display(t.main_subject_note) },
        { label: '과외지역', value: display(t.primary_region_label || t.location_label) },
      ],
    },
    {
      id: 'lesson',
      title: '수업 · 가격',
      editSection: 'detail',
      rows: [
        { label: '월 과외비', value: feeLabel(t) },
        { label: '산정방식', value: feeBasisLabel(t) },
        { label: '주 횟수', value: weeklyLabel(t) },
        { label: '월 총 횟수', value: monthlyLabel(t) },
        { label: '1회(분)', value: minutesLabel(t) },
        { label: '지도 대상 성별', value: GENDER_GROUP_LABELS[t.student_gender_group] || '' },
        { label: '수업인원', value: STUDENT_COUNT_LABELS[t.student_count_group] || '' },
        { label: '강의장소', value: lessonPlacesLabel(t) },
        { label: '가격 설명', value: display(t.fee_description) },
      ],
    },
    {
      id: 'education',
      title: '학력 · 자격',
      editSection: 'detail',
      rows: [
        { label: '출신대학', value: display(t.university_name) },
        { label: '전공', value: display(t.major_name) },
        { label: '학적상태', value: UNIVERSITY_STATUS_LABELS[t.university_status] || '' },
      ],
    },
    {
      id: 'intro',
      title: '소개 · 연락',
      editSection: 'detail',
      rows: [
        { label: '짧은 소개', value: display(t.intro_short) },
        { label: '상세 소개', value: display(t.intro_long) },
        { label: '특징 1', value: display(t.feature_1) },
        { label: '특징 2', value: display(t.feature_2) },
        { label: '특징 3', value: display(t.feature_3) },
        { label: '연락 가능 시간', value: display(t.contact_time_note) },
      ],
    },
    {
      id: 'extra',
      title: '추가 정보',
      editSection: 'detail',
      rows: [
        { label: '학생 대상', value: display(t.grade_band) },
        { label: '강의스타일', value: styles && styles !== '—' ? styles : '' },
        { label: '경력', value: career },
        { label: '학력 제출자료', value: yesNoBlank(t.education_doc_submitted) },
        { label: '학력 공개 선택', value: publicChoice(t.education_doc_public) },
        { label: '경력 제출자료', value: yesNoBlank(t.career_doc_submitted) },
      ],
    },
  ];
}

/**
 * @param {import('./store.js').TutorRecord} tutor
 */
function renderProfileGallery(tutor) {
  const images = normalizeTutorProfileImages(tutor);
  if (!images.length) return '';
  const items = images
    .map((img, idx) => {
      const src = tutorPhotoPreviewSrc(img);
      if (!src) return '';
      return `
      <div class="p21-profile__gallery-item${idx === 0 ? ' is-cover' : ''}">
        <img src="${esc(src)}" alt="프로필 사진 ${idx + 1}" />
        ${idx === 0 ? '<span class="p21-profile__gallery-badge">대표</span>' : ''}
      </div>`;
    })
    .filter(Boolean)
    .join('');
  if (!items) return '';
  return `<div class="p21-profile__gallery" aria-label="프로필 사진">${items}</div>`;
}

export function renderTutorProfileRead(tutor) {
  const name = display(tutor?.tutor_display_name) || '과외 프로필';
  const basicHref = tutorSectionPath(tutor.id, 'basic');
  const detailHref = tutorSectionPath(tutor.id, 'detail');
  const sections = buildTutorProfileReadSections(tutor)
    .map((sec) => {
      const editHref = sec.editSection ? tutorSectionPath(tutor.id, sec.editSection) : '';
      const edit = editHref
        ? `<a class="p21-profile__edit" href="#${editHref}" data-p21-nav="${editHref}">수정</a>`
        : '';
      const rows = sec.rows
        .map(
          (r) => `
        <div class="p21-profile__row">
          <dt class="p21-profile__label">${esc(r.label)}</dt>
          <dd class="p21-profile__value${r.value ? '' : ' is-empty'}">${r.value ? esc(r.value) : ''}</dd>
        </div>`,
        )
        .join('');
      return `
      <section class="p21-profile__section" data-profile-section="${esc(sec.id)}">
        <header class="p21-profile__section-head">
          <h3 class="p21-profile__section-title">${esc(sec.title)}</h3>
          ${edit}
        </header>
        <dl class="p21-profile__list">${rows}</dl>
      </section>`;
    })
    .join('');

  return `
    <div class="p21-profile" data-p21-profile>
      <header class="p21-profile__head">
        <p class="p21-profile__kicker">마이프로필</p>
        ${renderProfileGallery(tutor)}
        <h2 class="p21-profile__name">${esc(name)}</h2>
        <p class="p21-profile__lead">입력한 프로필 정보를 그대로 확인합니다. 수정은 기본정보·상세정보에서 합니다.</p>
        <div class="p21-profile__actions">
          <a class="btn btn--secondary" href="#${basicHref}" data-p21-nav="${basicHref}">기본정보 수정</a>
          <a class="btn btn--secondary" href="#${detailHref}" data-p21-nav="${detailHref}">상세정보 수정</a>
        </div>
      </header>
      ${sections}
    </div>`;
}
