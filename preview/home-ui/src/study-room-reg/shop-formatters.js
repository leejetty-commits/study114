/**
 * ShopPage 공통 formatter / mapper / photo split
 * — 원장·공개 경로가 동일 규칙을 쓰도록 여기만 둔다.
 */

import {
  LESSON_OPERATION_TYPES,
  CAPACITY_PER_TIME_OPTIONS,
  TEACHING_STYLE_OPTIONS,
  WEEKDAY_OPTIONS,
  DAILY_LESSON_MINUTES,
  WEEKLY_LESSON_COUNTS,
  IMAGE_TYPES,
  FACILITY_OPTIONS,
  SCHOOL_LEVELS,
  getFacilityOptions,
} from '@study-room-ui/state.js';
import { formatPrimaryAudienceLabel } from '../../../shared/study-room-basic-form.js';

export const ROOM_DEFAULT_BASIC = '/assets/brand/room-card-default-basic.svg';

/** 민감키 — 렌더/어댑터에서 본문에 넣지 말 것 */
export const SHOP_FORBIDDEN_KEYS = [
  'home_address',
  'home_address_zip',
  'home_address_line2',
  'address_text',
  'address_zip',
  'address_line2',
  'contact_phone',
  'contact_email',
  'gender',
];

export function blank(v) {
  const s = String(v ?? '').trim();
  if (!s || s === '—' || s === '-') return '';
  return s;
}

export function labelOf(options, value) {
  if (value == null || value === '') return '';
  return options.find((o) => String(o.value) === String(value) || String(o.id) === String(value))?.label || '';
}

export function boolOn(v) {
  return v === true || v === 1 || v === '1';
}

/** boolean → 가능/운영/제공 */
export function formatBoolFlag(v, tone = '가능') {
  return boolOn(v) ? tone : '';
}

/** 교습형태 */
export function formatLessonPlace(lessonPlaceType) {
  if (lessonPlaceType === 'academy') return '교습소';
  if (lessonPlaceType === 'study_room') return '공부방';
  return '';
}

/** 수업운영방식 */
export function formatLessonOperation(lessonOperationType) {
  return labelOf(LESSON_OPERATION_TYPES, lessonOperationType);
}

/** 타임별 원생수 — enum → 사람말, raw snake_case 숨김 */
export function formatCapacity(capacityPerTime) {
  const fromEnum = labelOf(CAPACITY_PER_TIME_OPTIONS, capacityPerTime);
  if (fromEnum) return fromEnum;
  const t = blank(capacityPerTime);
  if (!t || /^[a-z][a-z0-9_]*$/i.test(t)) return '';
  return t;
}

/** 월 가격 — 만원 / 만원대 */
export function formatMonthlyFeeBand(monthlyFeeManwon, priceAmount) {
  if (monthlyFeeManwon !== '' && monthlyFeeManwon != null) {
    const n = blank(monthlyFeeManwon).replace(/만원.*$/, '');
    return n ? `월 ${n}만원대` : '';
  }
  if (priceAmount) {
    const man = Math.round(Number(priceAmount) / 10000);
    if (man > 0) return `월 ${man}만원대`;
  }
  return '';
}

export function formatClassFee(raw) {
  const t = blank(raw);
  if (!t) return '';
  if (/만원/.test(t)) return `월 ${t.replace(/^월\s*/, '')}`;
  return `월 ${t}만원`;
}

export function formatMinutesPerLesson(v) {
  return labelOf(DAILY_LESSON_MINUTES, v) || (blank(v) && /^\d+$/.test(blank(v)) ? `${blank(v)}분` : '');
}

export function formatWeeklyCount(v) {
  return labelOf(WEEKLY_LESSON_COUNTS, v) || (blank(v) ? `주 ${blank(v)}회` : '');
}

export function formatSchoolLevel(v) {
  return labelOf(SCHOOL_LEVELS, v) || blank(v);
}

export function formatAttendanceDays(days) {
  if (!Array.isArray(days) || !days.length) return '';
  return days
    .map((d) => labelOf(WEEKDAY_OPTIONS, d) || blank(d))
    .filter(Boolean)
    .join('·');
}

export function formatAudience(primarySchoolLevels, gradeBand) {
  const fromLevels = formatPrimaryAudienceLabel(primarySchoolLevels);
  if (fromLevels) return fromLevels;
  return blank(gradeBand);
}

export function formatTeachingStyles(teachingStyleIds, teachingStyleRaw) {
  const ids = Array.isArray(teachingStyleIds) ? teachingStyleIds.map(String) : [];
  if (ids.length) {
    return ids
      .map((id) => TEACHING_STYLE_OPTIONS.find((o) => String(o.id) === id)?.label || '')
      .filter(Boolean);
  }
  const raw = blank(teachingStyleRaw);
  if (!raw) return [];
  return raw
    .split(/[,|/]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((id) => TEACHING_STYLE_OPTIONS.find((o) => String(o.id) === id)?.label || id);
}

export function formatImageTypeLabel(type) {
  return labelOf(IMAGE_TYPES, type) || '';
}

/** 홍보지역 → 생활권 문장 (주소 원문 금지) */
export function collectRegionLabels(s, room) {
  const slots = Array.isArray(s?.saved_regions) ? s.saved_regions : [];
  const fromSlots = slots
    .map((r) => blank(r?.region_label || r?.complex_name || ''))
    .filter(Boolean);
  if (fromSlots.length) return [...new Set(fromSlots)];
  if (Array.isArray(s?.promo_regions) && s.promo_regions.length) {
    return s.promo_regions.map(blank).filter(Boolean);
  }
  const one = blank(s?.region_label || room?.region_label || room?.location_label);
  return one ? [one] : [];
}

export function formatLivingAreaSentence(labels) {
  if (!labels?.length) return '';
  if (labels.length === 1) return `${labels[0]} 생활권`;
  return `${labels[0]} 생활권 · ${labels.slice(1).join(' · ')}`;
}

export function resolveFacilityNames(s) {
  if (Array.isArray(s?.facility_names) && s.facility_names.length) {
    return s.facility_names.map(blank).filter(Boolean);
  }
  const ids = Array.isArray(s?.facility_ids) ? s.facility_ids.map(Number) : [];
  if (!ids.length) {
    const summary = blank(s?.facility_note || s?.facility_summary);
    if (summary && /[·,]/.test(summary) && summary.length < 80) {
      return summary.split(/[·,]/).map((x) => x.trim()).filter(Boolean);
    }
    return [];
  }
  const opts = getFacilityOptions().length ? getFacilityOptions() : FACILITY_OPTIONS;
  return ids
    .map((id) => opts.find((f) => Number(f.id) === id)?.facility_name || '')
    .filter(Boolean);
}

function imgSrc(img) {
  if (!img || typeof img !== 'object') return '';
  return blank(img.basic_720_path || img.prime_1280_path || img.image_path || img.name || img.src);
}

function isSystemDefaultImage(img) {
  return Boolean(img?.is_system_default);
}

export function collectShopPhotos(s) {
  const list = Array.isArray(s?.images) ? s.images : [];
  return list
    .map((img) => ({
      src: imgSrc(img),
      type: blank(img.image_type) || 'other',
      title: blank(img.title || img.caption || ''),
      system: isSystemDefaultImage(img),
    }))
    .filter((x) => x.src && !x.system);
}

/**
 * 대표(cover) → Hero
 * Gallery: 내부시설(interior) → 시설(facility) → 기타(other)
 */
export function splitHeroAndGallery(photos) {
  const list = Array.isArray(photos) ? [...photos] : [];
  const coverIdx = list.findIndex((p) => p.type === 'cover');
  const hero = coverIdx >= 0 ? list[coverIdx] : list[0] || null;
  const rest = list.filter((p) => p !== hero);
  const rank = (t) => (t === 'interior' ? 0 : t === 'facility' ? 1 : 2);
  rest.sort((a, b) => rank(a.type) - rank(b.type));
  return { hero, gallery: rest };
}

/** 섹션 가드 — 내용 없으면 빈 문자열 (wrapper 미출력) */
export function sectionGuard(inner) {
  return blank(inner) ? String(inner).trim() : '';
}
