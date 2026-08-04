export const GUIDE_NAV_ITEMS = [
  { id: 'home', label: '이용안내 홈', path: '/guide' },
  { id: 'getting-started', label: '처음 이용', path: '/guide/getting-started' },
  { id: 'registration', label: '등록방법', path: '/guide/registration' },
  { id: 'saved-contact', label: '찜·비교·쪽지', path: '/guide/saved-contact' },
  { id: 'safety', label: '안전과외 가이드', path: '/guide/safety' },
];

export const GUIDE_HOME_CARDS = [
  {
    id: 'getting-started',
    title: '처음 이용',
    desc: '회원가입부터 찾기, 비교, 첫 연락까지 전체 흐름을 한 번에 확인해보세요.',
    cta: '전체 흐름 보기',
    image: '/assets/banners/discover.jpg',
  },
  {
    id: 'registration',
    title: '등록방법',
    desc: '공부방·과외 등록은 어떻게 시작하고 언제 공개되는지 순서대로 알려드려요.',
    cta: '등록 순서 보기',
    image: '/assets/banners/trust.jpg',
  },
  {
    id: 'saved-contact',
    title: '찜·비교·쪽지',
    desc: '후보를 저장하고 비교한 뒤 첫 연락까지 이어가는 방법을 확인해보세요.',
    cta: '판단 흐름 보기',
    image: '/assets/banners/compare.jpg',
  },
  {
    id: 'safety',
    title: '안전과외 가이드',
    desc: '첫 연락, 개인정보 공유, 선입금 전 꼭 알아둘 기준을 확인해보세요.',
    cta: '안전 기준 보기',
    image: '/assets/banners/support.jpg',
  },
];

export const GUIDE_ROLE_CARDS = [
  {
    eyebrow: '학부모·학생',
    title: '공부방이나 과외쌤을 찾고 비교하려는 분',
    body: '처음 이용에서 전체 구조를 익힌 뒤, 찜·비교·쪽지 흐름으로 판단을 이어가세요.',
    ctas: [
      { label: '처음 이용 보기', path: '/guide/getting-started' },
      { label: '공부방 찾기 시작', external: 'search-room' },
    ],
  },
  {
    eyebrow: '공부방',
    title: '공부방 정보를 등록하고 공개·운영하려는 분',
    body: '등록방법에서 기본등록과 상세등록의 차이를 먼저 확인하고, 이후 유료상품과 연결 여부를 판단하세요.',
    ctas: [
      { label: '등록방법 보기', path: '/guide/registration' },
      { label: '공부방 등록 시작', external: 'register-room' },
    ],
  },
  {
    eyebrow: '과외쌤',
    title: '프로필을 만들고 학생 탐색까지 연결하려는 분',
    body: '등록방법으로 공개 흐름을 이해하고, 찜·비교·쪽지 페이지에서 첫 연락 구조를 확인해보세요.',
    ctas: [
      { label: '등록방법 보기', path: '/guide/registration' },
      { label: '과외 등록 시작', external: 'register-tutor' },
    ],
  },
];

export const GUIDE_FLOW_SUMMARY = [
  {
    title: '찾는 사람',
    steps: ['찾기', '찜', '비교', '상세 확인', '쪽지'],
  },
  {
    title: '등록하는 사람',
    steps: ['가입', '기본등록', '상세등록', '공개 가능 상태', '유료 연결'],
  },
  {
    title: '도움이 필요할 때',
    steps: ['FAQ', '고객센터', '신고·도움 안내'],
  },
];

export const GUIDE_HOME_FAQ_PREVIEW = [
  '회원가입만 하면 바로 공개되나요?',
  '공부방 등록과 과외 등록은 뭐가 다른가요?',
  '찜은 저장 기능인가요?',
  '비교는 몇 개까지 할 수 있나요?',
  '첫 연락은 어디서 시작하나요?',
];

export const GUIDE_SUPPORT_LINKS = [
  { label: '고객센터 가기', path: '/support' },
  { label: 'FAQ 보기', path: '/support/faq' },
  { label: '신고·도움 안내 보기', path: '/support/policies/reporting' },
  { label: '정책 보기', path: '/support/policies' },
];

export const GUIDE_HOME_CTA = [
  { label: '공부방 찾기 시작', external: 'search-room' },
  { label: '과외쌤 찾기 시작', external: 'search-tutor' },
  { label: '공부방 등록 시작', external: 'register-room' },
  { label: '과외 등록 시작', external: 'register-tutor' },
];

export const GUIDE_PAGES = {
  'getting-started': {
    title: '처음 이용',
    heroLabel: '처음 방문한 분을 위한 전체 흐름',
    image: '/assets/banners/discover.jpg',
    summary:
      '우동공과는 학부모·학생이 공부방과 과외쌤을 찾고 비교하는 공간이자, 공부방과 과외쌤이 자기 정보를 등록하고 운영하는 공간입니다.',
    lead:
      '처음이라면 찾기 → 찜 → 비교 → 상세 확인 → 쪽지 순서로 이해하면 가장 쉽습니다.',
    steps: [
      {
        title: 'STEP 1. 무엇을 찾을지 먼저 정해보세요',
        body: '공부방을 찾을지, 과외쌤을 찾을지 먼저 정하면 이후 탐색이 훨씬 쉬워집니다.',
      },
      {
        title: 'STEP 2. 조건을 좁혀서 후보를 살펴보세요',
        body: '지역, 과목, 대상 학년, 수업 방식 같은 조건을 기준으로 나에게 맞는 후보를 골라볼 수 있어요.',
      },
      {
        title: 'STEP 3. 마음에 드는 후보는 찜해두세요',
        body: '지금 바로 결정하지 않아도 괜찮아요. 마음에 드는 후보는 찜에 저장해두고 나중에 다시 볼 수 있어요.',
      },
      {
        title: 'STEP 4. 여러 후보는 비교해서 차이를 확인하세요',
        body: '후보가 2~3개쯤 모이면 비교 기능으로 핵심 조건을 나란히 보면서 판단할 수 있어요.',
      },
      {
        title: 'STEP 5. 상세에서 더 자세히 확인하세요',
        body: '리스트만으로 부족하다면 상세에서 소개, 수업 방식, 공개된 신뢰정보를 더 확인해보세요.',
      },
      {
        title: 'STEP 6. 필요하면 로그인 후 쪽지 또는 마이페이지에서 이어가세요',
        body: '충분히 확인했다면 플랫폼 안의 쪽지로 첫 연락을 시작하거나, 마이페이지에서 다시 이어서 볼 수 있어요.',
      },
    ],
    flow: ['처음 방문', '공부방찾기 / 과외쌤찾기 선택', '조건 탐색', '상세 확인', '찜 또는 비교', '로그인 / 회원가입', '쪽지 또는 마이페이지 이어가기'],
    ctas: [
      { label: '공부방 찾기 시작', external: 'search-room' },
      { label: '과외쌤 찾기 시작', external: 'search-tutor' },
      { label: '회원가입하고 이어보기', external: 'signup' },
    ],
    tip: {
      title: '이렇게 보면 더 빠릅니다',
      body: '비교 기능은 후보가 2~3개쯤 모였을 때 가장 유용합니다. 먼저 조건을 좁히고, 상세 확인 뒤 쪽지로 이어가는 흐름으로 보시면 덜 헤매게 됩니다.',
      action: { label: '찜·비교·쪽지 보기', path: '/guide/saved-contact' },
    },
  },
  registration: {
    title: '등록방법',
    heroLabel: '공급자 등록 흐름 안내',
    image: '/assets/banners/trust.jpg',
    summary:
      '가입은 가볍게, 기본등록은 최소로, 상세등록에서 실제 공개용 정보를 완성하고, 그 이후에 공개와 유료를 연결합니다.',
    principles: [
      '공통가입 = 계정 생성용 최소 단계',
      '기본등록 = draft 시작 단계',
      '상세등록 = 실제 공개 정보 본체',
      '공개 = 상세등록 이후',
      '유료 = 추가 입력이 아니라 노출/접근 구매 단계',
    ],
    steps: [
      {
        title: 'STEP 1. 먼저 회원가입을 해주세요',
        body: '회원가입은 계정을 만드는 첫 단계입니다. 기본 정보만 입력하고 가볍게 시작할 수 있어요.',
      },
      {
        title: 'STEP 2. 내 역할을 선택해주세요',
        body: '우동공과에서는 공부방인지, 과외쌤인지에 따라 이후 등록 흐름이 달라집니다.',
      },
      {
        title: 'STEP 3. 기본등록으로 초안을 시작하세요',
        body: '기본등록은 긴 설명을 다 쓰는 단계가 아니라 등록 초안을 만드는 최소 시작 단계입니다.',
      },
      {
        title: 'STEP 4. 상세등록에서 실제 내용을 완성하세요',
        body: '검색, 리스트, 상세 페이지에 실제로 보일 정보는 대부분 상세등록에서 완성합니다.',
      },
      {
        title: 'STEP 5. 공개 가능 상태를 확인하세요',
        body: '기본등록만 끝났다고 바로 공개되는 것은 아닙니다. 상세등록이 충분히 정리되어야 일반 검색과 리스트에 노출될 수 있어요.',
      },
      {
        title: 'STEP 6. 필요하면 유료상품과 연결하세요',
        body: '유료상품은 추가 입력 단계가 아니라 노출 강화나 접근 기능을 연결하는 단계입니다.',
      },
    ],
    flow: ['회원가입', '역할 선택', '기본등록', '상세등록', '공개 가능 상태', '유료 연결'],
    detailGroups: [
      {
        title: '공부방 등록',
        lead: '먼저 공부방의 기본 정보를 가볍게 시작하고, 실제로 노출되는 소개와 운영 정보는 상세등록에서 완성합니다.',
        columns: [
          {
            title: '기본등록에서 하는 일',
            items: ['공부방명 입력', '노출지역 1개 선택', '주력과목 1개 선택'],
          },
          {
            title: '상세등록에서 하는 일',
            items: [
              '대상 학년 / 학교급',
              '수업장소 / 운영형태',
              '대표 가격',
              '짧은 소개문 / 상세 소개문',
              '특징 1~3',
              '시설 정보',
              '연락 가능 시간',
              '이미지 / 링크 / 증빙자료',
            ],
          },
        ],
      },
      {
        title: '과외쌤 등록',
        lead: '활동 지역과 주력과목부터 가볍게 시작해 보세요. 학부모가 판단할 핵심 정보는 상세등록에서 완성됩니다.',
        columns: [
          {
            title: '기본등록에서 하는 일',
            items: ['표시명 입력', '활동 시 1개 선택', '주력과목 1개 선택'],
          },
          {
            title: '상세등록에서 하는 일',
            items: [
              '대상 학생군 / 학년',
              '대표 과외비',
              '학교 / 전공 / 경력',
              '수업 장소 / 수업 방식',
              '짧은 소개문 / 상세 소개문',
              '특징 1~3',
              '증빙자료 / 프로필 이미지',
            ],
          },
        ],
      },
    ],
    faq: [
      '회원가입만 해도 바로 노출되나요?',
      '기본등록과 상세등록의 차이는 무엇인가요?',
      '공부방과 과외 등록 중복이 가능한가요?',
      '공개 전에는 어떤 정보를 먼저 준비해야 하나요?',
      '유료상품은 언제부터 볼 수 있나요?',
    ],
    ctas: [
      { label: '공부방 등록 시작', external: 'register-room' },
      { label: '과외 등록 시작', external: 'register-tutor' },
      { label: '유료상품 보러가기', path: '/plans' },
    ],
    footerNote: [
      '회원가입만으로 자동 공개되지 않으며, 공개 가능한 상태는 상세등록 충족 여부에 따라 달라집니다.',
      '유료상품은 심사나 승인 단계가 아니라 노출·접근 강화 단계입니다.',
    ],
  },
  'saved-contact': {
    title: '찜·비교·쪽지',
    heroLabel: '저장부터 첫 연락까지',
    image: '/assets/banners/compare.jpg',
    summary:
      '찜은 나중에 다시 보기 위한 저장 기능이고, 비교는 여러 후보의 핵심 조건을 나란히 보는 기능이며, 쪽지는 우동공과 안에서 이루어지는 공식 첫 접촉 채널입니다.',
    featureCards: [
      { title: '찜하기', body: '마음에 드는 후보를 저장해 나중에 다시 보고 비교 후보로 이어갈 수 있습니다.' },
      { title: '비교하기', body: '후보가 모였을 때 핵심 조건을 나란히 놓고 차이를 판단할 수 있습니다.' },
      { title: '쪽지하기', body: '전화번호 공개 전 공식 쪽지 채널로 첫 연락을 시작할 수 있습니다.' },
    ],
    conceptTable: [
      ['찜', '후보 저장', '마음에 들지만 바로 결정하지 않을 때'],
      ['비교', '여러 후보를 나란히 판단', '2~3개 후보의 차이를 보고 싶을 때'],
      ['쪽지', '공식 첫 연락', '상세를 본 뒤 실제 접촉이 필요할 때'],
    ],
    steps: [
      {
        title: 'STEP 1. 검색/홈에서 괜찮아 보이는 후보를 발견합니다',
        body: '공부방 또는 과외쌤 후보를 먼저 살펴봅니다.',
      },
      {
        title: 'STEP 2. 괜찮아 보이는 후보는 찜해두세요',
        body: '조금 더 보고 싶은 후보는 찜에 저장해두세요. 나중에 다시 찾기 쉽고, 비교 후보로도 이어가기 편합니다.',
      },
      {
        title: 'STEP 3. 여러 후보를 비교해보세요',
        body: '후보가 여러 개라면 비교 기능으로 핵심 차이를 나란히 볼 수 있어요.',
      },
      {
        title: 'STEP 4. 상세에서 실제 조건을 다시 확인하세요',
        body: '찜이나 비교만으로 결정하기 어렵다면 상세에서 수업 방식, 소개, 공개된 신뢰정보, 접촉 가능 여부를 다시 확인하세요.',
      },
      {
        title: 'STEP 5. 결정이 가까워지면 쪽지 또는 마이페이지에서 이어가세요',
        body: '충분히 확인했다면 쪽지로 첫 연락을 시작하거나, 마이페이지에서 후보를 다시 관리할 수 있어요.',
      },
    ],
    flow: ['검색/홈', '찜 저장', '비교 후보 담기', '상세 확인', '쪽지 또는 마이페이지'],
    note:
      '공급자가 학생 정보를 보는 흐름은 일반 찜·비교와 완전히 같지 않습니다. 학생은 비교 대상이 아니며, 실제 접촉은 권한 상태와 쪽지 가능 여부를 먼저 확인해야 합니다.',
    ctas: [
      { label: '찜 목록 보러가기', path: '/mypage/recent' },
      { label: '공부방 찾기 시작', external: 'search-room' },
      { label: '과외쌤 찾기 시작', external: 'search-tutor' },
    ],
    actionCards: [
      { label: '찜 목록 보러가기', path: '/mypage/recent' },
      { label: '비교 사용법 보기', path: '/guide/saved-contact' },
      { label: '쪽지함 알아보기', path: '/messages' },
      { label: '마이페이지에서 이어보기', path: '/mypage' },
    ],
  },
  safety: {
    title: '안전과외 가이드',
    heroLabel: '플랫폼 보증이 아닌 행동 가이드',
    image: '/assets/banners/support.jpg',
    summary:
      '안전과외는 결제 기능이 아니라 첫 연락과 개인정보 공유 전에 꼭 알아둘 행동 가이드입니다.',
    lead:
      '첫 연락은 쪽지부터 시작하고, 개인정보 공유와 비용 협의는 충분히 확인한 뒤 진행해 주세요.',
    steps: [
      {
        title: 'STEP 1. 공개된 신뢰정보를 먼저 확인하세요',
        body: '소개, 제출자료, 공개된 경력 정보 등 상대가 열어둔 정보를 먼저 차분히 확인해보세요.',
      },
      {
        title: 'STEP 2. 선입금이나 외부 결제 유도는 신중히 보세요',
        body: '비용, 환불 조건, 수업 방식이 충분히 정리되지 않았다면 서둘러 결제하지 않는 것이 좋습니다.',
      },
      {
        title: 'STEP 3. 첫 연락은 플랫폼 쪽지로 시작하세요',
        body: '처음부터 개인 연락처를 바로 주고받기보다 플랫폼 안의 공식 쪽지로 먼저 이야기해보세요.',
      },
      {
        title: 'STEP 4. 개인정보는 꼭 필요한 시점에만 공유하세요',
        body: '전화번호, 주소, 계좌 같은 정보는 충분히 판단한 뒤 필요한 범위에서만 공유하세요.',
      },
      {
        title: 'STEP 5. 이상한 요구가 있다면 바로 멈추고 확인하세요',
        body: '과도한 개인정보 요구, 불쾌한 접촉, 허위 정보가 의심되면 고객센터나 신고 안내를 먼저 확인해 주세요.',
      },
    ],
    flow: ['공개 정보 확인', '쪽지로 첫 연락', '조건 정리', '개인정보 최소 공유', '이상 시 신고 확인'],
    warnings: [
      '우동공과는 대금 보관·전화 중계·분쟁 대리를 제공하지 않습니다.',
      '검증·인증·보증처럼 오해될 수 있는 표현 대신 공개된 신뢰정보를 직접 확인하세요.',
      '안전번호나 플랫폼 대리 통화 없이, 회원 간 공식 첫 접촉은 쪽지입니다.',
    ],
    ctas: [
      { label: '고객센터 가기', path: '/support' },
      { label: '신고/도움 안내 보기', path: '/support/policies/reporting' },
      { label: '쪽지함 알아보기', path: '/messages' },
    ],
    supportCards: [
      {
        title: '고객센터 가기',
        body: '운영 문의나 정책 확인이 필요하면 고객센터에서 FAQ, 공지, 문의를 이어서 확인하세요.',
        action: { label: '고객센터 방문', path: '/support' },
      },
      {
        title: '신고/도움 안내 보기',
        body: '이상한 요구나 허위 정보가 의심되면 신고·제재 기준과 도움 절차를 먼저 확인해 주세요.',
        action: { label: '신고 가이드 보기', path: '/support/policies/reporting' },
      },
      {
        title: '쪽지 이용안내 보기',
        body: '개인정보를 최소 공개하면서 첫 연락을 이어가려면 공식 쪽지 흐름을 먼저 확인하는 편이 좋습니다.',
        action: { label: '쪽지 안내 보기', path: '/guide/saved-contact' },
      },
    ],
  },
};

