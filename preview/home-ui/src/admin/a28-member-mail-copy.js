/**
 * 관리자 「알림·문자 › 회원 메일」 문구 (승인 2026-10-14 · docs/worklog/2026/10/2026-10-14-member-mail-4.md §4-④)
 * 규칙 정본: docs/internal/74-member-mail-lock.md
 */
export const MEMBER_MAIL_COPY = {
  title: '회원 메일',
  lead: '우동공과 편지를 종류별로 켜고 끄고, 미리 보고, 내 메일로 시험 발송해요.',
  loading: '회원 메일 설정을 불러오는 중이에요.',
  loadFailed: '회원 메일 설정을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.',
  schemaMissing: '설정 저장 테이블이 없어요. sql/schema/070_site_settings.sql 적용이 필요해요.',

  colName: '메일',
  colWhen: '언제 보내나요',
  colWho: '받는 사람',
  colState: '상태',
  colSent: '최근 7일 보낸 수',
  colActions: '',

  stateOn: '보내는 중',
  stateOff: '멈춤',
  pause: '멈추기',
  resume: '다시 보내기',
  preview: '미리보기',
  test: '내 메일로 시험 보내기',
  sentUnit: '통',
  changedBy: '바꾼 사람',

  /** @param {string} name */
  confirmPause: (name) =>
    `「${name}」 보내기를 멈출까요? 멈춘 동안에는 이 메일이 나가지 않고, 다시 켜도 지난 메일을 몰아서 보내지 않아요.`,
  /** @param {string} to */
  testDone: (to) => `${to}로 보냈어요. 제목 앞에 [시험]이 붙어요.`,
  testFailed: '시험 메일을 보내지 못했어요. 잠시 뒤 다시 시도해 주세요.',
  saveFailed: '저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.',
  testLimit: '오늘 보낼 수 있는 시험 메일을 모두 썼어요. 내일 다시 보내 주세요.',
  forbidden: '권한이 없어요. 관리자 계정으로 다시 로그인해 주세요.',
  /** @param {number} n */
  testLeft: (n) => `오늘 시험 발송은 ${n}번 더 할 수 있어요.`,

  masterOnly: '켜고 끄기는 최고관리자만 할 수 있어요.',
  lifecycleOff: '서버 설정으로 회원 메일 전체가 꺼져 있어요. 여기서 켜 두어도 나가지 않아요.',
  /** @param {number} cap */
  scheduleNote: (cap) =>
    `첫 일주일 안부·이용 마무리 3일 전은 낮 9시부터 21시까지 한 시간에 두 번 나눠 보내요. 오늘 나간 회원 메일이 ${cap}통이 되면 이 두 메일은 다음 날 이어 보내요.`,
  accountNote: '이메일 확인·비밀번호 재설정 메일은 회원 안전을 위해 끌 수 없어요.',

  previewTitle: '메일 미리보기',
  previewWho: '견본',
  previewSubject: '제목',
  previewSample: '이름·날짜·금액은 견본이에요. 실제 메일에는 받는 회원의 내용이 들어가요.',
  previewLoading: '미리보기를 만드는 중이에요.',
  previewFailed: '미리보기를 만들지 못했어요.',
};

/** 종류 id → 이름·언제·누구 (정본 74 §1-2) */
export const MEMBER_MAIL_KINDS = {
  card_posted: {
    name: '카드 게시 환영',
    when: '카드가 처음 노출될 때 바로',
    who: '공부방·과외쌤·학생(학부모)',
  },
  purchase_thanks: {
    name: 'Prime·Pick 구매 감사',
    when: 'Prime·Pick 결제가 끝나면 바로 (연장 포함)',
    who: '공부방·과외쌤',
  },
  welcome_week: {
    name: '첫 일주일 안부',
    when: '가입 7일째 낮',
    who: '이메일 확인을 마친 회원',
  },
  position_ending: {
    name: '이용 마무리 3일 전',
    when: 'Prime·Pick 기간이 3일 남은 날 낮 (못 보내면 2일 남은 날)',
    who: '카드가 노출 중인 이용자',
  },
  withdraw_farewell: {
    name: '탈퇴 완료(사유 받기 포함)',
    when: '본인이 탈퇴하면 바로',
    who: '탈퇴한 본인 (관리자가 정리한 탈퇴는 제외)',
  },
};

/** 미리보기 견본 id → 이름 */
export const MEMBER_MAIL_VARIANTS = {
  study_room: '공부방',
  tutor: '과외쌤',
  student: '학생·학부모',
  no_card: '카드를 아직 올리지 않은 공부방·과외쌤',
  study_room_prime: '공부방 Prime',
  study_room_pick: '공부방 Pick',
  tutor_prime: '과외쌤 Prime',
  tutor_pick: '과외쌤 Pick',
  reason_given: '탈퇴할 때 이유를 고른 회원',
};
