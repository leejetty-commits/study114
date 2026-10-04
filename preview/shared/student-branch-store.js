/**
 * 학생(parent) 가입 분기 — 모든 번들이 같이 쓰는 저장소.
 * me.php 의 student_branch 와 세션 확인 여부를 여기에만 둔다.
 * 번들별로 복사하지 않는다.
 */

/** @typedef {'tutor'|'study_room'} StudentBranch */

/** @type {StudentBranch|null} */
let studentBranch = null;
/** me.php 확인이 끝났는지. 실패·비로그인도 끝난 것이다. */
let sessionChecked = false;
/**
 * student_branch 키를 받았거나, 실패·비로그인으로 분기가 없다고 확정했는지.
 * 키가 없는 응답은 확정이 아니다.
 */
let authoritative = false;

/** @param {unknown} value @returns {StudentBranch|null} */
function asBranch(value) {
  return value === 'tutor' || value === 'study_room' ? value : null;
}

/** @returns {StudentBranch|null} */
export function getStoredStudentBranch() {
  return studentBranch;
}

export function isStudentBranchSessionChecked() {
  return sessionChecked;
}

/** 서버가 분기를 확정했는지. 키 없는 응답은 false. */
export function isStudentBranchAuthoritative() {
  return authoritative;
}

/**
 * me.php JSON. 로그인 응답에 student_branch 키가 있으면 그 값이 정본이다.
 * 비로그인은 null 로 확정한다. 키 자체가 없으면 확정하지 않는다.
 * @param {unknown} payload
 */
export function noteSessionStudentBranch(payload) {
  sessionChecked = true;
  const record = payload && typeof payload === 'object' ? /** @type {Record<string, unknown>} */ (payload) : {};
  if (record.authenticated !== true) {
    studentBranch = null;
    authoritative = true;
    return;
  }
  if (Object.prototype.hasOwnProperty.call(record, 'student_branch')) {
    studentBranch = asBranch(record.student_branch);
    authoritative = true;
    return;
  }
  studentBranch = null;
  authoritative = false;
}

/** 세션 요청 실패. 분기를 모르는 상태로 확정한다. 기본 tutor 로 채우지 않는다. */
export function failStudentBranchSession() {
  sessionChecked = true;
  studentBranch = null;
  authoritative = true;
}

/** 로그아웃. 이전 학생의 분기를 남기지 않는다. */
export function clearStoredStudentBranch() {
  sessionChecked = true;
  studentBranch = null;
  authoritative = true;
}

/**
 * 마이페이지 저장 응답의 preferred_lesson_type.
 * tutor | study_room 일 때만 덮어쓴다.
 * @param {unknown} branch
 */
export function setStoredStudentBranch(branch) {
  const next = asBranch(branch);
  if (!next) return;
  studentBranch = next;
  sessionChecked = true;
  authoritative = true;
}

/** 세션 확인 전으로 되돌린다. */
export function resetStudentBranchSession() {
  sessionChecked = false;
  studentBranch = null;
  authoritative = false;
}
