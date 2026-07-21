/**
 * 19장 — 학생 의뢰 copy · 탭 · visibility · 허브 라벨 (횡단 SSOT)
 * docs/ssot/19-student-registration-management.md §3 · §4 · §5
 */

/** §3 · §4-1 P19-01 목록 탭 */
export const P19_LIST_TABS = [
  { key: 'all', label: '전체' },
  { key: 'draft', label: '저장목록' },
  { key: 'published', label: '공개중' },
  { key: 'hidden', label: '숨김' },
];

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

/** §3 상단 메뉴 · 스테퍼 */
export const PHASE_STEPS = [
  { key: 'basic', label: '기본등록' },
  { key: 'detail', label: '상세등록' },
  { key: 'settings', label: '공개설정' },
  { key: 'publish', label: '미리보기' },
];

/** P19-01 목록 헤더 */
export const P19_LIST_HEAD = {
  title: '자녀(학생) 의뢰',
  lead: '자녀별로 희망 조건을 등록하고 학생찾기에 공개할 수 있습니다.',
  registerCta: '+ 자녀 추가',
  manageCta: '관리하기 →',
  footnoteFirst: '첫 자녀는 가입 시 등록 · 두 번째부터는 기본등록 후 이 목록에 표시됩니다.',
};

/** P19-02 허브 빠른 이동 */
export const P19_HUB_QUICK_ACTIONS = [
  { path: 'basic', label: '기본등록', desc: '희망 유형 · 임시 저장 내용' },
  { path: 'detail', label: '상세등록', desc: '듀얼 희망지역·검색/공개 본체' },
  { path: 'settings', label: '공개설정', desc: '요청문·노출 범위' },
  { path: 'publish', label: '미리보기·공개', desc: '상세완료 후 학생찾기 등록', primary: true },
];

/** P19-06 · P19-02 위험 구역 */
export const P19_DANGER_ZONE = {
  title: '위험 구역',
  lead: '노출 철회는 숨김 처리되며, 삭제 시 복구할 수 없습니다.',
  hideLabel: '노출 철회 (숨김)',
  deleteLabel: '삭제',
};

/** §5 · P19-05 visibility */
export const VISIBILITY_OPTIONS = [
  { value: 'private', label: '비공개', desc: '학생찾기·무료 상세에 표시하지 않습니다' },
  { value: 'paid_only', label: '유료 공급자만', desc: '열람권을 보유한 공급자에게만 공개합니다' },
];

/** P19-04 미리보기·공개 */
export const P19_PUBLISH = {
  previewLabel: '학생찾기 목록 미리보기',
  metaTitle: '노출 정보 요약',
  checklistTitle: '공개 전 체크리스트',
  publishCta: '학생찾기에 공개하기',
  republishCta: '다시 공개',
};

/** P19-05 학부모 과금 안내 */
export const P19_SETTINGS_CALLOUT = {
  title: '학부모 과금 없음',
  body: '요청문 열람은 공급자 유료 서비스(열람권)로 운영됩니다. 학부모에게는 별도 요금이 없습니다.',
};
