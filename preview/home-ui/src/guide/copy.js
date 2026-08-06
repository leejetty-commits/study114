const I = {
  search: '/assets/guide/icons/search.svg',
  filter: '/assets/guide/icons/filter.svg',
  heart: '/assets/guide/icons/heart.svg',
  columns: '/assets/guide/icons/columns.svg',
  userCheck: '/assets/guide/icons/user-check.svg',
  message: '/assets/guide/icons/message.svg',
  userPlus: '/assets/guide/icons/user-plus.svg',
  school: '/assets/guide/icons/school.svg',
  filePen: '/assets/guide/icons/file-pen.svg',
  clipboard: '/assets/guide/icons/clipboard.svg',
  sparkles: '/assets/guide/icons/sparkles.svg',
  rocket: '/assets/guide/icons/rocket.svg',
  shield: '/assets/guide/icons/shield-check.svg',
  wallet: '/assets/guide/icons/wallet.svg',
  messageSafe: '/assets/guide/icons/message-safe.svg',
  alert: '/assets/guide/icons/alert.svg',
  check: '/assets/guide/icons/check.svg',
};

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
    image: '/assets/guide/getting-started/hero.webp',
  },
  {
    id: 'registration',
    title: '등록방법',
    desc: '공부방·과외 등록은 어떻게 시작하고 언제 공개되는지 순서대로 알려드려요.',
    cta: '등록 순서 보기',
    image: '/assets/guide/registration/hero.webp',
  },
  {
    id: 'saved-contact',
    title: '찜·비교·쪽지',
    desc: '후보를 저장하고 비교한 뒤 첫 연락까지 이어가는 방법을 확인해보세요.',
    cta: '판단 흐름 보기',
    image: '/assets/guide/saved-contact/hero.webp',
  },
  {
    id: 'safety',
    title: '안전과외 가이드',
    desc: '첫 연락, 개인정보 공유, 선입금 전 꼭 알아둘 기준을 확인해보세요.',
    cta: '안전 기준 보기',
    image: '/assets/guide/safety/hero.webp',
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
    steps: [
      { label: '공지사항', path: '/support/notice' },
      { label: '자주 묻는 질문', path: '/support/faq' },
      { label: '약관·정책', path: '/support/policies' },
      { label: '자료실', path: '/support/library' },
      { label: '문의', path: '/support/contact' },
    ],
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
  { label: '자주 묻는 질문', path: '/support/faq' },
  { label: '정책 보기', path: '/support/policies' },
  { label: '신고·도움 안내 보기', path: '/support/policies/reporting' },
];

export const GUIDE_HOME_CTA = [
  { label: '공부방 찾기 시작', external: 'search-room' },
  { label: '과외쌤 찾기 시작', external: 'search-tutor' },
  { label: '공부방 등록 시작', external: 'register-room' },
  { label: '과외 등록 시작', external: 'register-tutor' },
];

/** 35-1장 플로우차트 + 단계형 안내 카피 · 비질리 아이콘 연결 */
export const GUIDE_PAGES = {
  'getting-started': {
    title: '처음 이용',
    heroLabel: '처음 방문한 분을 위한 전체 흐름',
    image: '/assets/guide/getting-started/hero.webp',
    summary:
      '우동공과는 학부모·학생이 공부방과 과외쌤을 찾고 비교하는 공간이자, 공부방과 과외쌤이 자기 정보를 등록하고 운영하는 공간입니다.',
    lead: '처음이라면 찾기 → 찜 → 비교 → 상세 확인 → 쪽지 순서로 이해하면 가장 쉽습니다.',
    flowLead: '먼저 전체 흐름을 차트로 보고, 아래 단계별 설명에서 더 상세히 확인할 수 있습니다.',
    flow: [
      { label: '처음 방문', caption: '서비스 구조를 가볍게 파악', icon: I.search },
      { label: '찾기 선택', caption: '공부방찾기 / 과외쌤찾기', icon: I.school },
      { label: '조건 탐색', caption: '지역·과목·학년으로 좁히기', icon: I.filter },
      { label: '상세 확인', caption: '소개·수업·공개 신뢰정보', icon: I.userCheck },
      { label: '찜 또는 비교', caption: '저장하고 나란히 판단', icon: I.heart },
      { label: '로그인 / 가입', caption: '개인 기능으로 이어가기', icon: I.userPlus },
      { label: '쪽지·마이페이지', caption: '첫 연락 또는 다시 보기', icon: I.message },
    ],
    steps: [
      {
        title: '무엇을 찾을지 먼저 정해보세요',
        body: '공부방을 찾을지, 과외쌤을 찾을지 먼저 정하면 이후 탐색이 훨씬 쉬워집니다.',
        icon: I.search,
      },
      {
        title: '조건을 좁혀서 후보를 살펴보세요',
        body: '지역, 과목, 대상 학년, 수업 방식 같은 조건을 기준으로 나에게 맞는 후보를 골라볼 수 있어요.',
        icon: I.filter,
      },
      {
        title: '마음에 드는 후보는 찜해두세요',
        body: '지금 바로 결정하지 않아도 괜찮아요. 마음에 드는 후보는 찜에 저장해두고 나중에 다시 볼 수 있어요.',
        icon: I.heart,
      },
      {
        title: '여러 후보는 비교해서 차이를 확인하세요',
        body: '후보가 2~3개쯤 모이면 비교 기능으로 핵심 조건을 나란히 보면서 판단할 수 있어요.',
        icon: I.columns,
      },
      {
        title: '상세에서 더 자세히 확인하세요',
        body: '리스트만으로 부족하다면 상세에서 소개, 수업 방식, 공개된 신뢰정보를 더 확인해보세요.',
        icon: I.userCheck,
      },
      {
        title: '필요하면 로그인 후 쪽지 또는 마이페이지에서 이어가세요',
        body: '충분히 확인했다면 플랫폼 안의 쪽지로 첫 연락을 시작하거나, 마이페이지에서 다시 이어서 볼 수 있어요.',
        icon: I.message,
      },
    ],
    ctas: [
      { label: '공부방 찾기 시작', external: 'search-room' },
      { label: '과외쌤 찾기 시작', external: 'search-tutor' },
      { label: '회원가입하고 이어보기', external: 'signup' },
    ],
    tip: {
      title: '이렇게 보면 더 빠릅니다',
      body: '비교 기능은 후보가 2~3개쯤 모였을 때 가장 유용합니다. 먼저 조건을 좁히고, 상세 확인 뒤 쪽지로 이어가면 훨씬 더 정확합니다.',
      action: { label: '찜·비교·쪽지 보기', path: '/guide/saved-contact' },
    },
  },
  registration: {
    title: '등록방법',
    heroLabel: '공급자 등록 흐름 안내',
    image: '/assets/guide/registration/hero.webp',
    summary:
      '가입은 가볍게, 기본등록은 최소로, 상세등록에서 실제 공개용 정보를 완성하고, 그 이후에 공개와 유료를 연결합니다.',
    principles: [
      '공통가입 = 계정 생성용 최소 단계',
      '기본등록 = 초안 시작 단계',
      '상세등록 = 상세한 실제 공개 정보 입력',
      '공개 = 상세등록 이후',
      '유료 = 추가 입력이 아니라 홍보·광고를 위한 구매 단계',
    ],
    flowLead: '먼저 전체 흐름을 차트로 보고, 아래 단계별 설명에서 더 자세히 확인할 수 있습니다.',
    flow: [
      { label: '회원가입', caption: '계정만 가볍게 만들기', icon: I.userPlus },
      { label: '역할 선택', caption: '공부방 또는 과외쌤', icon: I.school },
      { label: '기본등록', caption: '초안을 최소로 시작', icon: I.filePen },
      { label: '상세등록', caption: '공개용 상세정보 입력 완성', icon: I.clipboard },
      { label: '공개 가능 상태', caption: '검색·리스트 노출 준비', icon: I.sparkles },
      { label: '검색/리스트 노출', caption: '일반 탐색에 보이기', icon: I.search },
      { label: '유료 연결(선택)', caption: '광고·홍보 노출 강화', icon: I.rocket },
    ],
    steps: [
      {
        title: '먼저 회원가입을 해주세요',
        body: '회원가입은 계정을 만드는 첫 단계입니다. 기본 정보만 입력하고 가볍게 시작할 수 있어요.',
        icon: I.userPlus,
      },
      {
        title: '내 역할을 선택해주세요',
        body: '우동공과에서는 공부방인지, 과외쌤인지에 따라 이후 등록 흐름이 달라집니다.',
        icon: I.school,
      },
      {
        title: '기본등록으로 초안을 시작하세요',
        body: '기본등록은 긴 설명을 다 쓰는 단계가 아니라 등록 초안을 만드는 최소 시작 단계입니다.',
        icon: I.filePen,
      },
      {
        title: '상세등록에서 실제 내용을 완성하세요',
        body: '검색, 리스트, 상세 페이지에 실제로 보일 정보는 대부분 상세등록에서 완성합니다.',
        icon: I.clipboard,
      },
      {
        title: '공개 가능 상태를 확인하세요',
        body: '기본등록만 끝났다고 바로 공개되는 것은 아닙니다. 상세등록이 충분히 정리되어야 일반 검색과 리스트에 노출될 수 있어요.',
        icon: I.sparkles,
      },
      {
        title: '필요하면 유료상품과 연결하세요',
        body: '유료상품은 추가 입력 단계가 아니라 광고·홍보 노출 강화 단계입니다.',
        icon: I.rocket,
      },
    ],
    detailGroups: [
      {
        title: '공부방 등록',
        image: '/assets/guide/registration/room.webp',
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
        image: '/assets/guide/registration/tutor.webp',
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
      {
        q: '회원가입만 해도 바로 노출되나요?',
        a: `아니요.
회원가입만 했다고 바로 검색이나 리스트에 노출되지는 않아요.
우동공과의 등록 흐름은
회원가입 → 기본등록 → 상세등록 → 공개 가능 상태 확인 → 노출 순서로 이해하시면 가장 쉬워요.

회원가입은 말 그대로 계정을 만드는 첫 단계예요.
그 다음에 내 역할에 맞게 기본등록을 시작하고,
실제로 공개에 필요한 정보는 상세등록에서 채우게 됩니다.

즉,
회원가입만 완료한 상태 = 아직 등록 시작 전
기본등록만 완료한 상태 = 초안(draft) 상태
상세등록까지 정리된 상태 = 일반 검색/리스트 노출 검토 가능 상태
라고 보시면 돼요.

쉽게 말하면,
회원가입은 입장,
기본등록은 등록 시작,
상세등록은 실제 공개 준비 완료에 가깝습니다.`,
      },
      {
        q: '기본등록과 상세등록의 차이는 무엇인가요?',
        a: `가장 쉽게 말하면:
기본등록은 가볍게 시작하는 단계
상세등록은 실제로 공개될 내용을 완성하는 단계
입니다.

기본등록에서는 너무 많은 정보를 한 번에 받지 않아요.
등록을 포기하지 않도록, 정말 최소한의 시작 정보만 먼저 입력하게 되어 있어요.

예를 들면:
공부방: 공부방명, 노출지역 1개, 주력과목 1개
과외쌤: 표시명, 활동 지역 1개, 주력과목 1개
정도부터 시작하는 흐름이에요.

반면 상세등록은
학부모나 학생이 실제로 보고 판단하는 정보들을 채우는 단계예요.
예를 들면 소개문, 가격, 수업 방식, 대상 학년, 이미지, 증빙자료, 연락 가능 시간 같은 것들이 여기에 들어갑니다.

한 줄로 정리하면:
기본등록은 “일단 초안 만들기”,
상세등록은 “실제로 보여줄 정보 완성하기”예요.`,
      },
      {
        q: '공부방과 과외 등록 중복이 가능한가요?',
        a: `네, 가능합니다.
우동공과는 한 계정이 복수 역할을 가질 수 있는 구조를 열어두고 있어요.

즉 한 계정으로
공부방 등록도 하고
과외 등록도 이어서 할 수 있는 방향이에요.

다만 처음 시작할 때는 보통
한 번에 한 역할 기준으로 먼저 진입하는 흐름으로 이해하시면 됩니다.

예를 들어:
처음에는 공부방으로 먼저 등록 시작
나중에 같은 계정에서 과외 등록 추가
또는 반대로 과외 등록 후 공부방 등록 추가
처럼 운영할 수 있는 쪽이 자연스러워요.

사용자 입장에서는
“계정은 하나인데, 활동 역할은 나중에 더 넓힐 수 있다”
정도로 이해하면 가장 편합니다.`,
      },
      {
        q: '공개 전에는 어떤 정보를 먼저 준비해야 하나요?',
        a: `공개 전에는 복잡하게 생각하지 마시고,
“상대가 보고 판단할 수 있는 기본 정보”를 먼저 준비한다고 생각하시면 돼요.
공통적으로는 아래 5가지를 먼저 준비해두면 좋아요.

어디에서 활동하는지
지역, 노출 지역, 활동 지역 같은 기본 위치 정보
무엇을 가르치는지
과목, 대상 학년, 수업 대상
어떤 방식으로 진행하는지
수업 형태, 장소, 운영 방식
얼마 정도인지
대표 가격 또는 과외비, 가격 설명
왜 믿고 볼 수 있는지
소개문, 이미지, 경력/학력/증빙, 연락 가능 시간 등

조금 더 나눠서 보면:

공부방 등록 전 준비하면 좋은 것
공부방명
노출 지역
주력 과목
대상 학년
수업 장소/운영 형태
대표 가격
짧은 소개문
사진
필요하면 교육청 등록 여부나 증빙자료

과외 등록 전 준비하면 좋은 것
표시명
활동 지역
주력 과목
대상 학생군/학년
대표 과외비
학교/전공/경력
수업 방식과 장소
짧은 소개문
프로필 이미지나 증빙자료

너무 완벽하게 준비한 뒤 시작하려고 하지 않아도 괜찮아요.
우동공과의 흐름은 처음엔 가볍게 시작하고, 상세등록에서 점점 보완하는 구조에 더 가깝습니다.`,
      },
      {
        q: '유료상품은 언제부터 볼 수 있나요?',
        a: `유료상품은
등록 내용을 다 입력하는 단계가 아니라, 공개 이후에 노출이나 접근을 더 강화하는 단계예요.

즉 순서상으로는 보통:
회원가입 → 기본등록 → 상세등록 → 일반 공개/노출 → 필요 시 유료상품 연결
이 흐름으로 이해하시면 됩니다.

중요한 점은,
유료상품이 있다고 해서 거기서 다시 긴 정보를 새로 입력하는 것은 아니라는 것이에요.
입력은 상세등록에서 대부분 끝내고,
유료상품에서는 그다음 노출 강화나 접근 기능을 선택하는 구조에 가깝습니다.

쉽게 말하면:
상세등록 전: 아직 상품보다 등록 정리가 먼저
상세등록 후: 일반 공개 준비 완료
그다음: 더 잘 보이게 하거나, 더 적극적으로 운영하고 싶을 때 유료상품 검토

그래서 처음 등록하는 분이라면
유료상품부터 보기보다, 먼저 기본등록과 상세등록을 차근차근 끝내는 것이 더 중요해요.`,
      },
    ],
    ctas: [
      { label: '공부방 등록 시작', external: 'register-room' },
      { label: '과외 등록 시작', external: 'register-tutor' },
      { label: '유료상품 보러가기', path: '/plans' },
    ],
    footerNote: [
      '회원가입만으로 자동 공개되지 않으며, 공개 가능한 상태는 상세등록 충족 여부에 따라 달라집니다.',
      '유료상품은 광고·홍보를 위한 강화 단계입니다. 우동공과는 심사나 승인의 단계가 일체 없습니다.',
    ],
  },
  'saved-contact': {
    title: '찜·비교·쪽지',
    heroLabel: '저장부터 첫 연락까지',
    image: '/assets/guide/saved-contact/hero.webp',
    summary:
      '찜은 나중에 다시 보기 위한 저장 기능이고, 비교는 여러 후보의 핵심 조건을 나란히 보는 기능이며, 쪽지는 우동공과 안에서 이루어지는 공부방·과외쌤과 학생 간의 접촉 채널입니다. 우동공과에서는 이메일이나 연락처를 입력받는 시스템이 없습니다.',
    featureCards: [
      {
        title: '찜하기',
        body: '마음에 드는 후보를 저장해 나중에 다시 보고 비교 후보로 이어갈 수 있습니다.',
        icon: I.heart,
      },
      {
        title: '비교하기',
        body: '후보가 모였을 때 핵심 조건을 나란히 놓고 차이를 판단할 수 있습니다.',
        icon: I.columns,
      },
      {
        title: '쪽지하기',
        body: '학생과 접촉할 수 있는 유일한 채널입니다. 개인정보·이메일·연락처 등의 노출에 주의를 기울여 주세요.',
        icon: I.message,
      },
    ],
    conceptTable: [
      ['찜', '후보 저장', '마음에 들지만 바로 결정하지 않을 때'],
      ['비교', '여러 후보를 나란히 판단', '2~3개 후보의 차이를 보고 싶을 때'],
      ['쪽지', '공식 첫 연락', '상세등록 정보를 본 뒤 실제 접촉이 필요할 때'],
    ],
    flow: [
      { label: '검색/홈', caption: '괜찮아 보이는 후보 발견', icon: I.search },
      { label: '찜 저장', caption: '나중에 다시 보기', icon: I.heart },
      { label: '비교 후보 담기', caption: '2~3개 차이 확인', icon: I.columns },
      { label: '상세 확인', caption: '조건·신뢰정보 재확인', icon: I.userCheck },
      { label: '쪽지', caption: '첫 연락으로 이어가기', icon: I.message },
    ],
    steps: [
      {
        title: '검색/홈에서 괜찮아 보이는 후보를 발견합니다',
        body: '공부방 또는 과외쌤 후보를 먼저 살펴봅니다.',
        icon: I.search,
      },
      {
        title: '괜찮아 보이는 후보는 찜해두세요',
        body: '조금 더 보고 싶은 후보는 찜에 저장해두세요. 나중에 다시 찾기 쉽고, 비교 후보로도 이어가기 편합니다.',
        icon: I.heart,
      },
      {
        title: '여러 후보를 비교해보세요',
        body: '후보가 여러 개라면 비교 기능으로 핵심 차이를 나란히 볼 수 있어요.',
        icon: I.columns,
      },
      {
        title: '상세에서 실제 조건을 다시 확인하세요',
        body: '찜이나 비교만으로 결정하기 어렵다면 상세에서 수업 방식, 소개, 공개된 신뢰정보, 접촉 가능 여부를 다시 확인하세요.',
        icon: I.userCheck,
      },
      {
        title: '결정이 가까워지면 쪽지로 첫 연락을 이어가세요',
        body: '충분히 확인했다면 쪽지로 첫 연락을 시작하고, 이후 관리는 마이페이지에서 이어갈 수 있어요.',
        icon: I.message,
      },
    ],
    compareGuide: {
      title: '비교 사용법',
      lead:
        '비교는 마음에 드는 후보를 여러 개 본 뒤, 핵심 조건을 나란히 보면서 더 쉽게 판단하는 기능이에요. 많이 담아두는 기능이 아니라, 2~3개 후보를 좁혀서 마지막 판단을 돕는 기능으로 이해하시면 가장 쉬워요.',
      blocks: [
        {
          title: '비교는 언제 쓰면 좋나요?',
          body: `이런 때 비교를 쓰면 좋아요.
· 공부방이나 과외쌤 후보를 몇 개 봤는데 비슷해 보여서 헷갈릴 때
· 찜해둔 후보 중에서 어디가 더 나와 맞는지 정리하고 싶을 때
· 바로 연락하기 전에 조건 차이를 한 번 더 확인하고 싶을 때

즉, “좋아 보이는 후보는 있는데 아직 결정은 안 됐다” 싶을 때 비교가 가장 유용해요.`,
        },
        {
          title: '비교는 무엇을 비교하는 기능인가요?',
          body: `비교는 후보를 나란히 놓고 핵심 정보를 한 번에 보는 기능이에요.
예를 들면 지역, 과목, 대상 학년, 수업 방식, 가격대, 소개문 분위기, 공개된 신뢰 정보를 한 화면에서 정리해 볼 수 있어요.

하나씩 상세 페이지를 왔다 갔다 하지 않고, 중요한 차이를 한 화면에서 정리해보는 용도라고 생각하시면 됩니다.`,
        },
        {
          title: '무엇을 비교할 수 있나요?',
          body: `비교는 공부방과 과외쌤을 대상으로 써요. 학생은 비교 대상이 아니에요.

즉:
· 공부방 후보끼리 비교
· 과외쌤 후보끼리 비교
는 가능하지만, 학생을 찜하거나 비교하는 방식으로 쓰지는 않아요.`,
        },
        {
          title: '몇 개까지 담을 수 있나요?',
          body: `비교 후보는 최대 3개까지 담는 구조가 적절해요.
비교 후보가 너무 많아지면 오히려 판단이 더 어려워지기 때문이에요.

그래서 비교는 많이 모으는 기능이 아니라, 후보를 2~3개로 줄인 뒤 마지막 판단을 돕는 기능에 가깝습니다.`,
        },
        {
          title: '비교는 어떻게 시작하나요?',
          body: `보통은 이렇게 쓰면 가장 쉬워요.
1. 홈이나 검색에서 괜찮아 보이는 후보를 찾습니다.
2. 마음에 드는 후보는 먼저 찜해둡니다.
3. 그중 비교해보고 싶은 후보를 2~3개 고릅니다.
4. 비교 화면에서 핵심 조건을 나란히 확인합니다.
5. 더 끌리는 후보는 상세 페이지로 다시 들어가 봅니다.
6. 결정이 가까워지면 쪽지로 첫 연락을 시작합니다.

즉 흐름은 찾기 → 찜 → 비교 → 상세 확인 → 쪽지 로 이해하시면 됩니다.`,
        },
        {
          title: '비교를 잘 쓰는 팁',
          body: `· 처음부터 너무 많은 후보를 담지 않기
· “가격만” 보지 않고 지역, 방식, 분위기도 함께 보기
· 비교 후에는 꼭 상세 페이지에서 한 번 더 확인하기
· 비교는 결정 보조도구이지, 최종 판단을 대신하는 기능은 아니라는 점 기억하기

특히 후보가 많아질수록 비교보다 먼저 찜 목록에서 한 번 정리한 뒤 들어가는 편이 좋아요.`,
        },
        {
          title: '비교만으로 바로 연락해도 되나요?',
          body: `비교는 판단을 도와주는 단계예요.
실제 연락 전에는 상세에서 소개, 수업 방식, 공개된 정보, 내게 중요한 조건을 다시 확인해보는 것이 좋아요.
그 다음에 마음이 정리되면 쪽지로 첫 연락을 시작하면 됩니다.

한 줄로 정리하면: 찜은 저장, 비교는 판단, 쪽지는 첫 연락이에요.`,
        },
      ],
    },
    note:
      '찜·비교는 공부방·과외쌤 후보를 저장하고 판단하는 기능입니다. 학생은 찜·비교 대상이 아니며, 공부방·과외쌤이 학생 요청을 다시 볼 때는 별도 ‘학생 검토함’으로 이어집니다.',
    ctas: [
      { label: '찜 목록 보기', path: '/mypage/wishlist' },
      { label: '쪽지함 보기', path: '/mypage/messages' },
      { label: '마이페이지 홈 가기', path: '/mypage' },
    ],
    actionCards: [
      { label: '찜 목록 보기', path: '/mypage/wishlist', hint: '저장해 둔 공부방·과외쌤 후보' },
      { label: '쪽지함 보기', path: '/mypage/messages', hint: '첫 연락과 이어가는 대화' },
      { label: '마이페이지 홈 가기', path: '/mypage', hint: '찜·쪽지·활동을 한곳에서' },
    ],
  },
  safety: {
    title: '안전과외 가이드',
    heroLabel: '플랫폼 보증이 아닌 행동 가이드',
    image: '/assets/guide/safety/hero.webp',
    summary: '안전과외는 결제 기능이 아니라 첫 연락과 개인정보 공유 전에 꼭 알아둘 행동 가이드입니다.',
    lead: '첫 연락은 쪽지부터 시작하고, 개인정보 공유와 비용 협의는 충분히 확인한 뒤 진행해 주세요.',
    flow: [
      { label: '공개 정보 확인', caption: '제출자료·소개를 직접 비교', icon: I.shield },
      { label: '쪽지로 첫 연락', caption: '공식 접촉 채널부터', icon: I.messageSafe },
      { label: '조건 정리', caption: '비용·환불·수업 방식', icon: I.wallet },
      { label: '개인정보 최소 공유', caption: '필요한 시점에만', icon: I.check },
      { label: '이상 시 신고 확인', caption: '멈추고 고객센터·신고', icon: I.alert },
    ],
    steps: [
      {
        title: '공개된 신뢰정보를 먼저 확인하세요',
        body: '소개, 제출자료, 공개된 경력 정보 등 상대가 열어둔 정보를 먼저 차분히 확인해보세요.',
        icon: I.shield,
      },
      {
        title: '선입금이나 외부 결제 유도는 신중히 보세요',
        body: '비용, 환불 조건, 수업 방식이 충분히 정리되지 않았다면 서둘러 결제하지 않는 것이 좋습니다.',
        icon: I.wallet,
      },
      {
        title: '첫 연락은 플랫폼 쪽지로 시작하세요',
        body: '처음부터 개인 연락처를 바로 주고받기보다 플랫폼 안의 공식 쪽지로 먼저 이야기해보세요.',
        icon: I.messageSafe,
      },
      {
        title: '개인정보는 꼭 필요한 시점에만 공유하세요',
        body: '전화번호, 주소, 계좌 같은 정보는 충분히 판단한 뒤 필요한 범위에서만 공유하세요.',
        icon: I.check,
      },
      {
        title: '이상한 요구가 있다면 바로 멈추고 확인하세요',
        body: '과도한 개인정보 요구, 불쾌한 접촉, 허위 정보가 의심되면 고객센터나 신고 안내를 먼저 확인해 주세요.',
        icon: I.alert,
      },
    ],
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
