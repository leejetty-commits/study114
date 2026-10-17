/**
 * 학생(parent) 현재 위치 = 서버에 저장된 희망지역.
 * 등록 API(students) 응답의 id·정식 라벨(StudentHubRepository)만 읽는다.
 * 찾기 저장소(find-canonical·lastRegionByHope)는 읽지 않는다.
 * 학생은 가입 분기(preferred_lesson_type) 하나만 가진다. 분기 지역이 비면 반대 축으로 채우지 않는다.
 */

import { getStudentsCache, isRegistrationsApiMode } from '@home-ui/registrations-backend.js';
import { persistFindDefaultsFromStudent, replaceStoredHopeRegions } from '../../shared/student-hope-regions.js';
import { registerParentBranchSource } from '../../shared/site-nav-config.js';
import { DEFAULT_STUDENT_HOPE_TYPE } from './student-hope-type.js';

/**
 * @typedef {{ id: string, label: string, scope: 'sigungu'|'dong' }} StudentPlace
 * @typedef {{
 *   lessonType: 'tutor'|'study_room'|null,
 *   tutor: StudentPlace|null,
 *   studyroom: StudentPlace|null,
 * }} StudentSavedRegion
 */

/** @param {unknown} value */
function positiveId(value) {
  const text = String(value ?? '').trim();
  return /^[1-9]\d*$/.test(text) ? text : '';
}

/** 숫자만 있는 문자열은 라벨로 보지 않는다. @param {unknown} value */
function placeLabel(value) {
  const text = String(value ?? '').trim();
  return text && !/^\d+$/.test(text) ? text : '';
}

/** @param {unknown} id @param {unknown} label @param {'sigungu'|'dong'} scope @returns {StudentPlace|null} */
function place(id, label, scope) {
  const pid = positiveId(id);
  const text = placeLabel(label);
  return pid && text ? { id: pid, label: text, scope } : null;
}

/** 기본등록이 쓰는 행(id 오름차순 첫 행, 삭제 제외). @param {unknown} rows */
export function pickStudentRecord(rows) {
  const list = (Array.isArray(rows) ? rows : []).filter(
    (row) => row && typeof row === 'object' && row.exposure_status !== 'deleted' && !row.deleted_at,
  );
  list.sort((a, b) => Number(a.id) - Number(b.id));
  return list[0] || null;
}

/**
 * @param {Record<string, unknown>|null|undefined} row 서버 students 행
 * @returns {StudentSavedRegion|null}
 */
export function studentSavedRegionFromRecord(row) {
  if (!row || typeof row !== 'object') return null;
  const lessonType =
    row.preferred_lesson_type === 'study_room' ? 'study_room' : row.preferred_lesson_type === 'tutor' ? 'tutor' : null;
  return {
    lessonType,
    tutor: place(row.preferred_tutor_region_id, row.preferred_tutor_region_label, 'sigungu'),
    studyroom: place(row.preferred_studyroom_region_id, row.preferred_studyroom_region_label, 'dong'),
  };
}

/** 로그인 학생의 저장 지역. 등록 API 캐시가 없으면 null. @returns {StudentSavedRegion|null} */
export function readStudentSavedRegion() {
  if (!isRegistrationsApiMode()) return null;
  return studentSavedRegionFromRecord(pickStudentRecord(getStudentsCache()));
}

/**
 * 학생 분기. 가입 분기가 없으면(등록 캐시 없음) 기본 희망 유형.
 * @param {StudentSavedRegion|null} [saved]
 * @returns {'tutor'|'study_room'}
 */
export function studentBranch(saved = readStudentSavedRegion()) {
  return saved?.lessonType || DEFAULT_STUDENT_HOPE_TYPE;
}

/**
 * 탭별 기준 지역. 자기 분기 탭과 학생 탭만 그 분기 저장 지역을 쓴다.
 * 반대 탭은 null. 찾기 화면은 세션 분기를 넘긴다. 인자를 생략하면 홈이 쓰는 studentBranch().
 * @param {StudentSavedRegion|null} saved
 * @param {'room'|'tutor'|'student'} tab
 * @param {'tutor'|'study_room'|null} [branch]
 * @returns {StudentPlace|null}
 */
export function studentPlaceFor(saved, tab, branch = studentBranch(saved)) {
  if (!saved) return null;
  if (branch !== 'tutor' && branch !== 'study_room') return null;
  if (tab === 'room' && branch !== 'study_room') return null;
  if (tab === 'tutor' && branch !== 'tutor') return null;
  return branch === 'study_room' ? saved.studyroom : saved.tutor;
}

/**
 * search.php 지역 조건.
 * @param {'room'|'tutor'|'student'} tab
 * @param {StudentPlace|null} target
 * @param {'tutor'|'study_room'} hope 학생 분기
 * @returns {Record<string, string>|null}
 */
export function studentPlaceFilters(tab, target, hope) {
  if (!target) return null;
  if (tab === 'room') return target.scope === 'dong' ? { region_id: target.id } : null;
  if (tab === 'tutor') return target.scope === 'sigungu' ? { tutor_region_id: target.id } : null;
  if (hope === 'study_room') {
    return target.scope === 'dong'
      ? { preferred_lesson_type: 'study_room', preferred_studyroom_region_id: target.id }
      : null;
  }
  return target.scope === 'sigungu' ? { preferred_lesson_type: 'tutor', preferred_region_id: target.id } : null;
}

/**
 * 임시값(lastRegionByHope)을 서버 저장 지역 라벨로 맞춘다. 분기 축만 남기고 반대 축은 지운다.
 * 분기를 넘기지 않으면 홈과 같이 studentBranch()를 쓴다.
 * 찾기 화면은 세션 분기를 넘긴다. null 이면 기본 tutor 로 맞추지 않고 건너뛴다.
 * @param {StudentSavedRegion|null} saved
 * @param {'tutor'|'study_room'|null} [branch]
 */
export function syncStoredHopeRegionsFromSaved(saved, branch) {
  if (!saved) return;
  const resolved = branch === undefined ? studentBranch(saved) : branch;
  if (resolved !== 'tutor' && resolved !== 'study_room') return;
  const place = resolved === 'study_room' ? saved.studyroom : saved.tutor;
  replaceStoredHopeRegions({ [resolved]: place?.label || '' });
}

/**
 * 마이페이지 저장 직후. 서버가 내려준 라벨이 있으면 그것으로, 없으면(프리뷰 저장소) 슬롯 라벨로.
 * @param {Record<string, unknown>|null|undefined} row
 */
export function syncStoredHopeRegionsFromStudent(row) {
  if (!row || typeof row !== 'object') return;
  const fromServer =
    'preferred_tutor_region_label' in row || 'preferred_studyroom_region_label' in row;
  if (fromServer) syncStoredHopeRegionsFromSaved(studentSavedRegionFromRecord(row));
  else persistFindDefaultsFromStudent(row);
}

// GNB 정본은 공용 저장소(me.php student_branch)다.
// 이 등록은 응답에 student_branch 키가 없을 때만 쓰인다.
// 캐시에 명시 분기가 없으면 null. 기본 tutor 를 넘기지 않는다.
registerParentBranchSource(() => {
  const lessonType = readStudentSavedRegion()?.lessonType;
  return lessonType === 'tutor' || lessonType === 'study_room' ? lessonType : null;
});
