/**
 * 자료실 UI copy — 자료실 입구(역할별 팁 게시판 카드) · 정보 게시판 화면 · 우측 레일 배너
 */

/** 자료실 입구(#/support/library · #/library) — 역할별 팁 게시판 카드 목록 */
export const LIBRARY_ENTRY_COPY = {
  lead: '역할별 팁 게시판을 모았어요. 게시판을 골라 들어가 보세요.',
  listLabel: '자료실 게시판',
  categoriesLabel: '분류',
  enter: '들어가기',
  navEntry: '자료실 입구',
  loading: '게시판을 불러오는 중이에요',
  loadFailed: '길이 막혔어요. 잠시 후 다시 확인해 주세요',
  retry: '다시 시도',
};

/**
 * 공급자 정보 게시판 2개 — 서버 저장 게시판(board_posts). 학생·member 에게는 보이지 않는다.
 * 분류 key 는 서버 InfoBoardService::CATEGORIES 와 같아야 한다.
 */
export const INFO_BOARDS = [
  {
    slug: 'room-info',
    boardKey: 'info-room',
    label: '공부방 쏙쏙정보',
    path: '/library/room-info',
    lead: '공부방 운영에 바로 쓰는 정보를 나눠요.',
    categories: [
      { key: 'know-how', label: '운영 노하우' },
      { key: 'recruit', label: '학생 모집·홍보' },
      { key: 'admin-tax', label: '시설·행정·세무' },
      { key: 'edu-news', label: '입시·교육 소식' },
    ],
  },
  {
    slug: 'tutor-tips',
    boardKey: 'info-tutor',
    label: '과외쌤 따끈 팁가이드',
    path: '/library/tutor-tips',
    lead: '과외 수업·상담에 바로 쓰는 팁을 나눠요.',
    categories: [
      { key: 'lesson', label: '수업 노하우' },
      { key: 'consult-match', label: '상담·학생 매칭' },
      { key: 'contract-tax', label: '계약·정산·세무' },
      { key: 'edu-news', label: '입시·교육 소식' },
    ],
  },
];

/** 학생 꿀팁 가이드 — 서버 저장 게시판(board_posts, info-student). 모든 역할에게 보인다(게스트는 제목만). */
export const STUDENT_TIPS_BOARD = {
  slug: 'student-tips',
  boardKey: 'info-student',
  label: '학생 꿀팁 가이드',
  path: '/library/student-tips',
  lead: '공부·시험·진로에 도움이 되는 꿀팁을 나눠요.',
  categories: [
    { key: 'study-howto', label: '공부 노하우' },
    { key: 'exam-school', label: '시험·내신' },
    { key: 'admission-career', label: '입시·진로' },
    { key: 'habit-mind', label: '습관·마음관리' },
    { key: 'choose-provider', label: '과외쌤·공부방 고르기' },
    { key: 'senior-story', label: '선배 이야기' },
  ],
};

/** 자료실 게시판 전체(입구 카드·화면·레일 배너 순서). 역할별 노출은 board-channel-acl 이 정한다. */
export const LIBRARY_BOARDS = [...INFO_BOARDS, STUDENT_TIPS_BOARD];

/** 학생 꿀팁 가이드에만 쓰는 문구 — 「응원해요」 하나, 연락처 차단 안내 */
export const STUDENT_TIPS_COPY = {
  cheer: '응원해요',
  cheerEmoji: '🎉',
  cheerLogin: '로그인하면 응원할 수 있어요',
  cheerFailed: '응원을 전하지 못했어요. 잠시 후 다시 시도해 주세요',
  freeProviderCompose: '공부방·과외쌤 글쓰기는 픽·프라임을 이용 중일 때 할 수 있어요',
  contactNotice: '연락처·카톡·외부 링크는 올릴 수 없어요',
  fieldBodyPlaceholder: '친구·후배에게 알려 주고 싶은 꿀팁을 적어 주세요',
};

export const INFO_BOARD_COPY = {
  empty: '아직 글이 도착하지 않았어요. 첫 정보를 기다려요',
  loadFailed: '글을 불러오는 중 길이 막혔어요. 잠시 후 다시 확인해 주세요',
  freeProviderCompose: '글쓰기는 픽·프라임을 이용 중인 공부방·과외쌤이 할 수 있어요',
  guestDetail: '로그인하면 전체 내용을 볼 수 있어요',
  blocked: '볼 수 없는 게시판이에요',
  navHeading: '정보 게시판',
  allTab: '전체',
  loading: '글을 불러오는 중이에요',
  retry: '다시 불러오기',
  more: '더 보기',
  moreLoading: '불러오는 중…',
  composeCta: '글쓰기',
  loginCta: '로그인',
  loginToWrite: '로그인한 뒤 글을 쓸 수 있어요',
  backToList: '← 목록으로',
  newTitle: '새 글 쓰기',
  editTitle: '글 고치기',
  fieldCategory: '분류',
  fieldCategoryPlaceholder: '분류를 골라 주세요',
  fieldTitle: '제목',
  fieldTitlePlaceholder: '한눈에 알 수 있는 제목',
  fieldBody: '본문',
  fieldBodyPlaceholder: '나누고 싶은 정보를 적어 주세요',
  submitNew: '올리기',
  submitEdit: '저장하기',
  saving: '저장하는 중…',
  saveFailed: '저장하지 못했어요. 잠시 후 다시 시도해 주세요',
  edit: '고치기',
  delete: '지우기',
  deleteConfirmTitle: '이 글을 지울까요?',
  deleteConfirmBody: '지운 글은 다시 볼 수 없어요.',
  cancel: '취소',
  deleteFailed: '지우지 못했어요. 잠시 후 다시 시도해 주세요',
  savedNew: '글을 올렸어요',
  savedEdit: '글을 고쳤어요',
  deleted: '글을 지웠어요',
  notFound: '글을 찾을 수 없어요',
  editNotAllowed: '이 글은 고칠 수 없어요',
  edited: '수정됨',
  flashClose: '닫기',
};

/** 우측 레일 정보 게시판 배너 · 레일 읽기 팝업 문구. 배너 제목은 LIBRARY_BOARDS 의 label 을 쓴다. */
export const INFO_RAIL_COPY = {
  empty: INFO_BOARD_COPY.empty,
  loadFailed: INFO_BOARD_COPY.loadFailed,
  loading: INFO_BOARD_COPY.loading,
  more: '더보기',
  guestDetail: INFO_BOARD_COPY.guestDetail,
  loginCta: INFO_BOARD_COPY.loginCta,
  notFound: INFO_BOARD_COPY.notFound,
  blocked: INFO_BOARD_COPY.blocked,
  goBoard: '게시판에서 보기',
  popupClose: '닫기',
  popupList: '글 목록',
  popupPager: '페이지 이동',
  popupPrev: '이전',
  popupNext: '다음',
};
