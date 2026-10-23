/**
 * 픽·프라임 구매 필수 항목 한 곳 (273).
 * 과외쌤 라벨·focus·tab은 tutor-detail-fields.js. 묶음 라벨만 여기 둔다.
 * 공부방 라벨은 등록점검 문구와 같다.
 */
import { lessonWeeklyLabel } from './lesson-weekly-options.js';
import { tutorDetailField, tutorDetailFieldFocus } from './tutor-detail-fields.js';

export const TIER_MARK_NOTE = '* 표시는 픽·프라임 카드 구매 때 필요한 항목이에요';
export const STYLE_LIMIT_NOTE = '강의스타일은 4개까지 고를 수 있어요';
export const TUTOR_STYLE_MAX = 4;

export const TUTOR_PICK_IDS = ['school_or_career', 'teaching_style_badges'];
export const TUTOR_PRIME_IDS = [...TUTOR_PICK_IDS, 'intro_long', 'feature_2', 'feature_3'];

/** 등록점검 RC_PICK/PRIME 순서 그대로 */
export const ROOM_PICK_IDS = ['cover', 'intro_long', 'fee', 'teaching_style', 'feature_1'];
export const ROOM_PRIME_IDS = [
  'cover',
  'intro_long',
  'teaching_style',
  'teaching_style_note',
  'fee',
  'lessons_per_week',
  'feature_1',
  'feature_2',
  'feature_3',
];

const SCHOOL_OR_CAREER_LABEL = '학교·학과 또는 경력';

const TUTOR_HINTS = {
  school_or_career: '대학명 또는 경력구간 중 하나면 됩니다',
  main_material_note: '주교재를 적어 주세요',
  teaching_style_badges: '강의스타일을 1개 이상 고르세요. 최대 4개',
  intro_long: '상세 소개를 입력하면 카드와 확대카드에 보입니다',
  feature_2: '프라임 카드에 특징을 더 보여 줍니다',
  feature_3: '프라임 카드에 특징을 더 보여 줍니다',
};

const ROOM_META = {
  cover: { label: '대표사진', focus: 'cover', tab: 'detail' },
  intro_long: { label: '공부방 소개 / 자랑', focus: 'intro_long', tab: 'detail' },
  fee: { label: '월 평균 수업료', focus: 'fee', tab: 'detail' },
  teaching_style: { label: '수업 스타일', focus: 'teaching_style', tab: 'detail' },
  teaching_style_note: { label: '수업 스타일 추가설명', focus: 'teaching_style_note', tab: 'detail' },
  lessons_per_week: { label: '주 회수', focus: 'lessons_per_week', tab: 'detail' },
  feature_1: { label: '경력특징 1', focus: 'feature_1', tab: 'detail2' },
  feature_2: { label: '경력특징 2', focus: 'feature_2', tab: 'detail2' },
  feature_3: { label: '경력특징 3', focus: 'feature_3', tab: 'detail2' },
};

const ROOM_STYLES = {
  kind: '친절',
  meticulous: '꼼꼼',
  taciturn: '과묵',
  comprehension: '이해력',
  problem_solving: '문제풀이형',
  concept_focus: '개념중심',
  advanced_focus: '고난이도',
  pinpoint: '족집게',
  patient: '인내형',
  attentive: '경청형',
  solution_notes: '풀이필기중점',
  textbook_focus: '교과서중심',
  mock_exam: '모의고사풀이',
};

function text(v) {
  return String(v ?? '').trim();
}

function tutorMeta(id) {
  if (id === 'school_or_career') {
    const school = tutorDetailField('university_name');
    return {
      label: SCHOOL_OR_CAREER_LABEL,
      focus: school ? tutorDetailFieldFocus(school) : 'university',
      tab: school?.tab || 'detail2',
    };
  }
  const field = tutorDetailField(id);
  return {
    label: field ? (typeof field.label === 'function' ? field.label({}) : field.label) : id,
    focus: field ? tutorDetailFieldFocus(field) : id,
    tab: field?.tab || 'detail2',
  };
}

function tutorFieldFilled(tutor, id) {
  const field = tutorDetailField(id);
  return field ? field.filled(tutor || {}) : false;
}

/** @param {object|null|undefined} tutor @param {'pick'|'prime'} tier */
export function tutorTierMissing(tutor, tier) {
  const ids = tier === 'prime' ? TUTOR_PRIME_IDS : TUTOR_PICK_IDS;
  const record = tutor && typeof tutor === 'object' ? tutor : {};
  return ids
    .filter((id) => {
      if (id === 'school_or_career') {
        return !tutorFieldFilled(record, 'university_name') && !tutorFieldFilled(record, 'career_year_band');
      }
      return !tutorFieldFilled(record, id);
    })
    .map((id) => ({ id, ...tutorMeta(id) }));
}

export function tutorTierPromoDefs() {
  return TUTOR_PRIME_IDS.map((id) => {
    const meta = tutorMeta(id);
    return {
      id,
      label: meta.label,
      hint: TUTOR_HINTS[id] || '',
      section: 'detail',
      focus: meta.focus,
    };
  });
}

function roomStyleLabels(room) {
  const ids = Array.isArray(room?.teaching_style_ids) ? room.teaching_style_ids.map(String) : [];
  if (ids.length) {
    return ids.map((id) => ROOM_STYLES[id] || '').filter(Boolean);
  }
  const raw = text(room?.teaching_style);
  if (!raw) return [];
  return raw
    .split(/[,|/]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((id) => ROOM_STYLES[id] || id);
}

function roomFeeFilled(room) {
  const price = Number(room?.price_amount);
  if (Number.isFinite(price) && price > 0 && Math.round(price / 1000) > 0) return true;
  const fee = text(room?.monthly_fee_manwon);
  if (!fee) return false;
  if (/(\d+(?:\.\d+)?)\s*만/.test(fee)) return true;
  const n = fee.replace(/천원.*$/, '').replace(/[^\d.]/g, '');
  return n !== '';
}

function photoSrc(img) {
  if (!img || typeof img !== 'object') return '';
  return text(img.basic_720_path || img.prime_1280_path || img.image_path || img.name || img.src);
}

function isBrandOrSystemDefaultImage(img) {
  if (!img || typeof img !== 'object') return true;
  if (img.is_system_default === true || img.is_system_default === 1 || img.is_system_default === '1') return true;
  const src = photoSrc(img);
  if (!src) return true;
  if (/room-card-default-(basic|pick|prime)/i.test(src)) return true;
  if (/study114[_-]default/i.test(src)) return true;
  const marker = text(img.original_filename || img.name);
  if (marker && /default/i.test(marker) && /system|brand|room-card/i.test(marker)) return true;
  return false;
}

function roomCoverFilled(room) {
  const images = Array.isArray(room?.images) ? room.images : [];
  const real = images.filter((img) => !isBrandOrSystemDefaultImage(img) && photoSrc(img));
  const cover = real.find((img) => text(img.image_type) === 'cover') || null;
  return Boolean(cover && photoSrc(cover));
}

function roomFieldFilled(room, id) {
  if (id === 'cover') return roomCoverFilled(room);
  if (id === 'intro_short') return text(room?.intro_short) !== '';
  if (id === 'intro_long') return text(room?.intro_long) !== '';
  if (id === 'teaching_style') return roomStyleLabels(room).length > 0;
  if (id === 'teaching_style_note') return text(room?.teaching_style_note) !== '';
  if (id === 'fee') return roomFeeFilled(room);
  if (id === 'lessons_per_week') return lessonWeeklyLabel(room?.lessons_per_week) !== '';
  if (id === 'feature_1') return text(room?.feature_1) !== '';
  if (id === 'feature_2') return text(room?.feature_2) !== '';
  if (id === 'feature_3') return text(room?.feature_3) !== '';
  return false;
}

/** @param {object|null|undefined} room @param {'pick'|'prime'} tier */
export function roomTierMissing(room, tier) {
  const ids = tier === 'prime' ? ROOM_PRIME_IDS : ROOM_PICK_IDS;
  const record = room && typeof room === 'object' ? room : {};
  return ids
    .filter((id) => !roomFieldFilled(record, id))
    .map((id) => ({ id, ...(ROOM_META[id] || { label: id, focus: id, tab: 'detail' }) }));
}

/** @param {'pick'|'prime'} tier */
export function tierBlockMessage(tier) {
  const name = tier === 'prime' ? '프라임' : '픽';
  return `${name} 정보 부족 · 등록점검에서 남은 항목을 채우면 구매가 열립니다`;
}

/** 새로 고른 개수가 4개를 넘으면 막는다. 이미 저장된 5개 이상은 화면이 지우지 않는다. */
export function teachingStylePickAllowed(nextCount) {
  return Number(nextCount) <= TUTOR_STYLE_MAX;
}
