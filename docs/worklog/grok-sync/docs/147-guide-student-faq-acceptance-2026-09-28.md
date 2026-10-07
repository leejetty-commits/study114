# 147 Guide Student FAQ — REWORK ACCEPTANCE

- **Verdict:** ACCEPT
- **Date:** 2026-09-28 (KST)
- **Planner:** 종현
- **Machine:** ljh_work (`6aa2b772-d71e-4241-bcd4-3c985bf73991`)
- **Repo:** `D:\work\study114`
- **Inspector:** actual PC files via Shell + box copy under `/workspace/147-rework-review/` (not Cursor report)
- **Next:** 148 · cadence 146+147 = **2/3**

## Verdict summary

Prior REJECT (본문 §1.5/§1.6 미달 · FAQ 토큰/checklist · compare FAQ 없음) is cleared on rework blobs. Render SoT remains `screens.js` via `index.js` → `renderGuideScreen` (screens does **not** import copy FAQ). `copy.js` student bodies + page FAQs sync with screens. Allowlist dirty = 2 guide files only. No push (HEAD == origin/main).

## Claim vs actual

| Claim | Actual | Result |
| --- | --- | --- |
| HEAD `f154183b5dab4d7391f98180996d94d432468ca4` | `git rev-parse HEAD` = same; `origin/main` = same | OK — no 147 commit/push; unstaged WIP |
| copy blob `2182f696a79d6d896b90f5d5c23cf06fe2cbe6b6` | `git hash-object` on-disk = same | OK |
| screens blob `55b3e93336982823b9940c69dda31eabf9ba69ee` | `git hash-object` on-disk = same | OK |
| Allowlist dirty only `copy.js` + `screens.js` | Tracked `M` = those 2 only | OK |
| Untracked docs | `docs/046-…`, `docs/047-…`, `docs/README.md` | Pre-existing / not 147 |
| No push | HEAD == origin/main; review did not push | OK |

## Must evidence

| # | Must | Result | Evidence |
| --- | --- | --- | --- |
| 1 | 학생찾기 body = §1.5 meaning (요청 찾는 화면; 공부방찾기·과외쌤찾기와 방향 반대; 홍보지역+조건검색; 우리동네=미리보기 vs 학생찾기) | **PASS** | **screens** `Students` / 학생찾기 (공부방·과외쌤용): 「학생찾기는 공부방·과외쌤이 근처에 올라온 학생·학부모 요청을 찾아보는 화면입니다.」「…「공부방찾기」「과외쌤찾기」와는 방향이 반대예요.」「기본으로 내 홍보 지역의 요청이 보이고, 조건을 바꿔 더 넓게 검색할 수 있습니다.」「홈의 「우리동네 학생」은 잠깐 훑는 동네 미리보기이고, 자세히 찾으려면 학생찾기로 가면 됩니다.」 **copy** `GUIDE_PAGES` start student block body = same text (whitespace-normalized equal). |
| 2 | 학생 등록 body §1.6 (가입→기본정보→기본노출; 무심사; 상세 나중 보완; 저장해야 이어짐/창만 닫으면 X); ZERO 「공개/숨김」「공개와 숨김」 | **PASS** | **screens** `Students` / 학생 등록: 「회원가입 후 기본 정보를 입력하면, 요청이 학생찾기 등에 기본으로 노출될 수 있습니다.」「운영자 심사·승인을 기다리지 않습니다.」「상세 정보는 나중에 보완해도 됩니다. (저장을 눌러야 이어집니다 — 창만 닫으면 저장되지 않아요.)」 **copy** body identical. Phrase scan: `공개/숨김`=0, `공개와 숨김`=0 in both files. |
| 3 | 5 pages real Q/A FAQ (not 1-line checklist only); quote counts; compare FAQ = max3+내린뒤+찜더+학생비대상+찜→비교→쪽지 | **PASS** | screens `faqBlock` counts: **home 4 · start 4 · register 4 · compare 3 · safe 3**. All are `q`/`a` pairs (not checklist-only). Compare FAQ A1: 「최대 3개까지」「찜은 더 담을 수 있어요」「비교에서 내린 뒤」; A2: 「학생은 찜·비교 대상이 아니에요」; A3: 「찜 → 비교 → 쪽지」. copy compare `faq` + `compareGuide.blocks` match screens. |
| 4 | Preserve 146: 신뢰정보 on safe; tutor lead 「상세등록에서 보완」 (not 「상세 페이지에서 보완」); 찜→비교→쪽지; zero 비교→찜; zero 학생 의뢰; hub 3 cards + aux | **PASS** | safe lead/FAQ: 「노출된 신뢰정보는 상대가 프로필에 보여 둔 소개·자료이며…」. Tutor lead copy: 「…상세등록에서 보완합니다.」; 「상세 페이지에서 보완」=0. Order 「찜 → 비교 → 쪽지」 present; 「비교 → 찜」=0; 「학생 의뢰」=0. Hub: 3 `situation-card` (start/register/compare) + `aux-links` (학생·학부모 / 안전이용 / support). |
| 5 | Allowlist dirty only 2 files; no push | **PASS** | See claim table. |

## FAQ inventory (screens SoT)

| Page | Count | Q titles |
| --- | --- | --- |
| home | 4 | 이용안내와 고객센터는 같은 곳인가요? · 어디부터 보면 되나요? · 로그인 전에도 볼 수 있나요? · 쪽지와 운영문의는 같은가요? |
| start | 4 | 학생찾기는 누구를 위한 화면인가요? · 게스트도 목록과 상세를 볼 수 있나요? · 홈의 우리동네 학생과 학생찾기는 같은가요? · 추천 순서는 무엇인가요? |
| register | 4 | 기본 정보를 입력하면 바로 노출되나요? · 상세 정보는 언제 보완하나요? · 창을 닫아도 저장되나요? · 학생 등록은 공부방·과외쌤 등록과 같나요? |
| compare | 3 | 비교는 최대 몇 개인가요? · 학생도 찜하거나 비교할 수 있나요? · 어떤 순서로 쓰면 되나요? |
| safe | 3 | 노출된 신뢰정보는 인증인가요? · 선입금은 어떻게 해야 하나요? · 학생·학부모도 같은 주의를 하나요? |

Home / start / register(student block) / compare / safe FAQ pairs: copy ↔ screens sync verified.

## Render path

- `preview/home-ui/src/guide/index.js` → `renderGuideScreen` from `./screens.js`
- `screens.js` hardcodes page bodies + `faqBlock` (no `import` from `./copy.js`)
- `copy.js` still feeds `nav.js` / `router.js` (`GUIDE_NAV_ITEMS`, `GUIDE_PAGES`); student bodies + FAQs kept in sync with screens

## Reject criteria (all clear vs prior REJECT)

- §1.5 학생찾기 meaning gap — **cleared**
- §1.6 공개/숨김 / missing 기본노출·저장 — **cleared**
- FAQ checklist-only / compare missing FAQ section — **cleared** (compare has FAQ section + required tokens)
- 146 regressions / allowlist / push — **none**

## Browser smoke

Not run (static string + render-path + blob proof sufficient for this accept).

## Cadence / next

- 146 ACCEPT + 147 ACCEPT → **2/3**
- **Next = 148** (support copy guest audit per queue)
