/**
 * 23장 — 자료실 UI copy (게시판 엔진 · 다운로드형 boardKey 묶음)
 * SSOT: board-engine-copy.js · docs/internal/23-board-community-integration-draft.md
 */

import { BOARD_ENGINE_LOCK } from '../board-engine-copy.js';

/** @typedef {'all'|'parent'|'study_room'|'tutor'} LibraryAudience */

export const LIBRARY_HEAD = {
  title: '자료실',
  engineLabel: BOARD_ENGINE_LOCK.topConcept,
  lead: '학습·운영 참고 자료(PDF·양식)를 내려받을 수 있습니다.',
  footnote:
    '자료실은 게시판 엔진의 다운로드형 채널입니다. GNU 커뮤니티와 콘텐츠를 공유하지 않습니다.',
};

export const LIBRARY_SECTIONS = [
  {
    key: 'library',
    label: '전체 자료',
    path: '/library',
    screenId: 'P23-01',
    boardKey: 'library',
    boardType: 'download',
  },
  {
    key: 'templates',
    label: '양식·체크리스트',
    path: '/library/templates',
    screenId: 'P23-02',
    boardKey: 'library-template',
    boardType: 'download',
  },
  {
    key: 'guides',
    label: '가이드 PDF',
    path: '/library/guides',
    screenId: 'P23-03',
    boardKey: 'library-guide-pdf',
    boardType: 'download',
  },
];

/** @type {Array<{ id: string, boardKey: string, title: string, summary: string, format: string, audience: LibraryAudience[], section: 'library'|'templates'|'guides', fileLabel: string }>} */
export const LIBRARY_SEED = [
  {
    id: 'lib-1',
    boardKey: 'library',
    title: '안전과외 체크리스트 (학부모용)',
    summary: '첫 상담 전 확인할 질문 목록',
    format: 'PDF',
    audience: ['all', 'parent'],
    section: 'library',
    fileLabel: 'safe-prep-checklist.pdf',
  },
  {
    id: 'lib-2',
    boardKey: 'library',
    title: '공부방 상담 수용 안내 템플릿',
    summary: '상담 가능·정원 마감 안내 문구 예시',
    format: 'DOCX',
    audience: ['study_room'],
    section: 'library',
    fileLabel: 'room-inquiry-template.docx',
  },
  {
    id: 'tpl-1',
    boardKey: 'library-template',
    title: '과외 첫 수업 안내 양식',
    summary: '학부모·학생에게 보낼 첫 안내 메모',
    format: 'HWP',
    audience: ['tutor'],
    section: 'templates',
    fileLabel: 'tutor-first-lesson.hwp',
  },
  {
    id: 'tpl-2',
    boardKey: 'library-template',
    title: '학습 요청 조건 정리표',
    summary: '자녀 등록 전 희망 조건 메모용',
    format: 'XLSX',
    audience: ['parent'],
    section: 'templates',
    fileLabel: 'student-request-sheet.xlsx',
  },
  {
    id: 'pdf-1',
    boardKey: 'library-guide-pdf',
    title: '안전과외 가이드 — 선지급 주의 (PDF)',
    summary: 'P17-03 safe/prepay 요약본',
    format: 'PDF',
    audience: ['all'],
    section: 'guides',
    fileLabel: 'safe-prepay-guide.pdf',
  },
  {
    id: 'pdf-2',
    boardKey: 'library-guide-pdf',
    title: '제출자료 안내 — 발급기관 재확인',
    summary: '22·28장 톤 · 플랫폼 인증 아님',
    format: 'PDF',
    audience: ['study_room', 'tutor'],
    section: 'guides',
    fileLabel: 'submission-doc-notice.pdf',
  },
];

export const LIBRARY_EMPTY = {
  title: '등록된 자료가 없습니다',
  body: '다른 카테고리를 선택하거나 나중에 다시 확인해 주세요.',
};
