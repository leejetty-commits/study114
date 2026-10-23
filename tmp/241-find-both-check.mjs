globalThis.window = {
  location: { hash: '', pathname: '/', search: '', origin: 'http://127.0.0.1:5176' },
  addEventListener() {},
  removeEventListener() {},
};
globalThis.document = { cookie: '' };
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
globalThis.sessionStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };

const nav = await import('../preview/shared/site-nav-config.js');
const access = await import('../preview/shared/route-access.js');
const store = await import('../preview/shared/student-branch-store.js');
const region = await import('../preview/search-ui/src/student-saved-region.js');

const fail = [];
function check(name, ok, detail = '') {
  if (ok) {
    console.log('PASS', name);
    return;
  }
  fail.push(name);
  console.log('FAIL', name, detail);
}

store.clearStoredStudentBranch();
store.failStudentBranchSession();
// fail marks checked + authoritative + null branch
check('세션은 확인됐지만 분기 없음 → 찾기 둘 숨김', nav.getGnbVisibility('parent', 'find_room') === 'hide' && nav.getGnbVisibility('parent', 'find_tutor') === 'hide');
check('분기 없어도 학생찾기는 보임', nav.getGnbVisibility('parent', 'student_parent') === 'show');

// 확인 전: 모듈을 다시 불러올 수 없으니, 저장소를 직접 흉내 낼 수는 없다.
// clear/fail 은 확인됨으로 둔다. 확인 전은 아래 새 함수 경로로 따로 본다.

store.noteSessionStudentBranch({ authenticated: true, student_branch: 'tutor' });
check('과외 분기 헤더 찾기 3개', ['find_room', 'find_tutor', 'student_parent'].every((id) => nav.getGnbVisibility('parent', id) === 'show'));
check('과외 분기 찾기 탭 3개', JSON.stringify(nav.visibleSearchTabsForRole('parent')) === JSON.stringify(['room', 'tutor', 'student']));

store.noteSessionStudentBranch({ authenticated: true, student_branch: 'study_room' });
check('공부방 분기 헤더 찾기 3개', ['find_room', 'find_tutor', 'student_parent'].every((id) => nav.getGnbVisibility('parent', id) === 'show'));
check('공부방 분기 찾기 탭 3개', JSON.stringify(nav.visibleSearchTabsForRole('parent')) === JSON.stringify(['room', 'tutor', 'student']));

check('가드는 반대 탭을 되돌리지 않음', access.guardParentFindTab('room', 'tutor').ok === true && access.guardParentFindTab('tutor', 'study_room').ok === true && access.guardParentFindTab('student', 'tutor').ok === true);

check('비회원 찾기 둘 다 보임', nav.getGnbVisibility('guest', 'find_room') === 'show' && nav.getGnbVisibility('guest', 'find_tutor') === 'show');
check('공부방 역할은 과외쌤찾기 숨김', nav.getGnbVisibility('study_room', 'find_tutor') === 'hide' && nav.getGnbVisibility('study_room', 'find_room') === 'show');
check('과외쌤 역할은 공부방찾기 숨김', nav.getGnbVisibility('tutor', 'find_room') === 'hide' && nav.getGnbVisibility('tutor', 'find_tutor') === 'show');

const saved = {
  lessonType: 'tutor',
  tutor: { id: '11', label: '경기도 의정부시', scope: 'sigungu' },
  studyroom: { id: '22', label: '경기도 의정부시 신곡동', scope: 'dong' },
};
check('과외 분기 반대 공부방찾기 저장지역 없음', region.studentPlaceFor(saved, 'room', 'tutor') === null);
check('과외 분기 자기 지역 유지', region.studentPlaceFor(saved, 'tutor', 'tutor')?.label === '경기도 의정부시');
check('세션 분기 모르면 저장지역을 넣지 않음', region.studentPlaceFor(saved, 'tutor', null) === null && region.studentPlaceFor(saved, 'room', null) === null);

const roomSaved = { ...saved, lessonType: 'study_room' };
check('공부방 분기 반대 과외쌤찾기 저장지역 없음', region.studentPlaceFor(roomSaved, 'tutor', 'study_room') === null);
check('공부방 분기 자기 지역 유지', region.studentPlaceFor(roomSaved, 'room', 'study_room')?.label === '경기도 의정부시 신곡동');
check('홈 호출(인자 생략)은 저장 분기를 그대로 씀', region.studentPlaceFor(roomSaved, 'room')?.id === '22' && region.studentPlaceFor(saved, 'tutor')?.id === '11');
check('홈 분기 함수는 비어 있으면 tutor', region.studentBranch({ lessonType: null, tutor: null, studyroom: null }) === 'tutor');

console.log(fail.length ? `\n${fail.length} failed` : '\nall passed');
process.exit(fail.length ? 1 : 0);
