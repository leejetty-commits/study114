import { EXPOSURE_TIER_META } from './exposure-schema.js';
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
  GUEST_LIST_PAGE_SIZE,
  PICK_PAGE_SIZE,
  sortByDateDesc,
  slicePage,
  renderListPagination,
} from './list-pagination.js';
import { getGuestListPage } from './state.js';
import { isWishlisted, isInCompare } from './user-actions-state.js';
import {
  renderStudentProviderActions,
  renderStudentConsumerActions,
} from './student-review-ui.js';
import { SLOT_PICK_ROW } from './data.js';

function esc(s) {
  if (s == null || s === '') return '';
  return String(s).replace(/</g, '&lt;');
}

/** 괄호 필드 — 값만 */
function valOnly(text, opts = {}) {
  return { text: text || '—', cls: `expo-tbl__cell--val-only${opts.cls ? ` ${opts.cls}` : ''}`, ...opts };
}

/** 항목제목 + 값 (Prime/Pick 표) */
function labeled(label, text, opts = {}) {
  return {
    html: `<span class="expo-tbl__label">${esc(label)}</span><span class="expo-tbl__val">${esc(text || '—')}</span>`,
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
    html: `${g}<span class="expo-tbl__label">${esc(nameLabel)}</span><span class="expo-tbl__val">${esc(name || '—')}</span>`,
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

/** 11장 §2 — 추천·찜·후기·쪽지·비교 아이콘+숫자 */
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
    recommend_count: item.recommend_count ?? 0,
    wish_count: item.wish_count ?? 0,
    review_count: item.review_count ?? 0,
    message_count: item.message_count ?? 0,
    compare_count: item.compare_count ?? 0,
  };
}

/**
 * @param {{ guest?: boolean, compareKind?: 'study_room'|'tutor', showCompare?: boolean, itemId?: number, recommend_count?: number, wish_count?: number, review_count?: number, message_count?: number, compare_count?: number }} opts
 */
export function renderItemActions(opts = {}) {
  const {
    guest = false,
    compareKind = 'study_room',
    showCompare = true,
    itemId,
    recommend_count = 0,
    wish_count = 0,
    review_count = 0,
    message_count = 0,
    compare_count = 0,
  } = opts;
  const kind = compareKind;
  const wished = !guest && itemId != null && isWishlisted(kind, itemId);
  const inCompare = !guest && itemId != null && isInCompare(kind, itemId);

  const recommendBtn = actionCountBtn('👍', recommend_count, {
    title: `추천 ${recommend_count}`,
    disabled: true,
  });

  const wishAttrs = guest
    ? `data-action="login-gate" data-gate="wish" data-gate-label="찜"`
    : `data-action="wish-toggle" data-item-kind="${kind}" data-item-id="${itemId}"`;
  const wishBtn = actionCountBtn(wished ? '♥' : '♡', wish_count, {
    title: `찜 ${wish_count}`,
    cls: wished ? 'is-active' : '',
    attrs: wishAttrs,
  });

  const reviewBtn = actionCountBtn('💬', review_count, {
    title: `후기 ${review_count}`,
    disabled: true,
    hideWhenZero: true,
  });

  const msgAttrs = guest
    ? `data-action="login-gate" data-gate="inquire" data-gate-label="쪽지"`
    : `data-action="login-gate" data-gate="inquire" data-gate-label="쪽지"`;
  const messageBtn = actionCountBtn('✉', message_count, {
    title: `쪽지 ${message_count}`,
    attrs: msgAttrs,
  });

  const compareBtn = !showCompare
    ? ''
    : guest
      ? actionCountBtn('⇄', compare_count, {
          title: `비교 ${compare_count}`,
          attrs: `data-action="compare-guest-blocked" data-compare-kind="${kind}"`,
        })
      : actionCountBtn('⇄', compare_count, {
          title: `비교 ${compare_count}`,
          cls: inCompare ? 'is-active' : '',
          attrs: `data-action="compare-toggle" data-item-kind="${kind}" data-item-id="${itemId}"`,
        });

  return `
    <div class="item-actions" aria-label="항목 액션">
      ${recommendBtn}
      ${wishBtn}
      ${reviewBtn}
      ${messageBtn}
      ${compareBtn}
    </div>
  `;
}

function renderCompareChip(kind, itemId, opts) {
  if (opts.showCompare === false) return '';
  if (opts.guest) {
    return `<button type="button" class="expo-compare-chip" data-action="compare-guest-blocked" data-compare-kind="${kind}">비교</button>`;
  }
  const active = isInCompare(kind, itemId);
  return `<button type="button" class="expo-compare-chip${active ? ' is-active' : ''}" data-action="compare-toggle" data-item-kind="${kind}" data-item-id="${itemId}">비교</button>`;
}

/** @param {'prime'|'pick'|'list'} ratio */
function renderMedia(image_path, alt, ratio) {
  const cls = `expo-media expo-media--${ratio}`;
  if (image_path) {
    return `<div class="${cls}"><img src="${esc(image_path)}" alt="${esc(alt)}" loading="lazy" /></div>`;
  }
  return `<div class="${cls} expo-media--placeholder" aria-hidden="true"><span class="expo-media__ph-label">이미지 없음 · 기본값</span></div>`;
}

/**
 * @param {{ tl?: string, bl?: string, br?: string, mid?: string }} zones
 */
function renderMediaBlock(image_path, alt, ratio, zones = {}) {
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
      ${renderMedia(image_path, alt, ratio)}
      ${overlay}
    </div>`;
}

function renderStudyRoomMediaOverlay(item, compareHtml) {
  return renderMediaBlock(item.image_path, item.study_room_name, 'prime', {
    tl: `<span class="expo-overlay-val">${esc(item.location_label)}</span>`,
    br: compareHtml,
  });
}

function renderPickStudyRoomMedia(item, compareHtml) {
  return renderMediaBlock(item.image_path, item.study_room_name, 'pick', {
    tl: `<span class="expo-overlay-val">${esc(item.location_label)}</span>`,
    br: compareHtml,
  });
}

/** 수업장소 미입력 시 (선택) */
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
  const grad = formatUniversityStatus(item.university_status) || '—';
  const edu =
    [item.university_name, item.major_name].filter(Boolean).join(' ') ||
    item.university_note ||
    formatUniversitySummary(item);
  const career = formatCareerYearBand(item.career_year_band) || '—';
  const fee = renderTutorFeeOverlay(item);
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
    .map((b) => `<span class="expo-tbl__badge">${esc(b)}</span>`)
    .join('');
}

function renderVerificationCell(item, maxDocs) {
  const count = item.verification_doc_count ?? (item.proof_document_available ? 1 : 0);
  if (!count) return '—';
  const shown = maxDocs === 1 ? 1 : count;
  const label = `${shown}개 공개 · 상세`;
  return `<button type="button" class="expo-link-btn" data-action="login-gate" data-gate="trust" data-gate-label="제출자료">${esc(label)}</button>`;
}

function studyRoomTableRows(item, { showIntro = true, featureMax = 3, stack = false }, actions = '') {
  if (stack) {
    const rows = [
      [valOnly(item.study_room_name, { cls: 'expo-tbl__cell--name' }), valOnly(formatMonthlyWon(item.price_amount), { cls: 'expo-tbl__cell--price' })],
      [{ html: renderTrustBadges(item.badges), col: 2, cls: 'expo-tbl__cell--badges' }],
      [labeled('대상', item.grade_band, { col: 2 })],
      [labeled('과목', item.main_subject_note, { col: 2 })],
      [labeled('수업장소', optionalStudyRoomPlace(item.lesson_place_type), { col: 2 })],
      [labeled('원생수', item.capacity_per_time || '—', { col: 2 })],
      [labeled('수업형태', formatLessonOperationType(item.lesson_operation_type), { col: 2 })],
      [labeled('특징', joinFeatures(item, featureMax), { col: 2, cls: 'expo-tbl__cell--features' })],
    ];
    return appendSloganAndActions(rows, item, actions, { showIntro });
  }

  const rows = [
    [valOnly(item.study_room_name, { cls: 'expo-tbl__cell--name' }), valOnly(formatMonthlyWon(item.price_amount), { cls: 'expo-tbl__cell--price' })],
    [{ html: renderTrustBadges(item.badges), col: 2, cls: 'expo-tbl__cell--badges' }],
    [labeled('대상', item.grade_band), labeled('과목', item.main_subject_note)],
    [labeled('수업장소', optionalStudyRoomPlace(item.lesson_place_type)), labeled('원생수', item.capacity_per_time || '—')],
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

  if (stack) {
    const rows = [
      [nameWithGenderCell(item.tutor_display_name, item.gender), verifyCell],
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

function renderPrimeStudyRoom(item, slotLabel, tierMeta, actions, opts) {
  const compare = renderCompareChip('study_room', item.id, opts);
  const rows = studyRoomTableRows(item, { showIntro: true, featureMax: 3 }, actions);
  return `
    <article class="expo-card expo-card--prime expo-card--study_room" data-provider-id="${item.id}" data-provider-kind="study_room">
      <span class="expo-card__slot">${esc(slotLabel)} · ${tierMeta.label}</span>
      ${renderStudyRoomMediaOverlay(item, compare)}
      ${renderExpoTable(rows, 'expo-tbl--card')}
    </article>`;
}

function renderPrimeTutor(item, slotLabel, tierMeta, actions, opts) {
  const compare = renderCompareChip('tutor', item.id, opts);
  const rows = tutorTableRows(item, { showIntro: true, featureMax: 3 }, actions);
  return `
    <article class="expo-card expo-card--prime expo-card--tutor" data-provider-id="${item.id}" data-provider-kind="tutor">
      <span class="expo-card__slot">${esc(slotLabel)} · ${tierMeta.label}</span>
      ${renderTutorMediaOverlay(item, compare, 'prime')}
      ${renderExpoTable(rows, 'expo-tbl--card')}
    </article>`;
}

function renderPickStudyRoom(item, slotLabel, tierMeta, actions, opts) {
  const compare = renderCompareChip('study_room', item.id, opts);
  const rows = studyRoomTableRows(item, { showIntro: false, featureMax: 1, stack: true }, actions);
  return `
    <article class="expo-card expo-card--pick expo-card--study_room" data-provider-id="${item.id}" data-provider-kind="study_room">
      <span class="expo-card__slot">${esc(slotLabel)} · ${tierMeta.label}</span>
      ${renderPickStudyRoomMedia(item, compare)}
      ${renderExpoTable(rows, 'expo-tbl--card expo-tbl--compact')}
    </article>`;
}

function renderPickTutor(item, slotLabel, tierMeta, actions, opts) {
  const compare = renderCompareChip('tutor', item.id, opts);
  const rows = tutorTableRows(item, { showIntro: false, featureMax: 1, verifyMax: 1, stack: true }, actions);
  return `
    <article class="expo-card expo-card--pick expo-card--tutor" data-provider-id="${item.id}" data-provider-kind="tutor">
      <span class="expo-card__slot">${esc(slotLabel)} · ${tierMeta.label}</span>
      ${renderTutorMediaOverlay(item, compare, 'pick')}
      ${renderExpoTable(rows, 'expo-tbl--card expo-tbl--compact')}
    </article>`;
}

/**
 * @param {'study_room' | 'tutor'} kind
 * @param {'prime' | 'pick'} tier
 */
export function renderExposureBox(kind, tier, item, slotLabel, opts = {}) {
  const tierMeta = EXPOSURE_TIER_META[tier];
  const actionOpts = actionOptsFromItem(item, {
    guest: opts.guest,
    compareKind: kind,
  });
  const actions = renderItemActions(actionOpts);
  if (tier === 'prime') {
    return kind === 'tutor'
      ? renderPrimeTutor(item, slotLabel, tierMeta, actions, actionOpts)
      : renderPrimeStudyRoom(item, slotLabel, tierMeta, actions, actionOpts);
  }
  return kind === 'tutor'
    ? renderPickTutor(item, slotLabel, tierMeta, actions, actionOpts)
    : renderPickStudyRoom(item, slotLabel, tierMeta, actions, actionOpts);
}

function renderBasicStudyRoomRow(item, opts) {
  const actions = renderItemActions(
    actionOptsFromItem(item, { guest: opts.guest, compareKind: 'study_room' }),
  );
  const compare = renderCompareChip('study_room', item.id, {
    guest: opts.guest,
    showCompare: true,
  });
  return `
    <article class="expo-basic expo-basic--study_room" data-provider-id="${item.id}" data-provider-kind="study_room">
      ${renderExpoTable(
        [
          [
            labeled('공부방명', item.study_room_name, { cls: 'expo-tbl__cell--name' }),
            labeled('대상', item.grade_band),
            labeled('과목', item.main_subject_note),
            valOnly(formatMonthlyWon(item.price_amount), { cls: 'expo-tbl__cell--price' }),
            { html: `<span class="expo-tbl__label">비교태그</span>${compare}`, cls: 'expo-tbl__cell--compare' },
          ],
          [
            valOnly(item.location_label),
            labeled('수업장소', optionalStudyRoomPlace(item.lesson_place_type)),
            labeled('원생수', item.capacity_per_time || '—'),
            labeled('수업형태', formatLessonOperationType(item.lesson_operation_type)),
            labeled('특징', item.feature_1 || '—'),
          ],
          [labeled('슬로건', item.slogan || item.feature_1 || '—', { col: 5 })],
          [{ html: actions, col: 5, cls: 'expo-tbl__cell--actions' }],
        ],
        'expo-tbl--basic expo-tbl--card',
      )}
    </article>`;
}

function renderBasicTutorRow(item, opts) {
  const actions = renderItemActions(
    actionOptsFromItem(item, { guest: opts.guest, compareKind: 'tutor' }),
  );
  const compare = renderCompareChip('tutor', item.id, { guest: opts.guest, showCompare: true });
  const schedule =
    item.lessons_per_week && item.minutes_per_lesson
      ? `주${item.lessons_per_week}·${item.minutes_per_lesson}분`
      : '—';
  return `
    <article class="expo-basic expo-basic--tutor" data-provider-id="${item.id}" data-provider-kind="tutor">
      ${renderExpoTable(
        [
          [
            nameWithGenderCell(item.tutor_display_name, item.gender),
            labeled('대상', item.grade_band || '—'),
            labeled('과목', item.main_subject_note),
            valOnly(formatTutorFeeCard(item), { cls: 'expo-tbl__cell--price' }),
            { html: `<span class="expo-tbl__label">비교태그</span>${compare}`, cls: 'expo-tbl__cell--compare' },
          ],
          [
            valOnly(item.location_label),
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

function renderBasicStudentRow(item, opts) {
  const viewerRole = opts.viewerRole || (opts.guest ? 'guest' : 'parent');
  const actions =
    viewerRole === 'tutor' || viewerRole === 'study_room'
      ? renderStudentProviderActions(item, { guest: opts.guest, viewerRole })
      : renderStudentConsumerActions();
  const schedule =
    item.lessons_per_week && item.minutes_per_lesson
      ? `주${item.lessons_per_week}·${item.minutes_per_lesson}분`
      : '—';
  const request =
    item.request_summary_visibility === 'private' && opts.guest
      ? '로그인 후'
      : item.request_summary || '—';
  return `
    <article class="expo-basic expo-basic--student" data-student-id="${item.id}" data-action="open-student-detail">
      ${renderExpoTable(
        [
          [
            nameWithGenderCell(item.public_display_name, item.gender),
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
  const pickPool = allItems.slice(3);
  const page = opts.page ?? getGuestListPage(listId);
  const pageItems = slicePage(pickPool, page, PICK_PAGE_SIZE);
  const cards = pageItems
    .map((item, i) => {
      const globalIndex = (page - 1) * PICK_PAGE_SIZE + i;
      const slotLabel = SLOT_PICK_ROW[globalIndex] || `Pick ${globalIndex + 1}`;
      return renderExposureBox(kind, 'pick', item, slotLabel, opts);
    })
    .join('');

  return `
    <div class="list-subsection" data-guest-list="${listId}">
      ${renderSectionHeading(headingCfg)}
      <div class="expo-grid--5">${cards}</div>
      ${renderListPagination(listId, pickPool.length, page, PICK_PAGE_SIZE)}
    </div>
  `;
}

export function renderGuestPaginatedListBlock(kind, listId, headingCfg, allItems, opts = {}) {
  const dateKey = kind === 'student' ? 'published_at' : 'registered_at';
  const sorted = sortByDateDesc(allItems, dateKey);
  const page = opts.page ?? getGuestListPage(listId);
  const pageItems = slicePage(sorted, page, GUEST_LIST_PAGE_SIZE);

  return `
    <div class="list-subsection" data-guest-list="${listId}">
      ${renderSectionHeading(headingCfg)}
      ${renderBrowseList(kind, pageItems, { guest: opts.guest ?? true })}
      ${renderListPagination(listId, sorted.length, page, GUEST_LIST_PAGE_SIZE)}
    </div>
  `;
}

export function renderBasicListBlock(kind, headingCfg, items, opts = {}) {
  return `
    <div class="list-subsection">
      ${renderSectionHeading(headingCfg)}
      ${renderBrowseList(kind, items, opts)}
    </div>
  `;
}

export function renderStudentListRow(student) {
  return renderBasicStudentRow(student, { guest: true });
}
