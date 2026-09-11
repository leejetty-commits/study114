/**
 * 등록점검(P20-04) copy — 관리용 현황판
 * 마이샵/쇼케이스 문구와 섞지 않는다.
 */

export const RC_COPY = {
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
    cardsLead: '왼쪽은 지금 내 Basic 카드입니다. 오른쪽은 유료 노출 시 학부모에게 보이는 차이입니다. 카드를 누르면 확대카드가 열립니다.',
    basicKicker: '내 현재 Basic',
    pickKicker: 'Pick',
    primeKicker: 'Prime',
    expandHint: '클릭하면 확대카드가 열립니다',
  },
  board: {
    title: '전체 프로필 현황',
    lead: '기본정보는 바로 보입니다. 상세정보는 접어 두고, 헤더에서 완료·부족을 먼저 읽습니다.',
    sections: {
      basic: '기본정보',
      detail: '상세정보',
      detail1: '상세정보1',
      detail2: '상세정보2',
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
    confirmFee: '수업료·수업 방식 표시를 확인했습니다',
    confirmTrust: '소개문·시설·신뢰정보 노출을 확인했습니다',
    publishCta: '공개하기',
    republishCta: '다시 공개',
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

/** 현황판·폼 필수 마크 — Pick ∪ Prime */
export const RC_REQUIRED_FIELD_IDS = [...new Set([...RC_PICK_FIELD_IDS, ...RC_PRIME_FIELD_IDS])];

/** 상단 누락 리스트 우선순위 (광고 연결) */
export const RC_PROMO_MISSING_DEFS = [
  { id: 'cover', label: '대표사진', hint: '첫 노출과 상세 진입에 중요합니다', section: 'detail' },
  { id: 'intro_short', label: '한 줄 소개', hint: '카드와 마이샵 상단에 쓰입니다', section: 'detail' },
  { id: 'intro_long', label: '공부방 소개 / 자랑', hint: '상세 페이지에서 공부방을 설명합니다', section: 'detail' },
  { id: 'teaching_style', label: '지도 스타일', hint: '수업 결을 한눈에 보여 줍니다', section: 'detail' },
  { id: 'teaching_style_note', label: '지도 스타일 추가설명', hint: '칩만으로 부족한 설명을 보완합니다', section: 'detail' },
  { id: 'classes', label: '수업상세', hint: '실제 수업 구성을 보여 주려면 필요합니다', section: 'detail' },
  { id: 'fee', label: '월 평균 수업료', hint: '검색 카드 가격대에 쓰입니다', section: 'detail' },
  { id: 'lessons_per_week', label: '주당 평균 수업회수', hint: '수업 밀도를 가늠하는 값입니다', section: 'detail' },
  { id: 'feature_1', label: '경력특징 1', hint: '카드 강조 한 줄. 상세정보2「경력특징 1」과 같은 값입니다', section: 'detail2' },
];

/**
 * DEV 메모 (구현 정본)
 * - 사진: 대표 1장만 등록점검 팝업. 추가·순서·구분은 상세정보1(lesson/홍보사진). 스펙의 「상세정보2」 표현은 구현상 상세정보1로 통일.
 * - feature_1: study_rooms.feature_1 단일 컬럼. 등록점검「경력특징 1」= 상세정보2「경력특징 1」동일 필드. feature_2·3는 경력특징만.
 * - return 쿼리: return=registration-check (구 return=publish 폐기)
 * - 누락 항목 링크: 상세정보 탭(edit=1)로 이동. 드로어 채우기 없음.
 */
