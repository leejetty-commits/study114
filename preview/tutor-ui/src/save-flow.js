/** 부트가 id를 못 담았어도 저장 전에 서버 행을 다시 찾아 INSERT를 피한다. */
async function resolveTutorId(state) {
  if (state.tutor_id) return state.tutor_id;
  const { loadTutor } = await import('./register-api.js');
  const existing = await loadTutor().catch(() => null);
  if (existing?.tutor_id) {
    state.tutor_id = existing.tutor_id;
    return existing.tutor_id;
  }
  const cached = Number(sessionStorage.getItem('study114_tutor_id') || '');
  if (Number.isFinite(cached) && cached > 0) {
    state.tutor_id = cached;
    return cached;
  }
  return null;
}

export async function saveAndNavigate(state, step, nextPath) {
  const { saveStep, saveBasicWithRegions } = await import('./register-api.js');
  const { payloadForStep } = await import('./form-collect.js');
  const payload = payloadForStep(step, state);
  const tutorId = await resolveTutorId(state);
  const result = step === 'basic'
    ? await saveBasicWithRegions(payload, tutorId)
    : await saveStep(step, payload, tutorId);
  state.tutor_id = result.tutor_id;
  state.profile_status = result.profile_status;
  state.detail_completion_status = result.detail_completion_status;
  state.detail_missing = Array.isArray(result.detail_missing) ? result.detail_missing : [];
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
