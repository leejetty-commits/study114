/**
 * 19장 — 학생 등록 copy · 탭 · visibility · 허브 라벨 (횡단 SSOT)
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

/** 계정의 학생이 0명·2명 이상일 때 마이프로필 대신 보이는 안내. 용어: 게시판·노출. */
export const STUDENT_COUNT_HALT_COPY = {
  zero: {
    title: '아직 우리 아이 정보가 없어요',
    body: '기본정보를 입력해 주시면 베이직카드가 노출돼요. 천천히 시작해 보세요.',
    cta: '기본정보 입력',
  },
  many: {
    /** @param {number} count */
    title: (count) => `이 계정에 학생이 ${count}명 등록되어 있어요`,
    body: '계정 하나에는 학생 1명만 둘 수 있어요. 운영문의로 알려 주시면 정리를 도와드릴게요.',
    cta: '운영문의',
  },
};

/** §5 · 요청문 노출 값. 학생 화면의 공개설정 탭은 쓰지 않는다. */
export const VISIBILITY_OPTIONS = [
  { value: 'private', label: '비공개', desc: '다른 학부모 비교 화면에 요청문을 보이지 않습니다' },
  { value: 'paid_only', label: '공급자 공개', desc: '로그인한 공부방·과외쌤에게 요청문을 보여 줍니다' },
];
