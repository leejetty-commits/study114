import { EXPOSURE_TIER_META } from './exposure-schema.js';
import { renderSectionHeading } from './section-headings.js';
import {
  formatMonthlyWon,
  formatHourlyWon,
  formatGender,
  formatCareerYears,
  formatProfileStatus,
  formatExposureStatus,
  browseCenterStudyRoom,
  browseCenterTutor,
  browseCenterStudent,
  browseIdentityStudyRoom,
  browseIdentityTutor,
  browseIdentityStudent,
  browseStatusTutor,
} from './exposure-format.js';
import {
  GUEST_LIST_PAGE_SIZE,
  sortByDateDesc,
  slicePage,
  renderListPagination,
} from './list-pagination.js';
import { getGuestListPage } from './state.js';

function esc(s) {
  if (s == null || s === '') return '';
  return String(s).replace(/</g, '&lt;');
}

function oneLine(...parts) {
  return parts.filter(Boolean).join(' · ') || '—';
}

/**
 * @param {{ guest?: boolean, compareKind?: 'study_room'|'tutor', showCompare?: boolean, review_count?: number }} opts
 */
export function renderItemActions(opts = {}) {
  const { guest = false, compareKind = 'study_room', showCompare = true, review_count = 0 } = opts;
  const compareAction = guest
    ? `data-action="compare-guest-blocked" data-compare-kind="${compareKind}"`
    : `data-action="compare-open" data-compare-kind="${compareKind}"`;
  const reviewN = Number(review_count) || 0;
  const reviewBtn =
    reviewN >= 1
      ? `<button type="button" class="item-actions__btn item-actions__btn--review" title="후기 ${reviewN}건" disabled aria-disabled="true">💬<span class="item-actions__count">${reviewN}</span></button>`
      : '';

  return `
    <div class="item-actions" aria-label="항목 액션">
      <button type="button" class="item-actions__btn" title="찜" data-action="login-gate" data-gate="wish" data-gate-label="찜">♡</button>
      <button type="button" class="item-actions__btn" title="추천" disabled aria-disabled="true">👍</button>
      ${showCompare ? `<button type="button" class="item-actions__btn" title="비교" ${compareAction}>⇄</button>` : ''}
      <button type="button" class="item-actions__btn" title="문의" data-action="login-gate" data-gate="inquire" data-gate-label="문의">✉</button>
      ${reviewBtn}
    </div>
  `;
}

function renderBrowseRowShell({ left, center, right, rowClass, dataAttrs }) {
  return `
    <article class="browse-row browse-row--3col ${rowClass}" ${dataAttrs}>
      <div class="browse-row__col browse-row__col--left">${left}</div>
      <div class="browse-row__col browse-row__col--center">${center}</div>
      <div class="browse-row__col browse-row__col--right">${right}</div>
    </article>
  `;
}

function renderBrowseLeft(title, identityMeta, imagePath, alt, extra = '') {
  return `
    ${renderMedia(imagePath, alt, 'list')}
    <div class="browse-row__identity">
      <h3 class="browse-row__title">${title}${extra}</h3>
      <p class="browse-row__meta">${identityMeta}</p>
    </div>
  `;
}

function renderBrowseCenter(line1, line2) {
  return `
    <p class="browse-row__center-line browse-row__center-line--primary">${line1}</p>
    <p class="browse-row__center-line browse-row__center-line--secondary">${line2}</p>
  `;
}

/** 우측: 가격+상태 / 날짜+아이콘 — 2블록 압축 */
function renderBrowseRightCompact(price, status, statusClass, date, dateAttr, actions) {
  return `
    <div class="browse-row__right-stack">
      <div class="browse-row__compact-block">
        <span class="browse-row__price">${price}</span>
        <span class="browse-row__tag ${statusClass}">${status}</span>
      </div>
      <div class="browse-row__compact-block browse-row__compact-block--foot">
        <time class="browse-row__date" datetime="${dateAttr}">${date}</time>
        ${actions}
      </div>
    </div>
  `;
}

/** @param {'prime'|'pick'|'list'} ratio */
function renderMedia(image_path, alt, ratio) {
  const cls = `expo-media expo-media--${ratio}`;
  if (image_path) {
    return `<div class="${cls}"><img src="${esc(image_path)}" alt="${esc(alt)}" loading="lazy" /></div>`;
  }
  return `<div class="${cls} expo-media--placeholder" aria-hidden="true"></div>`;
}

function renderBadges(badges, max = 2) {
  if (!badges?.length) return '';
  return `<div class="expo-card__badges">${badges
    .slice(0, max)
    .map((b) => `<span class="expo-card__badge">${esc(b)}</span>`)
    .join('')}</div>`;
}

function renderPrimeStudyRoom(item, slotLabel, tierMeta, actions) {
  const subjectTarget = oneLine(item.main_subject_note, item.grade_band);
  const introLine =
    item.intro_short || [item.feature_1, item.feature_2].filter(Boolean).join(' · ') || '—';

  return `
    <article class="expo-card expo-card--prime expo-card--study_room" data-provider-id="${item.id}" data-provider-kind="study_room">
      <span class="expo-card__slot">${esc(slotLabel)} · ${tierMeta.label}</span>
      ${renderMedia(item.image_path, item.study_room_name, 'prime')}
      <div class="expo-card__prime-grid">
        <div class="expo-card__prime-main">
          <h3 class="expo-card__title">${esc(item.study_room_name)}</h3>
          <p class="expo-card__loc">${esc(item.location_label)}</p>
          <p class="expo-card__line">${esc(subjectTarget)}</p>
          <p class="expo-card__intro">${esc(introLine)}</p>
          ${renderBadges(item.badges, 2)}
        </div>
        <div class="expo-card__prime-side">
          <p class="expo-card__price">${esc(formatMonthlyWon(item.price_amount))}</p>
          <p class="expo-card__side-value">${esc(item.grade_band)}</p>
          <p class="expo-card__side-meta">${esc(item.capacity_per_time ? `1타임 ${item.capacity_per_time}` : '')}</p>
        </div>
      </div>
      <footer class="expo-card__foot">${actions}</footer>
    </article>
  `;
}

function renderPrimeTutor(item, slotLabel, tierMeta, actions) {
  const subjectTarget = oneLine(item.main_subject_note, formatGender(item.gender));
  const introLine =
    item.intro_short || [item.feature_1, item.feature_2].filter(Boolean).join(' · ') || '—';

  return `
    <article class="expo-card expo-card--prime expo-card--tutor" data-provider-id="${item.id}" data-provider-kind="tutor">
      <span class="expo-card__slot">${esc(slotLabel)} · ${tierMeta.label} <span class="expo-card__design">[설계/더미]</span></span>
      ${renderMedia(item.image_path, item.display_name, 'prime')}
      <div class="expo-card__prime-grid">
        <div class="expo-card__prime-main">
          <h3 class="expo-card__title">${esc(item.display_name)}</h3>
          <p class="expo-card__loc">${esc(item.location_label)}</p>
          <p class="expo-card__line">${esc(subjectTarget)}</p>
          <p class="expo-card__intro">${esc(introLine)}</p>
          ${renderBadges(item.badges, 2)}
        </div>
        <div class="expo-card__prime-side">
          <p class="expo-card__price">${esc(formatHourlyWon(item.preferred_fee_amount))}</p>
          <p class="expo-card__side-value">${esc(formatCareerYears(item.career_years))}</p>
          <p class="expo-card__side-meta">${esc(item.education_background_note || '')}</p>
        </div>
      </div>
      <footer class="expo-card__foot">${actions}</footer>
    </article>
  `;
}

function renderPickCard(kind, item, slotLabel, tierMeta, actions) {
  const isTutor = kind === 'tutor';
  const title = isTutor ? item.display_name : item.study_room_name;
  const subjectLine = isTutor
    ? oneLine(item.main_subject_note, formatCareerYears(item.career_years))
    : oneLine(item.main_subject_note, item.grade_band);
  const featureLine = item.feature_1 || item.intro_short || '—';
  const price = isTutor ? formatHourlyWon(item.preferred_fee_amount) : formatMonthlyWon(item.price_amount);

  return `
    <article class="expo-card expo-card--pick expo-card--${kind}" data-provider-id="${item.id}" data-provider-kind="${kind}">
      <span class="expo-card__slot">${esc(slotLabel)} · ${tierMeta.label}${isTutor ? ' <span class="expo-card__design">[설계/더미]</span>' : ''}</span>
      ${renderMedia(item.image_path, title, 'pick')}
      <div class="expo-card__pick-body">
        <h3 class="expo-card__title">${esc(title)}</h3>
        <p class="expo-card__loc">${esc(item.location_label)}</p>
        <p class="expo-card__price">${esc(price)}</p>
        <p class="expo-card__line">${esc(subjectLine)}</p>
        <p class="expo-card__features">${esc(featureLine)}</p>
        ${renderBadges(item.badges, 1)}
      </div>
      <footer class="expo-card__foot">${actions}</footer>
    </article>
  `;
}

/**
 * @param {'study_room' | 'tutor'} kind
 * @param {'prime' | 'pick'} tier
 */
export function renderExposureBox(kind, tier, item, slotLabel, opts = {}) {
  const tierMeta = EXPOSURE_TIER_META[tier];
  const actions = renderItemActions({
    guest: opts.guest,
    compareKind: kind,
    review_count: item.review_count,
  });
  if (tier === 'prime') {
    return kind === 'tutor'
      ? renderPrimeTutor(item, slotLabel, tierMeta, actions)
      : renderPrimeStudyRoom(item, slotLabel, tierMeta, actions);
  }
  return renderPickCard(kind, item, slotLabel, tierMeta, actions);
}

function renderBrowseRow3Col(kind, item, opts) {
  const actions = renderItemActions({
    guest: opts.guest,
    compareKind: kind === 'tutor' ? 'tutor' : 'study_room',
    showCompare: kind !== 'student',
    review_count: item.review_count,
  });

  if (kind === 'student') {
    const center = browseCenterStudent(item);
    const statusCls =
      item.exposure_status === 'published' ? 'browse-row__tag--open' : 'browse-row__tag--review';
    return renderBrowseRowShell({
      rowClass: 'browse-row--student',
      dataAttrs: `data-student-id="${item.id}" data-action="login-gate" data-gate="student-detail" data-gate-label="학생 의뢰"`,
      left: renderBrowseLeft(
        esc(item.public_display_name),
        esc(browseIdentityStudent(item)),
        null,
        item.public_display_name,
      ),
      center: renderBrowseCenter(esc(center.line1), esc(center.line2)),
      right: renderBrowseRightCompact(
        esc(formatHourlyWon(item.preferred_fee_amount)),
        esc(formatExposureStatus(item.exposure_status)),
        statusCls,
        esc(item.published_at),
        esc(item.published_at),
        actions,
      ),
    });
  }

  if (kind === 'tutor') {
    const center = browseCenterTutor(item);
    const statusCls =
      item.profile_status === 'published' ? 'browse-row__tag--open' : 'browse-row__tag--review';
    return renderBrowseRowShell({
      rowClass: 'browse-row--tutor',
      dataAttrs: `data-provider-id="${item.id}" data-provider-kind="tutor"`,
      left: renderBrowseLeft(
        esc(item.display_name),
        esc(browseIdentityTutor(item)),
        item.image_path,
        item.display_name,
        ' <span class="expo-card__design">[설계/더미]</span>',
      ),
      center: renderBrowseCenter(esc(center.line1), esc(center.line2)),
      right: renderBrowseRightCompact(
        esc(formatHourlyWon(item.preferred_fee_amount)),
        esc(browseStatusTutor(item)),
        statusCls,
        esc(item.registered_at),
        esc(item.registered_at),
        actions,
      ),
    });
  }

  const center = browseCenterStudyRoom(item);
  const statusCls =
    item.profile_status === 'published' ? 'browse-row__tag--open' : 'browse-row__tag--review';
  return renderBrowseRowShell({
    rowClass: 'browse-row--study_room',
    dataAttrs: `data-provider-id="${item.id}" data-provider-kind="study_room"`,
    left: renderBrowseLeft(
      esc(item.study_room_name),
      esc(browseIdentityStudyRoom(item)),
      item.image_path,
      item.study_room_name,
    ),
    center: renderBrowseCenter(esc(center.line1), esc(center.line2)),
    right: renderBrowseRightCompact(
      esc(formatMonthlyWon(item.price_amount)),
      esc(formatProfileStatus(item.profile_status)),
      statusCls,
      esc(item.registered_at),
      esc(item.registered_at),
      actions,
    ),
  });
}

/** @param {'study_room'|'tutor'|'student'} kind */
export function renderBrowseList(kind, items, opts = {}) {
  return `
    <div class="browse-list" role="list">
      ${items.map((item) => renderBrowseRow3Col(kind, item, opts)).join('')}
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
  return renderBrowseRow3Col('student', student, { guest: true });
}
