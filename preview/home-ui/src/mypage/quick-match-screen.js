const NOT_PRIME_TITLE = '프라임에서 함께 제공되고 있는 서비스입니다';
const NOT_PRIME_BODY = '지금 광고 중인 프라임이 없어요. 프라임으로 지역을 광고하면, 조건이 맞는 학생이 등록할 때 쪽지로 알려 드려요.';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

export function renderQuickMatchScreen() {
  return `
    <section class="mp-card qm-screen" data-quick-match>
      <div data-quick-match-body><p class="mp-card__empty">불러오는 중…</p></div>
    </section>`;
}

export function bindQuickMatchScreen(root) {
  const host = root.querySelector('[data-quick-match]');
  if (!host || host.dataset.bound === '1') return;
  host.dataset.bound = '1';
  const body = host.querySelector('[data-quick-match-body]');
  if (!body) return;
  const show = (data) => {
    body.innerHTML = paint(data);
    const form = body.querySelector('[data-quick-match-save]');
    if (!form) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const note = form.querySelector('[data-quick-match-note]');
      const toggles = data.optional_toggles && !Array.isArray(data.optional_toggles) ? data.optional_toggles : {};
      fetch('/api/quick-match/settings.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-Study114-Soft-Error': '1' },
        body: JSON.stringify({ provider_id: data.provider_id, optional_toggles: toggles }),
      })
        .then((res) => res.json().then((saved) => ({ status: res.status, saved })))
        .then(({ status, saved }) => {
          if ((saved.http_status ?? status) === 409) {
            const when = formatNextChangeDay(saved.next_change_at);
            if (note) note.textContent = `${saved.message || '이번 주는 이미 저장했어요.'}${when ? ` 다음 변경일 ${when}` : ''}`;
            return;
          }
          if (saved.ok === false) {
            if (note) note.textContent = saved.message || '저장하지 못했어요.';
            return;
          }
          data = saved;
          show(saved);
        })
        .catch(() => {
          if (note) note.textContent = '저장하지 못했어요.';
        });
    });
  };
  fetch('/api/quick-match/settings.php', { credentials: 'include' })
    .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (!ok || data.ok === false) {
        body.innerHTML = `<p class="mp-card__empty">${esc(data.message || '화면을 열 수 없어요.')}</p>`;
        return;
      }
      show(data);
    })
    .catch(() => {
      body.innerHTML = '<p class="mp-card__empty">화면을 열 수 없어요.</p>';
    });
}

function paint(data) {
  if (data.schema_ready === false) {
    return '<p class="mp-card__empty">아직 이 기능을 쓸 수 없어요.</p>';
  }
  if (!data.prime_active) {
    return `
      <div class="qm-screen__off">
        <h2>${esc(NOT_PRIME_TITLE)}</h2>
        <p>${esc(NOT_PRIME_BODY)}</p>
      </div>`;
  }
  const day = formatNextChangeDay(data.next_change_at);
  const next = day ? `다음 변경일 ${esc(day)}` : '다음 변경일 없음';
  const count = Number(data.today_count || 0);
  const saveButton = hasOptionalToggles(data)
    ? `<form class="qm-screen__save" data-quick-match-save>
      <button type="submit" class="btn btn--primary btn--sm" ${data.can_save ? '' : 'disabled'}>저장</button>
      <p class="qm-screen__meta" data-quick-match-note></p>
    </form>`
    : '';
  return `
    <div class="qm-screen__benefit">
      <h2>프라임 회원 전용 혜택</h2>
    </div>
    <p class="qm-screen__meta">오늘 받은 매칭 쪽지 ${count}건 · 하루 20건까지</p>
    <p class="qm-screen__meta">${next}</p>
    ${saveButton}`;
}

function hasOptionalToggles(data) {
  const toggles = data.optional_toggles;
  return !!toggles && !Array.isArray(toggles) && Object.keys(toggles).length > 0;
}

/** 서버가 준 서울 시각의 날짜만 「11월 21일」로 보여 준다. */
function formatNextChangeDay(value) {
  const match = String(value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '';
  return `${Number(match[2])}월 ${Number(match[3])}일`;
}
