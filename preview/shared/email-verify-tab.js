/**
 * 메일 확인 탭 역할. 세션스토리지는 탭 단위.
 * 저장 판단은 호출부가 서버 email_verified를 다시 조회한 뒤에만 한다.
 */

const ROLE_KEY = 'study114.emailVerify.tabRole';
const PING_KEY = 'study114.emailVerify.ping';
const CHANNEL = 'study114-email-verify';

export function markWaitTab() {
  try {
    sessionStorage.setItem(ROLE_KEY, 'wait');
  } catch {
    /* ignore */
  }
}

export function markMailTab() {
  try {
    sessionStorage.setItem(ROLE_KEY, 'mail');
  } catch {
    /* ignore */
  }
}

/** 원래 탭을 닫은 뒤, 메일 탭에서 명시적으로 이어갈 때만. */
export function allowBasicInThisTab() {
  try {
    sessionStorage.setItem(ROLE_KEY, 'fallback');
  } catch {
    /* ignore */
  }
}

export function isMailTabBlocked() {
  try {
    return sessionStorage.getItem(ROLE_KEY) === 'mail';
  } catch {
    return false;
  }
}

/** 메일 탭이 Basic URL로 들어온 경우. 대기 탭·폴백 탭은 통과. */
export function mailTabMustStayOnVerify(path) {
  return path === '/signup/basic' && isMailTabBlocked();
}

/** 다른 탭을 깨우기만 한다. 수신 탭은 서버를 다시 조회해야 한다. */
export function pingVerified() {
  try {
    localStorage.setItem(PING_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage({ type: 'verified' });
    channel.close();
  } catch {
    /* ignore */
  }
}

/** @param {() => void} onPing */
export function listenVerifyPing(onPing) {
  const onStorage = (event) => {
    if (event.key === PING_KEY) onPing();
  };
  window.addEventListener('storage', onStorage);
  let channel = null;
  try {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = () => onPing();
  } catch {
    channel = null;
  }
  return () => {
    window.removeEventListener('storage', onStorage);
    if (channel) channel.close();
  };
}
