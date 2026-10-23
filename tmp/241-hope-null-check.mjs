const store = new Map();
globalThis.window = {
  location: { hash: '#/search/student', pathname: '/', search: '', origin: 'http://127.0.0.1:5176' },
  addEventListener() {},
  removeEventListener() {},
};
globalThis.document = { cookie: '' };
globalThis.localStorage = {
  getItem(key) { return store.has(key) ? store.get(key) : null; },
  setItem(key, value) { store.set(key, String(value)); },
  removeItem(key) { store.delete(key); },
};
globalThis.sessionStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };

const branchStore = await import('../preview/shared/student-branch-store.js');
const region = await import('../preview/search-ui/src/student-saved-region.js');
const hopeStore = await import('../preview/shared/student-hope-regions.js');
const surface = await import('../preview/search-ui/src/search-find-surface.js');
const access = await import('../preview/shared/route-access.js');

const fail = [];
function check(name, ok, detail = '') {
  if (ok) {
    console.log('PASS', name);
    return;
  }
  fail.push(name);
  console.log('FAIL', name, detail);
}

const saved = {
  lessonType: null,
  tutor: { id: '11', label: '의정부시', scope: 'sigungu' },
  studyroom: { id: '22', label: '신곡동', scope: 'dong' },
};

store.set('study114.studentFind.lastRegionByHope', JSON.stringify({ tutor: '유지라벨' }));
region.syncStoredHopeRegionsFromSaved(saved, null);
check('찾기 분기 없음은 임시 지역을 안 바꿈', hopeStore.readStoredHopeRegions().tutor === '유지라벨', JSON.stringify(hopeStore.readStoredHopeRegions()));

region.syncStoredHopeRegionsFromSaved(saved);
check('인자 생략(홈)은 기본 tutor 라벨로 맞춤', hopeStore.readStoredHopeRegions().tutor === '의정부시', JSON.stringify(hopeStore.readStoredHopeRegions()));

region.syncStoredHopeRegionsFromSaved(saved, 'study_room');
check('세션 공부방 분기는 동 라벨만 남김', hopeStore.readStoredHopeRegions().study_room === '신곡동' && !hopeStore.readStoredHopeRegions().tutor, JSON.stringify(hopeStore.readStoredHopeRegions()));

const base = {
  role: 'parent',
  findSurface: 'search',
  studentHopeType: null,
  hopeTypeResolved: false,
  expanded: false,
  searchExecuted: false,
  canonicalLocation: null,
  activeRegionLabel: '',
  studentLessonFormat: 'one_on_one',
};
const unknownHtml = surface.renderCompactFindForm('student', { ...base }, { role: 'parent', variant: 'search' });
check('분기 없음 학생찾기는 과외 희망지역 칸을 안 그림', !unknownHtml.includes('과외 희망지역') && unknownHtml.includes('희망 유형이 정해진 뒤에 지역을 고를 수 있어요.'));

branchStore.noteSessionStudentBranch({ authenticated: true, student_branch: 'tutor' });
const tutorHtml = surface.renderCompactFindForm('student', { ...base, studentHopeType: 'tutor', hopeTypeResolved: true }, { role: 'parent', variant: 'search' });
check('과외 분기는 과외 희망지역 칸', tutorHtml.includes('과외 희망지역') && !tutorHtml.includes('희망 유형이 정해진 뒤에'));

branchStore.noteSessionStudentBranch({ authenticated: true, student_branch: 'study_room' });
const roomHtml = surface.renderCompactFindForm('student', { ...base, studentHopeType: 'study_room', hopeTypeResolved: true }, { role: 'parent', variant: 'search' });
check('공부방 분기는 시·군·구와 행정동', roomHtml.includes('시·군·구') && roomHtml.includes('행정동') && !roomHtml.includes('과외 희망지역'));

branchStore.failStudentBranchSession();
const homeHtml = surface.renderCompactFindForm('student', { role: 'parent', studentHopeType: null, expanded: false, searchExecuted: false, canonicalLocation: null }, { role: 'parent', variant: 'home' });
check('홈은 기존처럼 과외 희망지역 칸', homeHtml.includes('과외 희망지역'));

check('guardParentFindTab 삭제', typeof access.guardParentFindTab !== 'function');

console.log(fail.length ? `\n${fail.length} failed` : '\nall passed');
process.exit(fail.length ? 1 : 0);
