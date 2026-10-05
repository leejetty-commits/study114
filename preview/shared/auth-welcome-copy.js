/**
 * 로그인·가입 환영 카피.
 * 해요체. 탓하지 않고, 압박하지 않는다.
 * 화면에는 학생·공부방·과외쌤만 보인다.
 */

export const AUTH_WELCOME_COPY = {
  login: {
    sub: '우리 동네 공부방과 과외쌤을 이어서 만나 보세요.',
    signupHint: '학생·공부방·과외쌤으로 시작할 수 있어요.',
    returnLead: '로그인하면 방금 보던 화면으로 돌아가요.',
    savedLead: '저장해 둔 탐색과 최근 본 후보를 이어서 볼 수 있어요.',
    fail: '로그인을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.',
    credential: '이메일 또는 비밀번호를 확인해 주세요.',
    welcome: '다시 만나서 반가워요.',
  },
  termsSub: '서비스를 쓰려면 약관에 동의해 주세요.',
  roleTitle: '어떤 회원으로 시작할까요?',
  roleSub: '하나만 골라 주세요. 계정을 만들고 이메일을 확인하면 기본정보로 이어져요.',
  roleSubOAuth: '하나만 골라 주세요. 이메일을 확인하면 기본정보로 이어져요.',
  formSub: '공통으로 필요한 정보만 받아요. 학교·과목·희망 조건은 여기서 받지 않아요.',
  basicStudentLead: '학생 카드에 먼저 보일 내용을 적어요.',
  basicDisplayNameHint: '학생 카드에 보이는 이름이에요.',
  basicSubjectHint: '학생 카드에 먼저 보일 과목이에요.',
  verify: {
    waitTitle: '이메일을 확인해 주세요',
    waitLead: '확인 메일을 보냈어요. 메일 안의 링크를 새 탭에서 눌러 주세요.',
    waitTab:
      '링크 확인은 새 탭에서 하고, 기본정보는 이 화면에서 이어서 입력해요. 이 화면은 닫지 말아 주세요. 메일이 안 보이면 스팸함·프로모션함도 확인해 주세요.',
    waitNext: '확인이 끝나면 이 화면이 기본정보 입력으로 넘어가요.',
    waitDelay: '메일이 바로 안 보이면 잠시 후 다시 확인해 주세요. 다시 보내기는 10분 뒤에 할 수 있어요.',
    failTitle: '계정은 만들어졌지만 확인 메일을 보내지 못했어요',
    failLead: '잠시 후 확인 메일을 다시 보내 주세요.',
    failHint: '이메일 주소를 확인한 뒤 다시 보낼 수 있어요.',
    doneTitle: '이메일을 확인했어요',
    doneLead: '확인이 끝났어요. 기본정보는 처음에 열어 둔 화면에서 이어서 입력해요.',
    doneNote: '그 화면을 닫았다면 아래에서 이 창으로 이어갈 수 있어요.',
    resendSuccess: '확인 메일을 다시 보냈어요. 받은편지함과 스팸함을 확인해 주세요.',
    resendCooldown: '최근에 확인 메일을 보냈어요. 잠시 후 다시 시도해 주세요.',
    already: '이미 이메일을 확인했어요.',
    resendFail: '확인 메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.',
    nextStudyRoom: '확인이 끝나면 공부방 가입정보로 이어져요.',
    nextTutor: '확인이 끝나면 과외쌤 가입정보로 이어져요.',
    nextStudent: '확인이 끝나면 학생 기본정보로 이어져요.',
    nextDefault: '확인이 끝나면 선택한 유형의 기본정보로 이어져요.',
    inboxHint: '받은편지함에서 확인 메일을 열어 주세요. 안 보이면 스팸함·프로모션함도 확인해 주세요.',
    doneAlert: '이메일을 확인했어요.',
  },
  complete: {
    title: '가입이 끝났어요',
    studentLead: '적어 주신 내용은 학생 카드에 바로 반영돼요.',
    providerLead:
      '계정과 기본등록이 끝났어요. 아직은 검색에 안 보여요. 상세등록을 채우면 이웃에게 열려요.',
    profileStudyRoom: '공부방',
    profileTutor: '과외쌤',
    detailTitle: '다음 · 상세등록 (선택)',
    detailNote:
      '기본등록만으로도 가입은 끝났어요. 상세등록은 나중에 마이페이지에서 이어갈 수 있어요. 검색에 쓰이는 항목은 상세등록에서 채워요.',
    alertDone: '기본등록이 끝났어요. 상세등록은 마이페이지에서 이어갈 수 있어요.',
    confirmStudent: '희망지역이 없어요. 그래도 홈으로 갈까요?',
    confirmProvider:
      '홍보지역 정보가 없어요. 그래도 홈으로 갈까요?\n마이페이지에서 기본등록과 상세등록을 이어갈 수 있어요.',
  },
  guestGateLead: '로그인하면 후기·위치·비교·찜·문의를 더 볼 수 있어요.',
};

/** 표시명이 있으면 「○○님, 다시 만나서 반가워요.」 */
export function loginWelcomeText(name) {
  const n = String(name || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!n || n.includes('@') || /oauth_/i.test(n)) return AUTH_WELCOME_COPY.login.welcome;
  return `${n}님, ${AUTH_WELCOME_COPY.login.welcome}`;
}

/**
 * 자격 증명 불일치는 존재 여부를 숨기는 기존 문구를 유지한다.
 * 그 밖의 완료 실패는 해요체 안내로 모은다.
 */
export function loginFailureMessage(raw) {
  const msg = String(raw || '').trim();
  if (msg.includes('이메일 또는 비밀번호')) return AUTH_WELCOME_COPY.login.credential;
  return AUTH_WELCOME_COPY.login.fail;
}

/** 재전송 남은 시간이 있으면 그 시간을 넣고, 없으면 잠시 후 안내만 한다. */
export function emailVerifyCooldownMessage(resendAvailableIn = 0, formatCountdown) {
  const wait = Math.max(0, Math.ceil(Number(resendAvailableIn) || 0));
  if (wait > 0 && typeof formatCountdown === 'function') {
    return `최근에 확인 메일을 보냈어요. ${formatCountdown(wait)} 후에 다시 시도해 주세요.`;
  }
  return AUTH_WELCOME_COPY.verify.resendCooldown;
}
