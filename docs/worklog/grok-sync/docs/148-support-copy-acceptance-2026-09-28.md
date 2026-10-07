# 148 Support Copy Guest — REWORK ACCEPTANCE

- **Verdict:** ACCEPT
- **Date:** 2026-09-28 (KST)
- **Planner:** 종현
- **Machine:** ljh_work (`6aa2b772-d71e-4241-bcd4-3c985bf73991`)
- **Repo:** `D:\work\study114`
- **Inspector:** actual PC files via Shell + box copy under `/workspace/148-rework-review/` (not Cursor report)
- **Cadence:** 146+147+148 = **3/3**
- **Prior:** `/workspace/148-review/REJECT.md` (FAQ §5.2 short · Hot·추천 · tip 「문의에서」)

## Verdict summary

Prior REJECT three fails are cleared on rework blobs. FAQ seed is **19** (§5.1 six + §5.2 adds). Guest allowlist copy has **에스크로0 · 공급자0 · Hot0**. 프라임/픽 answer uses **주목·추천**. FAQ tip uses **운영문의에서**. Prior PASS (hub / contact / library / §5.1 / provider-check / notice-001 / `#/support/safe`→`#/guide/safe`) still holds. Guide WIP remains **147 accept blobs** unchanged. Tracked dirty for 148 allowlist = 4 files only (plus expected 147 guide M). No push / no Notion.

## Claim vs actual

| Claim | Actual | Result |
| --- | --- | --- |
| HEAD `f154183b5dab4d7391f98180996d94d432468ca4` | `git rev-parse HEAD` = same; `origin/main` = same | OK — no 148 commit/push; unstaged WIP |
| support-copy `10e473b833ac8d6bfd0a79be3ad15173e072559c` | `git hash-object` on-disk (Win / LF-norm) = same; SHA256 `39b7cabb…` PC=box | OK |
| screens `53b470dd36238e90a96dabf9967381da87abd227` | same; SHA256 `909cad07…` | OK |
| nav `91f24a98082a7e1e43a0c529fb09c8db8f8f652d` | same; SHA256 `076a3004…` | OK |
| policy-copy `8fcc509120ed7a3c64a7cfe2ea2cfc08bf66841c` | same; SHA256 `5a02b63f…` | OK |
| guide/** = 147 blobs `2182f696…` / `55b3e933…` | on-disk hash-object match; SHA256 equal to `/workspace/147-rework-review/{copy,screens}.js` | OK — 148 did not touch guide |
| Allowlist dirty 4 only | Tracked `M` = policy-copy + support/{nav,screens,support-copy} + guide/{copy,screens} | OK — guide M = 147 WIP only |
| Untracked docs | `docs/046-…`, `docs/047-…`, `docs/README.md` | Pre-existing / not 148 |
| No push / no Notion | HEAD == origin/main; review did not push or write Notion | OK |

Note: on-disk files are CRLF. Windows `git hash-object` LF-normalizes (claimed blobs). Linux raw CRLF hashes differ; LF-stripped hashes match claims. Byte SHA256 PC↔box identical after CopyToBox.

## Rework fails cleared

| # | Prior REJECT | Result | Evidence |
| --- | --- | --- | --- |
| 1 | FAQ §5.2 short (only 4 adds beyond §5.1 six; need 채널4+찾기/등록3+안전4+계정·유료) | **PASS** | `FAQ_ITEMS` count **19**. Adds 07–19 = 채널4 (이용안내↔고객센터·쪽지↔운영문의·로그인게이트·내 문의 내역) + 찾기/등록3 (가입노출·학생찾기·비교 max3+`#/guide/compare`) + 안전4 (선입금·증빙·신고·학생개인정보) + 계정·유료2 (로그인·유료상품≠과외비). Prior reject blob had **10** FAQs. |
| 2 | Hot·추천 in 프라임/픽 answer | **PASS** | `q: '프라임/픽은 무엇인가요?'` → `a: '…주목·추천 등 광고 표시는…'`. `Hot` = 0 in all 4 allowlist files. |
| 3 | tip 「문의에서」 | **PASS** | `screens.js` tip: 「FAQ에 없는 내용은 **운영문의에서** 남겨 주세요…」 + CTA 「운영문의 남기기」. |

## FAQ inventory (support-copy `FAQ_ITEMS`)

| # | Q title |
| --- | --- |
| 01 | 회원끼리 연락은 어떻게 하나요? |
| 02 | 운영문의는 어디로 하나요? |
| 03 | 안전번호나 대금 보관이 있나요? |
| 04 | 유료 서비스는 학부모가 구매하나요? |
| 05 | 프라임/픽은 무엇인가요? |
| 06 | 환불·과외비 분쟁은? |
| 07 | 이용안내와 고객센터는 같은 곳인가요? |
| 08 | 쪽지와 운영문의는 같은가요? |
| 09 | 로그인 없이 운영문의를 남길 수 있나요? |
| 10 | 운영문의 답변은 어디서 보나요? |
| 11 | 가입하면 바로 노출되나요? |
| 12 | 학생찾기는 누구를 위한 화면인가요? |
| 13 | 비교는 최대 몇 개인가요? |
| 14 | 선입금은 어떻게 해야 하나요? |
| 15 | 제출자료나 증빙은 보증인가요? |
| 16 | 신고는 어디로 하나요? |
| 17 | 학생 개인정보는 어떻게 다루나요? |
| 18 | 로그인이 안 되면 어디로 하나요? |
| 19 | 유료상품 환불과 과외비 환불은 같나요? |

## Prior PASS (still hold)

| # | Must | Result | Evidence |
| --- | --- | --- | --- |
| 1 | 에스크로0 · 공급자0 · 포지션0 | **PASS** | Token scan on 4 allowlist files = 0 each. Policy bullets use 「대금 보관·안전결제」. |
| 2 | Hub §4.1 lead + shortcuts 이용안내 · policies/safety | **PASS** | Hero: 「필요한 답을 빠르게…이용안내…운영문의…쪽지와 운영문의는 다릅니다」. Quick cards include 이용안내 (`#/guide`) · 안전과외 (`#/support/policies/safety`). |
| 3 | Contact §4.2 · 운영문의 / 운영문의 남기기 | **PASS** | nav label/H1/button = 운영문의 / 운영문의 남기기. Lead: 운영팀·오류·정책·계정 · 수업=쪽지 · 마이페이지→내 문의 내역. |
| 4 | Library §4.3 | **PASS** | `renderSupportLibrarySection` lead: 「안내 자료와 양식입니다. 일부는 로그인 후에 볼 수 있습니다. 이용 방법은 이용안내를 먼저 보세요.」 |
| 5 | §5.1 six | **PASS** | Q01–06 titles/answers match memo lock (대금 보관·공부방·과외쌤·동네 노출(기간)·주목·추천). |
| 6 | Compare max3 + guide link | **PASS** | Q13: 「최대 3개」 + `[이용안내](#/guide/compare)`. |
| 7 | provider-check title | **PASS** | `공부방·과외쌤 체크리스트`. |
| 8 | parent-check 공개→표시/보여 | **PASS** | Body 「필요한 범위만 **보여** 주세요」; checklist 「학생 **표시** 범위」. (Title still `학부모·학생 의뢰 체크리스트` — same as prior-reject blob; not a rework regression.) |
| 9 | notice-001 | **PASS** | 「약관·정책의 안전과외 · 이용안내의 안전이용」. |
| 10 | `#/support/safe` → `#/guide/safe` | **PASS** | `guide/router.js` maps `/support/safe` → `/guide/safe`; router/guide untouched by 148; `state.js` `replace('#/guide/safe')` present. |

## Allowlist / scope

| File | Role |
| --- | --- |
| `preview/home-ui/src/support/support-copy.js` | FAQ 19 · GUIDE seeds · notices · OPERATIONAL_* |
| `preview/home-ui/src/support/screens.js` | Hub/contact/library/FAQ tip render |
| `preview/home-ui/src/support/nav.js` | 문의→운영문의 |
| `preview/home-ui/src/policy-copy.js` | 에스크로→대금 보관·안전결제 (3 sites) |

Box archive: `/workspace/148-rework-review/` (js + `allowlist.diff`).

## Browser smoke

Not run (static string + blob + prior-PASS regression scan sufficient for this accept).

## Cadence / next

- 146 ACCEPT + 147 ACCEPT + **148 ACCEPT** → **3/3**
- Local WIP remains uncommitted (146 guide + 147 guide + 148 support). Deploy only when user says 「배포」 (ticket: 146+147+148 together). No push / no `build:dothome` by this review.
