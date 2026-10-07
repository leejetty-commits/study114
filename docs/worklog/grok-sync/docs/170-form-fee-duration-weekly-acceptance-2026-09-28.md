# 170 · 수락 판정 — 금액 천원 + 1회 수업시간·주 회수 (REWORK)

- 작성: 2026-09-28 22:05 KST · executor strong-review (REWORK)
- 저장소: `D:\work\study114` · machineId `6aa2b772-d71e-4241-bcd4-3c985bf73991`
- 커밋: `95aca1f` (`fix(forms): convert registration-check lesson fee from cheonwon with times 1000.`)
- 부모: `8039ec6` (170 1차 · 당시 REJECT) ← `662fa75` (169 ACCEPT)
- `git merge-base --is-ancestor` 8039ec6→95aca1f · 662fa75→95aca1f **OK**
- push 없음 · ahead 4 · dirty는 untracked export/docs만 (커밋 미포함)
- 정본: [170 ticket](170-form-fee-duration-weekly-cursor-ticket-2026-09-28.md) · [168](168-form-fields-global-policy-2026-09-27.md) §1.3–1.5
- Cursor summary: **불신** · `git show` / grep / 파일 직접 검증
- 1차 판정 문서: 동일 파일 이전본 **REJECT** (`8039ec6` · `priceWon` ×10000)

---

## 판정: **ACCEPT**

### REWORK 검증 (거부 근거 해소)

| # | 검사 | 결과 |
|---|------|------|
| 1 | Diff `8039ec6..95aca1f` | **2 files only** · `registration-check-model.js` + `registration-check-edit.js` · +6/−4 |
| 2 | model `priceWon` | `manwon * 10000` **제거** · `cheonwonInputToWon(s?.monthly_fee_manwon)` (×1000) 우선 · 없으면 `price_amount` raw |
| 3 | edit light patch | `monthly_fee_manwon` → `cheonwonInputToWon(n)` → `patch.price_amount` (공유 모듈 · ×1000) |
| 4 | RC 경로 `* 10000` | study-room + tutor `registration-check*.js` **0건** |
| 5 | suffix | `RC_LIGHT_FIELDS.monthly_fee_manwon` suffix **「천원」** 유지 · max 99999 |
| 6 | 171 | rework diff에 logo/BrandHero **없음** · 662fa75..95aca1f에도 logo-full/renderBrandHero 파일 **없음** |
| 7 | 169 | `school-grade.js` **diff 없음** |

**공유 헬퍼:** `preview/shared/fee-cheonwon.js` `WON_PER_CHEONWON = 1000` · `cheonwonInputToWon` = `n * 1000`.

**Tutor RC:** `preferred_fee_amount`를 원으로 그대로 쓰고 `formatTutorFeeCard` → `formatMonthlyWon`(/1000 천원). cheonwon UI ×10000 경로 **없음**.

**허용 잔여 `* 10000` (cheonwon UI 아님):**

1. `study-room-ui/.../form-collect.js` — 텍스트에 「만」있을 때만 legacy
2. `StudyRoomRegisterService.php` — 「만」 legacy 파서

---

## 1) Diff 범위 (전체 170 = 8039ec6 + 95aca1f)

| 항목 | 결과 |
|------|------|
| HEAD | `95aca1f` ← `8039ec6` ← `662fa75` |
| Rework | 등록점검 2파일만 · 범위 OK |
| 171 로고 | **없음** |
| 169 | school-grade 무변경 |
| admin | 미포함 |
| dirty | untracked만 · stage 안 됨 |

---

## 2) 금액 「천원」·저장 원=UI×1000 (1차 PASS + REWORK)

1차에서 OK였던 경로 재확인:

| 경로 | 환산 |
|------|------|
| `fee-cheonwon.js` | ×1000 |
| 공부방 `form-collect.js` `cheonwonToPriceAmount` | ×1000 |
| `StudyRoomRegisterService::priceAmountFromLesson` | ×1000 |
| 가입 PHP `BasicRegisterService::cheonwonInputToWon` | ×1000 |
| `exposure-format.js` `formatMonthlyWon` | 표시 /1000 「천원」 |
| **RC `priceWon` / edit** (REWORK) | **`cheonwonInputToWon` ×1000** |

티켓 「라벨만 천원 · 환산 ×10000 잔존 → REJECT」조건: **해소**.

---

## 3) 1회 수업시간 (1차 PASS 유지)

- `lesson-duration-options.js`: 20..120 step 10 + 기타(`999`)
- 기본 목록 150/180/over_180 없음
- 라벨 「1회 수업시간」(RC_LIGHT 포함)

---

## 4) 주 회수 (1차 PASS 유지)

- `lesson-weekly-options.js`: 1..7 + 기타(`8`)
- 「7회 이상」실사용 **0** (주석 「쓰지 않는다」1건만)

---

## 5) Admin / shop money

- admin 미수정 — OK
- shop-formatters 천원 표시 — 허용

---

## 6) 스모크 체크리스트 (티켓 §6)

| # | 항목 | 판정 |
|---|------|------|
| 1 | 공부방 수업료 천원·×1000 | **PASS** (RC fallback 포함) |
| 2 | 찾기 금액 필터 천원 | PASS (1차) |
| 3 | 카드/목록 천원 | PASS |
| 4 | 1회 20~120+기타 | PASS |
| 5 | 주 1~7+기타 · 「7회 이상」없음 | PASS |
| 6 | 라벨 「1회 수업시간」 | PASS |
| 7 | 169 회귀 | PASS |

---

## 요점정리 (planner · 한국어)

**ACCEPT.** REWORK `95aca1f`(부모 `8039ec6`)는 등록점검 model·edit 2파일만 손댐. 거부 원인이었던 `priceWon`의 `manwon*10000`을 제거하고 `cheonwonInputToWon`(×1000)으로 맞춤. edit도 동일 헬퍼. study-room·tutor registration-check에 `*10000` 잔존 0. 1차 170 PASS(공유 천원·수업시간 20~120+기타999·주회수 1~7+기타8·대부분 저장 ×1000)·169·171 미포함 유지. push 없음.
