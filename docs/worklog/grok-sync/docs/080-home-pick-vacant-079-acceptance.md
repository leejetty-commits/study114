# 080 · 수락 — 079 픽 vacant 샘플1+EMPTY4

- 작성일: 2026-09-24 (KST)
- 티켓: [079](079-home-pick-vacant-sample1-empty4-fixup.md) (075 픽 절)
- 상태: **로컬 기능 수락** · push/`build:dothome` **금지**
- 배포 티켓: [081](081-073-079-allowlist-deploy-ticket.md)
- 운영: [082](082-073-079-deploy-081-acceptance.md) · `4dae030` · dothome 329 · 번들 `data-pick-empty`
- 선행 육안: 사용자 — 프라임 OK · 픽 샘플5 오류 → 079 요청

---

## 0. 판정

**수락.** 보완지시문 없음.

| 항목 | 결과 |
|------|------|
| 픽 실0 → 샘플1 + EMPTY 4 | 통과 (코드·Cursor 렌더) |
| 프라임 샘플1+EMPTY2 회귀 | 통과 (미변경 보고·유지) |
| 픽 실≥1 → vacant 샘플/EMPTY 없음 | 통과 (보고) |
| 게스트 vacantSamples 미적용 | 통과 (`#/guest` 브라우저) |
| push/build · 073/auth 미포함 | 통과 |
| 로그인 홈 실0 브라우저 재확인 | 유보(API 없음) — 사용자 사전 육안+코드로 갈음 |

---

## 1. 구현 요약

`preview/home-ui/src/exposure-render.js` · `renderPickPaginatedBlock`:

- `vacantPick`일 때 `pickRowSlots(5)`: `index===0` → `vacantStudyRoomSample('pick')`, 나머지 → `renderEmptyPickPromo(kind)`
- `renderEmptyPickPromo`: `expo-card--pick expo-card--empty` · `data-pick-empty` · CTA `#/plans/positions` (카피는 `getPrimeEmptyCopy` 재사용)
- CSS: `udx-std-apply.css` — 빈 픽 카드 높이를 실픽 칸에 맞춤

샘플 5장 `Array.from(... vacantStudyRoomSample)` 전면 채움 **제거**.

---

## 2. Allowlist (차후 커밋용 · 지금 금지)

```
preview/home-ui/src/exposure-render.js
preview/home-ui/src/styles/udx-std-apply.css
```

073·auth·search-tier-render 미포함(보고). 홈 다른 dirty와 `git add -A` 금지.

---

## 3. 잔여(수락 차단 아님)

- 로그인 공부방 · 실노출 0 화면 브라우저 육안 1회(세션·API 가능 시)
- 운영 반영은 「배포해」+ allowlist 배포 티켓 후에만 (069/074와 별도 묶음 가능)

---

## 변경 이력

| 일시 (KST) | 내용 |
|------------|------|
| 2026-09-24 | 079 로컬 수락. 보완 없음. |
