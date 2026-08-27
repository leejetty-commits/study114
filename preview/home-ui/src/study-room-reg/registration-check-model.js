/**
 * 등록점검 view model — 기존 registerState + StudyRoomRecord SSOT만 읽는다.
 * 입력 원본을 새로 만들지 않는다.
 */

import {
  DAILY_LESSON_MINUTES,
  WEEKLY_LESSON_COUNTS,
  TEACHING_STYLE_OPTIONS,
} from '@study-room-ui/state.js';
import { formatPrimaryAudienceLabel, lessonPlaceNameLabel } from '../../../shared/study-room-basic-form.js';
import {
  blank,
  formatLessonPlace,
  formatLessonOperation,
  formatCapacity,
  formatMonthlyFeeBand,
  formatMinutesPerLesson,
  formatWeeklyCount,
  formatTeachingStyles,
  collectRegionLabels,
  resolveFacilityNames,
} from './shop-formatters.js';
import { studyRoomSectionPath } from './router.js';
import { withEmbedQuery } from './embedded-panels.js';
import {
  RC_COPY,
  RC_PICK_FIELD_IDS,
  RC_PRIME_FIELD_IDS,
  RC_REQUIRED_FIELD_IDS,
  RC_PROMO_MISSING_DEFS,
} from './registration-check-copy.js';

const DEFAULT_BASIC = '/assets/brand/room-card-default-basic.svg';
const DEFAULT_PICK = '/assets/brand/room-card-default-pick.svg';
const DEFAULT_PRIME = '/assets/brand/room-card-default-prime.svg';

const REQUIRED_SET = new Set(RC_REQUIRED_FIELD_IDS);

function photoSrc(img) {
  if (!img || typeof img !== 'object') return '';
  return blank(img.basic_720_path || img.prime_1280_path || img.image_path || img.name || img.src);
}

/** 브랜드 기본 SVG/PNG · 시스템 기본 플래그 — 대표사진 완료로 치지 않음 */
function isBrandOrSystemDefaultImage(img) {
  if (!img || typeof img !== 'object') return true;
  if (img.is_system_default === true || img.is_system_default === 1 || img.is_system_default === '1') {
    return true;
  }
  const src = photoSrc(img);
  if (!src) return true;
  if (/room-card-default-(basic|pick|prime)/i.test(src)) return true;
  if (/study114[_-]default/i.test(src)) return true;
  const marker = blank(img.original_filename || img.name);
  if (marker && /default/i.test(marker) && /system|brand|room-card/i.test(marker)) return true;
  return false;
}

function realImages(s) {
  return (Array.isArray(s?.images) ? s.images : []).filter(
    (img) => !isBrandOrSystemDefaultImage(img) && photoSrc(img),
  );
}

function triBool(v, onLabel, offLabel) {
  if (v === true || v === 1 || v === '1') return { value: onLabel, status: 'filled' };
  if (v === false || v === 0 || v === '0') return { value: offLabel, status: 'filled' };
  return { value: '', status: 'empty' };
}

function textStatus(v) {
  return blank(v) ? 'filled' : 'empty';
}

function row(id, label, value, status) {
  return {
    id,
    label,
    value: blank(value) ? String(value) : '',
    status,
    required: REQUIRED_SET.has(id),
  };
}

function classSummary(s) {
  const classes = Array.isArray(s?.classes) ? s.classes : [];
  const usable = classes.filter((c) => {
    const t = blank(c?.class_name || c?.name);
    const sub = blank(c?.subject_name || c?.subject || c?.subject_label);
    const fee = blank(c?.monthly_fee ?? c?.fee);
    return !!(t || sub || fee);
  });
  const complete = usable.filter((c) => blank(c?.class_name || c?.name) && blank(c?.monthly_fee ?? c?.fee));
  if (!usable.length) return { value: '', status: 'empty', count: 0 };
  if (complete.length < usable.length) {
    return { value: `${usable.length}개 등록`, status: 'partial', count: usable.length };
  }
  return { value: `${usable.length}개 등록`, status: 'filled', count: usable.length };
}

function photoSummary(s) {
  const real = realImages(s);
  const coverImg = real.find((p) => blank(p.image_type) === 'cover') || null;
  /** 실사진 cover만 완료. 브랜드 기본 이미지·실사진 없는 상태는 미입력 */
  const hasCover = Boolean(coverImg && photoSrc(coverImg));
  const count = real.length;
  if (!count) {
    return { value: '', status: 'empty', count: 0, hasCover: false, coverSrc: '' };
  }
  const display = coverImg || real[0];
  if (!hasCover) {
    return {
      value: count === 1 ? '1장 등록됨 (대표 미지정)' : `${count}장 · 대표 미지정`,
      status: 'partial',
      count,
      hasCover: false,
      coverSrc: photoSrc(display),
    };
  }
  if (count === 1) {
    return {
      value: '1장 등록됨',
      status: 'filled',
      count,
      hasCover: true,
      coverSrc: photoSrc(coverImg),
    };
  }
  return {
    value: `${count}장 등록됨`,
    status: 'filled',
    count,
    hasCover: true,
    coverSrc: photoSrc(coverImg),
  };
}

function eduOffice(s) {
  if (s?.education_office_registered === true || s?.education_office_registered === 1) {
    const no = blank(s.education_office_reg_no);
    return no
      ? { value: `등록 · ${no}`, status: 'filled' }
      : { value: '등록 (번호 없음)', status: 'partial' };
  }
  if (s?.education_office_registered === false || s?.education_office_registered === 0) {
    return { value: '미등록', status: 'filled' };
  }
  return { value: '', status: 'empty' };
}

function franchise(s) {
  if (s?.franchise_flag === true || s?.franchise_flag === 1) {
    const name = blank(s.franchise_name);
    return name
      ? { value: `예 · ${name}`, status: 'filled' }
      : { value: '예', status: 'partial' };
  }
  if (s?.franchise_flag === false || s?.franchise_flag === 0) {
    return { value: '아니오', status: 'filled' };
  }
  return { value: '', status: 'empty' };
}

function fieldOkMap(s, room, photos) {
  const styles = formatTeachingStyles(s?.teaching_style_ids, s?.teaching_style);
  const fee = formatMonthlyFeeBand(s?.monthly_fee_manwon, room?.price_amount || s?.price_amount);
  const classes = classSummary(s);
  return {
    /** 실사진 cover만 — room.has_representative_image(시스템 기본 포함 가능)는 쓰지 않음 */
    cover: photos.hasCover === true,
    intro_short: !!blank(s?.intro_short || room?.intro_short),
    intro_long: !!blank(s?.intro_long),
    teaching_style: styles.length > 0,
    teaching_style_note: !!blank(s?.teaching_style_note),
    classes: classes.count > 0,
    fee: !!fee,
    lessons_per_week: !!formatWeeklyCount(s?.lessons_per_week),
    feature_1: !!blank(s?.feature_1 || room?.feature_1),
  };
}

function remainingCount(okMap, ids) {
  return ids.filter((id) => !okMap[id]).length;
}

function missingForTier(okMap, ids, roomId) {
  return RC_PROMO_MISSING_DEFS.filter((d) => ids.includes(d.id) && !okMap[d.id]).map((d) => ({
    id: d.id,
    label: d.label,
    hint: d.hint,
    href: registrationCheckTabHref(roomId, d.section, d.id),
  }));
}

function priceWon(s, room) {
  const raw = Number(s?.price_amount || room?.price_amount || 0);
  if (Number.isFinite(raw) && raw > 0) return raw;
  const manwon = Number(s?.monthly_fee_manwon);
  if (Number.isFinite(manwon) && manwon > 0) return manwon * 10000;
  return 0;
}

/**
 * 등록점검 비교 카드·확대카드용 노출 행 (카탈로그가 아니라 내 공부방 현재값)
 * @param {object} s registerState
 * @param {import('./store.js').StudyRoomRecord} room
 * @param {ReturnType<typeof photoSummary>} [photos]
 */
export function buildRegistrationCheckPreviewItem(s, room, photos) {
  const shot = photos || photoSummary(s || {});
  const regions = collectRegionLabels(s, room);
  const cover = shot.coverSrc || '';
  return {
    id: room.id,
    study_room_name: blank(s?.study_room_name || room?.study_room_name) || '공부방명 미입력',
    location_label: regions[0] || blank(room?.region_label) || '',
    main_subject_note: blank(s?.main_subject_note || room?.main_subject_note),
    grade_band: blank(s?.grade_band || room?.grade_band) || formatPrimaryAudienceLabel(s?.primary_school_levels) || '',
    price_amount: priceWon(s, room),
    intro_short: blank(s?.intro_short || room?.intro_short),
    intro_long: blank(s?.intro_long),
    slogan: blank(s?.slogan || room?.slogan || s?.intro_short || room?.intro_short),
    feature_1: blank(s?.feature_1 || room?.feature_1),
    feature_2: blank(s?.feature_2),
    feature_3: blank(s?.feature_3),
    career_years: s?.career_years ?? room?.career_years,
    education_office_registered: s?.education_office_registered ?? room?.education_office_registered,
    weekend_available: s?.weekend_available ?? room?.weekend_available,
    one_on_one_available: s?.one_on_one_available ?? room?.one_on_one_available,
    lesson_place_type: (s?.lesson_place_type || room?.lesson_place_type) === 'academy' ? 'office' : (s?.lesson_place_type || room?.lesson_place_type || 'home'),
    lesson_operation_type: s?.lesson_operation_type || room?.lesson_operation_type,
    capacity_per_time: s?.capacity_per_time || room?.capacity_per_time || '',
    facility_summary: blank(s?.facility_note || room?.facility_summary),
    profile_status: room?.profile_status,
    compare_eligible: room?.compare_eligible,
    image_path: cover || DEFAULT_BASIC,
    image_path_basic: cover || DEFAULT_BASIC,
    image_path_prime: cover || DEFAULT_PRIME,
    inquiry_status: room?.inquiry_status,
  };
}

function buildBoard(s, room, photos) {
  const styles = formatTeachingStyles(s?.teaching_style_ids, s?.teaching_style);
  const fee = formatMonthlyFeeBand(s?.monthly_fee_manwon, room?.price_amount || s?.price_amount);
  const regions = collectRegionLabels(s, room);
  const facilities = resolveFacilityNames(s);
  const classes = classSummary(s);
  const extraPhotos = photos.count > 1 ? photos.count - 1 : 0;

  const place = formatLessonPlace(s?.lesson_place_type || room?.lesson_place_type);
  const audience = formatPrimaryAudienceLabel(s?.primary_school_levels) || blank(room?.grade_band);
  const nameLabel = lessonPlaceNameLabel(s?.lesson_place_type || room?.lesson_place_type);

  const weekend = triBool(s?.weekend_available ?? room?.weekend_available, '가능', '불가');
  const oneToOne = triBool(s?.one_on_one_available ?? room?.one_on_one_available, '가능', '불가');
  const cardPay = triBool(s?.card_payment_available, '가능', '불가');
  const cash = triBool(s?.cash_receipt_available, '발급', '안 함');
  const correction = triBool(s?.correction_available, '운영', '안 함');
  const biz = triBool(s?.business_registration_available, '있음', '없음');
  const edu = eduOffice(s);
  const fran = franchise(s);

  const minutes = formatMinutesPerLesson(s?.minutes_per_lesson);
  const weekly = formatWeeklyCount(s?.lessons_per_week);
  const op = formatLessonOperation(s?.lesson_operation_type);
  const cap = formatCapacity(s?.capacity_per_time || room?.capacity_per_time);
  const career = s?.career_years !== '' && s?.career_years != null ? `${s.career_years}년` : '';

  return [
    {
      id: 'basic',
      title: RC_COPY.board.sections.basic,
      variant: 'plain',
      rows: [
        row('study_room_name', nameLabel, s?.study_room_name || room?.study_room_name, textStatus(s?.study_room_name || room?.study_room_name)),
        row('slogan', '슬로건', s?.slogan || room?.slogan, textStatus(s?.slogan || room?.slogan)),
        row('lesson_place_type', '교습형태', place, textStatus(place)),
        row('audience', '주대상', audience, textStatus(audience)),
        row('main_subject', '주력과목', s?.main_subject_note || room?.main_subject_note, textStatus(s?.main_subject_note || room?.main_subject_note)),
        row('regions', '대표 홍보지역', regions.join(' · '), regions.length ? 'filled' : 'empty'),
      ],
    },
    {
      id: 'detail',
      title: RC_COPY.board.sections.detail,
      variant: 'detail',
      editSection: 'detail',
      rows: [
        row('intro_short', '한 줄 소개', s?.intro_short || room?.intro_short, textStatus(s?.intro_short || room?.intro_short)),
        row('intro_long', '공부방 소개 / 자랑', s?.intro_long, textStatus(s?.intro_long)),
        row('cover', '대표사진', photos.value, photos.status),
        row('extra_photos', '추가 사진', extraPhotos ? `${extraPhotos}장` : '', extraPhotos ? 'filled' : 'empty'),
        row('classes', '수업상세', classes.value, classes.status),
        row('lesson_operation', '수업운영방식', op, textStatus(op)),
        row('capacity', '타임별 원생수', cap, textStatus(cap)),
        row('fee', '월 평균 수업료', fee, textStatus(fee)),
        row('minutes', '1일 평균 수업시간', minutes, textStatus(minutes)),
        row('lessons_per_week', '주당 평균 수업회수', weekly, textStatus(weekly)),
        row('teaching_style', '지도 스타일', styles.join(' · '), styles.length ? 'filled' : 'empty'),
        row('teaching_style_note', '지도 스타일 추가설명', s?.teaching_style_note, textStatus(s?.teaching_style_note)),
        row('weekend', '주말 가능 여부', weekend.value, weekend.status),
        row('one_on_one', '1:1 가능 여부', oneToOne.value, oneToOne.status),
        row('card_pay', '카드결제 여부', cardPay.value, cardPay.status),
        row('cash', '현금영수증 여부', cash.value, cash.status),
        row('correction', '첨삭식 여부', correction.value, correction.status),
      ],
    },
    {
      id: 'detail2',
      title: RC_COPY.board.sections.detail2,
      variant: 'detail',
      editSection: 'detail2',
      rows: [
        row('feature_1', '경력특징 1', s?.feature_1 || room?.feature_1, textStatus(s?.feature_1 || room?.feature_1)),
        row('feature_2', '경력특징 2', s?.feature_2, textStatus(s?.feature_2)),
        row('feature_3', '경력특징 3', s?.feature_3, textStatus(s?.feature_3)),
        row('career_years', '교습경력', career, textStatus(career)),
        row('university', '출신대학', [s?.university_name, s?.major_name].filter(blank).join(' · '), textStatus(s?.university_name)),
        row('edu_office', '교육청등록증', edu.value, edu.status),
        row('biz_reg', '사업자등록증', biz.value, biz.status),
        row('franchise', '프랜차이즈 여부', fran.value, fran.status),
        row('facilities', '시설 · 환경', facilities.join(' · ') || blank(s?.facility_note), facilities.length || blank(s?.facility_note) ? 'filled' : 'empty'),
      ],
    },
  ];
}

/**
 * @param {object} s registerState
 * @param {import('./store.js').StudyRoomRecord} room
 */
export function buildRegistrationCheckModel(s, room) {
  const photos = photoSummary(s || {});
  const okMap = fieldOkMap(s, room, photos);
  const pickLeft = remainingCount(okMap, RC_PICK_FIELD_IDS);
  const primeLeft = remainingCount(okMap, RC_PRIME_FIELD_IDS);
  const board = buildBoard(s, room, photos);
  const checklistRows = board.filter((sec) => sec.variant === 'detail').flatMap((sec) => sec.rows);
  const filledRows = checklistRows.filter((r) => r.status === 'filled').length;
  const pct = checklistRows.length ? Math.round((filledRows / checklistRows.length) * 100) : 0;
  const previewItem = buildRegistrationCheckPreviewItem(s, room, photos);

  return {
    roomId: room.id,
    copy: RC_COPY,
    previewItem,
    header: {
      title: RC_COPY.title,
      lead: RC_COPY.lead,
      badges: [
        {
          id: 'basic',
          label: RC_COPY.badges.basicReg,
          value: RC_COPY.badges.basicDone,
          tone: 'ok',
        },
        {
          id: 'pick',
          value: pickLeft ? RC_COPY.badges.pickNeed(pickLeft) : RC_COPY.badges.pickReady,
          tone: pickLeft ? 'warn' : 'ok',
          layout: 'sentence',
        },
        {
          id: 'prime',
          value: primeLeft ? RC_COPY.badges.primeNeed(primeLeft) : RC_COPY.badges.primeReady,
          tone: primeLeft ? 'warn' : 'ok',
          layout: 'sentence',
        },
        {
          id: 'progress',
          label: RC_COPY.badges.progress,
          value: `${pct}%`,
          tone: pct >= 80 ? 'ok' : 'neutral',
        },
      ],
    },
    promo: {
      ...RC_COPY.promo,
      pickMissing: missingForTier(okMap, RC_PICK_FIELD_IDS, room.id),
      primeMissing: missingForTier(okMap, RC_PRIME_FIELD_IDS, room.id),
    },
    board,
    counts: { filledRows, totalRows: checklistRows.length, pct, pickLeft, primeLeft },
    photos,
  };
}

/**
 * 원본 탭 이동 — edit=1 + return=registration-check 로 등록점검 복귀 문맥 유지
 * @param {number} roomId
 * @param {'basic'|'detail'|'detail2'} section
 * @param {string} [focusId]
 */
export function registrationCheckTabHref(roomId, section, focusId) {
  return `#${withEmbedQuery(studyRoomSectionPath(roomId, section), {
    edit: true,
    returnRegistrationCheck: true,
    focus: focusId || undefined,
  })}`;
}

export const RC_LIGHT_FIELDS = {
  slogan: { step: 'basic', type: 'text', label: '슬로건', max: 80 },
  intro_short: { step: 'lesson', type: 'textarea', label: '한 줄 소개', max: 80, rows: 2 },
  teaching_style: { step: 'lesson', type: 'styles', label: '지도 스타일' },
  teaching_style_note: { step: 'lesson', type: 'textarea', label: '지도 스타일 추가설명', max: 200, rows: 3 },
  monthly_fee_manwon: { step: 'lesson', type: 'number', label: '월 평균 수업료', suffix: '만원', min: 1, max: 999 },
  minutes_per_lesson: { step: 'lesson', type: 'select', label: '1일 평균 수업시간', options: DAILY_LESSON_MINUTES },
  lessons_per_week: { step: 'lesson', type: 'select', label: '주당 평균 수업회수', options: WEEKLY_LESSON_COUNTS },
  weekend_available: { step: 'lesson', type: 'bool', label: '주말 가능 여부' },
  one_on_one_available: { step: 'lesson', type: 'bool', label: '1:1 가능 여부' },
  card_payment_available: { step: 'lesson', type: 'bool', label: '카드결제 여부' },
  cash_receipt_available: { step: 'lesson', type: 'bool', label: '현금영수증 여부' },
  correction_available: { step: 'lesson', type: 'bool', label: '첨삭식 여부' },
  feature_1: {
    step: 'career',
    type: 'text',
    label: '경력특징 1',
    hint: '상세정보2의「경력특징 1」과 같은 저장 값입니다. 카드 강조와 경력 소개에 함께 쓰입니다.',
    max: 40,
  },
};

export { TEACHING_STYLE_OPTIONS, DEFAULT_BASIC, DEFAULT_PICK, DEFAULT_PRIME };
