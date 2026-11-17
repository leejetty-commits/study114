/**
 * 실시간 퀵매칭 소개 카피 — 카탈로그 블록과 #/promo/quick-match·마이페이지 본문이 같이 쓴다.
 * 가격·종료일·학교명·「최초」「유일」「1위」는 넣지 않는다.
 */

export const QUICK_MATCH_INTRO = {
  titleMark: '새로운 방식',
  titleRest: '의 매칭이 시작됩니다',
  subtitle: '이제, 공부방도 실시간으로 매칭됩니다',
  body: '조건이 맞는 학생이 나타나면 바로 쪽지가 연결됩니다',
  badgeNew: 'NEW',
  badgePrime: '프라임 회원 전용 혜택',
  withPrime: '프라임에 함께 제공되는 서비스입니다',
  bubble: '조건이 맞는 학생이 나타났어요',
  photo: '/assets/promo/room-classroom.webp',
  photoAlt: '공부방 수업 장면',
  stepsLead: '공부방을 먼저, 과외쌤은 함께',
  steps: [
    { title: '학생이 원하는 조건 선택', icon: 'pick' },
    { title: '조건 맞는 공부방·과외쌤에게 실시간 알림', icon: 'bell' },
    { title: '쪽지로 바로 상담', icon: 'note' },
  ],
  examplesTitle: '매칭 조건 예시',
  examples: ['학교급', '과목', '수업료', '원장/쌤 성별', '희망 지역', '수업 방식'],
  noExtraCost: '프라임이면 추가 비용 없이',
  ctaStart: '프라임으로 시작하기',
  ctaStartPath: '/plans/positions',
  ctaSettings: '퀵매칭 설정하기',
  ctaSettingsPath: '/mypage/quick-match',
  pickNote: '프라임에서 함께 제공되고 있는 서비스입니다',
};

/** 공부방 카탈로그 카드 종류 맨 앞 */
export const quickMatchCatalogRoom = {
  ...QUICK_MATCH_INTRO,
  toneNote: '',
};

/** 과외쌤 카탈로그. 공부방 우선 문장은 유지하고 톤만 한 줄 맞춘다. */
export const quickMatchCatalogTutor = {
  ...QUICK_MATCH_INTRO,
  toneNote: '과외쌤도 같은 실시간 알림을 함께 받습니다.',
};
