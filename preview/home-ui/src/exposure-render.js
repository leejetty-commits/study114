import { renderSectionHeading } from './section-headings.js';
import {
  formatMonthlyWon,
  formatTutorFeeCard,
  formatGender,
  formatCareerYearBand,
  formatUniversitySummary,
  formatTutorStudentTarget,
  formatStudentBudgetCard,
  formatLessonOperationType,
  formatLessonPlace,
  formatTutorLessonPlaces,
  formatTeachingStyleBadges,
  formatUniversityStatus,
  formatStudentPlaces,
  formatStudentLessonTarget,
} from './exposure-format.js';
import {
  slicePage,
  renderListPagination,
} from './list-pagination.js';
import { getGuestListPage } from './state.js';
import { isWishlisted, isInCompare } from './user-actions-state.js';
import {
  renderStudentProviderActions,
  renderStudentConsumerActions,
} from './student-review-ui.js';
import {
  buildPrimeSlotArray,
  getPrimeEmptyCopy,
  getExposurePageSizes,
  rotatePickPool,
  rotateSetPool,
  sortByNewestFirst,
  getPrimeOccupied,
  getPrimeCandidatePool,
  getPickPool,
  getBasicPool,
} from './exposure-rules.js';
import {
  maskPublicDisplayName,
  guestStudentTeaserFields,
  coarseRegionForGuest,
} from './student-blind-teaser.js';
import {
  readListSortFromHash,
  renderListSortSelect,
  sortListItems,
} from '../../shared/list-sort.js';
import {
  resolveCardVisualLayers,
  renderPromoBadgeRow,
  renderTrustBadgeRow,
} from './card-visual.js';

function esc(s) {
  if (s == null || s === '') return '';
  return String(s).replace(/</g, '&lt;');
}

function blankDash(text) {
  return text === '—' ? '' : text;
}

/** 괄호 필드 — 값만 */
function valOnly(text, opts = {}) {
  const { cls: extraCls, ...rest } = opts;
  return {
    text: blankDash(text || ''),
    cls: `expo-tbl__cell--val-only${extraCls ? ` ${extraCls}` : ''}`,
    ...rest,
  };
}

/** 항목제목 + 값 (대표·추천 노출 표) */
function labeled(label, text, opts = {}) {
  return {
    html: `<span class="expo-tbl__label">${esc(label)}</span><span class="expo-tbl__val">${esc(blankDash(text || ''))}</span>`,
    cls: opts.cls || '',
    col: opts.col,
  };
}

/** (성별) + 성명 — 성별은 값만, 성명은 라벨+값 */
function nameWithGenderCell(name, gender, nameLabel = '성명') {
  const g =
    gender && gender !== '—'
      ? `<span class="expo-tbl__val-only">${esc(formatGender(gender))}</span>`
      : '';
  return {
    html: `${g}<span class="expo-tbl__label">${esc(nameLabel)}</span><span class="expo-tbl__val">${esc(blankDash(name || ''))}</span>`,
  };
}

/** @param {Array<Array<{text?: string, html?: string, col?: number, cls?: string}>>} rows */
function renderExpoTable(rows, extraClass = '') {
  const body = rows
    .map((row) => {
      const tds = row
        .map((c) => {
          const col = c.col ? ` colspan="${c.col}"` : '';
          const cls = c.cls ? ` ${c.cls}` : '';
          const inner = c.html != null ? c.html : esc(c.text);
          return `<td class="expo-tbl__cell${cls}"${col}>${inner}</td>`;
        })
        .join('');
      return `<tr class="expo-tbl__row">${tds}</tr>`;
    })
    .join('');
  return `<table class="expo-tbl ${extraClass}"><tbody>${body}</tbody></table>`;
}

function joinFeatures(item, max = 3) {
  return [item.feature_1, item.feature_2, item.feature_3].filter(Boolean).slice(0, max).join(' · ') || '—';
}

/** 11장 §2-0 / 상위기획 §18 — 통계·기능 분리 (추천·후기≠액션배지) */
function actionCountBtn(icon, count, { title, cls = '', attrs = '', disabled = false, hideWhenZero = false } = {}) {
  const n = Number(count) || 0;
  if (hideWhenZero && n <= 0) return '';
  const dis = disabled ? ' disabled aria-disabled="true"' : '';
  return `<button type="button" class="item-actions__btn${cls ? ` ${cls}` : ''}" title="${esc(title)}" ${attrs}${dis}>
    <span class="item-actions__icon" aria-hidden="true">${icon}</span><span class="item-actions__count">${n}</span>
  </button>`;
}

/** @param {object} item @param {{ guest?: boolean, compareKind?: string, showCompare?: boolean, itemId?: number }} base */
function actionOptsFromItem(item, base = {}) {
  return {
    ...base,
    itemId: item.id,
    item,
    recommend_count: item.recommend_count ?? 0,
    wish_count: item.wish_count ?? 0,
    review_count: item.review_count ?? 0,
    message_count: item.message_count ?? 0,
    compare_count: item.compare_count ?? 0,
  };
}

/**
 * @param {{ guest?: boolean, compareKind?: 'study_room'|'tutor', showCompare?: boolean, showWish?: boolean, itemId?: number, item?: object, recommend_count?: number, wish_count?: number, review_count?: number, message_count?: number, compare_count?: number }} opts
 */
export function renderItemActions(opts = {}) {
  const {
    guest = false,
    compareKind = 'study_room',
    showCompare = true,
    showWish = true,
    itemId,
    item,
    recommend_count = 0,
    wish_count = 0,
    review_count = 0,
    message_count = 0,
    compare_count = 0,
  } = opts;
  const kind = compareKind;
  const wished = !guest && itemId != null && isWishlisted(kind, itemId);
  const inCompare = !guest && itemId != null && isInCompare(kind, itemId);
  const layers =
    item && (kind === 'study_room' || kind === 'tutor')
      ? resolveCardVisualLayers(kind, item)
      : null;
  const rec = layers?.stats.recommend ?? (Number(recommend_count) || 0);
  const rev = layers?.stats.review ?? (Number(review_count) || 0);

  // B 통계층 — 추천(토글 가능)·후기(개수만). 광고배지처럼 보이지 않게 card-stats 그룹
  const recommendAttrs = guest
    ? `data-action="login-gate" data-gate="recommend" data-gate-label="추천" data-item-kind="${kind}" data-item-id="${itemId}"`
    : itemId != null
      ? `data-action="recommend-toggle" data-item-kind="${kind}" data-item-id="${itemId}"`
      : '';
  const recommendStat = actionCountBtn('👍', rec, {
    title: `추천 ${rec}`,
    cls: 'item-actions__btn--stat',
    attrs: recommendAttrs,
    disabled: !guest && itemId == null,
  });
  const reviewStat = actionCountBtn('💬', rev, {
    title: `후기 ${rev}`,
    cls: 'item-actions__btn--stat',
    attrs: guest
      ? `data-action="login-gate" data-gate="review" data-gate-label="후기" data-item-kind="${kind}" data-item-id="${itemId}"`
      : itemId != null
        ? `data-action="open-review-sheet" data-item-kind="${kind}" data-item-id="${itemId}"`
        : '',
  });
  const writeAttrs = guest
    ? `data-action="login-gate" data-gate="review_write" data-gate-label="후기 작성" data-item-kind="${kind}" data-item-id="${itemId}"`
    : itemId != null
      ? `data-action="open-review-sheet" data-review-view="write" data-item-kind="${kind}" data-item-id="${itemId}"`
      : '';
  const writeBtn =
    itemId == null && !guest
      ? ''
      : `<button type="button" class="item-actions__btn item-actions__btn--action" title="후기 작성" ${writeAttrs}>
    <span class="item-actions__icon" aria-hidden="true">✎</span><span class="item-actions__count">작성</span>
  </button>`;

  // A 기능층 — 찜 / 쪽지 / 비교 (좋아요 제거)
  const wishAttrs = guest
    ? `data-action="login-gate" data-gate="wish" data-gate-label="찜" data-item-kind="${kind}" data-item-id="${itemId}"`
    : `data-action="wish-toggle" data-item-kind="${kind}" data-item-id="${itemId}"`;
  const wishBtn =
    !showWish
      ? ''
      : actionCountBtn(wished ? '♥' : '♡', wish_count, {
          title: `찜 ${wish_count}`,
          cls: wished ? 'is-active item-actions__btn--action' : 'item-actions__btn--action',
          attrs: wishAttrs,
        });

  const msgAttrs = guest
    ? `data-action="login-gate" data-gate="inquire" data-gate-label="쪽지" data-item-kind="${kind}" data-item-id="${itemId}"`
    : `data-action="open-detail-memo" data-item-kind="${kind}" data-item-id="${itemId}"`;
  const messageBtn = actionCountBtn('✉', message_count, {
    title: `쪽지 ${message_count}`,
    cls: 'item-actions__btn--action',
    attrs: msgAttrs,
  });

  const compareBtn = !showCompare
    ? ''
    : guest
      ? actionCountBtn('⇄', compare_count, {
          title: `비교 ${compare_count}`,
          cls: 'item-actions__btn--action',
          attrs: `data-action="compare-guest-blocked" data-compare-kind="${kind}" data-item-kind="${kind}" data-item-id="${itemId}"`,
        })
      : actionCountBtn('⇄', compare_count, {
          title: `비교 ${compare_count}`,
          cls: inCompare ? 'is-active item-actions__btn--action' : 'item-actions__btn--action',
          attrs: `data-action="compare-toggle" data-item-kind="${kind}" data-item-id="${itemId}"`,
        });

  return `
    <div class="card-visual__rail" data-card-visual="${esc(layers?.policyVersion || '')}">
      <div class="card-stats" aria-label="통계">${recommendStat}${reviewStat}</div>
      <div class="item-actions card-actions" aria-label="기능">${wishBtn}${messageBtn}${writeBtn}${compareBtn}</div>
    </div>
  `;
}

/** @param {'study_room'|'tutor'} kind @param {object} item */
function renderCardBadgeLayers(kind, item) {
  const layers = resolveCardVisualLayers(kind, item);
  const trust =
    layers.trustBadges.length > 0
      ? renderTrustBadgeRow(layers.trustBadges, esc)
      : item.badges?.length
        ? renderTrustBadgeRow(item.badges, esc)
        : '';
  return `${renderPromoBadgeRow(layers.promoBadges, esc)}${trust}`;
}

function renderCompareChip(kind, itemId, opts) {
  if (opts.showCompare === false) return '';
  if (opts.guest) {
    return `<button type="button" class="expo-compare-chip" aria-pressed="false" data-action="compare-guest-blocked" data-compare-kind="${kind}" data-item-kind="${kind}" data-item-id="${itemId}"><span class="expo-compare-chip__check" aria-hidden="true"></span>비교</button>`;
  }
  const active = isInCompare(kind, itemId);
  return `<button type="button" class="expo-compare-chip${active ? ' is-active' : ''}" aria-pressed="${active ? 'true' : 'false'}" data-action="compare-toggle" data-item-kind="${kind}" data-item-id="${itemId}"><span class="expo-compare-chip__check" aria-hidden="true">${active ? '✓' : ''}</span>비교</button>`;
}

/** 이미지 없을 때 브랜드 기본 카드 (가입 시 DB 자동삽입과 동일 자산) */
const ROOM_DEFAULT_BASIC = '/assets/brand/room-card-default-basic.svg';
const ROOM_DEFAULT_PRIME = '/assets/brand/room-card-default-prime.svg';
const ROOM_DEFAULT_PICK = '/assets/brand/room-card-default-pick.svg';

/** 이미지 없을 때 브랜드형 이니셜 플레이스홀더 (내부 문구 비노출) — 공부방은 기본 SVG 사용 */
function placeholderInitial(alt) {
  const raw = String(alt || '').trim();
  if (!raw) return '우';
  const ch = [...raw].find((c) => c !== ' ' && c !== '·') || '우';
  return ch;
}

/** @param {'prime'|'pick'|'list'} ratio */
function renderMedia(image_path, alt, ratio, opts = {}) {
  const cls = `expo-media expo-media--${ratio}`;
  if (image_path) {
    return `<div class="${cls}"><img src="${esc(image_path)}" alt="${esc(alt)}" loading="lazy" /></div>`;
  }
  if (opts.roomDefault) {
    const src =
      ratio === 'prime' ? ROOM_DEFAULT_PRIME : ratio === 'pick' ? ROOM_DEFAULT_PICK : ROOM_DEFAULT_BASIC;
    return `<div class="${cls}"><img src="${esc(src)}" alt="${esc(alt || '우동공과')}" loading="lazy" /></div>`;
  }
  const initial = placeholderInitial(alt);
  return `<div class="${cls} expo-media--placeholder" role="img" aria-label="${esc(alt || '프로필')}">
    <span class="expo-media__ph-initial" aria-hidden="true">${esc(initial)}</span>
  </div>`;
}

/**
 * @param {{ tl?: string, bl?: string, br?: string, mid?: string }} zones
 * @param {{ roomDefault?: boolean }} [opts]
 */
function renderMediaBlock(image_path, alt, ratio, zones = {}, opts = {}) {
  const parts = [];
  if (zones.tl) parts.push(`<div class="expo-media-overlay__tl">${zones.tl}</div>`);
  if (zones.mid) parts.push(`<div class="expo-media-overlay__mid">${zones.mid}</div>`);
  if (zones.bl) parts.push(`<div class="expo-media-overlay__bl">${zones.bl}</div>`);
  if (zones.br) parts.push(`<div class="expo-media-overlay__br">${zones.br}</div>`);
  const overlay = parts.length
    ? `<div class="expo-media-overlay" aria-hidden="false">${parts.join('')}</div>`
    : '';
  return `
    <div class="expo-media-wrap">
      ${renderMedia(image_path, alt, ratio, opts)}
      ${overlay}
    </div>`;
}

function listingImage(item, ratio) {
  if (ratio === 'prime' || ratio === 'pick') {
    return item.image_path_prime || item.image_path || '';
  }
  return item.image_path_basic || item.image_path || '';
}

function renderStudyRoomMediaOverlay(item, compareHtml) {
  return renderMediaBlock(
    listingImage(item, 'prime'),
    item.study_room_name,
    'prime',
    {
      tl: `<span class="expo-overlay-val">${esc(item.location_label)}</span>`,
      br: compareHtml,
    },
    { roomDefault: true },
  );
}

function renderPickStudyRoomMedia(item, compareHtml) {
  return renderMediaBlock(
    listingImage(item, 'pick'),
    item.study_room_name,
    'pick',
    {
      tl: `<span class="expo-overlay-val">${esc(item.location_label)}</span>`,
      br: compareHtml,
    },
    { roomDefault: true },
  );
}

/** 교습형태 미입력 시 (선택) */
function optionalStudyRoomPlace(lesson_place_type) {
  const v = formatLessonPlace(lesson_place_type);
  return v === '—' ? '(선택)' : v;
}

function optionalTutorPlaces(lesson_places) {
  const v = formatTutorLessonPlaces(lesson_places);
  return v === '—' ? '(선택)' : v;
}

function optionalStudentPlaces(lesson_places) {
  const v = formatStudentPlaces(lesson_places);
  return v === '—' ? '(선택)' : v;
}

function appendSloganAndActions(rows, item, actions, { showIntro = true } = {}) {
  rows.push([labeled('슬로건', item.slogan || '—', { col: 2, cls: 'expo-tbl__cell--slogan' })]);
  rows.push([{ html: actions, col: 2, cls: 'expo-tbl__cell--actions' }]);
  return rows;
}

function renderTutorOverlayBottomGrid(item) {
  const grad = blankDash(formatUniversityStatus(item.university_status) || '');
  // 학부 대학명·학과만 — university_note(보조)로 학교란을 채우지 않음
  const edu = blankDash([item.university_name, item.major_name].filter(Boolean).join(' '));
  const career = blankDash(formatCareerYearBand(item.career_year_band) || '');
  const fee = blankDash(renderTutorFeeOverlay(item));
  return `<div class="expo-overlay-bl-grid">
    <span class="expo-overlay-bl-grid__cell">${esc(grad)}</span>
    <span class="expo-overlay-bl-grid__cell">${esc(edu)}</span>
    <span class="expo-overlay-bl-grid__cell">${esc(career)}</span>
    <span class="expo-overlay-bl-grid__cell">${esc(fee)}</span>
  </div>`;
}

function renderTutorFeeOverlay(item) {
  const parts = [];
  if (item.lessons_per_week) parts.push(`주 ${item.lessons_per_week}회`);
  if (item.minutes_per_lesson) parts.push(`회당 ${item.minutes_per_lesson}분`);
  const monthly = formatMonthlyWon(item.preferred_fee_amount);
  if (monthly !== '—') parts.push(monthly.replace('~', ''));
  return parts.join(', ') || '—';
}

function renderTutorMediaOverlay(item, compareHtml, ratio = 'prime') {
  return renderMediaBlock(item.image_path, item.tutor_display_name, ratio, {
    tl: `<span class="expo-overlay-val">${esc(item.location_label)}</span>`,
    bl: renderTutorOverlayBottomGrid(item),
    br: compareHtml,
  });
}

function renderTrustBadges(badges, max = 4) {
  if (!badges?.length) return '—';
  return badges
    .slice(0, max)
    .map((b) => `<span class="card-visual__trust-badge expo-tbl__badge">${esc(b)}</span>`)
    .join('');
}

function trustBadgesForItem(kind, item) {
  const layers = resolveCardVisualLayers(kind, item);
  if (layers.trustBadges.length) return layers.trustBadges;
  return Array.isArray(item.badges) ? item.badges : [];
}

function renderVerificationCell(item, maxDocs) {
  const count = item.verification_doc_count ?? (item.proof_document_available ? 1 : 0);
  if (!count) return '—';
  const shown = maxDocs === 1 ? 1 : count;
  const label = `${shown}개 공개 · 상세`;
  return `<button type="button" class="expo-link-btn" data-action="login-gate" data-gate="trust" data-gate-label="제출자료">${esc(label)}</button>`;
}

function studyRoomPriceCell(item) {
  return valOnly(formatMonthlyWon(item.price_amount), { cls: 'expo-tbl__cell--price' });
}

function studyRoomTableRows(item, { showIntro = true, featureMax = 3, stack = false }, actions = '') {
  const badgeCell = `${renderPromoBadgeRow(resolveCardVisualLayers('study_room', item).promoBadges, esc)}${renderTrustBadges(trustBadgesForItem('study_room', item))}`;
  if (stack) {
    const rows = [
      [valOnly(item.study_room_name, { cls: 'expo-tbl__cell--name', col: 2 })],
      [{ html: badgeCell, col: 2, cls: 'expo-tbl__cell--badges' }],
      [labeled('대상', item.grade_band), studyRoomPriceCell(item)],
      [labeled('과목', item.main_subject_note, { col: 2 })],
      [labeled('교습형태', optionalStudyRoomPlace(item.lesson_place_type), { col: 2 })],
      [labeled('원생수', item.capacity_per_time || '—', { col: 2 })],
      [labeled('수업형태', formatLessonOperationType(item.lesson_operation_type), { col: 2 })],
      [labeled('특징', joinFeatures(item, featureMax), { col: 2, cls: 'expo-tbl__cell--features' })],
    ];
    return appendSloganAndActions(rows, item, actions, { showIntro });
  }

  const rows = [
    [valOnly(item.study_room_name, { cls: 'expo-tbl__cell--name', col: 2 })],
    [{ html: badgeCell, col: 2, cls: 'expo-tbl__cell--badges' }],
    [labeled('대상', item.grade_band), studyRoomPriceCell(item)],
    [labeled('과목', item.main_subject_note, { col: 2 })],
    [labeled('교습형태', optionalStudyRoomPlace(item.lesson_place_type)), labeled('원생수', item.capacity_per_time || '—')],
    [labeled('수업형태', formatLessonOperationType(item.lesson_operation_type), { col: 2 })],
    [labeled('특징', joinFeatures(item, featureMax), { col: 2, cls: 'expo-tbl__cell--features' })],
  ];
  if (showIntro) {
    rows.push([labeled('소개', item.intro_short || '—', { col: 2, cls: 'expo-tbl__cell--intro' })]);
  }
  return appendSloganAndActions(rows, item, actions, { showIntro });
}

function tutorTableRows(item, { showIntro = true, featureMax = 3, verifyMax = 99, stack = false }, actions = '') {
  const verifyCell = {
    html: `<span class="expo-tbl__label">제출자료</span> ${renderVerificationCell(item, verifyMax === 1 ? 1 : 99)}`,
    cls: 'expo-tbl__cell--verify',
  };
  const badgeCell = {
    html: `${renderPromoBadgeRow(resolveCardVisualLayers('tutor', item).promoBadges, esc)}${renderTrustBadges(trustBadgesForItem('tutor', item))}`,
    col: 2,
    cls: 'expo-tbl__cell--badges',
  };

  if (stack) {
    const rows = [
      [nameWithGenderCell(item.tutor_display_name, item.gender), verifyCell],
      [badgeCell],
      [labeled('대상', item.grade_band || '—', { col: 2 })],
      [labeled('과목', item.main_subject_note, { col: 2 })],
      [labeled('수업장소', optionalTutorPlaces(item.lesson_places), { col: 2 })],
      [labeled('원생수', formatTutorStudentTarget(item), { col: 2 })],
      [labeled('주교재', item.main_material_note || '—', { col: 2 })],
      [labeled('특징', joinFeatures(item, featureMax), { col: 2, cls: 'expo-tbl__cell--features' })],
      [
        labeled(
          '강의스타일',
          formatTeachingStyleBadges(item.teaching_style_badges, featureMax === 1 ? 1 : 3),
          { col: 2, cls: 'expo-tbl__cell--style' },
        ),
      ],
    ];
    if (showIntro) {
      rows.push([labeled('소개', item.intro_short || '—', { col: 2, cls: 'expo-tbl__cell--intro' })]);
    }
    return appendSloganAndActions(rows, item, actions, { showIntro });
  }

  const rows = [
    [nameWithGenderCell(item.tutor_display_name, item.gender), verifyCell],
    [badgeCell],
    [labeled('대상', item.grade_band || '—'), labeled('과목', item.main_subject_note)],
    [labeled('수업장소', optionalTutorPlaces(item.lesson_places)), labeled('원생수', formatTutorStudentTarget(item))],
    [labeled('주교재', item.main_material_note || '—'), labeled('특징', joinFeatures(item, featureMax), { cls: 'expo-tbl__cell--features' })],
    [
      labeled('강의스타일', formatTeachingStyleBadges(item.teaching_style_badges, featureMax === 1 ? 1 : 3), {
        col: 2,
        cls: 'expo-tbl__cell--style',
      }),
    ],
  ];
  if (showIntro) {
    rows.push([labeled('소개', item.intro_short || '—', { col: 2, cls: 'expo-tbl__cell--intro' })]);
  }
  return appendSloganAndActions(rows, item, actions, { showIntro });
}

function renderPrimeStudyRoom(item, actions, opts) {
  const compare = renderCompareChip('study_room', item.id, opts);
  const rows = studyRoomTableRows(item, { showIntro: true, featureMax: 3 }, actions);
  return `
    <article class="expo-card expo-card--prime expo-card--study_room" data-provider-id="${item.id}" data-provider-kind="study_room">
      ${renderStudyRoomMediaOverlay(item, compare)}
      ${renderExpoTable(rows, 'expo-tbl--card')}
    </article>`;
}

function renderPrimeTutor(item, actions, opts) {
  const compare = renderCompareChip('tutor', item.id, opts);
  const rows = tutorTableRows(item, { showIntro: true, featureMax: 3 }, actions);
  return `
    <article class="expo-card expo-card--prime expo-card--tutor" data-provider-id="${item.id}" data-provider-kind="tutor">
      ${renderTutorMediaOverlay(item, compare, 'prime')}
      ${renderExpoTable(rows, 'expo-tbl--card')}
    </article>`;
}

function renderPickStudyRoom(item, actions, opts) {
  const compare = renderCompareChip('study_room', item.id, opts);
  const rows = studyRoomTableRows(item, { showIntro: false, featureMax: 1, stack: true }, actions);
  return `
    <article class="expo-card expo-card--pick expo-card--study_room" data-provider-id="${item.id}" data-provider-kind="study_room">
      ${renderPickStudyRoomMedia(item, compare)}
      ${renderExpoTable(rows, 'expo-tbl--card expo-tbl--compact')}
    </article>`;
}

function renderPickTutor(item, actions, opts) {
  const compare = renderCompareChip('tutor', item.id, opts);
  const rows = tutorTableRows(item, { showIntro: false, featureMax: 1, verifyMax: 1, stack: true }, actions);
  return `
    <article class="expo-card expo-card--pick expo-card--tutor" data-provider-id="${item.id}" data-provider-kind="tutor">
      ${renderTutorMediaOverlay(item, compare, 'pick')}
      ${renderExpoTable(rows, 'expo-tbl--card expo-tbl--compact')}
    </article>`;
}

/**
 * @param {'study_room' | 'tutor'} kind
 * @param {'prime' | 'pick'} tier
 */
export function renderExposureBox(kind, tier, item, slotLabel, opts = {}) {
  const actionOpts = actionOptsFromItem(item, {
    guest: opts.guest,
    compareKind: kind,
    showCompare: opts.showCompare !== false,
    showWish: opts.showWish !== false,
  });
  const actions = renderItemActions(actionOpts);
  if (tier === 'prime') {
    return kind === 'tutor'
      ? renderPrimeTutor(item, actions, actionOpts)
      : renderPrimeStudyRoom(item, actions, actionOpts);
  }
  return kind === 'tutor'
    ? renderPickTutor(item, actions, actionOpts)
    : renderPickStudyRoom(item, actions, actionOpts);
}

/**
 * Prime 빈 슬롯 — 다른 상품으로 채우지 않고 홍보카드 유지
 * @param {'study_room'|'tutor'} kind
 */
export function renderEmptyPrimePromo(kind) {
  const copy = getPrimeEmptyCopy(kind);
  const tone = kind === 'tutor' ? 'tutor' : 'study_room';
  return `
    <article class="expo-card expo-card--prime expo-card--empty expo-card--${tone}" data-prime-empty="1">
      <div class="expo-empty-prime">
        <p class="expo-empty-prime__title">${esc(copy.title)}</p>
        <p class="expo-empty-prime__body">${esc(copy.body)}</p>
        <a href="#/plans/positions" class="btn btn--primary btn--sm" data-nav="/plans/positions">${esc(copy.cta)}</a>
      </div>
    </article>`;
}

/**
 * Prime 슬롯
 * — study_room: 항상 prime_slots 칸 고정 · null은 EMPTY 카드 (회전·페이지 없음)
 * — tutor: 후보 풀 15분 세트 순환 + 3슬롯 페이지 (시 단위 인원 대응)
 * 순환 고지는 이용안내 `#/support` (getHomeExposureGuides)에만 둔다.
 * @param {'study_room'|'tutor'} kind
 * @param {object[]} occupiedItems — study_room: 점유자 / tutor: 후보 풀 전체
 * @param {object} [opts]
 */
export function renderPrimeSlotGrid(kind, occupiedItems, opts = {}) {
  const { primeSlots, pickRotationMinutes } = getExposurePageSizes();

  if (kind === 'tutor') {
    const pool = occupiedItems;
    const rotated = rotateSetPool(pool, primeSlots, pickRotationMinutes);
    const listId = opts.listId || 'prime_tutor';
    const page = opts.page ?? getGuestListPage(listId);
    const pageItems = slicePage(rotated, page, primeSlots);
    const cards = pageItems.length
      ? pageItems.map((item) => renderExposureBox(kind, 'prime', item, '', opts)).join('')
      : Array.from({ length: primeSlots }, () => renderEmptyPrimePromo(kind)).join('');
    return `
    <div class="list-subsection" data-guest-list="${listId}">
      <div class="expo-grid--3">${cards}</div>
      ${renderListPagination(listId, rotated.length, page, primeSlots)}
    </div>`;
  }

  const slots = buildPrimeSlotArray(occupiedItems, primeSlots);
  const cards = slots
    .map((item) => {
      if (!item) return renderEmptyPrimePromo(kind);
      return renderExposureBox(kind, 'prime', item, '', opts);
    })
    .join('');
  return `<div class="expo-grid--3">${cards}</div>`;
}

function featureTagList(item, max = 3) {
  return [item.feature_1, item.feature_2, item.feature_3].filter(Boolean).slice(0, max);
}

function renderHcardMetaItem(label, value) {
  const v = blankDash(value || '');
  if (!v) return '';
  return `<li class="expo-hcard__meta-item"><span class="expo-hcard__k">${esc(label)}</span><span class="expo-hcard__v">${esc(v)}</span></li>`;
}

function renderBasicStudyRoomRow(item, opts) {
  const actionOpts = actionOptsFromItem(item, {
    guest: opts.guest,
    compareKind: 'study_room',
    showCompare: opts.showCompare !== false,
    showWish: opts.showWish !== false,
  });
  const actions = renderItemActions(actionOpts);
  const compare = renderCompareChip('study_room', item.id, {
    guest: opts.guest,
    showCompare: opts.showCompare !== false,
  });
  const locationLabel = opts.guest
    ? coarseRegionForGuest(item.location_label)
    : item.location_label;

  if (opts.layout === 'table') {
    return `
    <article class="expo-basic expo-basic--study_room" data-provider-id="${item.id}" data-provider-kind="study_room">
      ${renderExpoTable(
        [
          [
            labeled('공부방명', item.study_room_name, { cls: 'expo-tbl__cell--name' }),
            valOnly(locationLabel),
            valOnly(formatMonthlyWon(item.price_amount), { cls: 'expo-tbl__cell--price' }),
            { html: `<span class="expo-tbl__label">비교</span>${compare}`, cls: 'expo-tbl__cell--compare', col: 2 },
          ],
          [
            labeled('교습형태', optionalStudyRoomPlace(item.lesson_place_type)),
            labeled('대상', item.grade_band),
            labeled('과목', item.main_subject_note),
            labeled('원생수', item.capacity_per_time || '—'),
            labeled('수업운영방식', formatLessonOperationType(item.lesson_operation_type)),
          ],
          [labeled('슬로건', item.slogan || '—', { col: 5 })],
          [{ html: actions, col: 5, cls: 'expo-tbl__cell--actions' }],
        ],
        'expo-tbl--basic expo-tbl--card',
      )}
    </article>`;
  }

  const slogan = item.slogan || '';
  const badgeLayers = renderCardBadgeLayers('study_room', item);
  return `
    <article class="expo-basic expo-basic--study_room expo-hcard" data-provider-id="${item.id}" data-provider-kind="study_room">
      <div class="expo-hcard__media-wrap">
        ${renderMedia(listingImage(item, 'list'), item.study_room_name, 'list', { roomDefault: true })}
        ${badgeLayers}
      </div>
      <div class="expo-hcard__body">
        <div class="expo-hcard__top">
          <div class="expo-hcard__title-row">
            <h3 class="expo-hcard__name">${esc(item.study_room_name || '')}</h3>
            ${locationLabel ? `<span class="expo-hcard__loc">${esc(locationLabel)}</span>` : ''}
          </div>
          <p class="expo-hcard__price">${esc(formatMonthlyWon(item.price_amount))}</p>
        </div>
        <ul class="expo-hcard__meta">
          ${renderHcardMetaItem('교습형태', optionalStudyRoomPlace(item.lesson_place_type))}
          ${renderHcardMetaItem('대상', item.grade_band)}
          ${renderHcardMetaItem('과목', item.main_subject_note)}
          ${renderHcardMetaItem('원생수', item.capacity_per_time || '—')}
          ${renderHcardMetaItem('수업운영방식', formatLessonOperationType(item.lesson_operation_type))}
        </ul>
        ${slogan ? `<p class="expo-hcard__slogan">${esc(slogan)}</p>` : ''}
      </div>
      <div class="expo-hcard__side">
        <div class="expo-hcard__actions">${actions}</div>
        <button type="button" class="expo-hcard__detail" data-action="search-open-detail" data-search-kind="study_room" data-search-id="${item.id}">상세</button>
        ${compare}
      </div>
    </article>`;
}

function renderBasicTutorRow(item, opts) {
  const actionOpts = actionOptsFromItem(item, {
    guest: opts.guest,
    compareKind: 'tutor',
    showCompare: opts.showCompare !== false,
    showWish: opts.showWish !== false,
  });
  const actions = renderItemActions(actionOpts);
  const compare = renderCompareChip('tutor', item.id, {
    guest: opts.guest,
    showCompare: opts.showCompare !== false,
  });
  const schedule =
    item.lessons_per_week && item.minutes_per_lesson
      ? `주${item.lessons_per_week}·${item.minutes_per_lesson}분`
      : '—';
  const locationLabel = opts.guest
    ? coarseRegionForGuest(item.location_label)
    : item.location_label;

  if (opts.layout === 'table') {
    return `
    <article class="expo-basic expo-basic--tutor" data-provider-id="${item.id}" data-provider-kind="tutor">
      ${renderExpoTable(
        [
          [
            nameWithGenderCell(item.tutor_display_name, item.gender),
            labeled('대상', item.grade_band || '—'),
            labeled('과목', item.main_subject_note),
            valOnly(formatTutorFeeCard(item), { cls: 'expo-tbl__cell--price' }),
            { html: `<span class="expo-tbl__label">비교</span>${compare}`, cls: 'expo-tbl__cell--compare' },
          ],
          [
            valOnly(locationLabel),
            labeled('수업장소', optionalTutorPlaces(item.lesson_places)),
            labeled('원생수', formatTutorStudentTarget(item)),
            valOnly(schedule),
            labeled('특징', item.feature_1 || '—'),
          ],
          [labeled('슬로건', item.slogan || item.feature_1 || '—', { col: 5 })],
          [{ html: actions, col: 5, cls: 'expo-tbl__cell--actions' }],
        ],
        'expo-tbl--basic expo-tbl--card',
      )}
    </article>`;
  }

  const tags = featureTagList(item)
    .map((t) => `<span class="expo-hcard__tag">${esc(t)}</span>`)
    .join('');
  const slogan = item.slogan || item.feature_1 || '';
  const gender = item.gender && item.gender !== '—' ? formatGender(item.gender) : '';
  const nameLine = gender
    ? `<span class="expo-hcard__gender">${esc(gender)}</span>${esc(item.tutor_display_name || '')}`
    : esc(item.tutor_display_name || '');
  const badgeLayers = renderCardBadgeLayers('tutor', item);
  return `
    <article class="expo-basic expo-basic--tutor expo-hcard" data-provider-id="${item.id}" data-provider-kind="tutor">
      <div class="expo-hcard__media-wrap">
        ${renderMedia(item.image_path, item.tutor_display_name, 'list')}
        ${item.grade_band ? `<span class="expo-hcard__badge">${esc(item.grade_band)}</span>` : ''}
        ${badgeLayers}
      </div>
      <div class="expo-hcard__body">
        <div class="expo-hcard__top">
          <div class="expo-hcard__title-row">
            <h3 class="expo-hcard__name">${nameLine}</h3>
            ${locationLabel ? `<span class="expo-hcard__loc">${esc(locationLabel)}</span>` : ''}
          </div>
          <p class="expo-hcard__price">${esc(formatTutorFeeCard(item))}</p>
        </div>
        <ul class="expo-hcard__meta">
          ${renderHcardMetaItem('과목', item.main_subject_note)}
          ${renderHcardMetaItem('원생수', formatTutorStudentTarget(item))}
          ${renderHcardMetaItem('수업장소', optionalTutorPlaces(item.lesson_places))}
          ${
            schedule && schedule !== '—'
              ? `<li class="expo-hcard__meta-item"><span class="expo-hcard__v">${esc(schedule)}</span></li>`
              : ''
          }
        </ul>
        ${tags ? `<div class="expo-hcard__tags">${tags}</div>` : ''}
        ${slogan ? `<p class="expo-hcard__slogan">${esc(slogan)}</p>` : ''}
      </div>
      <div class="expo-hcard__side">
        <div class="expo-hcard__actions">${actions}</div>
        <button type="button" class="expo-hcard__detail" data-action="search-open-detail" data-search-kind="tutor" data-search-id="${item.id}">상세</button>
        ${compare}
      </div>
    </article>`;
}

function renderBasicStudentRow(item, opts) {
  const viewerRole = opts.viewerRole || (opts.guest ? 'guest' : 'parent');
  const isGuest = Boolean(opts.guest || viewerRole === 'guest');
  const maskedName = maskPublicDisplayName(item.public_display_name);
  const locationLabel = isGuest
    ? coarseRegionForGuest(item.location_label)
    : item.location_label;

  if (opts.layout === 'table') {
    if (isGuest) {
      const t = guestStudentTeaserFields(item);
      const meta = [t.band, t.subject, t.region, t.budget].filter((x) => x && x !== '—').join(' · ');
      const hopeLine = t.hope || t.chip;
      return `
    <article class="expo-basic expo-basic--student expo-basic--student-teaser" data-student-id="${item.id}" data-action="open-student-detail">
      <div class="student-teaser">
        <p class="student-teaser__name">${esc(t.name)}</p>
        <p class="student-teaser__meta">${esc(meta)}</p>
        ${hopeLine ? `<p class="student-teaser__hope">${esc(hopeLine)}</p>` : ''}
        <p class="student-teaser__hint">로그인 후 구조화 조건·쪽지를 이용할 수 있습니다.</p>
        <div class="item-actions item-actions--student">
          <button type="button" class="btn btn--secondary btn--sm" data-action="login-gate" data-gate="student" data-gate-label="학생상세">로그인하고 보기</button>
        </div>
      </div>
    </article>`;
    }
    const actions =
      viewerRole === 'tutor' || viewerRole === 'study_room' || viewerRole === 'admin'
        ? renderStudentProviderActions(item, {
            guest: false,
            viewerRole,
            sourceRoute: opts.sourceRoute || 'search',
          })
        : renderStudentConsumerActions();
    const schedule =
      item.lessons_per_week && item.minutes_per_lesson
        ? `주${item.lessons_per_week}·${item.minutes_per_lesson}분`
        : '—';
    const requestVis = item.request_summary_visibility || 'private';
    const request =
      requestVis === 'paid_only' ? '유료공개' : requestVis === 'private' ? '비공개' : '—';
    return `
    <article class="expo-basic expo-basic--student" data-student-id="${item.id}" data-action="open-student-detail">
      ${renderExpoTable(
        [
          [
            labeled('표시명', maskedName),
            labeled('대상', item.grade_level),
            labeled('과목', item.subject_label),
            valOnly(formatStudentBudgetCard(item), { cls: 'expo-tbl__cell--price' }),
            valOnly(request, { cls: 'expo-tbl__cell--request' }),
          ],
          [
            valOnly(item.location_label),
            labeled('수업장소', optionalStudentPlaces(item.lesson_places)),
            labeled('원생수', formatStudentLessonTarget(item)),
            valOnly(schedule),
            labeled('강의스타일', formatTeachingStyleBadges(item.teaching_style_badges, 2)),
          ],
          [{ html: actions, col: 5, cls: 'expo-tbl__cell--actions' }],
        ],
        'expo-tbl--basic expo-tbl--card',
      )}
    </article>`;
  }

  if (isGuest) {
    const t = guestStudentTeaserFields(item);
    const hopeLine = t.hope || t.chip;
    return `
    <article class="expo-basic expo-basic--student expo-hcard" data-student-id="${item.id}" data-action="open-student-detail">
      <div class="expo-hcard__media-wrap">
        ${renderMedia(item.image_path, t.name || '학생', 'list')}
        ${t.band ? `<span class="expo-hcard__badge">${esc(t.band)}</span>` : ''}
      </div>
      <div class="expo-hcard__body">
        <div class="expo-hcard__top">
          <div class="expo-hcard__title-row">
            <h3 class="expo-hcard__name">${esc(t.name)}</h3>
            ${locationLabel ? `<span class="expo-hcard__loc">${esc(locationLabel)}</span>` : ''}
          </div>
          <p class="expo-hcard__price">${esc(t.budget || '—')}</p>
        </div>
        <ul class="expo-hcard__meta">
          ${renderHcardMetaItem('과목', t.subject)}
          ${hopeLine ? renderHcardMetaItem('희망', hopeLine) : ''}
        </ul>
        <p class="expo-hcard__slogan">로그인 후 구조화 조건·쪽지를 이용할 수 있습니다.</p>
      </div>
      <div class="expo-hcard__side">
        <div class="expo-hcard__actions">
          <button type="button" class="btn btn--secondary btn--sm" data-action="login-gate" data-gate="student" data-gate-label="학생상세">로그인하고 보기</button>
        </div>
        <button type="button" class="expo-hcard__detail" data-action="open-student-detail" data-student-id="${item.id}">상세</button>
      </div>
    </article>`;
  }

  const actions =
    viewerRole === 'tutor' || viewerRole === 'study_room' || viewerRole === 'admin'
      ? renderStudentProviderActions(item, {
          guest: false,
          viewerRole,
          sourceRoute: opts.sourceRoute || 'search',
        })
      : renderStudentConsumerActions();
  const schedule =
    item.lessons_per_week && item.minutes_per_lesson
      ? `주${item.lessons_per_week}·${item.minutes_per_lesson}분`
      : '—';
  const requestVis = item.request_summary_visibility || 'private';
  const request =
    requestVis === 'paid_only' ? '유료공개' : requestVis === 'private' ? '비공개' : '—';

  return `
    <article class="expo-basic expo-basic--student expo-hcard" data-student-id="${item.id}" data-action="open-student-detail">
      <div class="expo-hcard__media-wrap">
        ${renderMedia(item.image_path, maskedName || '학생', 'list')}
        ${item.grade_level ? `<span class="expo-hcard__badge">${esc(item.grade_level)}</span>` : ''}
      </div>
      <div class="expo-hcard__body">
        <div class="expo-hcard__top">
          <div class="expo-hcard__title-row">
            <h3 class="expo-hcard__name">${esc(maskedName)}</h3>
            ${locationLabel ? `<span class="expo-hcard__loc">${esc(locationLabel)}</span>` : ''}
          </div>
          <p class="expo-hcard__price">${esc(formatStudentBudgetCard(item))}</p>
        </div>
        <ul class="expo-hcard__meta">
          ${renderHcardMetaItem('과목', item.subject_label)}
          ${renderHcardMetaItem('수업장소', optionalStudentPlaces(item.lesson_places))}
          ${renderHcardMetaItem('원생수', formatStudentLessonTarget(item))}
          ${renderHcardMetaItem('일정', schedule)}
          ${renderHcardMetaItem('요청', request)}
          ${renderHcardMetaItem('강의스타일', formatTeachingStyleBadges(item.teaching_style_badges, 2))}
        </ul>
      </div>
      <div class="expo-hcard__side">
        <div class="expo-hcard__actions">${actions}</div>
        <button type="button" class="expo-hcard__detail" data-action="open-student-detail" data-student-id="${item.id}">상세</button>
      </div>
    </article>`;
}

function renderBasicRow(kind, item, opts) {
  if (kind === 'student') return renderBasicStudentRow(item, opts);
  if (kind === 'tutor') return renderBasicTutorRow(item, opts);
  return renderBasicStudyRoomRow(item, opts);
}

/** @param {'study_room'|'tutor'|'student'} kind */
export function renderBrowseList(kind, items, opts = {}) {
  return `
    <div class="browse-list browse-list--table" role="list">
      ${items.map((item) => renderBasicRow(kind, item, opts)).join('')}
    </div>
  `;
}

export function renderPickPaginatedBlock(kind, listId, headingCfg, allItems, opts = {}) {
  const { pickSetSize } = getExposurePageSizes();
  const occupied = opts.primeOccupied ?? getPrimeOccupied(allItems);
  const pickPool = rotatePickPool(getPickPool(allItems, occupied));
  const page = opts.page ?? getGuestListPage(listId);
  const pageItems = slicePage(pickPool, page, pickSetSize);
  const cards = pageItems
    .map((item) => renderExposureBox(kind, 'pick', item, '', opts))
    .join('');

  return `
    <div class="list-subsection" data-guest-list="${listId}">
      ${renderSectionHeading(headingCfg)}
      <div class="expo-grid--5">${cards || '<p class="mypage-muted">추천 노출 후보가 없습니다.</p>'}</div>
      ${renderListPagination(listId, pickPool.length, page, pickSetSize)}
    </div>
  `;
}

export function renderGuestPaginatedListBlock(kind, listId, headingCfg, allItems, opts = {}) {
  const { basicPageSize } = getExposurePageSizes();
  const occupied = opts.primeOccupied ?? getPrimeOccupied(allItems);
  const sortMode = opts.sortMode || 'home';
  const sort = opts.sort ?? readListSortFromHash(kind, { mode: sortMode });
  const serverSorted = Boolean(opts.serverSorted);
  const pool = serverSorted
    ? kind === 'student'
      ? allItems.filter((i) => !i.exposure_status || i.exposure_status === 'published')
      : allItems.filter((i) => !i.profile_status || i.profile_status === 'published')
    : kind === 'student'
      ? sortListItems(allItems, 'student', sort)
      : getBasicPool(allItems, occupied, { kind, sort });
  const page = opts.page ?? getGuestListPage(listId);
  const pageItems = slicePage(pool, page, basicPageSize);
  const sortBar = renderListSortSelect(kind, sort, { listId, mode: sortMode });

  return `
    <div class="list-subsection" data-guest-list="${listId}">
      ${renderSectionHeading(headingCfg)}
      ${sortBar}
      ${renderBrowseList(kind, pageItems, { guest: opts.guest ?? true, ...opts })}
      ${renderListPagination(listId, pool.length, page, basicPageSize)}
    </div>
  `;
}

export function renderBasicListBlock(kind, headingCfg, items, opts = {}) {
  const { basicPageSize } = getExposurePageSizes();
  const listId = opts.listId || `basic_${kind}`;
  const occupied = opts.primeOccupied ?? [];
  const sortMode = opts.sortMode || 'home';
  const sort = opts.sort ?? readListSortFromHash(kind, { mode: sortMode });
  const pool = occupied.length
    ? getBasicPool(items, occupied, { kind, sort })
    : sortListItems(items, kind, sort);
  const page = opts.page ?? (opts.paginated ? getGuestListPage(listId) : 1);
  const usePager = opts.paginated !== false;
  const pageItems = usePager ? slicePage(pool, page, basicPageSize) : pool;
  const sortBar =
    opts.showSort === false
      ? ''
      : renderListSortSelect(kind, sort, { listId, mode: sortMode });

  return `
    <div class="list-subsection" data-guest-list="${listId}">
      ${renderSectionHeading(headingCfg)}
      ${sortBar}
      ${renderBrowseList(kind, pageItems, opts)}
      ${usePager ? renderListPagination(listId, pool.length, page, basicPageSize) : ''}
    </div>
  `;
}

export function renderStudentListRow(student) {
  return renderBasicStudentRow(student, { guest: true });
}

export {
  getPrimeOccupied,
  getPrimeCandidatePool,
  getPickPool,
  getBasicPool,
  buildPrimeSlotArray,
};
