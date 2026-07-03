/**
 * 단계 저장 후 다음 화면으로 이동
 * @param {import('./state.js').RegisterState} state
 * @param {string} step
 * @param {string|null} nextPath
 */
export async function saveAndNavigate(state, step, nextPath) {
  const { saveStep } = await import('./register-api.js');
  const { payloadForStep } = await import('./form-collect.js');

  const result = await saveStep(step, payloadForStep(step, state), state.study_room_id ?? null);
  state.study_room_id = result.study_room_id;
  state.profile_status = result.profile_status;
  state.detail_completion_status = result.detail_completion_status;
  sessionStorage.setItem('study114_study_room_id', String(result.study_room_id));

  if (nextPath) {
    const { navigate } = await import('./layout.js');
    navigate(nextPath);
  }
}

/**
 * @param {HTMLButtonElement|null|undefined} btn
 * @param {() => Promise<void>} fn
 */
export async function withSaving(btn, fn) {
  if (btn) {
    btn.disabled = true;
    btn.dataset.saving = '1';
  }
  try {
    await fn();
  } catch (err) {
    alert(err instanceof Error ? err.message : '저장 실패');
    throw err;
  } finally {
    if (btn) {
      btn.disabled = false;
      delete btn.dataset.saving;
    }
  }
}
