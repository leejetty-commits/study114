/** set-a 카드 카피. 대상 엔진·API 없음. */

export const LOCKUP_SRC = '/assets/brand/logo-lockup-pencil-wordmark.png';

export const POPUP_TYPES = [
  { id: 'notice', label: '공지' },
  { id: 'event', label: '이벤트' },
  { id: 'ad', label: '광고' },
];

export const SET_A = {
  notice: {
    id: 'notice',
    date: '2026.09.22 · 서비스 운영팀',
    title: '서비스 점검 안내',
    body: '안정적인 서비스 제공을 위해 아래 일정으로 시스템 점검을 진행합니다. 점검 중 일부 기능이 일시적으로 중단될 수 있으니 이용에 참고해 주세요.',
    bullets: [
      '일시: 9월 25일(금) 02:00–04:00',
      '영향: 로그인·문의·결제 일부 중단',
      '문의: 고객센터 (점검 후 순차 응답)',
    ],
    cta: '자세히 보기',
    ctaHref: '#/support',
  },
  event: {
    id: 'event',
    kicker: 'Autumn Offer',
    title: '가을 신규 등록 혜택',
    chip: 'EVENT',
    body: '첫 달 이용권 할인으로 공부방·과외쌤을 부담 없이 시작해 보세요.',
    period: '기간 9.23 – 10.7',
    note: '신규 회원 대상 · 결제 시 자동 적용 · 중복 쿠폰과 함께 사용 불가',
    cta: '이벤트 참여하기',
    ctaHref: '#/plans',
  },
  ad: {
    id: 'ad',
    chip: '안내',
    title: '공부방·과외쌤 한곳에서',
    body: '지금 찾고 바로 문의하세요.\n지역·과목·예산에 맞는 매칭을 도와드립니다.',
    aside: '공부방·과외쌤\n한곳에서',
    primary: '바로 찾기',
    primaryHref: '#/guest',
    secondary: '더 알아보기',
    secondaryHref: '#/guide',
  },
};
