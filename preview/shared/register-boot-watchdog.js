/**
 * 등록 SPA(/register/room/, /register/tutor/) 엔트리 워치독 해제.
 * HTML inline 워치독이 만든 #register-boot-fallback 를 제거한다.
 */
export function markRegisterBootDone() {
  try {
    if (typeof window.__registerBootDone === 'function') {
      window.__registerBootDone();
      return;
    }
  } catch {
    /* ignore */
  }
  window.__REGISTER_BOOT_DONE__ = true;
  const el = document.getElementById('register-boot-fallback');
  if (el && el.parentNode) el.parentNode.removeChild(el);
}

/** module load / 치명 실패 — 지연 안내와 동일 UI로 전환 */
export function markRegisterBootFailed() {
  try {
    if (typeof window.__registerBootFail === 'function') {
      window.__registerBootFail();
      return;
    }
  } catch {
    /* ignore */
  }
}
