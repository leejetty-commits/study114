/**
 * 노출 풀 — 실제 검색 API 결과만 담는다 (exposure-bridge.js가 채움). 견본·가짜 회원 없음.
 * 표본 밖 카드는 exposure-lookup.js → provider-item-registry.js 공용 조회로 찾는다.
 */

/** @type {object[]} */
export const EXPOSURE_STUDY_ROOMS = [];
/** @type {object[]} */
export const EXPOSURE_TUTORS = [];
/** @type {object[]} */
export const EXPOSURE_STUDENTS = [];
