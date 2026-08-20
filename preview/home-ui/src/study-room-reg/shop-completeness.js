/**
 * 마이샵(ShopPage) 완성도 — 등록점검에 되먹임
 * 공개 필수와 별도: 「왜 샵이 비어/얇아 보이는지」를 직접 알려 준다.
 * 정본: docs/internal/54-shop-page-lock.md
 */

import { blank, collectShopPhotos, formatMonthlyFeeBand, formatTeachingStyles, collectRegionLabels } from './shop-formatters.js';

/**
 * @typedef {object} ShopCompletenessDef
 * @property {string} id
 * @property {string} label
 * @property {'basic'|'detail'} section
 * @property {string} shopImpact
 * @property {string} emptyWhy  누락 시 학부모 화면에 생기는 결과 (등록점검 상단 문장용)
 * @property {string} emptyShort  상단 요약용 짧은 라벨 (예: 대표사진 없음)
 */

/** @type {ShopCompletenessDef[]} */
export const SHOP_COMPLETENESS_DEFS = Object.freeze([
  {
    id: 'cover',
    label: '대표사진',
    section: 'detail',
    shopImpact: 'Hero 대표 이미지',
    emptyShort: '대표사진 없음',
    emptyWhy: '대표사진이 없어 Hero가 기본 이미지로만 보입니다',
  },
  {
    id: 'intro_short',
    label: '한 줄 소개',
    section: 'detail',
    shopImpact: 'Hero 리드 문구',
    emptyShort: '한 줄 소개 없음',
    emptyWhy: '한 줄 소개가 없어 Hero 리드가 비어 보입니다',
  },
  {
    id: 'classes',
    label: '수업상세',
    section: 'detail',
    shopImpact: '수업 카드 섹션',
    emptyShort: '수업 카드 없음',
    emptyWhy: '수업 카드가 없어 「수업 안내」 섹션 전체가 숨겨집니다',
  },
  {
    id: 'teaching_style',
    label: '지도 스타일',
    section: 'detail',
    shopImpact: '매력(Signature) 칩',
    emptyShort: '지도 스타일 없음',
    emptyWhy: '지도 스타일이 없어 「이 공부방의 매력」이 약하거나 숨겨집니다',
  },
  {
    id: 'fee',
    label: '월 평균 수업료',
    section: 'detail',
    shopImpact: 'Quick Facts 가격대',
    emptyShort: '월 수업료 없음',
    emptyWhy: '월 평균 수업료가 없어 Quick Facts 가격대 타일이 빠집니다',
  },
  {
    id: 'living',
    label: '생활권(홍보지역)',
    section: 'basic',
    shopImpact: 'Hero·위치 생활권 문장',
    emptyShort: '생활권 약함',
    emptyWhy: '홍보지역이 없어 생활권 문장이 Hero·위치에서 빠집니다',
  },
]);

/**
 * @param {object} s registerState-like
 * @param {object} [room]
 * @returns {Array<ShopCompletenessDef & { ok: boolean }>}
 */
export function getShopCompletenessItems(s, room = {}) {
  const photos = collectShopPhotos(s || {});
  const hasCover = photos.some((p) => p.type === 'cover');
  const classes = Array.isArray(s?.classes) ? s.classes : [];
  const hasClassCard = classes.some((c) => {
    const t = blank(c?.class_name || c?.name);
    const sub = blank(c?.subject_name || c?.subject || c?.subject_label);
    const fee = blank(c?.monthly_fee ?? c?.fee);
    return !!(t || sub || fee);
  });
  const styles = formatTeachingStyles(s?.teaching_style_ids, s?.teaching_style);
  const fee = formatMonthlyFeeBand(s?.monthly_fee_manwon, room?.price_amount);
  const regions = collectRegionLabels(s || {}, room);

  const checks = {
    cover: Array.isArray(s?.images) && s.images.length ? hasCover : Boolean(room?.has_representative_image),
    intro_short: !!blank(s?.intro_short || room?.intro_short),
    classes: hasClassCard,
    teaching_style: styles.length > 0 || !!blank(s?.teaching_style_note),
    fee: !!fee,
    living: regions.length > 0 || Boolean(room?.has_regions && blank(room?.region_label)),
  };

  return SHOP_COMPLETENESS_DEFS.map((d) => ({
    ...d,
    ok: !!checks[d.id],
  }));
}

/**
 * @param {object} s
 * @param {object} [room]
 */
export function getShopCompletenessSummary(s, room) {
  const items = getShopCompletenessItems(s, room);
  const miss = items.filter((i) => !i.ok);
  const done = items.filter((i) => i.ok);
  /** 미완료를 위에 — 등록점검에서 바로 보이게 */
  const sorted = [...miss, ...done];
  const reasonLine =
    miss.length > 0
      ? `지금 샵이 얇아 보이는 이유: ${miss.map((m) => m.emptyShort).join(' · ')}`
      : '마이샵에 핵심 항목이 채워져 있습니다. 미리보기로 확인해 보세요.';

  return {
    items: sorted,
    missItems: miss,
    doneCount: done.length,
    totalCount: items.length,
    missing: miss.map((i) => i.label),
    weak: miss.length > 0,
    reasonLine,
    /** 상단 강조용: 누락 emptyWhy 최대 3개 */
    reasonDetails: miss.slice(0, 3).map((m) => m.emptyWhy),
  };
}
