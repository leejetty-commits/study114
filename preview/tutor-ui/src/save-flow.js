export async function saveAndNavigate(state, step, nextPath) {
  const { saveStep } = await import('./register-api.js');
  const { payloadForStep } = await import('./form-collect.js');
  const result = await saveStep(step, payloadForStep(step, state), state.tutor_id ?? null);
  state.tutor_id = result.tutor_id;
  state.profile_status = result.profile_status;
  state.detail_completion_status = result.detail_completion_status;
  sessionStorage.setItem('study114_tutor_id', String(result.tutor_id));
  if (nextPath) {
    const { navigate } = await import('./layout.js');
    navigate(nextPath);
  }
}

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
