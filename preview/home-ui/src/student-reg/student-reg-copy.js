/**
 * 19장 — 학생 의뢰 copy · 탭 · visibility · 허브 라벨 (횡단 SSOT)
 * docs/ssot/19-student-registration-management.md §3 · §4 · §5
 */

/** §22 · 운영자 심사 UI 금지 */
export const FORBIDDEN_UI_PHRASES = [
  '검토중',
  '반려',
  '보완 요청',
  '심사 대기',
  '검증 통과',
  '검증 실패',
  '승인',
  'pending',
];

/** §5 · 요청문 노출 값. 학생 화면의 공개설정 탭은 쓰지 않는다. */
export const VISIBILITY_OPTIONS = [
  { value: 'private', label: '비공개', desc: '다른 학부모 비교 화면에 요청문을 보이지 않습니다' },
  { value: 'paid_only', label: '공급자 공개', desc: '로그인한 공부방·과외쌤에게 요청문을 보여 줍니다' },
];
