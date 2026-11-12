/**
 * 플로팅 「문의하기」연락 상수 — URL·메일은 여기만.
 * 카카오 JS SDK·외부 위젯 금지. 채팅은 pf.kakao.com 일반 링크.
 */

import { supportUiUrl } from './preview-links.js';

/** 자주 묻는 질문 (기존 고객센터 FAQ) */
export const INQUIRY_FAQ_HASH = '#/support/faq';

/** 이메일 문의 (비로그인) */
export const INQUIRY_MAILTO = 'mailto:help@study114.net';

/** 운영문의 (로그인) — home-ui 밖에서도 고객센터로 가게 pathname 딥링크 */
export function inquiryContactUrl() {
  return supportUiUrl('/support/contact');
}

/** 카카오톡 채널 채팅 (https) */
export const KAKAO_CHAT_URL = 'https://pf.kakao.com/_xkeMNX/chat';
