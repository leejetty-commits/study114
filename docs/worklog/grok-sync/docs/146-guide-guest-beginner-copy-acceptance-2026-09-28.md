# 146 Guide Guest Beginner Copy — REWORK ACCEPTANCE

- **Verdict:** ACCEPT
- **Date:** 2026-09-28 (KST)
- **Planner:** 종현
- **Machine:** ljh_work (`6aa2b772-d71e-4241-bcd4-3c985bf73991`)
- **Repo:** `D:\work\study114`
- **Inspector:** actual PC files via Shell (not Cursor paste)

## Verdict summary

Guest guide rework Must locks hold on both `preview/home-ui/src/guide/screens.js` (render SoT via `index.js` → `renderGuideScreen`) and `preview/home-ui/src/guide/copy.js` (nav/`GUIDE_PAGES`). Allowlist clean. No commit/push of 146 changes. 147 may proceed.

## Claim vs actual

| Claim | Actual | Result |
| --- | --- | --- |
| HEAD `f154183b5dab4d7391f98180996d94d432468ca4` | `git rev-parse HEAD` = same; `origin/main` = same | OK — no new 146 commit; unstaged WIP only |
| copy blob `c086e1318d7187ffe6fa8378317c1bc34e7943ef` | `git hash-object` on-disk = same | OK |
| screens blob `72446001b8ef5be2c48e15e220e04078b13cd148` | `git hash-object` on-disk = same | OK |
| Line endings | Both files CRLF-only on disk (`copy` 638 CRLF, `screens` 408 CRLF; 0 LF-only). Claimed blobs = on-disk (CRLF) hashes | Note |
| Dirty tracked allowlist = only two guide files | `M preview/home-ui/src/guide/copy.js`, `M …/screens.js` only | OK |
| `study-room-reg/screens.js` untouched vs HEAD | empty `git diff HEAD -- …/study-room-reg/screens.js` | OK |
| Untracked docs | `docs/046-…`, `docs/047-…`, `docs/README.md` | Pre-existing / not 146 |
| No push / no build:dothome | HEAD == origin/main; 146 changes unstaged; no deploy performed by review | OK |

## Rework Must evidence

| # | Must | Evidence |
| --- | --- | --- |
| 1 | `renderGuideSafe` 신뢰정보 one-sentence definition | `screens.js:309` 「노출된 신뢰정보는 상대가 프로필에 보여 둔 소개·자료이며, 플랫폼이 확인·인증했다는 뜻이 아닙니다.」; wired `screens.js:298` / `safe: renderGuideSafe` |
| 2 | `copy.js` safe first-step **body** same meaning | `copy.js:579-580` step title + body ending with same definition sentence |
| 3 | Compare FAQ both files: 최대 3개 + 담은 것 중 일부를 비교에서 내린 뒤 + 찜 can hold more | `screens.js:281`; `copy.js:542` — both contain 「최대 3개까지」「찜은 더 담을 수 있어요」「지금 담은 것 중 일부를 비교에서 내린 뒤 다른 후보를 담으세요」 |
| 4 | Tutor register lead 「상세등록에서 보완」 not 「상세 페이지에서 보완」 | `copy.js:311` 과외쌤 등록 lead: 「…학부모가 볼 추가 정보는 상세등록에서 보완합니다.」; 「상세 페이지에서 보완」 absent in both files. Seek/finder 「상세 페이지」 uses (e.g. start/compare) OK |
| 5 | Allowlist + study-room-reg restored | Tracked dirty = 2 guide files only; study-room-reg diff empty |
| 6 | `#/guide/start` list/detail before login; 찜/쪽지 after | `screens.js:130`; `copy.js:168` 「목록·상세는 로그인 전에도 볼 수 있고, 찜·쪽지는 로그인 후입니다.」 |
| 7 | Prior 146 wins preserved | Hub 3 cards `screens.js:83-101` + aux 「학생·학부모예요」 `105`; order 찜→비교→쪽지 `screens.js:271`, start flow 찜→비교→…쪽지 `125/129`; zero 「비교 → 찜」; no 공급자/채집/학생 의뢰; 공통가입=회원가입 (`screens.js:186-188`, `copy.js` principles); 증빙 비심사 on register (`screens.js:186`) |

## Render path proof

- `preview/home-ui/src/guide/index.js` imports `renderGuideScreen` from `./screens.js` and renders body from it.
- `copy.js` still feeds `nav.js` (`GUIDE_NAV_ITEMS`, `GUIDE_PAGES`) — titles/nav/aux data; both updated where required.

## Reject criteria (all clear)

- Missing 신뢰정보 on safe path — no
- Compare max-3 without 빼고/내린 뒤 — no
- Tutor lead still 「상세 페이지에서 보완」 — no
- Allowlist breach — no
- 「비교 → 찜」 residual — no
- Reverted 146 order/jargon — no
- Commit/push of 146 — no

## Browser smoke

Not run (static string + render-path proof sufficient; live/local preview not required for this accept).

## Intentionally deferred to 147

- Student sections: 「학생찾기」「학생등록」 full guide sections still absent (0 hits).
- Full FAQ §4 dumps still not in these two files (partial FAQ/compare blocks only).
- 147 (student sections + full FAQ §4) can proceed.

## Notes

- `copy.js:606` contains 「검증·인증·보증처럼 오해될 수 있는 표현 대신…」 — warning *against* those terms; not jargon regression.
- Tutor field copy still has 「활동 시·군 1개」 as field label (correct domain term), not the forbidden guest-jargon patterns 「활동 시 1개」/「이상시」.
