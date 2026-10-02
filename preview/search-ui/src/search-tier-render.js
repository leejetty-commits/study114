/**
 * 홈 = 프라임/픽/베이직 티어
 * 찾기 검색 전 = 베이직 제목(flat) · 검색 후 = 결과 flat
 */

import {
  renderPrimeSlotGrid,
  renderPickPaginatedBlock,
  renderBasicListBlock,
  renderBrowseList,
  renderGuestVacantBasicList,
  renderExposureBox,
  renderEmptyPrimePromo,
  renderEmptyPickPromo,
  renderEmptyBasicPromo,
  getPrimeOccupied,
  getPrimeCandidatePool,
} from '@home-ui/exposure-render.js';
import { getExposurePageSizes } from '@home-ui/exposure-rules.js';
import { buildStudyRoomSampleItem, buildTutorSampleItem } from '@home-ui/home-card-samples/presets.js';
import { STUDENT_BRANCH_COPY } from '@home-ui/student-reg/student-reg-copy.js';
import { SECTION_HEADINGS, renderSectionHeading, renderSectionToolbar, renderSectionTitleBar } from '@home-ui/section-headings.js';
import { partitionByExposureTier } from './search-exposure-mapper.js';
import { renderSearchZeroState, renderStateCard } from '@home-ui/empty-state-copy.js';
import {
  readListSortFromHash,
  renderListSortSelect,
  sortListItems,
} from '../../shared/list-sort.js';
import { tutorHomePrimaryLabel } from '@home-ui/tutor-home-seed.js';

function tutorPrimaryRegionLabel() {
  return tutorHomePrimaryLabel();
}

/** 학생 홈 0건 전용 샘플. 지역 라벨 = 학생 저장 지역. 목록 풀에 넣지 않는다. */
function studentHomeSample(kind, tier, place) {
  const item = kind === 'tutor' ? buildTutorSampleItem(tier) : buildStudyRoomSampleItem(tier);
  item.id = `student-home-sample-${kind}-${tier}`;
  item._vacantSample = true;
  if (kind === 'tutor') item.tutor_display_name = '샘플 과외쌤';
  else item.study_room_name = '샘플 공부방';
  item.location_label = place;
  return item;
}

/**
 * 학생 홈 0건 — 공부방 홈 빈 자리와 같은 방식: 티어마다 샘플 1장 + 나머지 빈 카드 박스.
 * @param {'study_room'|'tutor'} kind
 * @param {string} place
 * @param {object} opts
 */
function renderStudentHomeVacantTiers(kind, place, opts) {
  const { primeSlots } = getExposurePageSizes();
  const pickRowSlots = 5;
  const section =
    kind === 'study_room'
      ? { prime: SECTION_HEADINGS.primeStudyRoom, pick: SECTION_HEADINGS.pickStudyRoom, basic: SECTION_HEADINGS.basicStudyRoom, color: 'content-section--orange' }
      : { prime: SECTION_HEADINGS.primeTutor, pick: SECTION_HEADINGS.pickTutor, basic: SECTION_HEADINGS.basicTutor, color: 'content-section--blue' };
  const boxOpts = { ...opts, guest: false };
  const prime = [
    renderExposureBox(kind, 'prime', studentHomeSample(kind, 'prime', place), '', boxOpts),
    ...Array.from({ length: Math.max(0, primeSlots - 1) }, () => renderEmptyPrimePromo(kind)),
  ].join('');
  const pick = [
    renderExposureBox(kind, 'pick', studentHomeSample(kind, 'pick', place), '', boxOpts),
    ...Array.from({ length: pickRowSlots - 1 }, () => renderEmptyPickPromo(kind)),
  ].join('');
  return `
    <div class="content-section ${section.color} search-tier-results" data-surface="home-tier" data-student-home-vacant="${kind}">
      ${renderSectionHeading({ ...section.prime, locationLabel: place })}
      ${renderSectionToolbar({ locationLabel: place })}
      <div class="expo-grid--3">${prime}</div>
      <div class="list-subsection">
        ${renderSectionHeading({ ...section.pick, locationLabel: place, desc: undefined })}
        ${renderSectionToolbar({ locationLabel: place })}
        <div class="expo-grid--5">${pick}</div>
      </div>
      <div class="list-subsection">
        ${renderSectionTitleBar({ ...section.basic, locationLabel: place, desc: undefined })}
        ${renderBrowseList(kind, [studentHomeSample(kind, 'basic', place)], boxOpts)}
        <div class="browse-list browse-list--table" role="list">${renderEmptyBasicPromo()}</div>
      </div>
    </div>`;
}

/** 학생 홈 「우리동네 학생」 0건. @param {string} place */
function renderStudentHomeNoStudents(place) {
  const copy = STUDENT_BRANCH_COPY.home;
  return `
    <div class="content-section search-tier-results search-tier-results--empty" data-student-home-empty="student">
      ${renderSectionTitleBar({ ...SECTION_HEADINGS.students, locationLabel: place })}
      ${renderStateCard({
        title: copy.studentEmptyTitle(place),
        body: copy.studentEmptyBody,
        variant: 'empty',
        screenId: 'P13-zero',
      })}
    </div>`;
}

/**
 * @param {'study_room'|'tutor'} kind
 * @param {object[]} items
 * @param {{ guest?: boolean, viewerRole?: string, sourceRoute?: string, showCompare?: boolean, showWish?: boolean }} opts
 * @param {string} [sectionTag]
 * @param {'region'|'search'} [mode]
 */
function renderProviderTierResults(kind, items, opts = {}, sectionTag = '지역 피드', mode = 'region') {
  const occupied =
    kind === 'tutor' ? getPrimeCandidatePool('tutor', items) : getPrimeOccupied(items);
  const section =
    kind === 'study_room'
      ? {
          prime: SECTION_HEADINGS.primeStudyRoom,
          pick: SECTION_HEADINGS.pickStudyRoom,
          basic: SECTION_HEADINGS.basicStudyRoom,
          color: 'content-section--orange',
          primeListId: `search_prime_${kind}`,
          pickListId: `search_pick_${kind}`,
          basicListId: `search_basic_${kind}`,
        }
      : {
          prime: SECTION_HEADINGS.primeTutor,
          pick: SECTION_HEADINGS.pickTutor,
          basic: SECTION_HEADINGS.basicTutor,
          color: 'content-section--blue',
          primeListId: `search_prime_${kind}`,
          pickListId: `search_pick_${kind}`,
          basicListId: `search_basic_${kind}`,
        };

  if (!items.length) {
    const tab = kind === 'study_room' ? 'room' : 'tutor';
    return `<div class="search-tier-results search-tier-results--empty">${renderSearchZeroState(tab, mode)}</div>`;
  }

  // 지역은 제목 아래 toolbar「현재위치」(정렬과 같은 행)
  const loc =
    opts.viewerRole === 'tutor' && opts.pinTutorPrimary ? tutorPrimaryRegionLabel() : sectionTag || '';
  const vacantSamples =
    opts.guest !== true &&
    ((kind === 'study_room' && opts.viewerRole === 'study_room') ||
      (kind === 'tutor' && opts.viewerRole === 'tutor' && opts.pinTutorPrimary === true));
  const primeHtml = `
      ${renderSectionHeading({ ...section.prime, locationLabel: loc })}
      ${renderSectionToolbar({ locationLabel: loc })}
      ${renderPrimeSlotGrid(kind, occupied, {
        ...opts,
        vacantSamples,
        listId: kind === 'tutor' ? section.primeListId : undefined,
      })}`;

  const pickHtml = renderPickPaginatedBlock(
    kind,
    section.pickListId,
    { ...section.pick, locationLabel: loc, desc: undefined },
    items,
    { ...opts, primeOccupied: occupied, vacantSamples },
  );

  const basicHtml = renderBasicListBlock(
    kind,
    { ...section.basic, locationLabel: loc, desc: undefined },
    items,
    {
      ...opts,
      primeOccupied: occupied,
      paginated: true,
      listId: section.basicListId,
      sortMode: 'home',
    },
  );

  return `
    <div class="content-section ${section.color} search-tier-results" data-surface="home-tier">
      ${primeHtml}
      ${pickHtml}
      ${basicHtml}
    </div>`;
}

/**
 * 검색 전(region): 베이직공부방/베이직과외쌤 — 「결과」금지
 * 검색 후(search): 결과성 제목 허용 (부모 섹션「검색 결과」와 중복 시 생략)
 * @param {'study_room'|'tutor'} kind
 * @param {object[]} items
 * @param {object} opts
 * @param {string} regionLabel
 * @param {'region'|'search'} mode
 * @param {{ omitHeading?: boolean }} [flatOpts]
 */
function renderProviderFlatResults(
  kind,
  items,
  opts = {},
  regionLabel = '',
  mode = 'search',
  flatOpts = {},
) {
  const tab = kind === 'study_room' ? 'room' : 'tutor';
  const basicHeading =
    kind === 'study_room' ? SECTION_HEADINGS.basicStudyRoom : SECTION_HEADINGS.basicTutor;
  const loc = String(regionLabel || '').trim();
  const sort = readListSortFromHash(kind, { mode: 'search' });
  const ordered = opts.serverSorted ? items : sortListItems(items, kind, sort);

  if (opts.guest === true && mode === 'region') {
    return `
    <div class="content-section search-flat-results" data-surface="search-flat" data-search-phase="region" data-guest-landing="1">
      ${renderSectionTitleBar({ ...basicHeading, locationLabel: loc })}
      ${renderGuestVacantBasicList(kind)}
    </div>`;
  }

  if (!items.length) {
    return `<div class="search-flat-results search-flat-results--empty" data-surface="search-flat" data-search-phase="${mode}">${renderSearchZeroState(tab, mode)}</div>`;
  }

  let titleBarHtml = '';
  if (!flatOpts.omitHeading) {
    if (mode === 'region') {
      titleBarHtml = renderSectionTitleBar(
        { ...basicHeading, locationLabel: loc },
        { sortHtml: renderListSortSelect(kind, sort, { mode: 'search' }) },
      );
    } else {
      const findLabel = kind === 'study_room' ? '공부방 찾기 결과' : '과외쌤 찾기 결과';
      titleBarHtml = renderSectionTitleBar(
        {
          tier: 'basic',
          brandText: '우동공과',
          title: findLabel,
          ariaTitle: `우동공과 ${findLabel}`,
          locationLabel: loc,
        },
        { sortHtml: renderListSortSelect(kind, sort, { mode: 'search' }) },
      );
    }
  } else {
    titleBarHtml = renderSectionToolbar({
      locationLabel: loc,
      sortHtml: renderListSortSelect(kind, sort, { mode: 'search' }),
    });
  }

  return `
    <div class="content-section search-flat-results" data-surface="search-flat" data-search-phase="${mode}">
      ${titleBarHtml}
      ${renderBrowseList(kind, ordered, { ...opts, sourceRoute: 'search' })}
    </div>`;
}

/**
 * @param {object[]} items
 * @param {{ guest?: boolean, viewerRole?: string }} opts
 * @param {string} [sectionTag]
 * @param {'region'|'search'} [mode]
 */
function renderStudentTierResults(items, opts = {}, sectionTag = '', mode = 'search') {
  if (opts.guest === true && mode === 'region') {
    return `
      <div class="content-section search-tier-results" data-surface="student-blind" data-guest-landing="1">
        ${renderSectionTitleBar({ ...SECTION_HEADINGS.students, locationLabel: sectionTag || '' })}
        ${renderGuestVacantBasicList('student')}
      </div>`;
  }

  if (!items.length) {
    const place = String(sectionTag || '').trim();
    const promoEmpty =
      (opts.viewerRole === 'study_room' || opts.viewerRole === 'tutor') && place && mode === 'region'
        ? renderStateCard({
            title: `${place}에 공개 중인 학생이 없습니다`,
            body: '조건을 바꾸려면 학생찾기에서 검색해 보세요.',
            variant: 'empty',
            screenId: 'P13-zero',
          })
        : renderSearchZeroState('student', mode);
    return `
      <div class="content-section search-tier-results search-tier-results--empty">
        ${promoEmpty}
      </div>`;
  }

  const sort = readListSortFromHash('student', { mode: 'search' });
  const ordered = opts.serverSorted ? items : sortListItems(items, 'student', sort);

  return `
    <div class="content-section search-tier-results" data-surface="student-blind">
      ${renderSectionTitleBar(
        { ...SECTION_HEADINGS.students, locationLabel: sectionTag || '' },
        { sortHtml: renderListSortSelect('student', sort, { mode: 'search' }) },
      )}
      ${renderBrowseList('student', ordered, { ...opts, sourceRoute: 'search' })}
    </div>`;
}

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {object[]} exposureItems
 * @param {{ role: import('./state.js').ViewerRole, homeSelf?: boolean }} ctx
 * @param {{ mode?: 'region' | 'search', regionLabel?: string, surfaceType?: 'home' | 'search' }} [options]
 *
 * 분기:
 * - surfaceType=home + mode=region → 홈 티어 문법
 * - mode=search → flat (결과)
 * - surfaceType=search + mode=region → flat + 베이직 제목 (결과 문구 금지)
 */
export function renderSearchTierResults(tab, exposureItems, ctx, options = {}) {
  const mode = options.mode || 'search';
  const surfaceType = options.surfaceType || 'search';
  const regionLabel = options.regionLabel || '';
  const guest = ctx.role === 'guest';
  const viewerRole = ctx.role;
  const opts = {
    guest,
    viewerRole,
    sourceRoute: 'search',
    showCompare: tab !== 'student',
    showWish: true,
    serverSorted: mode === 'search',
  };
  const pinTutorPrimary = viewerRole === 'tutor' && surfaceType === 'home' && mode === 'region';
  const homeTierTag = pinTutorPrimary
    ? tutorPrimaryRegionLabel()
    : regionLabel || (mode === 'region' ? '지역 피드' : '');
  opts.pinTutorPrimary = pinTutorPrimary;
  const useHomeTierGrammar = surfaceType === 'home' && mode === 'region';

  // 학생 홈: 저장 지역 조회가 끝났는데 0건일 때만. 조기 0건 안내(renderProviderTierResults)보다 먼저 본다.
  const place = String(regionLabel || '').trim();
  if (viewerRole === 'parent' && useHomeTierGrammar && ctx.studentHomeReady === true && !exposureItems.length && place) {
    if (tab === 'room') return renderStudentHomeVacantTiers('study_room', place, opts);
    if (tab === 'tutor') return renderStudentHomeVacantTiers('tutor', place, opts);
    return renderStudentHomeNoStudents(place);
  }

  if (tab === 'room') {
    return useHomeTierGrammar
      ? renderProviderTierResults('study_room', exposureItems, opts, homeTierTag, mode)
      : renderProviderFlatResults('study_room', exposureItems, opts, regionLabel, mode, {
          omitHeading: mode === 'search' && surfaceType === 'search',
        });
  }
  if (tab === 'tutor') {
    return useHomeTierGrammar
      ? renderProviderTierResults('tutor', exposureItems, opts, homeTierTag, mode)
      : renderProviderFlatResults('tutor', exposureItems, opts, regionLabel, mode, {
          omitHeading: mode === 'search' && surfaceType === 'search',
        });
  }
  return renderStudentTierResults(exposureItems, opts, homeTierTag, mode);
}

export { partitionByExposureTier };
