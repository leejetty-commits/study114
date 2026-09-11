/**
 * 과외쌤 쪽지설정(P21-05) copy
 * 수신 ON/OFF · 닫힘 사유 · 연락처 검증. 공부방 P20 copy와 파일을 섞지 않는다.
 *
 * 닫힘 사유는 표시용이 아니라 tutors.inquiry_status 값 자체다.
 * paused = 잠시 쉼 (일시 중단)
 * not_accepting = 신규 학생 안 받음 (신규 모집을 닫음. paused와 다른 운영 상태)
 */

export const P21_INQUIRY_COPY = {
  pageLead: '지금 학부모 쪽지를 받을지 확인하고, 필요하면 바꾼 뒤 저장합니다.',
  currentStatusHeading: '현재상태',
  badgeReceiving: '지금은 쪽지 받는 중',
  badgeClosed: '지금은 쪽지 안받음',
  storedOpen: '저장값: 쪽지 받는 중',
  storedPaused: '저장값: 쪽지 안받음 · 잠시 쉼',
  storedNotAccepting: '저장값: 쪽지 안받음 · 신규 학생 안 받음',
  editHeading: '현재상태 수정',
  receiving: '쪽지 받는 중',
  closed: '쪽지 안받음',
  offReasonTitle: '안받는 이유',
  offReasonHint: '쪽지 안받음이면 이유를 고른 뒤 저장합니다. 이유마다 서버 상태값이 다릅니다.',
  offReasonRequired: '쪽지 안받음으로 저장하려면 이유를 선택해 주세요.',
  contactHeading: '기본 연락처 검증',
  contactNeeded: '인증이 필요합니다',
  contactNeededLead: '처음 쪽지 받는 중으로 바꿀 때는 본인 핸드폰 인증이 먼저 필요합니다.',
  contactVerified: '인증 완료',
  contactVerifiedLead: '인증이 끝났습니다. 전화번호는 외부에 공개되지 않습니다.',
  contactNotice: '인증은 시스템 신뢰 확인용이며, 전화번호는 외부에 공개되지 않습니다.',
  contactVerifyCta: '핸드폰 인증하기',
  verifyFirstHint: '쪽지 받는 중으로 저장하려면 먼저 기본 연락처 검증을 완료해 주세요.',
  schemaMissing:
    '쪽지설정 저장 컬럼이 아직 운영 DB에 없습니다. 관리자가 064 SQL을 적용한 뒤 다시 저장해 주세요.',
  saveFailed: '저장에 실패했습니다. 화면은 마지막 서버값으로 되돌립니다.',
  saveCta: '저장하기',
  sampleTitle: '쪽지 설정시 카드 샘플',
  sampleLead: '홈과 같은 실제 BASIC 카드입니다. 화살표가 쪽지 관련 표시 위치를 가리킵니다.',
  sampleOpenKicker: '쪽지 받는 중',
  sampleClosedKicker: '쪽지 안받음',
  sampleOpenCallout: '여기가 쪽지 관련 표시 위치입니다. 받는 중이면 ✉가 활성입니다.',
  sampleClosedCallout: '여기가 쪽지 관련 표시 위치입니다. 안받음이면 ✉가 비활성입니다.',
};

export const P21_INQUIRY_OFF_REASONS = [
  {
    value: 'paused',
    label: '잠시 쉼',
    hint: '일시 중단입니다. 나중에 다시 받을 수 있습니다.',
  },
  {
    value: 'not_accepting',
    label: '신규 학생 안 받음',
    hint: '신규 모집을 닫은 상태입니다. 잠시 쉼이 아닙니다.',
  },
];
