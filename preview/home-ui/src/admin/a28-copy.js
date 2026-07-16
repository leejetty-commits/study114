/**
 * 28장 — A28 내부 운영 콘솔 copy (RED LINE)
 * SSOT: docs/ssot/28-admin-console-red-line.md
 */

import { ADMIN_RED_LINE_PRINCIPLE } from '../admin-red-line-copy.js';

export const A28_COPY = {
  previewBadge: '내부 전용 · A28',
  hubTitle: '내부 운영 콘솔',
  hubLead: '신고·노출 보정·제출자료 내부 확인 등 최소 운영 조치. 사용자-facing 심사·인증 UX는 금지합니다.',
  redLineBanner: ADMIN_RED_LINE_PRINCIPLE,
  p17Bridge: '고객센터 운영 프리뷰 (P17-admin)',
};

export const A28_NAV = [
  { id: 'hub', label: '운영 홈', path: '/admin', screenId: 'A28-01' },
  { id: 'members', label: '회원관리', path: '/admin/members', screenId: 'A28-02' },
  { id: 'commerce', label: '상품·결제 조회', path: '/admin/commerce', screenId: 'A28-07b' },
  { id: 'exposure', label: '노출 보정', path: '/admin/exposure', screenId: 'A28-07a' },
  { id: 'submission', label: '제출자료 확인', path: '/admin/submission-docs', screenId: 'A28-06' },
  { id: 'reports', label: '신고 처리', path: '/admin/reports', screenId: 'A28-04' },
  { id: 'tickets', label: '문의 큐', path: '/admin/tickets', screenId: 'A28-04b' },
  { id: 'notices', label: '공지·가이드', path: '/admin/notices', screenId: 'A28-05' },
  { id: 'logs', label: '운영 로그', path: '/admin/logs', screenId: 'A28-08a' },
  { id: 'permissions', label: '권한·계정', path: '/admin/permissions', screenId: 'A28-08b', masterOnly: true },
];

/** A28-02 회원 상태 (승인·반려 용어 금지) */
export const A28_MEMBER_STATUS_LABELS = {
  active: '정상',
  pending: '대기',
  blocked: '이용 제한',
  withdrawn: '탈퇴',
};

export const A28_MEMBER_ROLE_LABELS = {
  guardian_student: '학부모',
  study_room_owner: '공부방',
  tutor: '과외쌤',
  admin: '운영자',
};

export const A28_MEMBER_TIER_LABELS = {
  free: '무료',
  paid: '유료',
};

/** A28-04 신고 상태 (심사·승인 용어 금지) */
export const A28_REPORT_STATUS_LABELS = {
  open: '접수',
  protect: '임시 보호',
  resolved: '조치 완료',
  dismissed: '종결(기각)',
};

/** @type {Array<{ id: string, kind: string, target: string, reason: string, status: string, createdAt: string }>} */
export const A28_REPORT_SEED = [
  { id: 'RPT-101', kind: '허위 정보', target: 'tutor #12', reason: '활동 지역 불일치 신고', status: 'open', createdAt: '2026-07-05' },
  { id: 'RPT-102', kind: '안전 이슈', target: 'thread #8', reason: '부적절 접촉 의심', status: 'protect', createdAt: '2026-07-06' },
];

/** A28-07 노출·권한 보정 조치 (심사·승인 용어 금지) — SSOT: 28장 §3-b · 정책 상수는 admin-red-line-copy.js */
export const A28_EXPOSURE_ACTIONS = {
  hide: { label: '숨김', hint: '검색·노출에서 제외' },
  publish: { label: '공개중', hint: '검색 노출 상태로 복원' },
  inquiry_status: { label: '상담 상태 보정', hint: '공부방 inquiry_status만 변경' },
};

export const A28_EXPOSURE_TARGET_LABELS = {
  study_room: '공부방',
  tutor: '과외쌤',
  submission: '제출',
};

export const A28_INQUIRY_STATUS_LABELS = {
  open: '상담 수용',
  paused: '상담 일시중지',
  capacity_full: '정원 마감',
  waiting_only: '대기만',
};

/** @type {Array<{ id: string, action: string, target: string, operator: string, at: string, reversible: boolean }>} */
export const A28_LOG_SEED = [
  { id: 'LOG-1', action: 'hide_profile', target: 'study_room #3', operator: 'ops@dev', at: '2026-07-06 14:22', reversible: true },
  { id: 'LOG-2', action: 'restrict_messages', target: 'user #44', operator: 'ops@dev', at: '2026-07-06 15:01', reversible: true },
];

export const A28_ACTION_LABELS = {
  hide_profile: '프로필 숨김',
  restrict_messages: '쪽지 제한',
  exposure_correction: '노출 보정(공개·상담)',
  internal_note: '내부 메모',
  submission_expose: '제출 노출 반영',
  submission_hide: '제출 숨김',
  report_status_change: '신고 상태 변경',
  commerce_position_ends_at: '포지션 만료일 보정',
  commerce_ticket_remaining: '횟수권 잔여 보정',
  account_block: '이용 제한',
  account_restore: '복구',
  account_withdraw: '탈퇴 처리',
};

/** 운영 로그 대상 유형 (DB target_type) */
export const A28_LOG_TARGET_TYPE_LABELS = {
  study_room: '공부방',
  tutor: '과외쌤',
  board_post: '제출',
  user: '회원',
  position_subscription: '포지션 구독',
  ticket_pack: '횟수권 팩',
};

/** A28-06 큐 조치 (심사·승인 용어 금지) */
export const A28_SUBMISSION_QUEUE_ACTIONS = {
  expose: { label: '노출 반영', hint: '사용자 화면: 게시중 (공개 사실만)' },
  hide: { label: '숨김', hint: '사용자 화면: 비공개' },
};

export const A28_FORBIDDEN_UI = '승인 · 반려 · 검증 완료 · 인증쌤 · 플랫폼 심사 통과';
