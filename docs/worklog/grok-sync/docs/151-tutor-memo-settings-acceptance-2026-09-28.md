# 151 Tutor Memo Settings Block-Wrap Parity — ACCEPTANCE

- **Verdict:** ACCEPT
- **Date:** 2026-09-28 (KST)
- **Planner:** 종현
- **Machine:** ljh_work (`6aa2b772-d71e-4241-bcd4-3c985bf73991`)
- **Repo:** `D:\work\study114` · `git -c safe.directory=D:/work/study114`
- **Inspector:** PC files via Shell + box copy `/workspace/151-review/` (not Cursor report)
- **Ticket:** [151](151-tutor-memo-settings-block-wrap-parity.md)
- **Next:** 161

## Verdict summary

Uncommitted WIP on HEAD `5570243` ports study-room 쪽지설정 card/grid markup to tutor: `p20-inq-card` on status/edit, `p20-inq-sample`+`__surface` on samples, `p20-inq-edit-grid` with left choices+save / right reason-empty|reasons, and `syncReasonState` mirroring `syncStudyRoomReasonState` (hidden toggle). Catalog CSS widens every former `[data-p20-inquiries]` rule to `:is([data-p20-inquiries], [data-p21-inquiries])` only — study-room still matched; no new global selectors. Save path / `open|paused|not_accepting` enum untouched. `study-room-reg/screens.js` clean. 150 WIP (`guest-sections.js`, `naver-map.js`) byte-identical to `/workspace/150-review/` — not touched this turn. No push / no Notion.

## Claim vs actual

| Claim | Actual | Result |
| --- | --- | --- |
| HEAD `5570243` | `git rev-parse HEAD` = `55702430525bed6751b932e039f289be2eb53bb9` = `origin/main` | OK |
| no push / no commit | Branch `feat/student-mypage-a-g` tracks `origin/main` @ same SHA; 151 changes unstaged | OK |
| Allowlist: `inquiries-render.js`, `inquiries-edit.js`, `inquiry-settings-catalog.css` | Those 3 dirty for 151; plus expected 150 WIP 2 files; screens.js **no diff** | OK |
| 150 WIP untouched | SHA256 guest `191a59ae…` · naver `b67a2884…` = `/workspace/150-review/` | OK |
| SHA256 render | PC = box = `7d449066fc9cc7da81e015d868c8c0ea6a354ca9b2db64b41824ccad08534e78` (4962 B) | OK |
| SHA256 edit | PC = box = `e0db287dcea346219cafabcd5ed1d4f6cf32540ca32ff3dce9d9209115e06ae4` (3914 B) | OK |
| SHA256 catalog CSS | PC = box = `7e7d1512ac82bdbed72cda4f9005e3d6d63d3c3828dd4867746e4eeb43bf11dd` (6080 B) | OK |
| git hash-object (Win LF-norm) | render `dcaad2e1…` · edit `a5d0c2f8…` · css `681b04c5…` | recorded |
| Untracked docs/assets | `docs/046…`, `docs/047…`, `docs/README.md`, `teaser-*.js` | Pre-existing / not 151 |

Note: on-disk files are CRLF. Windows `git hash-object` LF-normalizes. Linux raw CRLF `git hash-object` differs; byte SHA256 PC↔box identical after CopyToBox.

## Must matrix

| # | Must | Result | Evidence |
| --- | --- | --- | --- |
| 1 | `p20-inq-card` on status / edit; samples card wrap | **PASS** | Status: `p21-inq-block--status p20-inq-card` + `p20-inq-status-row`. Edit: `…--edit p20-inq-card`. Samples: `…--samples p20-inq-sample` > `p20-inq-sample__surface`. Matches room `screens.js` ~518–558. |
| 2 | edit-grid left choices+save / right reasons or reason-empty | **PASS** | `p20-inq-edit-grid` → `p20-inq-edit-main` (choices + `p21-inq-save`+hint) · `aside.p20-inq-reason-empty[data-p21-inquiry-reason-empty]` · `div.p21-inq-reasons[data-p21-inquiry-reason-wrap]`. Save moved inside left column (was outside section). |
| 3 | `syncReasonState` like `syncStudyRoomReasonState` | **PASS** | Both toggle wrap `aria-disabled`+`hidden` when receiving; empty opposite `hidden`; disable reason inputs; `is-selected` on choices/reasons; `dataset.inquiryReceiving`. Tutor uses `data-p21-*` / `p21_inquiry_*` names. |
| 4 | CSS `:is([data-p20],[data-p21])` only | **PASS** | Every former `[data-p20-inquiries]` selector in catalog → `:is([data-p20-inquiries], [data-p21-inquiries])…`. No bare global new rules. Comment updated. |
| 5 | API / status enum unchanged | **PASS** | `inquiries-edit.js` save still `tutorInquiryStatusFromPref` → `setTutorInquiryStatus(id, nextStatus)`. Diff is syncReasonState only. Pref/store still `open\|paused\|not_accepting`. |
| 6 | study-room `screens.js` untouched | **PASS** | `git diff --stat screens.js` empty; status clean for that path. |

## Structural parity (room ↔ tutor)

| Block | Room (`screens.js`) | Tutor (WIP render) |
| --- | --- | --- |
| Root | `data-p20-inquiries` | `data-p21-inquiries` |
| Status | `p20-inq-card` + `p20-inq-status-row` | same classes |
| Edit | `p20-inq-card` + `p20-inq-edit-grid` | same |
| Left | choices + save + hint | same |
| Right empty | `p20-inq-reason-empty` + `hidden` when closed | same pattern (`data-p21-…`) |
| Right reasons | `p21-inq-reasons` + `hidden` when receiving | same |
| Samples | `p20-inq-sample` / `__surface` | same |
| Sync | `syncStudyRoomReasonState` | `syncReasonState` equivalent |

## CSS cascade (not broken study-room)

- `main.js`: `home-member-flows.css` L3 → `inquiry-settings-catalog.css` L39 (catalog wins on equal/higher specificity).
- Unscoped flows `.p21-inq-choices { display:flex }` (0,1,0) loses to catalog `:is(…) .p21-inq-choices { display:grid }` (0,2,0) — same path study-room already used for p20.
- Extending `[data-p20-inquiries]` → `:is([data-p20],[data-p21])` keeps study-room matches; does not remove or rewrite p20-only behavior.
- Reject gate “broken study-room CSS” / “cosmetic-only”: **not triggered** — structural markup+sync+scoped selector widen.

## Code quotes — tutor edit grid

```js
<section class="p21-inq-block p21-inq-block--edit p20-inq-card" …>
  <div class="p20-inq-edit-grid">
    <div class="p20-inq-edit-main">
      <div class="p21-inq-choices" …>…</div>
      <div class="p21-inq-save">
        <button … data-p21-inquiry-save>…</button>
        <span class="p20-inq-save-hint">저장은 쪽지 상태만 바꿉니다.</span>
      </div>
    </div>
    <aside class="p20-inq-reason-empty" data-p21-inquiry-reason-empty…>
    <div class="p21-inq-reasons…" data-p21-inquiry-reason-wrap…>
```

## Code quotes — syncReasonState

```js
function syncReasonState(page) {
  const receiving = selectedReceiving(page);
  const wrap = page.querySelector('[data-p21-inquiry-reason-wrap]');
  const empty = page.querySelector('[data-p21-inquiry-reason-empty]');
  wrap?.classList.toggle('is-inactive', receiving);
  if (wrap) {
    if (receiving) { wrap.setAttribute('aria-disabled', 'true'); wrap.setAttribute('hidden', ''); }
    else { wrap.removeAttribute('aria-disabled'); wrap.removeAttribute('hidden'); }
  }
  if (empty) {
    if (receiving) empty.removeAttribute('hidden');
    else empty.setAttribute('hidden', '');
  }
  // … disable reasons, is-selected toggles, dataset.inquiryReceiving
}
```

## Scope / forbidden

| Item | Result |
| --- | --- |
| 151 allowlist dirty | `preview/home-ui/src/tutor-reg/inquiries-render.js` · `inquiries-edit.js` · `styles/inquiry-settings-catalog.css` |
| 150 WIP preserved | `guest-sections.js` · `naver-map.js` SHA256 match `/workspace/150-review/` |
| screens.js | untouched |
| Student 쪽지설정 | not in allowlist / not dirty |
| API enum | unchanged |
| No push / `build:dothome` / Notion | HEAD == origin/main; review wrote docs only |

## Box copy

`/workspace/151-review/`: `inquiries-render.js`, `inquiries-edit.js`, `inquiry-settings-catalog.css`, `151.diff`, `home-member-flows-p21.txt` (cascade evidence), this acceptance.

## Residual (non-blocking)

- Empty-state / save-hint strings are inline Korean in render (room uses `P20_INQUIRY_COPY.*`). UI parity holds; optional follow-up to move into `inquiries-copy.js`.
- Live browser smoke on Hot `…/tutors/9/inquiries` deferred (no deploy this turn); code parity with room screens.js is the acceptance basis.
