# 075 · Cursor 보완 — 공부방 홈 · 목록 0이어도 프라임/픽 샘플 렌더

- 작성일: 2026-09-24 (KST)
- 선행: [065](065-home-memberbox-prime-pick-063-acceptance.md) · [062](062-home-memberbox-map-prime-pick-planning.md) · 운영 [074](074-home-063-067-deploy-acceptance.md) (`f6b8498`)
- 증상 증거: 로그인 가능동 홈 · 맵「공부방 0」· 아래 「이 지역에 등록된 공부방이 없습니다」만 · 프라임/픽 섹션·샘플 **없음** (`assets/075-login-ganeung-zero-no-samples.png`)
- 상태: **부분 진행 → 픽은 079로 이관** (프라임 샘플1+EMPTY2 사용자 확인 OK · 픽 샘플5 잔여). 로컬만 · push 금지.
- 후속: [079](079-home-pick-vacant-sample1-empty4-fixup.md) → **수락 [080](080-home-pick-vacant-079-acceptance.md)**
- 판정: 063 **미작업 아님**. `f6b8498`에 vacantSamples 코드는 있으나, **items.length===0 early-return**이 그 앞에 있어 운영에서 안 보임.
- 픽 UX: 사용자 「반영해」(2026-09-24) → 실0일 때 **샘플 1 + EMPTY 4**(구 065의 샘플 5장 전면 채움 **폐기**)

---

## 0. 한 줄

공부방 로그인 홈에서 동네 목록이 0이어도, 「등록된 공부방 없음」**만**으로 티어 전체를 대체하지 말고, **프라임(샘플1+EMPTY2) · 픽(샘플1+EMPTY4)**을 그린 뒤 베이직만 짧은 빈 안내를 둔다.

---

## 1. 원인 (코드 · `f6b8498`)

`preview/search-ui/src/search-tier-render.js` — 티어 결과 함수 초반:

```js
if (!items.length) {
  return `…${renderSearchZeroState(tab, mode)}…`; // 「이 지역에 등록된 공부방이 없습니다」
}
// 아래 vacantSamples + renderPrimeSlotGrid / renderPickPaginatedBlock 은 도달 불가
```

`vacantSamples = kind === 'study_room' && guest !== true && viewerRole === 'study_room'` 및 샘플 로직은 **그 아래**에만 있어, **실 목록 0이면 샘플이 영원히 안 나옴**.

멤버박스·맵(067)은 스크린샷상 동작 → 배포 자체는 됨.

---

## 2. 잠금 UX

| 구간 | 실데이터 0일 때 |
|------|----------------|
| 프라임 | **샘플 1 + EMPTY 2** · 유료상품 중앙 · sku/자기방 아님 |
| 픽 | **샘플 1 + EMPTY 4**(한 줄 5칸). 샘플=가상+「샘플」· inert. EMPTY=픽 카드 크기 빈칸+안내/CTA. **샘플 5장 전면 채움 금지**(065 구현 폐기) |
| 베이직 | 목록 0이면 **짧은** 빈 안내. 티어 전체 zero-state 한 장으로 **붕괴 금지** |
| 047 | 자기 방 프라임 실점유 금지 · 샘플≠실점유 · 게스트 `demo_prime` 분리 |

---

## 3. 수정 요구

1. `items.length === 0`이어도 `vacantSamples`가 true이면 **early zero-state return 하지 말 것**.
2. 그 경우: 프라임(샘플1+EMPTY2) + 픽(샘플1+EMPTY4) + 베이직 짧은 빈 카피.
3. `renderPickPaginatedBlock`(또는 동등): `vacantPick`일 때 **샘플 5장 배열 금지** → 슬롯0=샘플, 나머지 4=`renderEmptyPick`류(없으면 EMPTY 픽 카드 신설·게스트 EMPTY 톤 재사용).
4. `vacantSamples` false(게스트·다른 역할)는 기존 zero-state 유지.
5. `viewerRole === 'study_room'` 홈 전달 회귀.
6. 필수 범위=홈 티어(`data-surface="home-tier"`). 찾기 플랫 items===0은 홈과 혼동 금지.

### Allowlist (예상)
```
preview/search-ui/src/search-tier-render.js
preview/home-ui/src/exposure-render.js   # vacantPick → 샘플1+EMPTY4 · empty pick 카드
(+ 필요 시 empty-state-copy.js · 최소 CSS)
```

### 하지 말 것
- push / build:dothome
- 073 메일·희망지역 · auth dirty 혼합
- 게스트에 vacantSamples 켜기
- 픽을 다시 샘플 5장으로 되돌리기

---

## 4. 스모크

1. 공부방 로그인 · 가능동 · **공부방 0**: 프라임 샘플1+EMPTY2 · 픽 샘플1+EMPTY4 · 「등록된 공부방 없습니다」**단독 전체 대체 없음**
2. 프라임 실 1~2: 샘플 없음
3. 게스트 `#/guest`: 기존 데모 · vacantSamples 미적용
4. 멤버박스·맵 회귀
5. 보고: early-return 전후 · 픽 슬롯 구성(1+4) · 파일 · push 안 함

---

## 5. 붙여넣기

```
[티켓 075 · 보완 · 목록0 프라임/픽 샘플 · 픽=샘플1+EMPTY4 · 로컬만]

074 운영 f6b8498 이후. 미작업 아님. push/build 금지. 073/auth 섞지 말 것.

원인: search-tier-render.js items.length===0 → renderSearchZeroState return → vacantSamples 미도달.
증상: 가능동 로그인 홈 「공부방0」+「등록된 공부방 없습니다」만.

잠금:
1) vacantSamples true면 early zero-state 금지.
2) 프라임 실0: 샘플1+EMPTY2.
3) 픽 실0: 샘플1+EMPTY4 (한 줄 5칸). 샘플5장 전면채움 폐기(065→재잠금).
4) 베이직만 짧은빈. 게스트·다른역할 zero-state 유지. 047·demo_prime 분리.

출발: search-tier-render.js · exposure-render.js(vacantPick).

스모크: 가능동0에서 프라임1+2·픽1+4 보임 · 실프라임있으면 샘플없음 · 게스트회귀 · 파일보고.
첨부: 사용자 로그인 홈 스크린샷.
```
