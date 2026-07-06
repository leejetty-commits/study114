/**
 * 23장 — submission boardKey (권한형 업로드) copy
 * SSOT: board-engine-copy.js · 22장 lifecycle (심사·승인·반려 UX ✕)
 */

export const SUBMISSION_BOARD = {
  boardKey: 'submission',
  screenId: 'P23-04',
  title: '제출함',
  whatIs:
    '게시판 엔진의 권한형 업로드 보드입니다. 공개 자료실(`/library`)과 달리, 로그인한 공급자가 자료를 올리고 본인 제출 목록을 관리합니다.',
  whoCanUpload: '공부방 운영자 · 과외쌤 · (정책 허용 시) 학부모',
  whoCanRead: '본인 제출 목록 · 운영자 내부 확인(A28 후순위)',
  footnote: '22·28장: 승인·반려·검증 완료·검수중 표현 ✕ · 제출·공개 상태만 중립 표기',
  bridgeP15: 'P15-10 제출자료 상태 · tutor-ui 등록 흐름과 병행',
};

export const SUBMISSION_CATEGORIES = [
  { id: 'education', label: '학력·경력 증빙' },
  { id: 'business', label: '사업자·시설 관련' },
  { id: 'facility', label: '공간·안전 자료' },
  { id: 'other', label: '기타 참고 자료' },
];

/** @typedef {'draft'|'submitted'|'published'|'hidden'} SubmissionPostStatus */

/** 내부 status → 사용자-facing 중립 라벨 (심사형 ✕) */
export const SUBMISSION_STATUS_LABELS = {
  draft: '저장됨',
  submitted: '제출됨',
  published: '게시중',
  hidden: '비공개',
};

/** @param {SubmissionPostStatus} status */
export function submissionVisibilityLabel(status) {
  if (status === 'published') return '공개';
  return '비공개';
}

export const SUBMISSION_FILE_POLICY = {
  formats: 'PDF · JPG · JPEG · PNG',
  maxFiles: 1,
  maxSizeMb: 10,
  hint: '파일 1개 · 최대 10MB · 업로드 후 서버에 저장됩니다.',
};

export const SUBMISSION_FORM = {
  titleLabel: '제목',
  descriptionLabel: '설명',
  categoryLabel: '자료 유형',
  fileLabel: '첨부 파일',
  memoLabel: '내 제출 메모 (본인만)',
  draftCta: '저장',
  submitCta: '제출',
  filePolicyTitle: '업로드 안내',
};

export const SUBMISSION_PERMISSION_DENIED = {
  title: '이 보드에 접근할 수 없습니다',
  body: '제출함은 공급자(공부방·과외) 또는 정책상 허용된 역할만 이용할 수 있습니다. 공개 자료실은 유틸 메뉴의 「자료실」을 이용해 주세요.',
};

export const SUBMISSION_LIST = {
  empty: '제출한 자료가 없습니다.',
  newCta: '새 자료 제출',
  viewCta: '다시 보기',
  editCta: '수정',
  deleteCta: '삭제',
};

export const SUBMISSION_DETAIL = {
  attachment: '첨부 파일',
  memo: '내 제출 메모',
  status: '현재 상태',
  visibility: '공개 여부',
  back: '← 제출 목록',
};
