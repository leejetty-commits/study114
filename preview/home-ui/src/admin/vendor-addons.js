/**
 * 부가서비스 업체 연락처·URL 카탈로그
 * 영카트 「부가서비스」(PG·본인인증·SMS) 벤치마크 — 실연동 전 연락·신청용
 */

/** @typedef {'sms'|'pg'|'identity'} AddonCategory */

/**
 * @typedef {{
 *   id: string,
 *   category: AddonCategory,
 *   name: string,
 *   summary: string,
 *   homeUrl: string,
 *   applyUrl?: string,
 *   docsUrl?: string,
 *   phone?: string,
 *   note?: string,
 *   status: 'lab'|'ready'|'planned',
 * }} AddonVendor
 */

/** @type {AddonVendor[]} */
export const ADDON_VENDORS = [
  /* —— 문자·메시징 —— */
  {
    id: 'aligo',
    category: 'sms',
    name: '알리고 (Aligo)',
    summary: 'SMS·LMS·알림톡 대량 발송. 발신번호 사전등록·수신동의 후 연동.',
    homeUrl: 'https://smartsms.aligo.in/',
    applyUrl: 'https://smartsms.aligo.in/join.html',
    docsUrl: 'https://smartsms.aligo.in/admin/api/spec.html',
    note: '2차 실연동 후보. API 키·발신번호·야간 제한을 관리자 설정에 넣을 예정.',
    status: 'planned',
  },
  {
    id: 'icode',
    category: 'sms',
    name: '아이코드 (iCODE)',
    summary: '그누보드·영카트 기본 SMS 파트너. SMS/LMS 충전형.',
    homeUrl: 'http://www.icodekorea.com/',
    applyUrl: 'https://sir.kr/main/service/icode.php',
    docsUrl: 'http://www.icodekorea.com/',
    phone: '031-728-1281',
    note: 'SIR 경유 가입 시 영카트 연동 안내를 받을 수 있습니다. 발신번호 사전등록 필수.',
    status: 'planned',
  },

  /* —— 카드·전자결제(PG) —— */
  {
    id: 'inicis',
    category: 'pg',
    name: 'KG이니시스',
    summary: '영카트에서 자주 쓰는 카드·간편결제 PG. 상점 ID·사인키 연동.',
    homeUrl: 'https://www.inicis.com/',
    applyUrl: 'https://www.inicis.com/service_main',
    docsUrl: 'https://manual.inicis.com/',
    phone: '1588-4954',
    note: '카드 결제모듈 상담·계약용. 우동공과는 실 PG 미연동(Lab) 상태입니다.',
    status: 'planned',
  },
  {
    id: 'kcp',
    category: 'pg',
    name: 'NHN KCP',
    summary: '신용카드·계좌이체·휴대폰 결제. 영카트·SIR 부가서비스에 포함.',
    homeUrl: 'https://www.kcp.co.kr/',
    applyUrl: 'https://www.kcp.co.kr/payment/paymentGuide',
    docsUrl: 'https://developer.kcp.co.kr/',
    note: '수수료·심사 일정은 상담 후 확정. 계약 전 테스트 MID로 UI만 맞출 수 있습니다.',
    status: 'planned',
  },
  {
    id: 'toss',
    category: 'pg',
    name: '토스페이먼츠',
    summary: '카드·간편결제·정기결제. 개발자센터 문서가 잘 정리되어 있음.',
    homeUrl: 'https://www.tosspayments.com/',
    applyUrl: 'https://www.tosspayments.com/business',
    docsUrl: 'https://docs.tosspayments.com/',
    note: '후순위 PG 후보. 유료 구독·횟수권 결제 연동 시 검토.',
    status: 'planned',
  },
  {
    id: 'nicepay',
    category: 'pg',
    name: '나이스페이먼츠',
    summary: '카드·가상계좌·간편결제. 본인확인(나이스아이디)과 계열이 가까움.',
    homeUrl: 'https://www.nicepay.co.kr/',
    applyUrl: 'https://www.nicepay.co.kr/home/main.do',
    docsUrl: 'https://developers.nicepay.co.kr/',
    note: '카드 모듈·본인확인을 한 계열에서 상담하고 싶을 때 후보.',
    status: 'planned',
  },

  /* —— 본인인증 —— */
  {
    id: 'niceid',
    category: 'identity',
    name: '나이스아이디 (본인확인)',
    summary: '휴대폰·아이핀 등 본인확인. 가입·성인 확인 정책에 사용 가능.',
    homeUrl: 'https://www.niceid.co.kr/',
    applyUrl: 'https://www.niceid.co.kr/',
    note: 'Study114는 가입 SMS OTP를 쓰지 않음(SSOT). 필요 시만 검토.',
    status: 'lab',
  },
  {
    id: 'pass',
    category: 'identity',
    name: 'PASS 본인확인 (한국모바일인증)',
    summary: '통신사 PASS 앱 기반 본인확인.',
    homeUrl: 'https://www.kmcert.com/',
    applyUrl: 'https://www.kmcert.com/',
    note: '정책상 필요해질 때만 연락. 현재 Lab 안내만.',
    status: 'lab',
  },
];

export const ADDON_CATEGORY_LABELS = {
  sms: '문자·메시징',
  pg: '카드·전자결제(PG)',
  identity: '본인인증',
};

export const ADDON_STATUS_LABELS = {
  lab: '안내만',
  planned: '연동 예정',
  ready: '연동 가능',
};

/** SMS Lab 안내문 (문자 기본설정·부가서비스 공통) */
export const SMS_LAB_NOTICE = {
  title: '지금은 Lab(미리보기)입니다',
  body:
    '버튼을 눌러도 실제 휴대폰으로 문자가 나가지 않습니다. 전송내역에 「미리보기」만 남습니다. 실제 발송(2차)은 아래 업체에 가입·API 키·발신번호 등록·수신 동의가 준비된 뒤 연결합니다.',
};

/** @param {AddonCategory | 'all'} [category] */
export function listAddonVendors(category = 'all') {
  if (category === 'all') return ADDON_VENDORS.slice();
  return ADDON_VENDORS.filter((v) => v.category === category);
}

/** @param {string} id */
export function getAddonVendor(id) {
  return ADDON_VENDORS.find((v) => v.id === id) || null;
}
