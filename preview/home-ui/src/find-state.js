/** @returns {import('@search-ui/search-find-surface.js').FindSurfaceState & { searchRows: object[], searchItems: object[] }} */
export function createFindState() {
  return {
    expanded: false,
    searchExecuted: false,
    searchLoading: false,
    searchError: null,
    searchTotal: 0,
    searchRows: [],
    searchItems: [],
    searchExposureItems: [],
    activeResultItems: [],
    activeResultSource: null,
    activeRegionLabel: '',
    studentLessonFormat: 'one_on_one',
    tutorRegionIndex: 0,
    homeSelf: false,
  };
}

/** @param {import('@search-ui/search-find-surface.js').FindSurfaceState & { searchRows?: object[], searchItems?: object[] }} findState */
export function resetFindState(findState) {
  findState.expanded = false;
  findState.searchExecuted = false;
  findState.searchLoading = false;
  findState.searchError = null;
  findState.searchTotal = 0;
  if (findState.searchRows) findState.searchRows = [];
  if (findState.searchItems) findState.searchItems = [];
  findState.searchExposureItems = [];
  findState.activeResultItems = [];
  findState.activeResultSource = null;
  findState.activeRegionLabel = '';
  findState.tutorRegionIndex = 0;
  findState.studentLessonFormat = 'one_on_one';
  findState.homeSelf = false;
  findState.hasRequestSummary = false;
}

/*
 * failFindLoadIfStuck 미도입 근거:
 * 목록 fetch는 search-api.js SEARCH_API_TIMEOUT_MS(8s)+AbortController가
 * AbortError → searchError로 끊는다. runFindSearchWithFilters finally가
 * searchLoading=false로 내린다. 별도 폴링 고착 헬퍼는 중복이라 두지 않는다.
 */
