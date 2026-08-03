/**
 * 17장 — 고객센터 copy · 원칙 · FAQ · 가이드 (횡단 SSOT)
 * docs/ssot/17-customer-center-and-safe-guide.md §3 · §4 · §5 · §7
 */

/** §3-1 3대 원칙 */
export const PRINCIPLES_POSITIVE = [
  { title: '학생 보호', body: '민감정보·공개 범위를 보수적으로 — 필요한 범위만 공개합니다.' },
  { title: '공급자 제출자료 확인', body: '등록·제출자료·공개 상태를 직접 비교합니다. 플랫폼이 사실을 보증하지 않습니다.' },
  { title: '플랫폼 비중계', body: '대금·외부 연락 중개·보증은 1차 핵심 기능이 아닙니다.' },
];

/** §3-2 하지 않는 것 */
export const PRINCIPLES_NEGATIVE = [
  { label: '에스크로·지급 보류', msg: '대금은 당사자가 직접 합의·결제합니다.' }, // 에스크로: 플랫폼이 돈을 잠시 맡아 두는 방식
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
  columnLabel: '운영·서비스 문의',
  buttonLabel: '문의하기',
  hintSuffix: '· 쪽지함과 별도',
};

/** §5 G1~G7 */
export const GUIDE_ARTICLES = [
  {
    slug: 'safe-what',
    title: '안전과외란? — 우동공과에서의 의미',
    priority: 'primary',
    audience: '전체',
    body: [
      '안전과외는 결제 보장 상품이 아니라, **선입금 주의·분쟁 예방·당사자 책임**을 설명하는 교육형 가이드입니다.',
      '우동공과는 과외·공부방 **매칭을 대신하지 않으며**, 탐색·비교·쪽지는 회원 주도로 이루어집니다.',
      '플랫폼은 에스크로·안전번호·전화 중계를 제공하지 않습니다.',
    ],
  },
  {
    slug: 'prepay',
    title: '선입금·전액선불 주의',
    priority: 'primary',
    audience: '학부모',
    body: [
      '장기·고액 선입금은 신중히 결정하세요.',
      '영수증·환불 조건은 **당사자 간 문서화**를 권장합니다.',
      '우동공과는 대금을 보관하거나 지급하지 않습니다.',
    ],
  },
  {
    slug: 'first-meeting',
    title: '첫 쪽지·시범 수업 안내',
    priority: 'primary',
    audience: '전체',
    body: [
      '회원 간 **공식 접촉**은 쪽지를 사용합니다.',
      '시범 수업·일정·조건은 쪽지로 먼저 확인한 뒤, 연락처 교환 여부는 당사자가 판단합니다.',
      '플랫폼이 전화·이메일을 대신 전달하지 않습니다.',
    ],
  },
  {
    slug: 'dispute',
    title: '분쟁이 생기면 — 플랫폼 역할과 한계',
    priority: 'primary',
    audience: '전체',
    body: [
      '과외비·환불 등 분쟁은 **당사자 간 협의**가 우선입니다.',
      '우동공과는 법률 자문·분쟁 대리 조정을 하지 않습니다.',
      '필요 시 소비자원·관할 기관 등 외부 절차를 안내합니다.',
    ],
  },
  {
    slug: 'provider-check',
    title: '공급자(공부방·과외) 체크리스트',
    priority: 'secondary',
    audience: '공급자',
    body: [
      '등록·노출·접촉 권한은 서비스 정책을 따릅니다. 아래 항목을 주기적으로 점검하세요.',
      '플랫폼은 제출자료의 사실을 검증·보증하지 않습니다 — **공개 상태를 스스로 관리**합니다.',
    ],
    checklist: [
      { label: '프로필·등록 정보 최신 여부', hint: '공부방명·과목·지역·소개글이 실제와 일치하는지' },
      { label: '제출자료·공개 상태 확인', hint: '마이페이지 제출자료 상태와 학부모에게 보이는 범위 확인' },
      { label: '상담 가능 상태', hint: '공부방은 상담 가능·일시 중지 등 현재 상태를 유지' },
      { label: '쪽지·접촉 권한 이해', hint: '학부모가 먼저 보낸 쪽지와 답장은 무료 · 학생에게 먼저 보내는 쪽지만 유료' },
      { label: '대표·추천 노출 의미', hint: '눈에 잘 띄는 자리를 일정 기간 이용하는 상품 · 매칭과 성과를 보장하지 않음' },
      { label: '대금·선입금', hint: '과외비는 당사자 합의 · 대금 보관·지급 중개 없음' },
    ],
  },
  {
    slug: 'parent-check',
    title: '학부모·학생 의뢰 체크리스트',
    priority: 'secondary',
    audience: '학부모',
    body: [
      '탐색·비교·접촉은 **회원 주도**입니다. 플랫폼이 후보를 추천하거나 대금을 보관하지 않습니다.',
      '학생 정보는 **필요한 범위만** 공개하세요.',
    ],
    checklist: [
      { label: '학생 공개 범위·블라인드', hint: '등록·수정 시 공개 필드 · 표시명 확인' },
      { label: '찜·비교 후 접촉', hint: '후보를 좁힌 뒤 쪽지로 공식 접촉 시작' },
      { label: '공급자 제출자료 직접 비교', hint: '제출자료·공개 상태는 본인이 확인 — 플랫폼 비보증' },
      { label: '선입금·고액 선불', hint: '결정 전 선입금 주의 가이드 · 환불 조건은 쪽지·문서로' },
      { label: '시범·일정·조건', hint: '첫 대화는 쪽지 · 연락처 교환은 당사자 판단' },
      { label: '분쟁 발생 시', hint: '당사자 협의 우선 · 플랫폼 법률·분쟁 대리 없음' },
    ],
  },
  {
    slug: 'privacy',
    title: '연락처·개인정보 — 쪽지 밖 자율 교환',
    priority: 'secondary',
    audience: '전체',
    body: [
      '우동공과는 **안전번호·대리 통화·이메일 중계**를 제공하지 않습니다.',
      '쪽지 밖 연락처 교환은 **회원 간 자율**이며, 플랫폼은 내용·분쟁에 관여하지 않습니다.',
    ],
    checklist: [
      { label: '공식 접촉 = 쪽지', hint: '회원 ↔ 회원 · 플랫폼 전화·메일 노출 없음' },
      { label: '안전번호 없음', hint: '번호 중계·녹취·대리 통화 미제공' },
      { label: '연락처·카톡 교환', hint: '충분히 조건 확인 후 당사자가 판단 · 플랫폼 비관여' },
      { label: '개인정보 최소 공유', hint: '필요한 범위만 · 학생 민감정보 보수적 공개' },
      { label: '운영 문의와 구분', hint: '오류·정책·계정 문제는 고객센터 문의 · 회원 간 분쟁은 당사자 간 협의' },
      { label: '신고·차단', hint: '쪽지함·상세에서 사후 조치 — 사전 심사 없음' },
    ],
  },
];

/** §4-2 역할별 이용안내 */
export const ROLE_GUIDES = {
  parent: {
    title: '학부모',
    items: ['공부방/과외 찾기 · 찜/비교', '학생 공개 범위 · 안전 대화', '선입금 전 G2 가이드 확인'],
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
      title: '공급자 홈 미리보기',
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

/** FAQ */
export const FAQ_ITEMS = [
  {
    q: '회원끼리 연락은 어떻게 하나요?',
    a: '회원 간 공식 접촉은 **쪽지**입니다. 플랫폼 전화·이메일 중계는 없습니다.',
  },
  {
    q: '운영·서비스 문의는 어디로 하나요?',
    a: '**고객센터** — 이메일/문의 폼을 이용합니다. 쪽지함과는 별개입니다.',
  },
  {
    q: '안전번호나 에스크로가 있나요?',
    a: '없습니다. 대금·연락 중개·보증은 우동공과에서 제공하지 않는 서비스입니다.', // 에스크로: 플랫폼이 돈을 잠시 맡아 두는 방식
  },
  {
    q: '유료 서비스는 학부모가 구매하나요?',
    a: '아닙니다. 공급자(공부방·과외)용 프라임/픽·쪽지권·열람권이며, 학부모 과외비 결제와 무관합니다.',
  },
  {
    q: '프라임/픽은 무엇인가요?',
    a: '동네 노출 기간형 포지션 상품입니다. Hot·추천 등 광고배지는 포지션에 종속됩니다.',
  },
  {
    q: '환불·과외비 분쟁은?',
    a: '당사자 간 협의와 조정으로 결정하며, 우동공과 플랫폼은 일체 관여하지 않습니다.',
  },
];

/** §7-2 공지 */
export const NOTICES = [
  {
    id: 'notice-001',
    date: '2026-07-01',
    title: '고객센터·안전과외 가이드 안내',
    body: [
      '고객센터 왼쪽 메뉴·자주 묻는 질문·공지·안전과외 접이식 안내를 이용할 수 있습니다.',
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

/** 약관·정책 링크 (고객센터 내) */
export const TERMS_LINKS = [
  { label: '이용약관', href: '/support/policies/terms' },
  { label: '개인정보처리방침', href: '/support/policies/privacy' },
  { label: '플랫폼 역할 고지', href: '/support/policies/platform' },
  { label: '제출자료/신뢰정보 고지', href: '/support/policies/trust' },
  { label: '학생정보 보호 고지', href: '/support/policies/student-privacy' },
  { label: '신고/제재/분쟁 안내', href: '/support/policies/reporting' },
];

/** §7-3 운영 문의 */
export const TICKET_CATEGORIES = [
  { value: 'bug', label: '오류·장애' },
  { value: 'policy', label: '정책·이용 문의' },
  { value: 'account', label: '계정·로그인' },
  { value: 'other', label: '기타' },
];

export const TICKET_STATUS_LABELS = {
  open: '접수',
  in_progress: '확인 중',
  closed: '종료',
};

export const OPERATIONAL_CONTACT = {
  email: 'support@udonggong.example',
  note: '제출하면 문의 번호가 안내됩니다. 접수한 내용은 「내 문의 내역」에서 확인할 수 있습니다.',
  ticketSuccessTitle: '문의가 접수되었습니다',
};

/** 운영 콘솔 카피 (관리자 화면) */
export const ADMIN_COPY = {
  hubTitle: '고객센터 운영',
  hubLead: '공지와 문의 목록을 한곳에서 관리합니다.',
  noticeAdminLead: '공지 추가·수정·삭제 · 사용자 공지사항에 즉시 반영',
  ticketAdminLead: '접수 문의 상태 변경',
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
  return GUIDE_ARTICLES.filter((g) => g.slug !== slug && g.priority === current.priority).slice(0, 3);
}
