/**
 * 17장 — 고객센터 copy · 원칙 · FAQ · 가이드 (횡단 SSOT)
 * docs/ssot/17-customer-center-and-safe-guide.md §3 · §4 · §5 · §7
 */

/** §3-1 3대 원칙 */
export const PRINCIPLES_POSITIVE = [
  { title: '학생 보호', body: '민감정보·공개 범위를 보수적으로 — 필요한 범위만 공개합니다.' },
  { title: '공부방·과외쌤 제출자료 확인', body: '등록·제출자료·노출 상태를 직접 비교합니다. 플랫폼이 사실을 보증하지 않습니다.' },
  { title: '플랫폼 비중계', body: '대금·외부 연락 중개·보증은 1차 핵심 기능이 아닙니다.' },
];

/** §3-2 하지 않는 것 */
export const PRINCIPLES_NEGATIVE = [
  { label: '대금 보관·안전결제', msg: '대금은 당사자가 직접 합의·결제합니다.' },
  { label: '안전번호', msg: '플랫폼이 전화번호를 중계하지 않습니다.' },
  { label: '전화·이메일 플랫폼 노출', msg: '회원 간 공식 접촉은 쪽지입니다.' },
  { label: '매칭 알고리즘', msg: '탐색·비교는 회원 주도입니다.' },
  { label: '법률·분쟁 대리', msg: '당사자 협의 · 필요 시 관할 기관을 이용합니다.' },
];

/** §4 이용안내 탭·카드 */
export const HOME_CARDS = [
  { id: 'start', title: '처음 이용', desc: '회원가입 · 역할 · 탐색 흐름', mode: 'tab' },
  { id: 'register', title: '등록 방법', desc: '공부방·과외 등록 안내', mode: 'tab' },
  { id: 'wishlist', title: '찜·비교·쪽지', desc: '회원 간 공식 접촉은 쪽지', mode: 'tab' },
  { id: 'safe', title: '안전과외 가이드', desc: '선입금·분쟁 예방 교육', mode: 'nav', href: '/support/safe' },
];

/** §4-1 · §8 CTA copy */
export const MEMBER_CONTACT_CTA = {
  guestLoginLabel: '로그인 · 회원가입',
  guestHint: '회원 간 공식 접촉(쪽지)은 로그인 후 이용',
  memberLabel: '쪽지함 열기',
  memberHint: '회원끼리 주고받는 공식 쪽지',
  columnLabel: '회원 간 접촉',
};

export const OPERATIONAL_CTA = {
  columnLabel: '운영문의',
  buttonLabel: '운영문의 남기기',
  hintSuffix: '· 쪽지와 다름',
};

/** 안전과외 가이드 본문 */
export const GUIDE_ARTICLES = [
  {
    slug: 'safe-what',
    title: '안전과외란? — 우동공과에서의 의미',
    priority: 'primary',
    audience: '전체',
    related: ['prepay', 'first-meeting', 'dispute'],
    body: [
      '안전과외는 결제를 보장하는 상품이 아니라, **선입금 주의·분쟁 예방·당사자 책임**을 설명하는 이용 안내입니다.',
      '우동공과는 과외·공부방 **연결을 대신하지 않으며**, 찾기·비교·쪽지는 회원 주도로 이루어집니다.',
      '우동공과는 대금 보관·안전번호·전화 연결을 제공하지 않습니다.',
    ],
  },
  {
    slug: 'prepay',
    title: '선입금·전액선불 주의',
    priority: 'primary',
    audience: '학부모',
    related: ['safe-what', 'first-meeting', 'dispute'],
    body: [
      '장기·고액 선입금은 신중히 결정하세요.',
      '영수증·환불 조건은 **당사자 간에 글로 남겨 두는 것**을 권장합니다.',
      '우동공과는 대금을 보관하거나 대신 지급하지 않습니다.',
    ],
  },
  {
    slug: 'first-meeting',
    title: '첫 쪽지·시범 수업 안내',
    priority: 'primary',
    audience: '전체',
    related: ['safe-what', 'prepay', 'privacy'],
    body: [
      '회원 간 **공식 연락**은 쪽지를 사용합니다.',
      '시범 수업·일정·조건은 쪽지로 먼저 확인한 뒤, 연락처 교환 여부는 당사자가 판단합니다.',
      '플랫폼이 전화·이메일을 대신 전달하지 않습니다.',
    ],
  },
  {
    slug: 'dispute',
    title: '분쟁이 생기면 — 플랫폼 역할과 한계',
    priority: 'primary',
    audience: '전체',
    related: ['prepay', 'first-meeting', 'parent-check'],
    body: [
      '과외비·환불 등 분쟁은 **당사자 간 협의**가 우선입니다.',
      '우동공과는 법률 자문이나 분쟁 조정을 대신하지 않습니다.',
      '필요 시 소비자원·관할 기관 등 외부 절차를 안내합니다.',
    ],
  },
  {
    slug: 'provider-check',
    title: '공부방·과외쌤 체크리스트',
    priority: 'secondary',
    audience: '공부방·과외쌤',
    related: ['parent-check', 'privacy', 'safe-what'],
    body: [
      '등록·노출·연락 권한은 서비스 정책을 따릅니다. 아래 항목을 주기적으로 점검하세요.',
      '플랫폼은 제출자료의 사실을 검증하거나 보증하지 않습니다 — **노출 상태를 스스로 관리**합니다.',
    ],
    checklist: [
      { label: '프로필·등록 정보 최신 여부', hint: '공부방명·과목·지역·소개글이 실제와 일치하는지' },
      { label: '제출자료·노출 상태 확인', hint: '마이페이지 제출자료 상태와 학부모에게 보이는 범위 확인' },
      { label: '상담 가능 상태', hint: '공부방은 상담 가능·일시 중지 등 현재 상태를 유지' },
      { label: '쪽지·연락 권한 이해', hint: '학부모가 먼저 보낸 쪽지와 답장은 무료 · 학생에게 먼저 보내는 쪽지만 유료' },
      { label: '대표·추천 노출 의미', hint: '눈에 잘 띄는 자리를 일정 기간 이용하는 상품 · 연결·성과를 보장하지 않음' },
      { label: '대금·선입금', hint: '과외비는 당사자 합의 · 대금 보관·지급 중개 없음' },
    ],
  },
  {
    slug: 'parent-check',
    title: '학부모·학생 등록 체크리스트',
    priority: 'secondary',
    audience: '학부모',
    related: ['provider-check', 'prepay', 'privacy'],
    body: [
      '찾기·비교·연락은 **회원 주도**입니다. 플랫폼이 후보를 골라 주거나 대금을 보관하지 않습니다.',
      '학생 정보는 **필요한 범위만** 보여 주세요.',
    ],
    checklist: [
      { label: '학생 표시 범위·이름 가림', hint: '등록·수정 시 보여 주는 항목 · 표시명 확인' },
      { label: '찜·비교 후 연락', hint: '후보를 좁힌 뒤 쪽지로 공식 연락 시작' },
      { label: '공부방·과외쌤 제출자료 직접 비교', hint: '제출자료·노출 상태는 본인이 확인 — 플랫폼이 보증하지 않음' },
      { label: '선입금·고액 선불', hint: '결정 전 「선입금·전액선불 주의」 안내 · 환불 조건은 쪽지·문서로' },
      { label: '시범·일정·조건', hint: '첫 대화는 쪽지 · 연락처 교환은 당사자 판단' },
      { label: '분쟁 발생 시', hint: '당사자 협의 우선 · 플랫폼 법률·분쟁 대리 없음' },
    ],
  },
  {
    slug: 'privacy',
    title: '연락처·개인정보 — 쪽지 밖 자율 교환',
    priority: 'secondary',
    audience: '전체',
    related: ['first-meeting', 'provider-check', 'parent-check'],
    body: [
      '우동공과는 **안전번호·대리 통화·이메일 전달**을 제공하지 않습니다.',
      '쪽지 밖 연락처 교환은 **회원 간 자율**이며, 플랫폼은 내용·분쟁에 관여하지 않습니다.',
    ],
    checklist: [
      { label: '공식 연락 = 쪽지', hint: '회원 ↔ 회원 · 플랫폼 전화·메일 노출 없음' },
      { label: '안전번호 없음', hint: '번호 중계·녹취·대리 통화 미제공' },
      { label: '연락처·카톡 교환', hint: '충분히 조건 확인 후 당사자가 판단 · 플랫폼 비관여' },
      { label: '개인정보 최소 공유', hint: '필요한 범위만 · 학생 민감정보는 조심스럽게 공개' },
      { label: '운영 문의와 구분', hint: '오류·정책·계정 문제는 고객센터 문의 · 회원 간 분쟁은 당사자 간 협의' },
      { label: '신고·차단', hint: '쪽지함·상세에서 사후 조치 — 사전 심사 없음' },
    ],
  },
];

/** §4-2 역할별 이용안내 */
export const ROLE_GUIDES = {
  parent: {
    title: '학부모',
    items: ['공부방/과외 찾기 · 찜/비교', '학생 공개 범위 · 안전 대화', '선입금 전 「선입금·전액선불 주의」 확인'],
  },
  study_room: {
    title: '공부방',
    items: ['기본/상세등록 · 프라임/픽(대표·추천) 노출', '학생 접촉 권한 · 제출자료', '무료/유료에 따른 쪽지 이용 범위'],
  },
  tutor: {
    title: '과외',
    items: ['프로필·제출자료 · 무료/유료 쪽지 범위', '학생 상세 열람 범위', '안전과외 가이드'],
  },
  guest: {
    title: '비회원',
    items: ['회원가입 후 탐색·찜·비교', '회원 간 공식 접촉은 로그인 후 쪽지', '운영 문의는 고객센터 채널 이용'],
  },
};

/**
 * 홈 노출 블록 안내 — 이용안내 `#/support` 전용
 * (홈 피드 본문에는 순환 고지를 두지 않음)
 * @param {{ pick_rotation_minutes?: number, pick_set_size?: number, prime_slots?: number }} [settings]
 */
export function getHomeExposureGuides(settings = {}) {
  const rot = Math.max(1, Number(settings.pick_rotation_minutes) || 15);
  const pickSize = Math.max(1, Number(settings.pick_set_size) || 5);
  const primeSlots = Math.max(1, Number(settings.prime_slots) || 3);
  return [
    {
      title: '대표 노출 공부방',
      items: [
        '선착순 한정으로 운영되는 지역 상단 노출입니다.',
        `${primeSlots}자리 고정이며, 빈 자리는 홍보카드로 유지하고 자동 대체·시간 순환하지 않습니다.`,
      ],
    },
    {
      title: '대표 노출 과외쌤',
      items: [
        '시(市) 단위로 운영되는 상단 노출입니다.',
        `후보가 많으면 ${primeSlots}자리씩 페이지로 나누며, 약 ${rot}분마다 세트가 순환됩니다.`,
      ],
    },
    {
      title: '추천 노출 공부방·과외쌤',
      items: [
        `핵심 정보를 빠르게 비교하는 ${pickSize}개 카드 세트입니다.`,
        `세트는 약 ${rot}분마다 순환하며 최신 입점 항목을 우선합니다.`,
      ],
    },
    {
      title: '우동공과 공부방·과외쌤',
      items: [
        '기본 등록 항목을 최근 등록순으로 보여주는 목록입니다.',
        '시간 순환 없이 수동 페이지만 사용합니다.',
      ],
    },
    {
      title: '우동공과 학생',
      items: [
        '선생님을 찾는 학생·학부모의 학습 의뢰를 보여줍니다.',
        '시장 비교 열람 시에도 이름은 마스킹되며 학생 간 쪽지는 불가합니다.',
      ],
    },
    {
      title: '공부방·과외쌤 홈 미리보기',
      items: [
        '내 과외쌤·공부방 홈의 자기 탭은 검색·노출 화면 미리보기입니다.',
        '자기 미리보기에서는 비교·찜을 쓰지 않고, 경쟁 비교는 찾기(검색) 메뉴를 이용합니다.',
        '공부방찾기 결과의 지도 핀과 목록은 동일한 결과 집합입니다.',
      ],
    },
  ];
}

/** @deprecated getHomeExposureGuides() 사용 — 정적 스냅샷(기본 15분) */
export const HOME_EXPOSURE_GUIDES = getHomeExposureGuides();

/** FAQ 분류 탭. 문구·slug 고정. */
export const FAQ_TABS = [
  { slug: 'join', label: '가입·로그인' },
  { slug: 'register', label: '등록·카드' },
  { slug: 'search', label: '검색·쪽지' },
  { slug: 'plans', label: '결제·상품' },
  { slug: 'safety', label: '안전·신고' },
];

/** FAQ */
export const FAQ_ITEMS = [
  {
    category: 'search',
    q: '회원끼리 연락은 어떻게 하나요?',
    a: '회원끼리 첫 연락은 **쪽지**입니다. 플랫폼은 전화·이메일을 대신 전달하지 않습니다.',
  },
  {
    category: 'join',
    q: '운영문의는 어디로 하나요?',
    a: '**운영문의**는 운영팀에 보내는 채널입니다. 오류·정책·계정 문제를 남기세요. 수업 상담은 쪽지입니다. 접수한 뒤에는 마이페이지의 내 문의 내역에서 확인합니다.',
  },
  {
    category: 'safety',
    q: '안전번호나 대금 보관이 있나요?',
    a: '없습니다. 안전번호, 대금 보관, 안전결제, 보증, 분쟁 대리는 제공하지 않습니다.',
  },
  {
    category: 'plans',
    q: '유료 서비스는 학부모가 구매하나요?',
    a: '아닙니다. 공부방·과외쌤용 동네 노출(기간) 상품과 쪽지권이며, 학부모 과외비 결제와 무관합니다.',
  },
  {
    category: 'plans',
    q: '프라임/픽은 무엇인가요?',
    a: '동네 노출(기간) 상품입니다. 주목·추천 등 광고 표시는 그 상품을 이용할 때 붙습니다. 연결이나 성과를 보장하지 않습니다.',
  },
  {
    category: 'safety',
    q: '환불·과외비 분쟁은?',
    a: '당사자 간 협의로 정합니다. 우동공과는 대금 보관·안전결제·분쟁 대리를 하지 않습니다.',
  },
  {
    category: 'join',
    q: '이용안내와 고객센터는 같은 곳인가요?',
    a: '아닙니다. 이용안내는 쓰는 순서이고, 고객센터는 공지·자주 묻는 질문·운영문의·정책입니다. 쓰는 방법은 [이용안내](#/guide)를 보세요.',
  },
  {
    category: 'search',
    q: '쪽지와 운영문의는 같은가요?',
    a: '아닙니다. 쪽지는 회원끼리 첫 연락이고, 운영문의는 운영팀에 보내는 문의입니다.',
  },
  {
    category: 'join',
    q: '로그인 없이 운영문의를 남길 수 있나요?',
    a: '없습니다. 운영문의는 로그인 후에 남깁니다.',
  },
  {
    category: 'join',
    q: '운영문의 답변은 어디서 보나요?',
    a: '마이페이지의 내 문의 내역에서 확인합니다.',
  },
  {
    category: 'register',
    q: '가입하면 바로 노출되나요?',
    a: '기본 정보를 입력하면 기본 노출이 시작됩니다. 운영자 심사를 기다리지 않습니다. [이용안내](#/guide/register)를 보세요.',
  },
  {
    category: 'search',
    q: '학생찾기는 누구를 위한 화면인가요?',
    a: '공부방·과외쌤용입니다. 학부모가 공부방·과외쌤을 찾는 화면과는 방향이 반대예요. [이용안내](#/guide/start)를 보세요.',
  },
  {
    category: 'search',
    q: '비교는 최대 몇 개인가요?',
    a: '공부방끼리 또는 과외쌤끼리 최대 3개입니다. 순서는 [이용안내](#/guide/compare)를 보세요.',
  },
  {
    category: 'safety',
    q: '선입금은 어떻게 해야 하나요?',
    a: '비용·환불·수업 방식이 정리되기 전에는 선입금이나 외부 결제에 바로 응하지 마세요. [안전이용](#/guide/safe)을 보세요.',
  },
  {
    category: 'register',
    q: '제출자료나 증빙은 보증인가요?',
    a: '아닙니다. 제출자료·증빙은 회원이 보여 둔 자료이며, 플랫폼이 확인하거나 보증한 것이 아닙니다.',
  },
  {
    category: 'safety',
    q: '신고는 어디로 하나요?',
    a: '[신고·제재](#/support/policies/reporting) 안내를 보세요. 회원 쪽지로 대신 해결하지 마세요.',
  },
  {
    category: 'safety',
    q: '학생 개인정보는 어떻게 다루나요?',
    a: '필요한 범위만 보여 주세요. [학생정보 보호](#/support/policies/student-privacy) 고지를 보세요.',
  },
  {
    category: 'join',
    q: '로그인이 안 되면 어디로 하나요?',
    a: '계정·로그인 문제는 운영문의로 남기세요. 수업 상담은 쪽지입니다.',
  },
  {
    category: 'plans',
    q: '유료상품 환불과 과외비 환불은 같나요?',
    a: '다릅니다. 유료상품 환불은 운영문의로 묻고, 과외비는 당사자가 정합니다.',
  },
];

/** §7-2 공지 */
export const NOTICES = [
  {
    id: 'notice-001',
    date: '2026-07-01',
    title: '고객센터·안전과외 가이드 안내',
    body: [
      '고객센터 왼쪽 메뉴·자주 묻는 질문·공지와, 약관·정책의 안전과외 · 이용안내의 안전이용을 볼 수 있습니다.',
      '공지와 안내는 운영 정책에 따라 업데이트됩니다.',
    ],
  },
  {
    id: 'notice-002',
    date: '2026-06-15',
    title: '쪽지함 이용 안내',
    body: [
      '회원 간 공식 접촉은 쪽지함을 이용합니다.',
      '운영 문의는 고객센터 문의 채널과 별도입니다.',
    ],
  },
];

/**
 * 고객센터 홈 바로가기 박스 — SUPPORT_NAV 항목 id 별 제목·설명·아이콘.
 * 박스 순서와 주소는 SUPPORT_NAV(nav.js)가 정한다. 여기에는 순서·주소를 두지 않는다.
 */
export const SUPPORT_HOME_CARDS = {
  notice: { title: '공지사항', desc: '서비스 변경·운영 안내', icon: '/assets/info-refresh/motif-notice.svg', accent: 'warn' },
  faq: { title: '자주 묻는 질문', desc: '자주 묻는 질문에서 먼저', icon: '/assets/info-refresh/motif-faq.svg', accent: '' },
  policies: { title: '약관·정책', desc: '이용약관 · 개인정보 등', icon: '/assets/info-refresh/motif-policy.svg', accent: 'violet' },
  library: { title: '자료실', desc: '역할별 팁 게시판 모음', icon: '/assets/info-refresh/motif-library.svg', accent: 'teal' },
  contact: { title: '운영문의', desc: '운영팀 · 오류·정책·계정', icon: '/assets/info-refresh/motif-contact.svg', accent: '' },
};

/** 약관·정책 링크 (고객센터 내) */
export const TERMS_LINKS = [
  { label: '이용약관', href: '/support/policies/terms' },
  { label: '개인정보처리방침', href: '/support/policies/privacy' },
  { label: '플랫폼 역할 고지', href: '/support/policies/platform' },
  { label: '제출자료/신뢰정보 고지', href: '/support/policies/trust' },
  { label: '학생정보 보호 고지', href: '/support/policies/student-privacy' },
  { label: '신고/제재/분쟁 안내', href: '/support/policies/reporting' },
  { label: '계정·연락처 원칙', href: '/support/policies/account-contact' },
];

/** §7-3 운영 문의 */
export const TICKET_CATEGORIES = [
  { value: 'bug', label: '오류·장애' },
  { value: 'policy', label: '정책·이용 문의' },
  { value: 'account', label: '계정·로그인' },
  { value: 'other', label: '기타' },
  { value: 'unhide_request', label: '숨김 해제 요청' },
];

export const TICKET_ADMIN_GROUPS = [
  { value: 'open', label: '처리 전' },
  { value: 'closed', label: '종료' },
  { value: 'all', label: '전체' },
];

export const TICKET_STATUS_LABELS = {
  open: '접수',
  in_progress: '확인 중',
  closed: '종료',
};

export const OPERATIONAL_CONTACT = {
  email: 'support@udonggong.example',
  note: '제출하면 문의 번호가 안내됩니다. 답변과 진행 상태는 마이페이지 > 내 문의 내역에서 확인할 수 있습니다.',
  ticketSuccessTitle: '운영문의가 접수되었습니다',
};

/** 운영 콘솔 카피 (관리자 화면) */
export const ADMIN_COPY = {
  hubTitle: '고객센터 운영',
  hubLead: '공지와 문의 목록을 한곳에서 관리합니다.',
  noticeAdminLead: '공지 추가·수정·삭제 · 사용자 공지사항에 즉시 반영',
  ticketAdminLead: '접수 문의 상태 변경과 운영자 답변 등록',
  previewBadge: '운영',
};

/** @param {string} slug */
export function getGuideBySlug(slug) {
  return GUIDE_ARTICLES.find((g) => g.slug === slug) || null;
}

/** @param {string} slug */
export function getRelatedGuides(slug) {
  const current = getGuideBySlug(slug);
  if (!current) return [];
  if (Array.isArray(current.related) && current.related.length) {
    return current.related
      .map((id) => getGuideBySlug(id))
      .filter(Boolean)
      .slice(0, 3);
  }
  return GUIDE_ARTICLES.filter((g) => g.slug !== slug && g.priority === current.priority).slice(0, 3);
}
