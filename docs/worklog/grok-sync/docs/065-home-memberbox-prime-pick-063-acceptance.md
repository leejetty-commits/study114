# 065 · 063 수락 — 멤버박스 · 프라임/픽 빈자리 샘플

- 작성일: 2026-09-24 (KST)
- 티켓: [063](063-home-memberbox-prime-pick-sample-ticket.md) · 기획 [062](062-home-memberbox-map-prime-pick-planning.md)
- 상태: **로컬 수락** (커밋·push·`build:dothome` 없음 · 지시 준수)
- 기준 보고: Cursor 로그인 공부방 홈만 · 렌더 스모크 개수 일치 · 브라우저 `#/study-room`은 세션 없어 `#/guest`로 돌아감(로그인 HTML/분기 검증은 보고·코드로 대체)

---

## 0. 판정

**수락.** 063 멤버박스·프라임/픽 샘플이 잠금과 일치한다. 맵(064)·signup·과외 홈은 미포함.  
보완지시문 없음.

| 항목 | 결과 |
|------|------|
| 멤버박스 배지 `쪽지 후기함` ∥ 마이페이지 | 통과 |
| 악센트바·테두리·그림자·옅은 tint · 풀블리드 금지 | 통과 (좌측 Primary 바 4px · tint `#f3f8ff`) |
| 프라임 실0 → 샘플1+EMPTY2 · 유료상품 중앙 | 통과 |
| 프라임 실1~2 → 샘플 없음 | 통과 |
| 픽 실0 → 한 줄 5칸 샘플 · 후보없음만/섹션붕괴 금지 | 통과(당시) · **이후 075에서 샘플1+EMPTY4로 재잠금** |
| 047 자기방 프라임0 · 게스트 `demo_prime` 경로 분리 | 통과 (`vacantSamples`만 · 풀 미삽입) |
| 맵·push/build | 제외·미실행 |

---

## 1. 구현 요약 (코드 대조)

분기: `vacantSamples = kind === 'study_room' && guest !== true && viewerRole === 'study_room'`  
(`search-tier-render.js` → `renderPrimeSlotGrid` / `renderPickPaginatedBlock`)

- 프라임: `occupiedItems.length === 0`일 때만 `slots[0] = vacantStudyRoomSample('prime')`, 나머지 EMPTY.
- 픽: `pickPool.length === 0`이면 `min(pickSetSize, 5)`장 샘플. 페이지 크기 10(두 줄)은 샘플에 미사용.
- 샘플: `_vacantSample` · `data-expo-sample`/`data-expo-virtual` · `data-provider-id` 없음 · 이미지 mid `샘플` 스탬프 · 지역 `가상` · wish/compare inert.
- 게스트 HTML·`demo_prime_filled` 경로 미사용(보고·분기 일치).

---

## 2. Allowlist (차후 스테이징용 · 지금 커밋 금지)

```
preview/home-ui/src/screens/study-room.js
preview/home-ui/src/exposure-render.js
preview/search-ui/src/search-tier-render.js
preview/home-ui/src/styles/home-marketing-banner.css
preview/home-ui/src/styles/udx-std-apply.css
preview/home-ui/src/styles/home-listings.css
```

워킹트리에 auth/signup/`naver-map`/helpers 등 dirty가 남아 있음 → **위 6파일과 섞지 말 것**.

---

## 3. 잔여(수락 차단 아님)

- 로그인 세션 브라우저 육안: 가능동0에서 샘플 미노출 확인(2026-09-24) → 원인 early-return · 보완 [075](075-home-prime-pick-vacant-bypass-empty-fixup.md)
- 맵 미표시는 **064 진단** 별도
- 운영 반영은 「배포해」 + allowlist 티켓 후에만
- 과외쌤 홈 동일 샘플 루틴은 후순위(062)

---

## 변경 이력

| 일시 (KST) | 내용 |
|------------|------|
| 2026-09-24 | 063 로컬 수락. 보완 없음. |
