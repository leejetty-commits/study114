/**
 * 관리자 콘솔 문구·메뉴
 *
 * 참고(코드용, 화면에 표시하지 않음):
 * - SSOT: docs/ssot/28-admin-console-red-line.md
 * - 화면 코드 A28-01~09 · 영카트 adm/admin.menu100~300.php 벤치마크
 * - 메뉴 순서: 환경설정 → 회원 → 게시판 → 상품·결제 → 고객응대 → 로그
 */

import { ADMIN_RED_LINE_PRINCIPLE } from '../admin-red-line-copy.js';

export const A28_COPY = {
  /** 화면 배지 — 이정표 코드 없이 */
  previewBadge: '관리자',
  hubTitle: '운영 홈',
  hubLead:
    '신고 대응, 노출 보정, 제출자료 확인처럼 서비스 운영에 필요한 최소 조치만 모았습니다. 회원 화면에는 「승인」「인증」처럼 보이지 않게 해 주세요.',
  /** 내부 원칙 문구(쉬운 말로 재작성해 UI에 씀) */
  redLineBanner: ADMIN_RED_LINE_PRINCIPLE,
  opsTipTitle: '이렇게 써 주세요',
  opsTipBody:
    '숨김·쪽지 제한·노출 보정은 할 수 있어요. 다만 그 결과가 회원에게 심사·보증·인증처럼 보이면 안 됩니다. 「승인」「반려」「인증쌤」 같은 말은 쓰지 마세요.',
};

/** 미연동 관리자 화면 표시. 메뉴·패널·허브는 여기만 읽는다. */
export const ADMIN_PREVIEW_PREFIX = '미리보기 · ';

/** 마켓 5 · 문자 7 · 부가 4 · 홍보 1. 실도구 path는 넣지 않는다. */
export const ADMIN_PREVIEW_PATHS = Object.freeze([
  '/admin/market/overview',
  '/admin/market/listings',
  '/admin/market/stats',
  '/admin/market/reviews',
  '/admin/market/incomplete',
  '/admin/notify/settings',
  '/admin/notify/sync',
  '/admin/notify/templates',
  '/admin/notify/phones',
  '/admin/notify/send',
  '/admin/notify/logs',
  '/admin/notify/logs-phone',
  '/admin/addons',
  '/admin/addons/pg',
  '/admin/addons/sms',
  '/admin/addons/identity',
  '/admin/promo',
]);

export const ADMIN_PREVIEW_NOTICE =
  '연습용 화면이에요. 이 화면은 아직 사이트와 완전히 연결되어 있지 않을 수 있어요. 여기 보이는 숫자·내용으로 운영 판단을 하지 마세요.';

export const ADMIN_PREVIEW_SMS_EXTRA = '실제 문자는 나가지 않아요.';

const ADMIN_PREVIEW_PATH_SET = new Set(ADMIN_PREVIEW_PATHS);

/** @param {string} path */
export function adminPreviewPathname(path) {
  const raw = String(path ?? '').trim();
  const noHash = raw.startsWith('#') ? raw.slice(1) : raw;
  const pathOnly = noHash.split('?')[0];
  if (!pathOnly) return '';
  return pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
}

/** @param {string} path */
export function isAdminPreviewPath(path) {
  return ADMIN_PREVIEW_PATH_SET.has(adminPreviewPathname(path));
}

/** @param {string} path */
export function isAdminNotifyPreviewPath(path) {
  const name = adminPreviewPathname(path);
  return name.startsWith('/admin/notify/') && isAdminPreviewPath(name);
}

/**
 * @param {string} path
 * @param {string} label
 */
export function withAdminPreviewLabel(path, label) {
  const text = String(label ?? '');
  if (!isAdminPreviewPath(path)) return text;
  if (text.startsWith(ADMIN_PREVIEW_PREFIX)) return text;
  return `${ADMIN_PREVIEW_PREFIX}${text}`;
}

/** @param {string} path */
export function adminPreviewNoticeText(path) {
  if (!isAdminPreviewPath(path)) return '';
  if (isAdminNotifyPreviewPath(path)) return `${ADMIN_PREVIEW_NOTICE} ${ADMIN_PREVIEW_SMS_EXTRA}`;
  return ADMIN_PREVIEW_NOTICE;
}

/**
 * 영카트식 2단 메뉴.
 * - 그룹 = 왼쪽 큰 메뉴(영카트 menu100/200/300…)
 * - children = 서브메뉴(페이지)
 * - menuId = 권한 검사 키 (settings / permissions 등)
 * - screenId = 개발 참고용만 (UI 비표시)
 *
 * @type {Array<{
 *   id: string,
 *   label: string,
 *   path?: string,
 *   menuId?: string,
 *   help?: string,
 *   masterOnly?: boolean,
 *   screenId?: string,
 *   children?: Array<{
 *     id: string,
 *     label: string,
 *     path: string,
 *     menuId: string,
 *     help?: string,
 *     masterOnly?: boolean,
 *     screenId?: string,
 *   }>
 * }>}
 */
export const A28_MENU = [
  {
    id: 'hub',
    label: '운영 홈',
    path: '/admin',
    menuId: 'hub',
    help: '자주 쓰는 메뉴로 바로 이동합니다.',
    // A28-01
    screenId: 'A28-01',
  },
  {
    id: 'grp-promo',
    label: '홍보 런치',
    help: '프로모션 랜딩 URL · 배너 연결 · 공유 문구',
    children: [
      {
        id: 'promo-desk',
        menuId: 'promo',
        label: '홍보 런치 데스크',
        path: '/admin/promo',
        help: '홍보 풀페이지를 열고, URL·공유 문구를 복사하고, 배너 연결 상태를 확인합니다.',
        screenId: 'A28-promo',
      },
    ],
  },
  {
    // Youngcart menu100 환경설정
    id: 'grp-config',
    label: '사이트 기본',
    help: '이름·점검·약관 글·운영자',
    children: [
      {
        id: 'settings-basic',
        menuId: 'settings',
        label: '사이트 기본',
        path: '/admin/settings/basic',
        masterOnly: true,
        help: '서비스 이름·연락처·점검 안내·게스트 배너를 정합니다.',
        screenId: 'A28-09',
      },
      {
        id: 'settings-join',
        menuId: 'settings',
        label: '가입·등록',
        path: '/admin/settings/join',
        masterOnly: true,
        help: '가입 차단 메일·금지어와 역할별 안내 항목을 고릅니다.',
        screenId: 'A28-09',
      },
      {
        id: 'settings-notify',
        menuId: 'settings',
        label: '운영 알림',
        path: '/admin/settings/notify',
        masterOnly: true,
        help: '새 신고·문의·등록이 오면 받을지 고릅니다.',
        screenId: 'A28-09',
      },
      {
        id: 'settings-popups',
        menuId: 'settings',
        label: '팝업 관리',
        path: '/admin/settings/popups',
        masterOnly: true,
        help: '기간·노출 화면을 정해 안내 팝업을 띄웁니다. (영카트 팝업레이어)',
        screenId: 'A28-09',
      },
      {
        id: 'settings-legal',
        menuId: 'settings',
        label: '약관·개인정보',
        path: '/admin/settings/legal',
        masterOnly: true,
        help: '이용약관·개인정보처리방침 글을 고칩니다. (영카트 내용관리)',
        screenId: 'A28-09',
      },
      {
        id: 'permissions',
        menuId: 'permissions',
        label: '권한·계정',
        path: '/admin/permissions',
        masterOnly: true,
        help: '운영 계정(최고관리자·부마스터) 발급·권한·비활성·비밀번호 초기화. 공개 회원가입으로 만들지 않습니다.',
        screenId: 'A28-08b',
      },
    ],
  },
  {
    // Youngcart menu200 회원관리
    id: 'grp-members',
    label: '회원관리',
    help: '회원 검색·상태·일괄 조치',
    children: [
      {
        id: 'members',
        menuId: 'members',
        label: '회원 목록',
        path: '/admin/members',
        help: '이메일·이름·휴대폰으로 찾고, 정지·다시 활성·탈퇴 처리를 합니다.',
        screenId: 'A28-02',
      },
    ],
  },
  {
    // Youngcart menu300 게시판관리 (+ 내용·FAQ)
    id: 'grp-board',
    label: '공지·안내 글',
    help: '공지·자주 묻는 질문·이용안내 글을 고칩니다',
    children: [
      {
        id: 'notices-channels',
        menuId: 'notices',
        label: '게시판 채널',
        path: '/admin/notices/channels',
        help: '고객센터·자료실 같은 메뉴에 붙는 글 칸입니다.',
        screenId: 'A28-05',
      },
      {
        id: 'notices-rails',
        menuId: 'notices',
        label: '우측 배너',
        path: '/admin/notices/rails',
        help: '홈·찾기·상세 화면 오른쪽에 붙는 안내 칸입니다.',
        screenId: 'A28-05',
      },
      {
        id: 'notices-posts',
        menuId: 'notices',
        label: '공지사항',
        path: '/admin/notices/posts',
        help: '사이트 공지글을 작성·수정합니다.',
        screenId: 'A28-05',
      },
      {
        id: 'notices-faq',
        menuId: 'notices',
        label: '자주 묻는 질문',
        path: '/admin/notices/faq',
        help: '자주 묻는 질문을 관리합니다.',
        screenId: 'A28-05',
      },
      {
        id: 'notices-guide',
        menuId: 'notices',
        label: '이용안내',
        path: '/admin/notices/guide',
        help: '이용안내 글을 고칩니다.',
        screenId: 'A28-05',
      },
    ],
  },
  {
    // Youngcart menu400·500 쇼핑몰 — 상품 = 공부방·과외쌤
    id: 'grp-commerce',
    label: '마켓·결제',
    help: '공부방·과외 노출, 결제, 매출·후기 운영',
    children: [
      {
        id: 'market-overview',
        menuId: 'commerce',
        label: '마켓 현황',
        path: '/admin/market/overview',
        help: '오늘 결제·미완료·문의·후기 등 한눈에 봅니다. (영카트 쇼핑몰현황)',
        screenId: 'A28-07b',
      },
      {
        id: 'market-listings',
        menuId: 'commerce',
        label: '공부방·과외 목록',
        path: '/admin/market/listings',
        help: '등록된 공부방·과외쌤을 보고 홈·찾기 노출로 이어갑니다. (영카트 상품관리)',
        screenId: 'A28-07a',
      },
      {
        id: 'commerce',
        menuId: 'commerce',
        label: '결제·주문',
        path: '/admin/commerce',
        help: '유료 구독·횟수권·결제 내역을 조회하고 잔여·만료를 보정합니다.',
        screenId: 'A28-07b',
      },
      {
        id: 'exposure',
        menuId: 'exposure',
        label: '홈·찾기 노출',
        path: '/admin/exposure',
        help: '검색에 보이거나 숨기도록 수동으로 맞춥니다. (영카트 상품유형·노출)',
        screenId: 'A28-07a',
      },
      {
        id: 'market-stats',
        menuId: 'commerce',
        label: '매출·순위',
        path: '/admin/market/stats',
        help: '기간 매출과 공부방·과외 조회/결제 순위입니다. (영카트 매출·판매순위)',
        screenId: 'A28-07b',
      },
      {
        id: 'market-reviews',
        menuId: 'commerce',
        label: '이용 후기',
        path: '/admin/market/reviews',
        help: '이용 후기를 공개하거나 숨깁니다. (영카트 사용후기 · 승인 아님)',
        screenId: 'A28-07b',
      },
      {
        id: 'market-incomplete',
        menuId: 'commerce',
        label: '미완료 결제',
        path: '/admin/market/incomplete',
        help: '결제 중 이탈·실패 건을 확인합니다. (영카트 미완료주문)',
        screenId: 'A28-07b',
      },
      {
        id: 'settlement',
        menuId: 'settlement',
        label: '보고서',
        path: '/admin/settlement',
        help: '하루·한 주·한 달 운영 보고서를 보고 인쇄합니다.',
        screenId: 'A28-162',
      },
    ],
  },
  {
    id: 'grp-ops',
    label: '고객응대',
    help: '신고·문의·제출자료',
    children: [
      {
        id: 'reports',
        menuId: 'reports',
        label: '신고 처리',
        path: '/admin/reports',
        help: '신고를 접수하고 임시 보호·종결 처리합니다.',
        screenId: 'A28-04',
      },
      {
        id: 'tickets',
        menuId: 'tickets',
        label: '문의',
        path: '/admin/tickets',
        help: '이용·정책·오류 문의를 답변합니다. (영카트 상품문의 대응)',
        screenId: 'A28-04b',
      },
      {
        id: 'submission',
        menuId: 'submission',
        label: '제출자료 확인',
        path: '/admin/submission-docs',
        help: '제출된 자료를 내부에서만 확인하고 공개/숨김을 반영합니다.',
        screenId: 'A28-06',
      },
    ],
  },
  {
    // Youngcart 부가서비스 — PG·SMS·본인인증 업체 연락 허브 (실연동 전)
    id: 'grp-addons',
    label: '부가서비스',
    help: '문자·카드결제·본인인증 업체 안내와 신청 URL',
    children: [
      {
        id: 'addons-home',
        menuId: 'addons',
        label: '부가서비스 홈',
        path: '/admin/addons',
        help: '나중에 연동할 문자·전자결제·본인인증 업체를 한곳에서 봅니다.',
        screenId: 'A28-09',
      },
      {
        id: 'addons-pg',
        menuId: 'addons',
        label: '카드·전자결제',
        path: '/admin/addons/pg',
        help: '이니시스·KCP·토스·나이스 등 결제 모듈 업체 연락처.',
        screenId: 'A28-09',
      },
      {
        id: 'addons-sms',
        menuId: 'addons',
        label: '문자·메시징',
        path: '/admin/addons/sms',
        help: '알리고·아이코드 등 SMS 게이트웨이 신청·문서 URL.',
        screenId: 'A28-09',
      },
      {
        id: 'addons-identity',
        menuId: 'addons',
        label: '본인인증',
        path: '/admin/addons/identity',
        help: '본인확인 업체 안내(정책상 필요 시만).',
        screenId: 'A28-09',
      },
    ],
  },
  {
    // Youngcart menu900 SMS — Lab(실발송 없음), 구조는 동일하게
    id: 'grp-notify',
    label: '알림·문자',
    help: '문자·이메일 알림 설정·템플릿·주소록·미리보기 발송',
    children: [
      {
        id: 'notify-settings',
        menuId: 'notify',
        label: '문자 기본설정',
        path: '/admin/notify/settings',
        help: '사용 여부·발신 표시·야간 제한·자동 알림 이벤트를 정합니다. (영카트 SMS 기본설정)',
        screenId: 'A28-09',
      },
      {
        id: 'notify-sync',
        menuId: 'notify',
        label: '회원번호 동기화',
        path: '/admin/notify/sync',
        help: '회원 목록의 휴대폰을 테스트 주소록에 가져옵니다. (영카트 회원정보업데이트)',
        screenId: 'A28-09',
      },
      {
        id: 'notify-templates',
        menuId: 'notify',
        label: '문구 템플릿',
        path: '/admin/notify/templates',
        help: '자주 쓰는 알림 문구와 그룹을 관리합니다. (영카트 이모티콘)',
        screenId: 'A28-09',
      },
      {
        id: 'notify-phones',
        menuId: 'notify',
        label: '수신번호 관리',
        path: '/admin/notify/phones',
        help: '수신 그룹·번호를 관리합니다. (영카트 휴대폰번호)',
        screenId: 'A28-09',
      },
      {
        id: 'notify-send',
        menuId: 'notify',
        label: '문자 보내기',
        path: '/admin/notify/send',
        help: '실제로 보내지 않고 발송 내역에만 남기는 미리보기입니다.',
        screenId: 'A28-09',
      },
      {
        id: 'notify-logs',
        menuId: 'notify',
        label: '전송내역(건별)',
        path: '/admin/notify/logs',
        help: '건별 발송·미리보기 기록입니다.',
        screenId: 'A28-09',
      },
      {
        id: 'notify-logs-phone',
        menuId: 'notify',
        label: '전송내역(번호별)',
        path: '/admin/notify/logs-phone',
        help: '수신번호별 집계입니다.',
        screenId: 'A28-09',
      },
    ],
  },
  {
    id: 'logs',
    label: '운영 로그',
    path: '/admin/logs',
    menuId: 'logs',
    help: '누가 언제 무엇을 바꿨는지 기록만 봅니다. 삭제할 수 없습니다.',
    screenId: 'A28-08a',
  },
];

/** 평탄 목록(권한·라우터·레거시용). 그룹은 제외하고 leaf만. */
export function flattenAdminNav() {
  /** @type {Array<Record<string, unknown>>} */
  const out = [];
  for (const g of A28_MENU) {
    if (g.children?.length) {
      for (const c of g.children) out.push(c);
    } else if (g.path) {
      out.push(g);
    }
  }
  return out;
}

/** @deprecated 평탄 메뉴 — 새 코드는 A28_MENU 사용 */
export const A28_NAV = flattenAdminNav();

/** 메뉴 id → 한글 (권한 화면용) */
export const A28_MENU_ID_LABELS = {
  hub: '운영 홈',
  promo: '홍보 런치',
  settings: '사이트 기본',
  permissions: '권한·계정',
  members: '회원관리',
  notices: '공지·안내 글',
  commerce: '마켓·결제',
  settlement: '보고서',
  exposure: '홈·찾기 노출',
  notify: '알림·문자',
  addons: '부가서비스',
  reports: '신고 처리',
  tickets: '문의',
  submission: '제출자료 확인',
  logs: '운영 로그',
  system: '시스템',
};

/** 탈퇴·삭제 확인. 결제 있음 또는 활성 노출 구독이 있을 때만 붙인다. */
export const A28_MEMBER_BENEFIT_END_NOTICE =
  '이용 중인 노출·이용권 혜택은 모두 종료되며, 환불은 환불규정에 따라서 조치를 해 드립니다.';

/**
 * @param {{ hasPayment?: boolean, activePositions?: number, paid?: { positions?: unknown[] } } | null | undefined} member
 */
export function memberBenefitEndNotice(member) {
  const positions = member?.paid?.positions;
  const activeSub =
    (Array.isArray(positions) && positions.length > 0) || Number(member?.activePositions) > 0;
  if (member?.hasPayment !== true && !activeSub) return '';
  return A28_MEMBER_BENEFIT_END_NOTICE;
}

/** 회원 상태 — 승인·반려 용어 금지 (A28-02) */
export const A28_MEMBER_STATUS_LABELS = {
  active: '정상',
  pending: '대기',
  blocked: '정지',
  withdrawn: '탈퇴',
};

/** 관리자 화면 역할 글자. 키 guardian_student 는 바꾸지 않는다. */
export const ADMIN_GUARDIAN_ROLE_LABEL = '학생';

export const A28_MEMBER_ROLE_LABELS = {
  guardian_student: ADMIN_GUARDIAN_ROLE_LABEL,
  study_room_owner: '공부방',
  tutor: '과외쌤',
  admin: '운영자',
};

/** 게시판 채널 폼은 저장소 라벨을 그대로 쓰지 않고 여기만 본다. */
export function adminChannelRoleLabel(role) {
  if (role?.id === 'guardian_student') return ADMIN_GUARDIAN_ROLE_LABEL;
  return String(role?.label ?? '');
}

/** 홍보 런치 데스크에만 적용. 카탈로그 원문은 그대로 둔다. */
export const ADMIN_PROMO_AUDIENCE_LABELS = {
  '학부모 · 원장': '학생 · 원장',
  '학생 · 학부모(보조)': '학생',
};

/** @param {string} audience */
export function adminPromoAudienceLabel(audience) {
  const key = String(audience ?? '');
  return Object.prototype.hasOwnProperty.call(ADMIN_PROMO_AUDIENCE_LABELS, key)
    ? ADMIN_PROMO_AUDIENCE_LABELS[key]
    : key;
}

export const ADMIN_TODAY_HEADING = '오늘 할 일';

export const ADMIN_TODAY_NOTE = '아래쪽 미리보기는 연습용이에요. 실운영은 위 네 가지만.';

export const ADMIN_TODAY_CARDS = [
  {
    id: 'members',
    path: '/admin/members',
    title: '회원 정리',
    desc: '테스트·탈퇴·삭제 → 회원',
  },
  {
    id: 'exposure',
    path: '/admin/exposure',
    title: '홈에 뭐가 보이나',
    desc: '카드 숨김·다시 보이기 → 홈·찾기 노출',
  },
  {
    id: 'inquiry',
    paths: ['/admin/tickets', '/admin/reports'],
    title: '문의·신고',
    desc: '답장할 글 → 신고·문의',
  },
  {
    id: 'popups',
    path: '/admin/settings/popups',
    title: '홈 팝업',
    desc: '지금 뜨는 팝업 → 홈 팝업',
  },
];

export const A28_MEMBER_TIER_LABELS = {
  free: '무료',
  paid: '유료',
};

/** 신고 상태 — 심사·승인 용어 금지 (A28-04) */
export const A28_REPORT_STATUS_LABELS = {
  open: '접수',
  protect: '임시 보호',
  resolved: '조치 완료',
  dismissed: '종결(기각)',
};

/** @type {Array<{ id: string, kind: string, target: string, reason: string, status: string, createdAt: string }>} */
export const A28_REPORT_SEED = [
  { id: 'RPT-101', kind: '허위 정보', target: '과외쌤 12번', reason: '활동 지역 불일치 신고', status: 'open', createdAt: '2026-07-05' },
  { id: 'RPT-102', kind: '안전 이슈', target: '대화 8번', reason: '부적절 접촉 의심', status: 'protect', createdAt: '2026-07-06' },
];

/** 노출 보정 조치 (A28-07) */
export const A28_EXPOSURE_ACTIONS = {
  hide: { label: '홈·찾기에서 숨김', hint: '홈과 찾기에서 빼기' },
  publish: { label: '다시 보이기', hint: '홈과 찾기에 다시 보이게' },
  inquiry_status: { label: '상담 상태 보정', hint: '공부방 상담 상태만 바꾸기' },
};

export const A28_EXPOSURE_TARGET_LABELS = {
  study_room: '공부방',
  tutor: '과외쌤',
  student: '학생',
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
  { id: 'LOG-1', action: 'hide_profile', target: '공부방 3번', operator: '운영자', at: '2026-07-06 14:22', reversible: true },
  { id: 'LOG-2', action: 'restrict_messages', target: '회원 44번', operator: '운영자', at: '2026-07-06 15:01', reversible: true },
];

export const A28_ACTION_LABELS = {
  hide_profile: '프로필 숨김',
  restrict_messages: '쪽지 제한',
  exposure_correction: '노출 보정(공개·상담)',
  internal_note: '내부 메모',
  submission_expose: '제출 노출 반영',
  submission_hide: '제출 숨김',
  report_status_change: '신고 상태 변경',
  commerce_position_ends_at: '노출 상품 만료일 보정',
  commerce_ticket_remaining: '횟수권 잔여 보정',
  account_block: '이용 제한',
  account_restore: '복구',
  account_withdraw: '탈퇴 처리',
  account_delete: '회원 삭제',
  site_settings_save: '사이트 기본 저장',
  site_settings_reset: '사이트 기본 초기값 복원',
  popup_create: '팝업 생성',
  popup_update: '팝업 수정',
  popup_delete: '팝업 삭제',
  legal_save: '법적 문서 저장',
  channel_create: '채널 생성',
  channel_update: '채널 수정',
  channel_archive: '채널 보관',
  channel_reset_seed: '채널 초기값 복원',
  section_group_create: '소속 그룹 추가',
  section_group_delete: '소속 그룹 삭제',
  section_access_add: '그룹 접근회원 추가',
  section_access_remove: '그룹 접근회원 제거',
  channel_copy: '채널 복사',
  slot_update: '슬롯 수정',
  slot_enable: '슬롯 활성화',
  slot_disable: '슬롯 비활성화',
  slot_reset_seed: '슬롯 초기값 복원',
};

export const A28_LOG_TARGET_TYPE_LABELS = {
  study_room: '공부방',
  tutor: '과외쌤',
  student: '학생',
  board_post: '제출',
  user: '회원',
  position_subscription: '노출 상품 이용권',
  ticket_pack: '횟수권 묶음',
  board_channel: '게시판 채널',
  right_rail_slot: '우측 배너',
  site_settings: '사이트 기본',
};

/** 제출자료 큐 조치 (A28-06) */
export const A28_SUBMISSION_QUEUE_ACTIONS = {
  expose: { label: '노출 반영', hint: '회원 화면: 게시중' },
  hide: { label: '숨김', hint: '회원 화면: 비공개' },
};

/** 내부 참고 — 화면에는 opsTipBody로만 안내 */
export const A28_FORBIDDEN_UI = '승인 · 반려 · 검증 완료 · 인증쌤 · 플랫폼 심사 통과';
