/**
 * 등록점검(P20-04) copy — 관리용 현황판
 * 마이샵/쇼케이스 문구와 섞지 않는다.
 */

export const RC_COPY = {
  title: '등록점검',
  lead: '입력한 정보를 한눈에 확인하고, 비어 있는 항목을 빠르게 채워 보세요',
  badges: {
    publishOk: '공개 기본조건',
    publishYes: '충족',
    publishNo: '미충족',
    pick: 'Pick 준비',
    prime: 'Prime 준비',
    pickReady: '준비됨',
    primeReady: '준비됨',
    remaining: (n) => `${n}개 남음`,
    progress: '전체 입력 상태',
  },
  promo: {
    title: '홍보광고를 위하여 픽 · 프라임 노출을 고민 중이신가요?',
    lines: [
      '베이직 검색은 기본정보만으로도 가능합니다.',
      '더 잘 보이게 하려면 아래 항목을 추가로 채워 주세요.',
      '필요한 정보는 상세정보1, 상세정보2에서 바로 보완할 수 있어요.',
    ],
    detail1Title: '상세정보1',
    detail1Items: ['홍보사진', '한 줄 소개', '수업운영방식 · 타임별 원생수', '월 평균 수업료'],
    detail2Title: '상세정보2',
    detail2Items: ['경력특징', '교육청등록증', '시설 · 환경'],
    missingTitle: '지금 채우면 좋은 항목',
    missingLead: '광고·홍보 노출과 바로 연결되는 빈 항목만 모았습니다.',
    allReady: 'Pick · Prime 핵심 항목이 채워져 있습니다. 아래 현황판에서 나머지를 확인하세요.',
    cardsTitle: '베이직 / Pick / Prime 이렇게 달라집니다',
    cardsLead: '왼쪽은 지금 내 베이직 카드입니다. 오른쪽은 유료 노출 시 학부모에게 보이는 차이입니다.',
    basicKicker: '내 현재 베이직',
    pickKicker: 'Pick 샘플',
    primeKicker: 'Prime 샘플',
    plansCta: 'Pick / Prime 상품 보기',
    defaultPhotoNote: '실사진 없음 · 브랜드 기본 이미지',
    realPhotoNote: '등록한 대표사진',
  },
  board: {
    title: '전체 프로필 현황',
    lead: '값이 비어 있으면 — 으로 표시됩니다. 가벼운 항목은 여기서, 복잡한 항목은 원래 탭에서 수정합니다.',
    sections: {
      basic: '기본정보',
      detail: '상세정보1',
      detail2: '상세정보2',
      extras: '수업상세 / 증빙 / 기타',
    },
  },
  status: {
    filled: '입력됨',
    empty: '미입력',
    partial: '일부입력',
  },
  actions: {
    fill: '채우기',
    edit: '수정',
    photoFill: '사진 채우기',
    /** 추가 사진·전체 관리는 상세정보1(수업·홍보사진) 정본 */
    photoMore: '상세정보1에서 사진 더 추가',
    photoManage: '상세정보1에서 사진 관리',
    classManage: '상세정보1에서 관리',
    gotoBasic: '기본정보에서 수정',
    gotoDetail: '상세정보1에서 채우기',
    gotoDetail2: '상세정보2에서 채우기',
    gotoDetailManage: '상세정보1에서 관리',
    gotoDetail2Manage: '상세정보2에서 관리',
  },
  /** 원본 탭에서 등록점검으로 복귀 (?return=registration-check) */
  returnBanner: {
    label: '← 등록점검으로 돌아가기',
    hint: '수정이 끝나면 등록점검에서 다시 확인할 수 있습니다.',
  },
  drawer: {
    save: '저장',
    cancel: '닫기',
    saving: '저장 중…',
    failPrefix: '저장에 실패했습니다',
  },
  cover: {
    title: '대표사진 1장',
    lead: '검색 카드와 상세 진입에 쓰이는 대표사진입니다. 추가 사진(2장 이상)은 상세정보1에서 관리합니다.',
    pick: '사진 선택',
    hint: 'JPG · PNG · WebP / 최소 800×600 / 최대 4MB',
  },
  pickSample: {
    name: '한 줄 소개가 보이는 공부방',
    intro: '초등·중등 수학을 차근차근 잡아 줍니다',
    meta: ['수학', '1~4명', '월 35만원대'],
  },
  primeSample: {
    name: '상세가 채워진 공부방',
    intro: '수업 구성과 지도 스타일이 카드에 바로 보입니다',
    meta: ['수학 · 중등', '그룹 타임', '주 3회', '월 35만원대'],
    extra: '대표사진 · 한 줄 소개 · 수업상세가 채워진 상태',
  },
};

/** Pick 핵심 — 남은 수 배지용 */
export const RC_PICK_FIELD_IDS = ['cover', 'intro_short', 'fee', 'teaching_style'];

/** Prime 핵심 — Pick + 보강 */
export const RC_PRIME_FIELD_IDS = [
  'cover',
  'intro_short',
  'intro_long',
  'teaching_style',
  'teaching_style_note',
  'classes',
  'fee',
  'lessons_per_week',
  'feature_1',
];

/** 상단 누락 리스트 우선순위 (광고 연결) */
export const RC_PROMO_MISSING_DEFS = [
  { id: 'cover', label: '대표사진', hint: '첫 노출과 상세 진입에 중요합니다' },
  { id: 'intro_short', label: '한 줄 소개', hint: '카드와 마이샵 상단에 쓰입니다' },
  { id: 'intro_long', label: '공부방 소개 / 자랑', hint: '상세 페이지에서 공부방을 설명합니다' },
  { id: 'teaching_style', label: '지도 스타일', hint: '수업 결을 한눈에 보여 줍니다' },
  { id: 'teaching_style_note', label: '지도 스타일 추가설명', hint: '칩만으로 부족한 설명을 보완합니다' },
  { id: 'classes', label: '수업상세', hint: '실제 수업 구성을 보여 주려면 필요합니다' },
  { id: 'fee', label: '월 평균 수업료', hint: '검색 카드 가격대에 쓰입니다' },
  { id: 'lessons_per_week', label: '주당 평균 수업회수', hint: '수업 밀도를 가늠하는 값입니다' },
  { id: 'feature_1', label: '특징성 문구', hint: '카드 강조 한 줄. 상세정보2「경력특징 1」과 같은 값입니다' },
];

/**
 * DEV 메모 (구현 정본)
 * - 사진: 대표 1장만 등록점검 팝업. 추가·순서·구분은 상세정보1(lesson/홍보사진). 스펙의 「상세정보2」 표현은 구현상 상세정보1로 통일.
 * - feature_1: study_rooms.feature_1 단일 컬럼. 등록점검「특징성 문구」= 상세정보2「경력특징 1」동일 필드. feature_2·3는 경력특징만.
 * - return 쿼리: return=registration-check (구 return=publish 폐기)
 */
