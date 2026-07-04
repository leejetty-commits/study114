/** 17장 정적 콘텐츠 [임시] — G1~G4 · FAQ · 공지 */

export const PRINCIPLES_POSITIVE = [
  { title: '학생 보호', body: '민감정보·공개 범위를 보수적으로 — 필요한 범위만 공개합니다.' },
  { title: '공급자 검증', body: '등록·증빙·검토 상태를 확인하며 비교합니다.' },
  { title: '플랫폼 비중계', body: '대금·연락 중개·보증은 1차 핵심 기능이 아닙니다.' },
];

export const PRINCIPLES_NEGATIVE = [
  { label: '에스크로·지급 보류', msg: '대금은 당사자가 직접 합의·결제합니다.' },
  { label: '안전번호', msg: '플랫폼이 전화번호를 중계하지 않습니다.' },
  { label: '전화·이메일 플랫폼 노출', msg: '회원 간 공식 접촉 = 쪽지(16장)입니다.' },
  { label: '매칭 알고리즘', msg: '탐색·비교는 회원 주도입니다.' },
  { label: '법률·분쟁 대리', msg: '당사자 협의 · 필요 시 관할 기관을 이용합니다.' },
];

export const HOME_CARDS = [
  { id: 'start', title: '처음 이용', desc: '회원가입 · 역할 · 탐색 흐름', href: '/support/guide' },
  { id: 'register', title: '등록 방법', desc: '공부방·과외 등록 안내', href: '/support/guide' },
  { id: 'wishlist', title: '찜·비교·쪽지', desc: '회원 간 공식 접촉은 쪽지', href: '/support/guide' },
  { id: 'safe', title: '안전과외 가이드', desc: '선입금·분쟁 예방 교육', href: '/support/safe' },
];

/** @type {Array<{slug:string,title:string,priority:'primary'|'secondary',audience:string,body:string[]}>} */
export const GUIDE_ARTICLES = [
  {
    slug: 'safe-what',
    title: '안전과외란? — 우동공과에서의 의미',
    priority: 'primary',
    audience: '전체',
    body: [
      '안전과외는 결제 보장 상품이 아니라, **선입금 주의·분쟁 예방·당사자 책임**을 설명하는 교육형 가이드입니다.',
      '우동공과는 과외·공부방 **매칭을 대신하지 않으며**, 탐색·비교·연락은 회원 주도로 이루어집니다.',
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
    title: '첫 연락·시범 수업 · 쪽지 활용',
    priority: 'primary',
    audience: '전체',
    body: [
      '회원 간 **공식 접촉**은 쪽지(16장)를 사용합니다.',
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
    body: ['프로필·증빙·검토 상태를 확인하세요.', '유료등록·Prime/Pick 의미는 11·18장 FAQ를 참고하세요.'],
  },
  {
    slug: 'parent-check',
    title: '학부모·학생 의뢰 체크리스트',
    priority: 'secondary',
    audience: '학부모',
    body: ['학생 공개 범위·블라인드 원칙을 확인하세요.', '찜·비교 후 쪽지로 공식 접촉을 시작하세요.'],
  },
  {
    slug: 'privacy',
    title: '연락처·개인정보 — 쪽지 밖 자율 교환',
    priority: 'secondary',
    audience: '전체',
    body: [
      '플랫폼 안전번호·대리 통화는 없습니다.',
      '공식 접촉 = 쪽지 · 번호 교환은 회원 간 판단(플랫폼 비관여)입니다.',
    ],
  },
];

export const ROLE_GUIDES = {
  parent: {
    title: '학부모',
    items: ['공부방/과외 찾기 · 찜/비교', '학생 공개 범위 · 안전 대화', '선입금 전 G2 가이드 확인'],
  },
  study_room: {
    title: '공부방',
    items: ['기본/상세등록 · Prime/Pick(11·18장)', '학생 접촉 권한(13·16장) · 검증', '무료/유료에 따른 메모 게이트'],
  },
  tutor: {
    title: '과외',
    items: ['프로필·증빙 · 메모 vs 유료(16·18장)', '학생 상세 열람 범위', '안전과외 가이드'],
  },
  guest: {
    title: '비회원',
    items: ['회원가입 후 탐색·찜·비교', '회원 간 공식 접촉은 로그인 후 쪽지', '운영 문의는 고객센터 채널 이용'],
  },
};

export const FAQ_ITEMS = [
  {
    q: '회원끼리 연락은 어떻게 하나요?',
    a: '회원 간 공식 접촉은 **쪽지(16장)** 입니다. 플랫폼 전화·이메일 중계는 없습니다.',
  },
  {
    q: '운영·서비스 문의는 어디로 하나요?',
    a: '**고객센터 운영 문의(P17-07)** — 이메일/문의 폼을 이용합니다. 쪽지함과는 별개입니다.',
  },
  {
    q: '안전번호나 에스크로가 있나요?',
    a: '**없습니다.** 대금·연락 중개·보증은 1차 제공 범위가 아닙니다.',
  },
  {
    q: '유료등록은 학부모가 구매하나요?',
    a: '아닙니다. 공급자(공부방·과외)용이며, 학부모 과외비 결제와 무관합니다(15·18장).',
  },
  {
    q: 'Prime/Pick은 무엇인가요?',
    a: '노출·슬롯 상품입니다. 자세한 내용은 11·18장 FAQ를 참고하세요.',
  },
  {
    q: '환불·과외비 분쟁은?',
    a: '당사자 간 협의가 우선이며, 플랫폼은 대리 조정하지 않습니다.',
  },
];

export const NOTICES = [
  {
    id: 'notice-001',
    date: '2026-07-01',
    title: '고객센터·안전과외 가이드 1차 오픈 (프리뷰)',
    body: [
      '고객센터 좌측 메뉴·게시판형 FAQ/공지·안전과외 아코디언 UI를 프리뷰에 반영했습니다.',
      '1차는 정적 콘텐츠이며, 후순위에 관리자 게시판 연동 예정입니다.',
    ],
  },
  {
    id: 'notice-002',
    date: '2026-06-15',
    title: '쪽지함 프리뷰(16a) 안내',
    body: [
      '회원 간 공식 접촉은 쪽지함(16장)을 이용합니다.',
      '운영 문의는 고객센터 운영 문의 채널과 별도입니다.',
    ],
  },
];

export const TERMS_LINKS = [
  { label: '이용약관', href: '[후순위]' },
  { label: '개인정보처리방침', href: '[후순위]' },
  { label: '운영 정책', href: '[후순위]' },
];

export const OPERATIONAL_CONTACT = {
  email: 'support@udonggong.example',
  note: '버그·정책·계정 문의 · 티켓·SLA는 1차 범위 밖',
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
