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
import { getPublishReadiness } from './store.js';
import { studyRoomSectionPath } from './router.js';
import { withEditQuery } from './embedded-panels.js';
import {
  RC_COPY,
  RC_PICK_FIELD_IDS,
  RC_PRIME_FIELD_IDS,
  RC_PROMO_MISSING_DEFS,
} from './registration-check-copy.js';

const DEFAULT_BASIC = '/assets/brand/room-card-default-basic.svg';
const DEFAULT_PICK = '/assets/brand/room-card-default-pick.svg';
const DEFAULT_PRIME = '/assets/brand/room-card-default-prime.svg';

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

function light(field, filled) {
  return { kind: 'light', field, label: filled ? RC_COPY.actions.edit : RC_COPY.actions.fill };
}

function heavy(section, filled, manage = false) {
  const labels = {
    basic: RC_COPY.actions.gotoBasic,
    detail: manage || filled ? RC_COPY.actions.gotoDetailManage : RC_COPY.actions.gotoDetail,
    detail2: manage || filled ? RC_COPY.actions.gotoDetail2Manage : RC_COPY.actions.gotoDetail2,
  };
  return { kind: 'heavy', section, label: labels[section] || RC_COPY.actions.fill };
}

function coverAction(photos) {
  if (!photos?.hasCover) {
    return { kind: 'cover', label: photos?.count > 0 ? '대표사진 지정' : RC_COPY.actions.photoFill };
  }
  /** 추가 사진 관리는 상세정보1(홍보사진 그리드) 정본 */
  if (photos.count <= 1) return { kind: 'heavy', section: 'detail', label: RC_COPY.actions.photoMore };
  return { kind: 'heavy', section: 'detail', label: RC_COPY.actions.photoManage };
}

function row(id, label, value, status, action) {
  return { id, label, value: blank(value) ? String(value) : '', status, action };
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

function promoMissing(okMap, photos) {
  return RC_PROMO_MISSING_DEFS.filter((d) => !okMap[d.id]).map((d) => {
    let action;
    if (d.id === 'cover') action = coverAction(photos);
    else if (d.id === 'intro_short' || d.id === 'fee' || d.id === 'lessons_per_week' || d.id === 'teaching_style' || d.id === 'teaching_style_note') {
      action = light(d.id === 'fee' ? 'monthly_fee_manwon' : d.id, false);
    } else if (d.id === 'feature_1') action = light('feature_1', false);
    else if (d.id === 'classes' || d.id === 'intro_long') action = heavy('detail', false, d.id === 'classes');
    else action = heavy('detail', false);
    return {
      id: d.id,
      label: d.label,
      hint: d.hint,
      status: 'empty',
      statusLabel: RC_COPY.status.empty,
      action,
    };
  });
}

function basicCard(s, room, photos) {
  const regions = collectRegionLabels(s, room);
  return {
    kicker: RC_COPY.promo.basicKicker,
    name: blank(s?.study_room_name || room?.study_room_name) || '공부방명 미입력',
    intro: blank(s?.intro_short || room?.intro_short || s?.slogan || room?.slogan),
    meta: [
      blank(s?.main_subject_note || room?.main_subject_note),
      formatCapacity(s?.capacity_per_time || room?.capacity_per_time),
      formatMonthlyFeeBand(s?.monthly_fee_manwon, room?.price_amount || s?.price_amount),
    ].filter(Boolean),
    region: regions[0] || '',
    imageSrc: photos.coverSrc || DEFAULT_BASIC,
    imageDefault: !photos.coverSrc,
    imageNote: photos.coverSrc ? RC_COPY.promo.realPhotoNote : RC_COPY.promo.defaultPhotoNote,
  };
}

function sampleCard(tier, photos) {
  const sample = tier === 'pick' ? RC_COPY.pickSample : RC_COPY.primeSample;
  const fallback = tier === 'pick' ? DEFAULT_PICK : DEFAULT_PRIME;
  return {
    kicker: tier === 'pick' ? RC_COPY.promo.pickKicker : RC_COPY.promo.primeKicker,
    badge: tier === 'pick' ? 'PICK' : 'PRIME',
    name: sample.name,
    intro: sample.intro,
    meta: sample.meta,
    extra: sample.extra || '',
    imageSrc: photos.coverSrc || fallback,
    imageDefault: !photos.coverSrc,
  };
}

function buildBoard(s, room, photos) {
  const styles = formatTeachingStyles(s?.teaching_style_ids, s?.teaching_style);
  const fee = formatMonthlyFeeBand(s?.monthly_fee_manwon, room?.price_amount || s?.price_amount);
  const regions = collectRegionLabels(s, room);
  const facilities = resolveFacilityNames(s);
  const classes = classSummary(s);
  const feature1 = blank(s?.feature_1 || room?.feature_1);
  const careerFeatures = [s?.feature_1, s?.feature_2, s?.feature_3].map(blank).filter(Boolean);
  const careerFeatureDisplay = [s?.feature_1, s?.feature_2, s?.feature_3]
    .map((v, i) => {
      const t = blank(v);
      return t ? `${i + 1}. ${t}` : '';
    })
    .filter(Boolean)
    .join(' · ');
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
      rows: [
        row('study_room_name', nameLabel, s?.study_room_name || room?.study_room_name, textStatus(s?.study_room_name || room?.study_room_name), heavy('basic', !!blank(s?.study_room_name || room?.study_room_name))),
        row('slogan', '슬로건', s?.slogan || room?.slogan, textStatus(s?.slogan || room?.slogan), light('slogan', !!blank(s?.slogan || room?.slogan))),
        row('lesson_place_type', '교습형태', place, textStatus(place), heavy('basic', !!place)),
        row('audience', '주대상', audience, textStatus(audience), heavy('basic', !!audience)),
        row('main_subject', '주력과목', s?.main_subject_note || room?.main_subject_note, textStatus(s?.main_subject_note || room?.main_subject_note), heavy('basic', !!blank(s?.main_subject_note || room?.main_subject_note))),
        row('regions', '대표 홍보지역', regions.join(' · '), regions.length ? 'filled' : 'empty', heavy('basic', regions.length > 0)),
      ],
    },
    {
      id: 'detail',
      title: RC_COPY.board.sections.detail,
      rows: [
        row('intro_short', '한 줄 소개', s?.intro_short || room?.intro_short, textStatus(s?.intro_short || room?.intro_short), light('intro_short', !!blank(s?.intro_short || room?.intro_short))),
        row('intro_long', '공부방 소개 / 자랑', s?.intro_long, textStatus(s?.intro_long), heavy('detail', !!blank(s?.intro_long))),
        row(
          'feature_1',
          '특징성 문구',
          feature1,
          textStatus(feature1),
          light('feature_1', !!feature1),
        ),
        // feature_1 UI 힌트는 드로어 라벨·누락 hint에 명시 (상세2 경력특징1과 동일 컬럼)
        row('cover', '대표사진', photos.value, photos.status, coverAction(photos)),
        row('extra_photos', '추가 사진', extraPhotos ? `${extraPhotos}장` : '', extraPhotos ? 'filled' : 'empty', coverAction(photos)),
        row('lesson_operation', '수업운영방식', op, textStatus(op), heavy('detail', !!op)),
        row('capacity', '타임별 원생수', cap, textStatus(cap), heavy('detail', !!cap)),
        row('fee', '월 평균 수업료', fee, textStatus(fee), light('monthly_fee_manwon', !!fee)),
        row('minutes', '1일 평균 수업시간', minutes, textStatus(minutes), light('minutes_per_lesson', !!minutes)),
        row('weekly', '주당 평균 수업회수', weekly, textStatus(weekly), light('lessons_per_week', !!weekly)),
        row('weekend', '주말 가능 여부', weekend.value, weekend.status, light('weekend_available', weekend.status === 'filled')),
        row('one_on_one', '1:1 가능 여부', oneToOne.value, oneToOne.status, light('one_on_one_available', oneToOne.status === 'filled')),
        row('card_pay', '카드결제 여부', cardPay.value, cardPay.status, light('card_payment_available', cardPay.status === 'filled')),
        row('cash', '현금영수증 여부', cash.value, cash.status, light('cash_receipt_available', cash.status === 'filled')),
        row('correction', '첨삭식 여부', correction.value, correction.status, light('correction_available', correction.status === 'filled')),
      ],
    },
    {
      id: 'detail2',
      title: RC_COPY.board.sections.detail2,
      rows: [
        row('teaching_style', '지도 스타일', styles.join(' · '), styles.length ? 'filled' : 'empty', light('teaching_style', styles.length > 0)),
        row('teaching_style_note', '지도 스타일 추가설명', s?.teaching_style_note, textStatus(s?.teaching_style_note), light('teaching_style_note', !!blank(s?.teaching_style_note))),
        row('career_years', '교습경력', career, textStatus(career), heavy('detail2', !!career)),
        row('university', '출신대학', [s?.university_name, s?.major_name].filter(blank).join(' · '), textStatus(s?.university_name), heavy('detail2', !!blank(s?.university_name))),
        row(
          'career_features',
          '경력특징 (1~3)',
          careerFeatureDisplay,
          careerFeatures.length ? (careerFeatures.length >= 2 ? 'filled' : 'partial') : 'empty',
          heavy('detail2', careerFeatures.length > 0, true),
        ),
        // 1번은 위「특징성 문구」와 동일 DB 필드 — 상세2에서 묶음 편집
        row('edu_office', '교육청등록증', edu.value, edu.status, heavy('detail2', edu.status !== 'empty')),
        row('facilities', '시설 · 환경', facilities.join(' · ') || blank(s?.facility_note), facilities.length || blank(s?.facility_note) ? 'filled' : 'empty', heavy('detail2', facilities.length > 0 || !!blank(s?.facility_note))),
      ],
    },
    {
      id: 'extras',
      title: RC_COPY.board.sections.extras,
      rows: [
        row('classes', '수업상세', classes.value, classes.status, { kind: 'heavy', section: 'detail', label: classes.count ? RC_COPY.actions.classManage : RC_COPY.actions.gotoDetail }),
        row('biz_reg', '사업자등록증', biz.value, biz.status, heavy('detail2', biz.status !== 'empty', true)),
        row('edu_no', '등록번호', s?.education_office_reg_no, textStatus(s?.education_office_reg_no), heavy('detail2', !!blank(s?.education_office_reg_no))),
        row('franchise', '프랜차이즈 여부', fran.value, fran.status, heavy('detail2', fran.status !== 'empty')),
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
  const readiness = getPublishReadiness(room);
  const board = buildBoard(s, room, photos);
  const allRows = board.flatMap((sec) => sec.rows);
  const filledRows = allRows.filter((r) => r.status === 'filled').length;
  const pct = allRows.length ? Math.round((filledRows / allRows.length) * 100) : 0;
  const missing = promoMissing(okMap, photos);

  return {
    roomId: room.id,
    copy: RC_COPY,
    header: {
      title: RC_COPY.title,
      lead: RC_COPY.lead,
      badges: [
        {
          id: 'publish',
          label: RC_COPY.badges.publishOk,
          value: readiness.canPublish ? RC_COPY.badges.publishYes : RC_COPY.badges.publishNo,
          tone: readiness.canPublish ? 'ok' : 'warn',
        },
        {
          id: 'pick',
          label: RC_COPY.badges.pick,
          value: pickLeft ? RC_COPY.badges.remaining(pickLeft) : RC_COPY.badges.pickReady,
          tone: pickLeft ? 'warn' : 'ok',
        },
        {
          id: 'prime',
          label: RC_COPY.badges.prime,
          value: primeLeft ? RC_COPY.badges.remaining(primeLeft) : RC_COPY.badges.primeReady,
          tone: primeLeft ? 'warn' : 'ok',
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
      missing,
      cards: {
        basic: basicCard(s, room, photos),
        pick: sampleCard('pick', photos),
        prime: sampleCard('prime', photos),
      },
      plansHref: `#/plans/positions?provider_type=study_room&provider_id=${room.id}`,
    },
    board,
    counts: { filledRows, totalRows: allRows.length, pct, pickLeft, primeLeft },
    photos,
  };
}

/**
 * 원본 탭 이동 — edit=1 + return=registration-check 로 등록점검 복귀 문맥 유지
 * @param {number} roomId
 * @param {'basic'|'detail'|'detail2'} section
 */
export function registrationCheckTabHref(roomId, section) {
  const base = withEditQuery(studyRoomSectionPath(roomId, section), true);
  const join = base.includes('?') ? '&' : '?';
  return `#${base}${join}return=registration-check`;
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
    label: '특징성 문구',
    hint: '상세정보2의「경력특징 1」과 같은 저장 값입니다. 카드 강조와 경력 소개에 함께 쓰입니다.',
    max: 40,
  },
};

export { TEACHING_STYLE_OPTIONS, DEFAULT_BASIC, DEFAULT_PICK, DEFAULT_PRIME };
