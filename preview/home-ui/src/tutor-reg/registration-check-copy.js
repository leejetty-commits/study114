/**
 * 과외쌤 등록점검(P21-04) copy
 * Pick/Prime 차등 안내는 여기만. 입력 화면 배지와 섞지 않는다.
 */

export const TRC_COPY = {
  title: '등록점검',
  lead: '공개 가능 여부와 픽·프라임에 더 필요한 항목을 한 화면에서 확인합니다',
  badges: {
    publishOk: '공개 가능',
    publishLive: '공개중',
    publishHidden: '숨김 · 다시 공개 가능',
    publishNeed: '아직 공개 불가',
    basicOk: 'Basic 충족',
    basicNeed: (n) => `Basic ${n}개 부족`,
    pickOk: 'Pick 추가 충족',
    pickNeed: (n) => `Pick 추가 ${n}개`,
    primeOk: 'Prime 추가 충족',
    primeNeed: (n) => `Prime 추가 ${n}개`,
  },
  next: {
    prefix: '다음',
    publish: '자기확인 후 공개하기',
    live: '공개 유지 중 · 현황만 확인하면 됩니다',
    hidden: '자기확인 후 다시 공개하기',
    fill: (label) => `${label} 입력하러 가기`,
  },
  promo: {
    title: '공개와 픽·프라임은 단계가 다릅니다',
    lines: [
      '베이직 검색 노출은 공개 조건을 채운 뒤 공개하면 가능합니다.',
      '픽·프라임은 그 위에 카드 정보량·신뢰를 더하는 추가 입력입니다.',
    ],
    pickMissingTitle: '[픽] 추가 입력',
    primeMissingTitle: '[프라임] 추가 입력',
    gotoField: '입력하러 가기',
    pickReadyBody: '픽에 필요한 추가 항목이 채워져 있습니다.',
    primeReadyBody: '프라임에 필요한 추가 항목이 채워져 있습니다.',
    cardsTitle: 'Basic/Pick/Prime 이렇게 달라집니다',
    cardsLead:
      '샘플은 홈 실제 카드와 같은 크기·구성입니다. 1행은 베이직 목록 카드, 2행은 픽·프라임 유료 노출 카드입니다. 확대카드 보기로 상세를 엽니다.',
    basicKicker: '내 현재 BASIC',
    pickKicker: 'PICK',
    primeKicker: 'PRIME',
    expandCard: '확대카드 보기',
  },
  board: {
    title: '전체 프로필 현황',
    lead: '기본정보와 상세정보는 같은 수준의 구역입니다. 상세정보 안은 입력 화면과 같이 수업 · 가격 / 학력 · 소개 · 연락으로 나뉩니다.',
    sections: {
      basic: '기본정보',
      detail: '상세정보',
      detail1: '수업 · 가격',
      detail2: '학력 · 소개 · 연락',
    },
    cols: {
      item: '항목',
      value: '현재값',
      status: '상태',
      note: '비고',
    },
    required: '필수',
    allRequiredOk: '모든 필수 항목 입력 완료',
    missPrefix: '부족',
    filledLine: (filled, total, missing) => `완료 ${filled}/${total} · 부족 ${missing}`,
    foldOpen: '펼치기',
    foldClose: '접기',
    editAria: (title) => `${title} 수정`,
  },
  status: {
    filled: 'O',
    empty: '미입력됨',
  },
  publish: {
    summaryReady: '공개 조건이 충족되었습니다. 아래를 확인한 뒤 공개하세요.',
    summaryNeed: (n) => `공개하려면 아직 ${n}개 항목이 부족합니다. 위에서 수정 위치를 확인하세요.`,
    summaryLive: '현재 공개 중입니다. 내용을 바꿨다면 다시 한 번 확인해 주세요.',
    summaryHidden: '지금은 숨김입니다. 조건을 확인한 뒤 다시 공개할 수 있습니다.',
    confirmTitle: '공개 전 자기확인',
    confirmLead: '학부모 화면에 이렇게 보이는지 직접 확인하고 공개합니다.',
    confirmRegion: '활동 지역·과목·대상 학생군 노출을 확인했습니다',
    confirmFee: '과외비·수업 방식 표시를 확인했습니다',
    confirmTrust: '소개문·신뢰정보(공개 선택 범위) 노출을 확인했습니다',
    publishCta: '공개하기',
    republishCta: '다시 공개',
  },
  returnBanner: {
    label: '← 등록점검으로 돌아가기',
    hint: '수정이 끝나면 등록점검에서 다시 확인할 수 있습니다.',
  },
};

/** Basic 공개·검색 게이트 — getPublishReadiness + expanded_complete 필드를 항목명으로 풀어 쓴다 */
export const TRC_BASIC_FIELD_IDS = [
  'display_name',
  'main_subject',
  'primary_region',
  'lesson_places',
  'fee',
  'fee_basis',
  'schedule',
  'minutes',
  'intro',
  'university',
  'profile_image',
];

/** Pick 추가 — Basic 공개 외에 픽 카드에 더 필요한 입력 */
export const TRC_PICK_FIELD_IDS = ['feature_1', 'student_target'];

/** Prime 추가 — Pick/Basic 외에 프라임 카드에 더 필요한 입력 */
export const TRC_PRIME_FIELD_IDS = ['intro_long', 'feature_2', 'feature_3'];

export const TRC_REQUIRED_FIELD_IDS = [
  ...new Set([...TRC_BASIC_FIELD_IDS, ...TRC_PICK_FIELD_IDS, ...TRC_PRIME_FIELD_IDS]),
];

/**
 * 상세정보 탭 실제 입력 항목 = 등록점검 보드 행.
 * 상세정보1 = 수업 · 가격, 상세정보2 = 학력 · 소개 · 연락.
 */
export const TRC_BOARD_BASIC_FIELDS = [
  { id: 'display_name', label: '표시명', required: true },
  { id: 'main_subject', label: '주력과목', required: true },
  { id: 'primary_region', label: '과외지역', required: true },
];

export const TRC_BOARD_DETAIL1_FIELDS = [
  { id: 'fee', label: '월 과외비', required: true },
  { id: 'fee_basis', label: '산정방식', required: true },
  { id: 'lessons_per_week', label: '주 횟수', required: true },
  { id: 'monthly_session_count', label: '월 총 횟수', required: false },
  { id: 'minutes', label: '1회(분)', required: true },
  { id: 'student_gender_group', label: '지도 대상 성별', required: true },
  { id: 'student_count_group', label: '수업인원', required: true },
  { id: 'lesson_places', label: '강의장소', required: true },
  { id: 'fee_description', label: '가격 설명', required: false },
];

export const TRC_BOARD_DETAIL2_FIELDS = [
  { id: 'university_name', label: '출신대학', required: true },
  { id: 'major_name', label: '전공', required: false },
  { id: 'university_status', label: '학적상태', required: false },
  { id: 'feature_1', label: '특징 1', required: true },
  { id: 'feature_2', label: '특징 2', required: false },
  { id: 'feature_3', label: '특징 3', required: false },
  { id: 'intro_short', label: '짧은 소개', required: true },
  { id: 'profile_image', label: '프로필 사진', required: true },
  { id: 'intro_long', label: '상세 소개', required: true },
  { id: 'contact_time_note', label: '연락 가능 시간', required: false },
];

export const TRC_BOARD_REQUIRED_IDS = new Set(
  [...TRC_BOARD_BASIC_FIELDS, ...TRC_BOARD_DETAIL1_FIELDS, ...TRC_BOARD_DETAIL2_FIELDS]
    .filter((f) => f.required)
    .map((f) => f.id),
);

export const TRC_PROMO_MISSING_DEFS = [
  { id: 'display_name', label: '표시명', hint: '검색·카드에 바로 보입니다', section: 'basic' },
  { id: 'main_subject', label: '주력과목', hint: '과외 매칭의 첫 조건입니다', section: 'basic' },
  { id: 'primary_region', label: '대표 활동 시', hint: '지역 검색 노출에 필요합니다', section: 'basic' },
  { id: 'lesson_places', label: '강의장소', hint: '방문·공공장소 등 수업 방식을 보여 줍니다', section: 'detail' },
  { id: 'fee', label: '과외비', hint: '검색 카드 가격대에 쓰입니다', section: 'detail' },
  { id: 'fee_basis', label: '과외비 산정방식', hint: '주 횟수 또는 월 총 횟수 기준을 정합니다', section: 'detail' },
  { id: 'schedule', label: '주 횟수/월 총 횟수', hint: '산정방식에 맞는 횟수가 필요합니다', section: 'detail' },
  { id: 'minutes', label: '1회 수업 시간', hint: '1회 수업 분량을 보여 줍니다', section: 'detail' },
  { id: 'intro', label: '소개문', hint: '짧은 소개 또는 상세 소개 중 하나가 필요합니다', section: 'detail' },
  { id: 'university', label: '출신대학', hint: '상세등록 완료·검색 노출 조건입니다', section: 'detail' },
  { id: 'profile_image', label: '프로필 사진', hint: '공개 전 카드 신뢰에 필요합니다', section: 'detail' },
  { id: 'feature_1', label: '경력특징 1', hint: '픽 카드 강조 한 줄입니다', section: 'detail' },
  { id: 'student_target', label: '학생구성', hint: '지도 대상 성별·인원을 보여 줍니다', section: 'detail' },
  { id: 'intro_long', label: '상세 소개', hint: '프라임 상세에서 과외를 설명합니다', section: 'detail' },
  { id: 'feature_2', label: '경력특징 2', hint: '프라임 카드에 특징을 더 보여 줍니다', section: 'detail' },
  { id: 'feature_3', label: '경력특징 3', hint: '프라임 카드에 특징을 더 보여 줍니다', section: 'detail' },
];
