/**
 * ShopPage ViewModel — 고정 shape (공부방 정본)
 *
 * raw state/room 을 렌더에서 직접 만지지 않는다.
 * buildShopViewModel → renderShopViewModel 만 허용.
 *
 * 장기: classes 는 현재 공부방 수업행. 상위 개념은 offerings 여지를 둔다
 * (지금 당장 일반화하지 않음 — 필드명 classes 유지, meta.offeringsAlias 로만 표기).
 */

import { myshopInquiryStatusLine } from './inquiry-display.js';
import {
  ROOM_DEFAULT_BASIC,
  blank,
  boolOn,
  formatBoolFlag,
  formatLessonPlace,
  formatLessonOperation,
  formatCapacity,
  formatMonthlyFeeBand,
  formatClassFee,
  formatMinutesPerLesson,
  formatWeeklyCount,
  formatSchoolLevel,
  formatAttendanceDays,
  formatAudience,
  formatTeachingStyles,
  formatImageTypeLabel,
  collectRegionLabels,
  formatLivingAreaSentence,
  resolveFacilityNames,
  collectShopPhotos,
  splitHeroAndGallery,
} from './shop-formatters.js';

/** @readonly 섹션 키 — 문서가 아니라 코드 상수 */
export const SHOP_SECTION_KEYS = Object.freeze([
  'hero',
  'facts',
  'signature',
  'gallery',
  'classes',
  'career',
  'trust',
  'facilities',
  'livingArea',
  'social',
  'inquiry',
]);

/** @readonly 렌더 순서 = 키 순서 */
export const SHOP_SECTION_ORDER = SHOP_SECTION_KEYS;

/**
 * Fallback matrix — 애매한 입력의 우선순위 (코드 + 문서 SSOT)
 * @readonly
 */
export const SHOP_FALLBACK_MATRIX = Object.freeze({
  heroImage: Object.freeze([
    Object.freeze({ id: 'cover', when: 'images에 cover 있음', then: 'cover → Hero, 나머지 → Gallery' }),
    Object.freeze({
      id: 'no_cover_first_photo',
      when: '사진은 있으나 cover 없음',
      then: '배열 첫 사진 → Hero, 나머지 → Gallery(interior→facility→other)',
    }),
    Object.freeze({
      id: 'no_photos',
      when: '사진 0장',
      then: 'Hero = ROOM_DEFAULT_BASIC(isDefault), Gallery 섹션 숨김',
    }),
  ]),
  heroCopy: Object.freeze([
    Object.freeze({ id: 'both', when: 'slogan ≠ intro_short', then: 'slogan + lead(intro_short) 둘 다' }),
    Object.freeze({ id: 'slogan_only', when: 'slogan만', then: 'slogan만 표시' }),
    Object.freeze({ id: 'intro_only', when: 'intro_short만', then: 'lead로 intro_short (slogan 자리 비움)' }),
    Object.freeze({ id: 'same', when: 'slogan === intro_short', then: '한 번만 (slogan)' }),
  ]),
  classes: Object.freeze([
    Object.freeze({ id: 'cards', when: 'classes[] 1+', then: '카드 N개 반복 (첫 카드만 렌더 금지)' }),
    Object.freeze({
      id: 'no_classes_fee_tile',
      when: '수업상세 없음 · 월수업료만 있음',
      then: 'classes 섹션 숨김 · facts 가격대 타일만 (monthly_fee_manwon / price_amount)',
    }),
    Object.freeze({ id: 'empty', when: '수업·가격 모두 없음', then: 'classes 숨김 · 가격 타일 숨김' }),
  ]),
  livingArea: Object.freeze([
    Object.freeze({ id: 'one', when: '홍보지역 1개', then: '「X 생활권」 Hero+섹션' }),
    Object.freeze({ id: 'many', when: '홍보지역 2+', then: '첫 라벨 강조 · 나머지 칩' }),
    Object.freeze({ id: 'none', when: '0개', then: 'Hero 생활권·livingArea 섹션 숨김' }),
  ]),
});

/**
 * @param {object[]} photos
 * @returns {{ hero: object|null, gallery: object[], ruleId: string }}
 */
export function resolveHeroGalleryWithFallback(photos) {
  const list = Array.isArray(photos) ? photos : [];
  if (!list.length) {
    return { hero: null, gallery: [], ruleId: 'no_photos' };
  }
  const hasCover = list.some((p) => p.type === 'cover');
  const { hero, gallery } = splitHeroAndGallery(list);
  return {
    hero,
    gallery,
    ruleId: hasCover ? 'cover' : 'no_cover_first_photo',
  };
}

/**
 * @param {string} slogan
 * @param {string} introShort
 * @returns {{ slogan: string, lead: string, ruleId: string }}
 */
export function resolveHeroCopy(slogan, introShort) {
  const s = blank(slogan);
  const i = blank(introShort);
  if (s && i && s !== i) return { slogan: s, lead: i, ruleId: 'both' };
  if (s && i && s === i) return { slogan: s, lead: '', ruleId: 'same' };
  if (s) return { slogan: s, lead: '', ruleId: 'slogan_only' };
  if (i) return { slogan: '', lead: i, ruleId: 'intro_only' };
  return { slogan: '', lead: '', ruleId: 'empty' };
}

/**
 * @typedef {object} ShopPhotoVM
 * @property {string} src
 * @property {string} type
 * @property {string} title
 * @property {string} [caption]
 */

/**
 * @typedef {object} ShopViewModel
 * @property {{ name: string, slogan: string, lead: string, livingLine: string, chips: string[], imageSrc: string, imageIsDefault: boolean }} hero
 * @property {{ tiles: { label: string, value: string }[] }} facts
 * @property {{ styles: string[], styleNote: string, introLong: string }} signature
 * @property {{ items: ShopPhotoVM[] }} gallery
 * @property {{ items: object[] }} classes  — 공부방 수업행 (미래 offerings 자리)
 * @property {{ university: string, major: string, careerYears: string, academyYears: string, features: string[] }} career
 * @property {{ items: { label: string, value: string }[] }} trust
 * @property {{ names: string[], note: string }} facilities
 * @property {{ labels: string[], sentence: string }} livingArea
 * @property {{ links: { label: string, href: string }[] }} social
 * @property {{ line: string }} inquiry
 * @property {{ fallbacks: Record<string, string>, offeringsAlias: 'classes' }} meta
 */

/**
 * raw → 고정 ViewModel (렌더 전 유일한 매핑 지점)
 * @param {object} s registerState-like
 * @param {object} [room]
 * @returns {ShopViewModel}
 */
export function buildShopViewModel(s, room = {}) {
  const name = blank(s?.study_room_name ?? room?.study_room_name) || '공부방';
  const copy = resolveHeroCopy(s?.slogan ?? room?.slogan, s?.intro_short ?? room?.intro_short);
  const introLong = blank(s?.intro_long ?? room?.intro_long);
  const subject = blank(s?.main_subject_note ?? room?.main_subject_note);
  const place = formatLessonPlace(s?.lesson_place_type);
  const audience = formatAudience(s?.primary_school_levels, room?.grade_band);
  const regionLabels = collectRegionLabels(s, room);
  const livingSentence = formatLivingAreaSentence(regionLabels);
  const livingRule =
    regionLabels.length === 0 ? 'none' : regionLabels.length === 1 ? 'one' : 'many';

  const photos = collectShopPhotos(s);
  const photoSplit = resolveHeroGalleryWithFallback(photos);
  const heroSrc = photoSplit.hero?.src || ROOM_DEFAULT_BASIC;
  const imageIsDefault = !photoSplit.hero;

  const styles = formatTeachingStyles(s?.teaching_style_ids, s?.teaching_style);
  const styleNote = blank(s?.teaching_style_note);

  const fee = formatMonthlyFeeBand(s?.monthly_fee_manwon, room?.price_amount);
  const tiles = [
    { label: '과목', value: subject },
    { label: '대상', value: audience },
    { label: '교습형태', value: place },
    { label: '원생수', value: formatCapacity(s?.capacity_per_time) },
    { label: '가격대', value: fee },
    { label: '수업형태', value: formatLessonOperation(s?.lesson_operation_type) },
    { label: '1일 수업', value: formatMinutesPerLesson(s?.minutes_per_lesson) },
    { label: '주당 회수', value: formatWeeklyCount(s?.lessons_per_week) },
    { label: '1:1', value: formatBoolFlag(s?.one_on_one_available, '가능') },
    { label: '주말', value: formatBoolFlag(s?.weekend_available, '가능') },
    { label: '첨삭', value: formatBoolFlag(s?.correction_available, '운영') },
    { label: '카드결제', value: formatBoolFlag(s?.card_payment_available, '가능') },
    { label: '현금영수증', value: formatBoolFlag(s?.cash_receipt_available, '가능') },
  ].filter((t) => t.value);

  /** @type {object[]} */
  const classItems = [];
  const rawClasses = Array.isArray(s?.classes) ? s.classes : [];
  for (const c of rawClasses) {
    const title = blank(c.class_name || c.name);
    const subj = blank(c.subject_label || c.subject_name || c.subject || c.subject_custom);
    const level = formatSchoolLevel(c.school_level);
    const grade = blank(c.grade_band);
    const days = formatAttendanceDays(c.attendance_days);
    const perWeek = formatWeeklyCount(c.lessons_per_week);
    const classFee = formatClassFee(c.monthly_fee ?? c.fee);
    const feeNote = blank(c.fee_note);
    const note = blank(c.lesson_note);
    if (!title && !subj && !classFee && !note) continue;
    classItems.push({
      title: title || subj || '수업',
      subject: subj,
      level,
      grade,
      days,
      perWeek,
      fee: classFee,
      feeNote,
      note,
      toplineParts: [level, subj, perWeek, classFee].filter(Boolean),
    });
  }
  const classesRule = classItems.length
    ? 'cards'
    : fee
      ? 'no_classes_fee_tile'
      : 'empty';

  const galleryItems = photoSplit.gallery.map((g) => ({
    src: g.src,
    type: g.type,
    title: g.title || formatImageTypeLabel(g.type),
    caption: g.title || formatImageTypeLabel(g.type),
  }));

  const trustItems = [];
  if (boolOn(s?.education_office_registered)) {
    trustItems.push({
      label: '교육청 등록',
      value: blank(s.education_office_reg_no) ? `완료 · ${blank(s.education_office_reg_no)}` : '완료',
    });
  }
  if (boolOn(s?.business_registration_available)) {
    trustItems.push({ label: '사업자등록', value: '확인' });
  }
  if (s?.franchise_flag === true || s?.franchise_flag === 1) {
    trustItems.push({ label: '프랜차이즈', value: blank(s.franchise_name) || '예' });
  }
  const proofs = Array.isArray(s?.other_proof_notes)
    ? s.other_proof_notes.map(blank).filter(Boolean)
    : blank(s?.other_proof_notes)
      ? [blank(s.other_proof_notes)]
      : [];
  if (proofs.length) trustItems.push({ label: '기타 증빙', value: proofs.join(' · ') });

  const facNames = resolveFacilityNames(s || {});
  const facNoteRaw = blank(s?.facility_note);
  const facNote =
    !facNames.length && facNoteRaw && !/^[가-힣A-Za-z0-9]+(?:[·,][가-힣A-Za-z0-9]+)+$/.test(facNoteRaw)
      ? facNoteRaw
      : facNames.length
        ? facNoteRaw
        : '';

  const socialLinks = [
    blank(s?.youtube_url) && { label: '유튜브', href: blank(s.youtube_url) },
    blank(s?.facebook_url) && { label: '페이스북', href: blank(s.facebook_url) },
    blank(s?.instagram_url) && { label: '인스타그램', href: blank(s.instagram_url) },
  ].filter(Boolean);

  return {
    hero: {
      name,
      slogan: copy.slogan,
      lead: copy.lead,
      livingLine: livingSentence,
      chips: [audience, subject, place].filter(Boolean),
      imageSrc: heroSrc,
      imageIsDefault,
    },
    facts: { tiles },
    signature: { styles, styleNote, introLong },
    gallery: { items: galleryItems },
    classes: { items: classItems },
    career: {
      university: blank(s?.university_name),
      major: blank(s?.major_name),
      careerYears: blank(s?.career_years),
      academyYears: blank(s?.academy_career_years),
      features: [s?.feature_1, s?.feature_2, s?.feature_3].map(blank).filter(Boolean),
    },
    trust: { items: trustItems },
    facilities: { names: facNames, note: facNote },
    livingArea: { labels: regionLabels, sentence: livingSentence },
    social: { links: socialLinks },
    inquiry: { line: myshopInquiryStatusLine(s?.inquiry_status || room?.inquiry_status) },
    meta: {
      fallbacks: {
        heroImage: photoSplit.ruleId,
        heroCopy: copy.ruleId,
        classes: classesRule,
        livingArea: livingRule,
      },
      /** 미래 과외쌤 확장 시 offerings 로 옮길 자리 — 현재 값 'classes' */
      offeringsAlias: 'classes',
    },
  };
}

/** 섹션이 렌더될 내용이 있는지 */
export function shopSectionHasContent(vm, key) {
  switch (key) {
    case 'hero':
      return true;
    case 'facts':
      return vm.facts.tiles.length > 0;
    case 'signature':
      return vm.signature.styles.length > 0 || !!vm.signature.styleNote || !!vm.signature.introLong;
    case 'gallery':
      return vm.gallery.items.length > 0;
    case 'classes':
      return vm.classes.items.length > 0;
    case 'career': {
      const c = vm.career;
      return !!(c.university || c.major || c.careerYears || c.academyYears || c.features.length);
    }
    case 'trust':
      return vm.trust.items.length > 0;
    case 'facilities':
      return vm.facilities.names.length > 0 || !!vm.facilities.note;
    case 'livingArea':
      return vm.livingArea.labels.length > 0;
    case 'social':
      return vm.social.links.length > 0;
    case 'inquiry':
      return !!vm.inquiry.line;
    default:
      return false;
  }
}

export function visibleShopSections(vm) {
  return SHOP_SECTION_ORDER.filter((k) => shopSectionHasContent(vm, k));
}
