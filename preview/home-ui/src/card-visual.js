/**
 * 카드 이모티콘·아이콘·배지 SSOT (2026-08-21 잠금 · 2026-08-22 paid_badges 계약)
 *
 * 최우선: Notion「상위기획-공부방 샵 페이지·카드 연동 구현 컨셉」§18
 * 교차: 11장 §2-0 · 18장 §0-A · docs/internal/57-paid-badges-api-contract.md
 *
 * 층위 (섞지 않음)
 *  A 기능 = 찜 / 비교 / 쪽지
 *  B 통계 = 추천 수 / 후기 개수
 *  C 제거 = 좋아요
 *  D 자동부여 = New (신규 1주, 판매 아님)
 *  E 무료 신뢰 = 교육청·사업자·졸업·경력·증빙
 *  F 유료 주목 = 공부방 Hot·단과 / 과외쌤 Hot·쪽집게·SKY
 *
 * 금지: 공부방 유료축에「전문」사용 · 추천/후기를 광고배지로 취급
 * 유료 배지 정본: API paid_badges[] 만 (클라이언트 entitlement 추론 금지)
 */

/** @typedef {'study_room'|'tutor'|'student'} CardKind */

export const CARD_VISUAL_POLICY = Object.freeze({
  lockedAt: '2026-08-21',
  actions: Object.freeze(['wish', 'compare', 'message']),
  stats: Object.freeze(['recommend', 'review']),
  removed: Object.freeze(['like']),
  auto: Object.freeze(['new']),
  paidStudyRoom: Object.freeze(['hot', 'subject_track']),
  /** API 정본 코드 — jjokjipge (표시: 쪽집게). picked는 구 alias */
  paidTutor: Object.freeze(['hot', 'jjokjipge', 'sky']),
  /** 공부방 유료축에 금지 — 헤드라인 카피만 허용 */
  forbiddenPaidStudyRoomLabels: Object.freeze(['전문']),
  newBadgeDays: 7,
});

export const PAID_BADGE_LABELS = Object.freeze({
  hot: 'Hot',
  subject_track: '단과',
  jjokjipge: '쪽집게',
  sky: 'SKY',
  new: 'New',
});

/** @deprecated 옛 광고배지 카탈로그 id — 통계/자동부여로 이전됨 */
export const DEPRECATED_PAID_BADGE_PRODUCT_IDS = Object.freeze(['recommend', 'new', 'picked']);

/**
 * @param {string|Date|null|undefined} dateVal
 * @param {number} [nowMs]
 */
export function isWithinNewBadgeWindow(dateVal, nowMs = Date.now()) {
  if (!dateVal) return false;
  const t = dateVal instanceof Date ? dateVal.getTime() : Date.parse(String(dateVal));
  if (!Number.isFinite(t)) return false;
  const days = CARD_VISUAL_POLICY.newBadgeDays;
  return nowMs - t >= 0 && nowMs - t < days * 24 * 60 * 60 * 1000;
}

/**
 * 신규 자동배지 — published_at 우선, 없으면 created_at / registered_at
 * @param {object} item
 * @param {number} [nowMs]
 */
export function resolveAutoNewBadge(item, nowMs = Date.now()) {
  const dateVal = item?.published_at || item?.created_at || item?.registered_at || null;
  if (!isWithinNewBadgeWindow(dateVal, nowMs)) return null;
  return { id: 'new', label: PAID_BADGE_LABELS.new, layer: 'auto' };
}

/**
 * API/플래그 코드를 정본 id로 정규화
 * @param {string} raw
 * @param {CardKind} kind
 */
export function normalizePaidBadgeCode(raw, kind) {
  let id = String(raw).trim().toLowerCase();
  if (!id || id === 'recommend' || id === 'new') return null;
  if (id === '전문' || id === 'specialty') return null;
  if (id === '단과' || id === 'subject') id = 'subject_track';
  if (id === '쪽집게' || id === 'picked' || id === 'jjokjipgae') id = 'jjokjipge';
  const allowed =
    kind === 'study_room'
      ? CARD_VISUAL_POLICY.paidStudyRoom
      : kind === 'tutor'
        ? CARD_VISUAL_POLICY.paidTutor
        : [];
  return allowed.includes(id) ? id : null;
}

/**
 * 유료 주목 배지 — item.paid_badges | badge_codes | badge_* 플래그만 사용.
 * SKY는 대학명 자동추론 금지(유료축). 사실 학력은 신뢰/본문 필드.
 * @param {CardKind} kind
 * @param {object} item
 */
export function resolvePaidPromoBadges(kind, item) {
  const allowed =
    kind === 'study_room'
      ? CARD_VISUAL_POLICY.paidStudyRoom
      : kind === 'tutor'
        ? CARD_VISUAL_POLICY.paidTutor
        : [];
  if (!allowed.length) return [];

  /** @type {string[]} */
  let codes = [];
  if (Array.isArray(item?.paid_badges)) {
    codes = item.paid_badges.map((x) => String(x));
  } else if (Array.isArray(item?.badge_codes)) {
    codes = item.badge_codes.map((x) => String(x));
  } else {
    for (const id of allowed) {
      const flag = item?.[`badge_${id}`] ?? item?.[id];
      if (flag === true || flag === 1 || flag === '1') codes.push(id);
    }
    // 구 alias 플래그
    if (kind === 'tutor' && (item?.badge_picked === true || item?.picked === true)) {
      codes.push('jjokjipge');
    }
  }

  const out = [];
  const seen = new Set();
  for (const raw of codes) {
    const id = normalizePaidBadgeCode(raw, kind);
    if (!id || seen.has(id) || !PAID_BADGE_LABELS[id]) continue;
    seen.add(id);
    out.push({ id, label: PAID_BADGE_LABELS[id], layer: 'paid' });
  }
  return out;
}

/**
 * 무료 신뢰층 — 기능칩(1:1·주말) 혼입 금지
 * @param {CardKind} kind
 * @param {object} item
 * @returns {string[]}
 */
export function resolveTrustBadgeLabels(kind, item) {
  const b = [];
  if (kind === 'study_room') {
    if (item?.education_office_registered) b.push('교육청등록');
    if (item?.business_registration_available || item?.business_registered) b.push('사업자');
    const years = Number(item?.career_years);
    if (Number.isFinite(years) && years > 0) {
      b.push(years >= 10 ? `${years}년 경력` : `경력 ${years}년`);
    }
    if (item?.proof_document_available || (item?.verification_doc_count ?? 0) > 0) {
      b.push('증빙');
    }
  } else if (kind === 'tutor') {
    if (item?.university_status === 'graduated') b.push('졸업');
    if (item?.career_year_band === 'y10_plus') b.push('경력 10년+');
    else if (item?.career_year_band) {
      const map = {
        y1_3: '경력 1~3년',
        y4_6: '경력 4~6년',
        y7_10: '경력 7~10년',
      };
      b.push(map[item.career_year_band] || `경력`);
    }
    if (item?.proof_document_available || (item?.verification_doc_count ?? 0) > 0) {
      b.push('증빙');
    }
  }
  return b.slice(0, 4);
}

/**
 * @param {object} item
 * @returns {{ recommend: number, review: number, showReview: boolean }}
 */
export function resolveCardStats(item) {
  const recommend = Math.max(0, Number(item?.recommend_count) || 0);
  const review = Math.max(0, Number(item?.review_count) || 0);
  return {
    recommend,
    review,
    showReview: review >= 1,
  };
}

/**
 * @param {CardKind} kind
 * @param {object} item
 * @param {{ nowMs?: number }} [opts]
 */
export function resolveCardVisualLayers(kind, item, opts = {}) {
  const nowMs = opts.nowMs ?? Date.now();
  const autoNew = resolveAutoNewBadge(item, nowMs);
  const paid = resolvePaidPromoBadges(kind, item);
  const promo = [...(autoNew ? [autoNew] : []), ...paid];
  return {
    policyVersion: CARD_VISUAL_POLICY.lockedAt,
    kind,
    promoBadges: promo,
    trustBadges: resolveTrustBadgeLabels(kind, item),
    stats: resolveCardStats(item),
    actions: CARD_VISUAL_POLICY.actions,
  };
}

/**
 * HTML — 광고/자동 배지 줄
 * @param {{ id: string, label: string }[]} badges
 * @param {(s: string) => string} esc
 */
export function renderPromoBadgeRow(badges, esc) {
  if (!badges?.length) return '';
  return `<div class="card-visual__promo" aria-label="주목·신규 배지">${badges
    .map(
      (b) =>
        `<span class="card-visual__promo-badge card-visual__promo-badge--${esc(b.id)}">${esc(b.label)}</span>`,
    )
    .join('')}</div>`;
}

/**
 * HTML — 신뢰 배지 줄
 * @param {string[]} labels
 * @param {(s: string) => string} esc
 */
export function renderTrustBadgeRow(labels, esc) {
  if (!labels?.length) return '';
  return `<div class="card-visual__trust" aria-label="신뢰 배지">${labels
    .map((b) => `<span class="card-visual__trust-badge">${esc(b)}</span>`)
    .join('')}</div>`;
}

/**
 * 확대카드·비교 상단용 — 미니카드와 동일 층위 HTML (시설/특징 혼입 금지)
 * @param {CardKind} kind
 * @param {object} item
 * @param {(s: string) => string} esc
 */
export function renderCardVisualPolicyBlock(kind, item, esc) {
  if (kind === 'student') return '';
  const layers = resolveCardVisualLayers(kind, item);
  const promo = renderPromoBadgeRow(layers.promoBadges, esc);
  const trust = renderTrustBadgeRow(layers.trustBadges, esc);
  const rec = layers.stats.recommend;
  const rev = layers.stats.review;
  const statsBits = [
    `<span class="card-visual__stat" data-stat="recommend">추천 ${esc(String(rec))}</span>`,
  ];
  if (layers.stats.showReview) {
    const id = Number(item?.id || 0);
    statsBits.push(
      id
        ? `<button type="button" class="card-visual__stat card-visual__stat--btn" data-stat="review" data-action="open-review-sheet" data-item-kind="${esc(kind)}" data-item-id="${esc(String(id))}">후기 ${esc(String(rev))}</button>`
        : `<span class="card-visual__stat" data-stat="review">후기 ${esc(String(rev))}</span>`,
    );
  }
  const stats = `<div class="card-visual__stats" aria-label="통계">${statsBits.join('')}</div>`;
  const disc = `<p class="card-visual__disclaimer">플랫폼 보증 아님</p>`;
  return `<div class="card-visual__policy-block" data-card-visual-ssot="1">${promo}${trust}${stats}${disc}</div>`;
}

/** 정책 회귀용 — 「전문」이 유료 라벨로 쓰이면 true */
export function paidLabelsContainForbiddenSpecialty(labels) {
  return (labels || []).some((l) => String(l).trim() === '전문');
}
