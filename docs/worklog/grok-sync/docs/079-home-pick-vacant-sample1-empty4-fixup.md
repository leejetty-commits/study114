# 079 · Cursor 보완 — 픽 빈자리: 샘플5 → 샘플1+EMPTY4

- 작성일: 2026-09-24 (KST)
- 선행: [075](075-home-prime-pick-vacant-bypass-empty-fixup.md) · [065](065-home-memberbox-prime-pick-063-acceptance.md) · 운영 [074](074-home-063-067-deploy-acceptance.md)
- 사용자 육안(로그인 홈): **프라임 OK** · **픽 오류**
- 상태: **로컬 수락** → [080](080-home-pick-vacant-079-acceptance.md) (push/`build:dothome` **금지**)

---

## 0. 이게 몇 번 작업인가

| 번호 | 무엇 |
|------|------|
| 063→065 | 처음 프라임/픽 샘플 도입. 당시 픽=**샘플 5칸**으로 수락 |
| 075 | 목록0 early-return 우회 + 픽을 **샘플1+EMPTY4**로 **재잠금** |
| **079 (이번)** | 프라임은 이미 샘플1+EMPTY2로 맞음. **픽만** 아직 샘플 5칸 → **075 픽 절만 미완/미적용** |

한 줄: **075의 픽 절만 다시 고친다.** 프라임·멤버박스·맵·가입 손대지 말 것.

---

## 1. 사용자 증상 (잠금)

| 구간 | 실데이터 0(또는 1개라도 없을 때 빈자리 규칙) | 현재 | 목표 |
|------|-----------------------------------------------|------|------|
| 프라임 | 샘플1 + 빈박스 2 | **정상** | 유지 |
| 픽 | 샘플1 + 빈박스 4 (한 줄 5칸) | **샘플 5칸 전부** ← 오류 | **샘플1+EMPTY4** |

「1개라도 없으면」= 해당 티어 실점유가 0일 때(기존 vacantSamples 조건과 동일). 실 1개 이상이면 샘플 넣지 않음(프라임/픽 각각).

---

## 2. 원인 가설 (검증 후 수정 · 처방 강제 아님)

로컬 `preview/home-ui/src/exposure-render.js` · `renderPickPaginatedBlock`:

```js
const vacantPick = opts.vacantSamples === true && kind === 'study_room' && pickPool.length === 0;
const cards = vacantPick
  ? Array.from({ length: Math.min(pickSetSize, pickRowSlots) }, () =>
      renderExposureBox(kind, 'pick', vacantStudyRoomSample('pick'), '', opts),
    ).join('')
  : …
```

→ vacant일 때 **칸마다 샘플**을 만들어 **샘플 5장**이 된다.  
프라임은 같은 파일에서 `slots[0]=vacantStudyRoomSample('prime')` + 나머지 `renderEmptyPrimePromo`라서 이미 맞음.

*(가설이 틀리면 실제 분기를 찾아 같은 UX로 고칠 것.)*

---

## 3. 수정 잠금

1. `vacantPick === true`일 때 한 줄 5칸:
   - **슬롯 0:** `vacantStudyRoomSample('pick')` 1장만 (가상·「샘플」·inert · provider-id 없음)
   - **슬롯 1~4:** **EMPTY 픽 카드** 4장 (유료/픽 안내·CTA 톤 · 픽 카드 크기). `renderEmptyPrimePromo`를 픽에 그대로 쓰지 말 것(프라임 레이아웃).
2. **샘플 5장 전면 채움 금지** (065 픽 구현 폐기 · 075와 동일).
3. EMPTY 픽 헬퍼가 없으면 `renderEmptyPickPromo`(가칭) 신설. 게스트 EMPTY 픽 톤이 있으면 재사용 우선.
4. 프라임 `renderPrimeSlotGrid` vacant 분기 **회귀 금지**(이미 샘플1+EMPTY2).
5. `vacantSamples` 조건·게스트/`demo_prime`·047 자기방 프라임0 **유지**.
6. 필수 범위: 공부방 **로그인 홈** 티어. 찾기 플랫과 혼동 금지.
7. early-return(`items.length===0` → zero-state만)이 아직 남아 프라임/픽이 안 보이면 **075와 같이** vacantSamples일 때 early zero 금지. 이번 보고 증상은 픽 샘플5이므로 **픽 1+4가 본게임**.

### Allowlist (최소)
```
preview/home-ui/src/exposure-render.js
(+ EMPTY 픽 카피/CSS 필요 시 empty-state-copy.js · 최소 CSS)
(+ early-return 잔여 시에만) preview/search-ui/src/search-tier-render.js
```

### 하지 말 것
- push / `build:dothome`
- 073 signup · auth · 멤버박스·맵(067) 불필요 수정
- 픽을 다시 샘플 5장으로 두기
- 프라임 레이아웃 변경

---

## 4. 스모크

1. 공부방 로그인 · 동네 공부방 **실0**(또는 픽 풀 0): **픽 = 샘플1 + 빈칸4**. 프라임 = 샘플1+EMPTY2 유지.
2. 픽 실 ≥1: 샘플·EMPTY vacant 채움 없음.
3. 게스트 `#/guest`: vacantSamples 미적용 · 기존 데모.
4. 보고: vacantPick 전후 슬롯 구성 · 파일 목록 · push 안 함.

---

## 5. Cursor 붙여넣기

```
[티켓 079 · 픽 vacant = 샘플1+EMPTY4 · 로컬만 · 075 픽 절 미완]

증상(사용자): 프라임=샘플1+빈2 OK. 픽=샘플 5칸 전부 → 오류. 목표 픽=샘플1+빈4.

맥락: 063/065 때 픽=샘플5 수락 → 075에서 샘플1+EMPTY4 재잠금. 프라임은 반영됨, 픽만 구구현.

가설(검증): exposure-render.js renderPickPaginatedBlock vacantPick 시
Array.from(... vacantStudyRoomSample('pick')) × 5칸.
→ 슬롯0만 샘플, 1~4는 EMPTY 픽 카드(없으면 신설). 샘플5 금지.

프라임 renderPrimeSlotGrid 회귀 금지. vacantSamples/게스트/047 유지.
로컬만. push/build 금지. 073·auth 섞지 말 것.

스모크: 실0에서 픽1+4 · 프라임1+2 유지 · 실픽있으면 샘플없음 · 게스트회귀 · 파일보고.
```
