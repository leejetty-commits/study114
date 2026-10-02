/**
 * 홈 [공지 | 동네 인사] 칸이 쓰는 메모리 캐시(브라우저 저장소 없음).
 * 진행 중 요청은 하나만 두고 같이 기다린다. 다른 세션 주인(계정·역할)으로 받은 값은 없는 것으로 본다.
 * 실패는 빈 값을 담되 failed 로 따로 표시해 0건과 구분한다. 실패한 값은 다음 그리기 때 다시 받는다.
 */

/** @typedef {'loading'|'ready'|'failed'} NewsLoadStatus 받는 중 · 받음(0건 포함) · 실패 */

/**
 * @template T
 * @param {() => Promise<T>} load
 * @param {T} emptyValue
 * @param {number} ttlMs
 */
export function createNewsLoader(load, emptyValue, ttlMs) {
  /** @type {T|null} */
  let data = null;
  let owner = '';
  let loadedAt = 0;
  let failed = false;
  /** @type {Promise<T>|null} */
  let pending = null;
  let pendingOwner = '';
  let generation = 0;
  return {
    /** @param {string} who @returns {T|null} */
    peek(who) {
      return data !== null && owner === who ? data : null;
    },
    /** @param {string} who */
    isFresh(who) {
      return data !== null && owner === who && !failed && Date.now() - loadedAt < ttlMs;
    },
    /** @param {string} who @returns {NewsLoadStatus} */
    status(who) {
      if (data === null || owner !== who) return 'loading';
      return failed ? 'failed' : 'ready';
    },
    /** @param {string} who @returns {Promise<T>} */
    ensure(who) {
      if (this.isFresh(who)) return Promise.resolve(/** @type {T} */ (data));
      if (pending && pendingOwner === who) return pending;
      const gen = ++generation;
      pendingOwner = who;
      pending = load()
        .then(
          (result) => ({ ok: true, result }),
          () => ({ ok: false, result: emptyValue }),
        )
        .then(({ ok, result }) => {
          if (gen === generation) {
            data = result;
            owner = who;
            loadedAt = Date.now();
            failed = !ok;
            pending = null;
          }
          return result;
        });
      return pending;
    },
    reset() {
      data = null;
      owner = '';
      loadedAt = 0;
      failed = false;
      pending = null;
      pendingOwner = '';
      generation += 1;
    },
  };
}
