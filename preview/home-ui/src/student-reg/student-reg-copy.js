/**
 * 19장 — 학생 등록 copy · 탭 · visibility · 허브 라벨 (횡단 SSOT)
 * docs/ssot/19-student-registration-management.md §3 · §4 · §5
 */

/** §22 · 운영자 심사 UI 금지 */
export const FORBIDDEN_UI_PHRASES = [
  '검토중',
  '반려',
  '보완 요청',
  '심사 대기',
  '검증 통과',
  '검증 실패',
  '승인',
  'pending',
];

/** 계정의 학생이 0명·2명 이상일 때 마이프로필 대신 보이는 안내. 용어: 게시판·노출. */
export const STUDENT_COUNT_HALT_COPY = {
  zero: {
    title: '아직 우리 아이 정보가 없어요',
    body: '기본정보를 입력해 주시면 베이직카드가 노출돼요. 천천히 시작해 보세요.',
    cta: '기본정보 입력',
  },
  many: {
    /** @param {number} count */
    title: (count) => `이 계정에 학생이 ${count}명 등록되어 있어요`,
    body: '계정 하나에는 학생 1명만 둘 수 있어요. 운영문의로 알려 주시면 정리를 도와드릴게요.',
    cta: '운영문의',
  },
};

/**
 * 학생 분기(교습형태) 문구 한곳. 학생 홈 두 탭 · 찾기 링크배지 · 마이페이지 분기 변경 확인창 · 저장 후 새로고침 안내.
 * 용어: 「학생」(「학부모」 금지).
 */
export const STUDENT_BRANCH_COPY = {
  home: {
    /** 「우리동네 학생」 탭 0건 */
    studentEmptyTitle: (place) => `${place}에는 아직 함께 공부할 친구가 보이지 않아요`,
    studentEmptyBody: '새 친구가 오면 여기에 먼저 보여 드릴게요.',
    /** 하단 링크배지 — 탭별 찾기 페이지 */
    findMore: {
      room: '공부방찾기에서 더 찾아보기',
      tutor: '과외쌤찾기에서 더 찾아보기',
      student: '학생찾기에서 더 찾아보기',
    },
  },
  mypage: {
    changeConfirm:
      '교습형태를 바꾸면 지역설정이 초기화돼요.\n새 지역을 다시 입력해 주세요.\n\n바꿀까요?',
    savedRefresh: '저장했어요.\n상단 메뉴와 카드에 바로 반영되도록 새로고침해 주세요.',
    branchSavedRefresh: '교습형태를 바꿨어요.\n상단 메뉴가 새 교습형태로 바뀌도록 새로고침해 주세요.',
    regionEmptyHint: '지금은 지역이 비어 있어 카드가 잠시 쉬고 있어요. 지역을 입력하면 다시 보여요.',
    /** 가입 화면과 같은 주소검색 실패 안내. 마이페이지 공부방 희망지역도 이 문구만 쓴다. */
    hopeRegionDongMissing: '행정동을 찾지 못했습니다. 주소 검색으로 다시 선택해 주세요.',
    hopeRegionComplexMissing: '주소 검색으로 아파트·단지를 다시 선택해 주세요.',
    hopeRegionComplexNameMissing: '아파트·단지 이름이 있는 주소로 다시 검색해 주세요.',
    draftMissing: (labels) => `기본정보에 빈 칸이 있어 카드가 잠시 쉬고 있어요: ${labels}`,
  },
};

/**
 * 과외쌤 홈 「우리동네 학생」 탭 문구 한곳.
 * 조회 중 · 조회 실패 · 활동지역 없음 · 조회 끝 0건을 서로 다른 문구로 구분한다.
 * 용어: 「학생」(「학부모」 금지).
 */
export const TUTOR_HOME_STUDENT_COPY = {
  loading: '우리동네 학생을 불러오는 중입니다.',
  error: '학생을 불러오지 못했어요. 잠시 후 다시 확인해 주세요.',
  noRegion: '과외지역을 등록하면 학생이 보여요.',
  reselect: '활동지역을 구(시·군)까지 다시 선택해 주세요',
  /** @param {string} place */
  emptyTitle: (place) => `${place}에는 아직 함께 공부할 학생이 보이지 않아요`,
  emptyBody: '새 학생이 오면 여기에 먼저 보여 드릴게요.',
};
