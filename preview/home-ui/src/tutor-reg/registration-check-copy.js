/**
 * 과외쌤 등록점검(P21-04) copy — 공부방 RC 공통 프레임 이식
 * 공부방 registration-check-copy 와 파일을 섞지 않는다.
 */

export const TRC_COPY = {
  title: '등록점검',
  lead: '입력한 정보를 한눈에 확인하고, 비어 있는 항목을 빠르게 채워 보세요',
  badges: {
    basicReg: '기본정보 등록',
    basicDone: '등록완료',
    pickNeed: (n) => `픽 홍보 노출을 위해 ${n}개 더 입력해 주세요`,
    primeNeed: (n) => `프라임 홍보 노출을 위해 ${n}개 더 입력해 주세요`,
    pickReady: '픽 홍보 노출 준비됨',
    primeReady: '프라임 홍보 노출 준비됨',
    progress: '전체 입력 상태',
  },
  promo: {
    title: '홍보광고를 위하여 픽 · 프라임 노출을 고민 중이신가요?',
    lines: [
      '베이직 검색은 기본정보만으로도 가능합니다.',
      '더 잘 보이게 하려면 아래 항목을 추가로 채워 주세요.',
      '필요한 정보는 기본정보·상세정보에서 바로 보완할 수 있어요.',
    ],
    pickMissingTitle: '[픽] 노출을 위해 추가 입력해야 할 항목',
    primeMissingTitle: '[프라임] 노출을 위해 추가 입력해야 할 항목',
    gotoField: '입력하러 가기',
    pickReadyBody: '픽 노출에 필요한 항목이 채워져 있습니다.',
    primeReadyBody: '프라임 노출에 필요한 항목이 채워져 있습니다.',
    cardsTitle: 'Basic/Pick/Prime 이렇게 달라집니다',
    cardsLead:
      '1행은 지금 내 Basic(현재 기준)입니다. 2행 Pick · Prime은 업그레이드 후 학부모에게 보이는 노출 차이입니다. 카드를 누르면 확대카드가 열립니다.',
    basicKicker: '내 현재 BASIC',
    pickKicker: 'PICK',
    primeKicker: 'PRIME',
  },
  board: {
    title: '전체 프로필 현황',
    lead: '값이 비어 있으면 — 으로 표시됩니다. 기본정보는 바로 보이고, 상세정보1·2는 접어서 요약만 볼 수 있습니다.',
    sections: {
      basic: '기본정보',
      detail: '상세정보1',
      detail2: '상세정보2',
    },
    cols: {
      item: '항목',
      value: '현재값',
      status: '상태',
      note: '비고',
    },
    required: '필수',
    editAria: (title) => `${title} 수정`,
  },
  status: {
    filled: 'O',
    empty: '미입력됨',
  },
  publish: {
    confirmTitle: '자기확인 — 학부모에게 이렇게 보입니다',
    confirmRegion: '활동 지역·과목·대상 학생군 노출을 확인했습니다',
    confirmFee: '과외비·수업 방식 표시를 확인했습니다',
    confirmTrust: '소개문·신뢰정보(공개 선택 범위) 노출을 확인했습니다',
    publishCta: '공개하기 (published)',
    republishCta: '다시 공개',
  },
};

/** Pick 핵심 */
export const TRC_PICK_FIELD_IDS = [
  'display_name',
  'main_subject',
  'primary_region',
  'profile_image',
  'intro_short',
  'fee',
  'lesson_places',
  'feature_1',
];

/** Prime 핵심 — Pick + 보강 */
export const TRC_PRIME_FIELD_IDS = [
  ...TRC_PICK_FIELD_IDS,
  'intro_long',
  'teaching_style',
  'student_target',
  'university',
  'detail_complete',
  'education_doc',
];

export const TRC_REQUIRED_FIELD_IDS = [...new Set([...TRC_PICK_FIELD_IDS, ...TRC_PRIME_FIELD_IDS])];

export const TRC_PROMO_MISSING_DEFS = [
  { id: 'display_name', label: '표시명', hint: '검색·카드에 바로 보입니다', section: 'basic' },
  { id: 'main_subject', label: '주력과목', hint: '과외 매칭의 첫 조건입니다', section: 'basic' },
  { id: 'primary_region', label: '대표 활동 시', hint: '지역 검색 노출에 필요합니다', section: 'basic' },
  { id: 'profile_image', label: '프로필 사진', hint: '첫 인상과 카드 신뢰에 중요합니다', section: 'detail' },
  { id: 'intro_short', label: '한 줄 소개', hint: '카드 상단에 쓰입니다', section: 'detail' },
  { id: 'intro_long', label: '상세 소개', hint: '상세 페이지에서 과외를 설명합니다', section: 'detail' },
  { id: 'fee', label: '과외비', hint: '검색 카드 가격대에 쓰입니다', section: 'detail' },
  { id: 'lesson_places', label: '강의장소', hint: '방문·공공장소 등 수업 방식을 보여 줍니다', section: 'detail' },
  { id: 'feature_1', label: '경력특징 1', hint: '카드 강조 한 줄입니다', section: 'detail2' },
  { id: 'teaching_style', label: '강의스타일', hint: '수업 결을 한눈에 보여 줍니다', section: 'detail' },
  { id: 'student_target', label: '학생구성', hint: '성별·인원 구성을 보여 줍니다', section: 'detail' },
  { id: 'university', label: '학교·학과', hint: '신뢰 정보로 쓰입니다', section: 'detail2' },
  { id: 'detail_complete', label: '상세등록 완료', hint: '프라임·추천 노출 신청 조건입니다', section: 'detail' },
  { id: 'education_doc', label: '학력 제출자료', hint: '제출·공개 선택으로 신뢰를 높입니다', section: 'detail2' },
];
