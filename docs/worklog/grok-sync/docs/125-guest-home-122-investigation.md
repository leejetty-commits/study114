# 125 · 게스트 초기화면 122 조사 (허수·현재위치·프라임크기·샘플규칙)

- 작성: 2026-09-25 04:12 KST
- 선행 요청: [122](122-guest-home-remove-fake-numbers-backlog.md)
- 범위: **읽기 전용 조사** (repo 미수정 · 빌드/커밋/푸시 없음)
- 기준 브랜치: `feat/student-mypage-a-g` · HEAD `8eaf74d`
- 샷: `../shots/guest-home-122/guest-home-a.png`(새로고침 후) · `guest-home-b.png`(첫 로드/EMPTY 상태)

---

## 0. 한 줄 요약

| # | 질문 | 결론 |
|---|------|------|
| 1 | 대치동 박스 47/62·63/128 | **하드코딩 더미** (`GUEST_REGION_STATS`). 동/지역 집계 전용 API **없음**. 검색 목록 COUNT는 재사용 가능 후보. |
| 2 | 게스트 현재위치 | **하드코딩 데모** (공부방=대치동, 과외/학생=서울시). 홈은 GPS/IP **미사용**. 찾기 화면은 우선순위 체인에 GPS 옵션 있음(기본은 같은 데모). |
| 3 | 프라임 첫 로드 작음 | **유력: CSS `100cqw` + `container-type`** 로 미디어 높이 계산 → 첫 레이아웃 전 cqw≈0/미확정 → 새로고침 후 정상. |
| 4 | 카드 0/일부 실데이터 | 게스트는 **vacantSamples OFF**. 로그인 홈용 샘플1+EMPTY 헬퍼는 이미 있음. 게스트는 시드/`demo_prime`·EMPTY·「후보 없음」이 섞임. |
| 5 | 정본 개수 | Notion 9·11·12·UDX-30: Prime 3 / Pick 10(5×2) / Basic 20(비회원 데모 Basic **10**). 페이지=숫자형. |
| 6 | 기획 결정 필요 | 아래 §6 질문 목록. |

---

## 1. 지도 박스 수치 (공부방 47 / 과외쌤 62·63 / 학생 128)

### 출처 — 하드코딩

`preview/home-ui/src/data.js`:

```js
export const GUEST_REGION_STATS = {
  studyRooms: 47,
  tutors: 62,
  studentRequests: 128,
  updated: '2026-06-01',
};
```

렌더: `preview/home-ui/src/guest-sections.js` `renderGuestHero()` (대략 L46–66)

```js
const s = GUEST_REGION_STATS;
…
<dl class="hero-map__stats">
  <div><dt>공부방</dt><dd>${s.studyRooms}</dd></div>
  <div><dt>과외쌤</dt><dd>${s.tutors}</dd></div>
  <div><dt>학생</dt><dd>${s.studentRequests}</dd></div>
</dl>
```

- 샷의 과외쌤 **63** vs 코드 **62**: 구빌드/샷 오차 가능. **현재 HEAD는 62**.
- `updated: '2026-06-01'`도 더미 메타. API 연동 없음.

### 기존 API로 실집계 가능한가?

- `public/api/**`에 **지역별 공부방/과외쌤/학생 수 전용 엔드포인트는 없음** (조사 시점).
- `src/Search/SearchService.php`는 목록 조회 시 `COUNT(DISTINCT …)` + `region_id` / `region_label` 필터를 이미 씀 → **목록 total을 집계로 재사용**하는 방향은 가능.
- 맵 배너(`preview/search-ui/src/search-map.js`)의 `roomCount` 등은 **현재 결과 목록 길이/토탈**이지, 동 단위 상시 통계 테이블이 아님.

### 실집계에 필요한 것 (구현 시)

1. **집계 축 정의**: 공부방=행정동(대치동), 과외쌤=시(서울시), 학생=희망지역 시? 동? (홈 데모 축과 동일해야 함)
2. **포함 조건**: `published`만? 유료(Prime/Pick)만? 숨김 제외? 게스트 공개 가능만?
3. **API**: 예) `GET /api/…/region-stats?dong=…` 또는 기존 search에 `stats_only=1`
4. **캐시·갱신**: 실시간 COUNT vs 주기 집계
5. 데이터가 0이면 박스에 **0 표시** vs 문구 변경 vs 박스 숨김 — 기획 결정

---

## 2. 게스트 「현재위치」

### 게스트 홈

| 축 | 값 | 출처 |
|----|-----|------|
| 지도·공부방 섹션 | `서울 강남구 대치동` | `GUEST_DEMO_REGION` / `GUEST_DEMO_REGIONS_BY_AXIS.room` (`data.js` L22–32) |
| 과외쌤·학생 섹션 | `서울시` | `GUEST_DEMO_REGIONS_BY_AXIS.tutor/student` (`data.js` L33–44) |

- `guest-sections.js`가 `toDisplayLabel(GUEST_DEMO_REGIONS_BY_AXIS.*.full, …)`로 섹션 헤더 「현재위치」에 넣음 (L80, L110, L143–145).
- **브라우저 geolocation / IP 지오룩업을 홈에서 호출하지 않음.**
- 좌표: `preview/shared/location-display.js` `REGION_COORDS`에 대치동 시드 `{ lat: 37.4946, lng: 127.0626, label: '서울 강남구 대치동' }` — **실제 대치동 근처 시드 좌표** (실사용자 GPS 아님).

### 공부방찾기 / 과외쌤찾기 / 학생찾기 (게스트)

- 기본값: `preview/search-ui/src/search-schema.js` `GUEST_DEFAULT_REGIONS`  
  `room: '서울 강남구 대치동'`, `tutor/student: '서울시'`
- 우선순위 (`location-display.js` L352–385):  
  `sessionSelected(URL) → savedDefault → gps → fallback`
- `tryBrowserGps()` 존재 (L388–408). 찾기 hydrate에서 **상위 소스가 없을 때만** GPS 시도 (`search-find-surface.js` GPS 스킵 분기들).
- 게스트 첫 진입은 보통 **fallback=데모 지역**이라 GPS 없이도 대치/서울시로 고정되는 경로가 주류.

**결론:** 「현재위치」는 **데모용 고정 라벨**이며, 대치동 좌표 시드는 있으나 **실주소/실GPS를 가리키는 개인화 위치가 아님**.

---

## 3. 프라임 공부방 카드 「첫 로드 작음 → 새로고침 정상」

### 유력 원인 (코드 증거)

`preview/home-ui/src/styles/home-listings.css`:

```css
.expo-media--prime {
  width: 100%;
  aspect-ratio: auto;
  height: calc(100cqw * 9 / 16 * var(--expo-prime-media-height-scale, 1.3));
}
.expo-card--prime > .expo-media-wrap {
  container-type: inline-size;
  container-name: expo-prime-media;
}
```

- 미디어 높이가 **자기 wrap의 container query width(`cqw`)** 에 종속.
- 첫 페인트에서 그리드/셸 폭·폰트·우측 레일이 아직 확정되지 않으면 `cqw`가 0 또는 과소 → **이미지 영역이 납작/작게** 보일 수 있음.
- 새로고침·재레이아웃 후에는 container 폭이 안정되어 정상(샷 a).

부가 요인:

- `exposure-render.js` `renderMedia` — `loading="lazy"` (L273). 이미지 intrinsic 전까지 레이아웃 흔들림 가능(주원인보다 부차).
- `screens/guest.js` — `hydrateHomeBasicFromSearch().then(rerender)` (L41–45). 베이직만 재조회이나 **전체 게스트 리렌더**로 프라임도 다시 그려 레이아웃이 “고쳐진 것처럼” 보일 수 있음.

### 수정 방향 (조사만 · 미적용)

- `aspect-ratio: 16 / 9` (× scale) 등 **cqw 비의존**으로 바꾸거나
- wrap에 min-height / `aspect-ratio` 폴백
- 또는 레이아웃 확정 후(ResizeObserver) 한 번 더 측정 — 다만 정본 주석이 「aspect-ratio 교체 금지·cqw」라 **정책 확인 후** 수정.

---

## 4. 게스트 카드 섹션별 현재 로직

### 공통 헬퍼 (재사용 후보 · 지금은 로그인 홈 중심)

| 헬퍼 | 파일 | 용도 |
|------|------|------|
| `vacantStudyRoomSample` / `vacantTutorSample` | `exposure-render.js` L321–338 | `_vacantSample` + 「샘플」스탬프 |
| `renderEmptyPrimePromo` / `renderEmptyPickPromo` | 동 L600–624 | EMPTY CTA 카드 |
| `buildStudyRoomSampleItem` / `buildTutorSampleItem` | `home-card-samples/presets.js` | 샘플 데이터 |
| `renderPrimeSlotGrid` + `vacantSamples` | `exposure-render.js` L636–665 | 실0 → 샘플1+EMPTY2 |
| `renderPickPaginatedBlock` + `vacantPick` | L1020–1046 | 실0 → 샘플1+EMPTY4 (한 줄 5칸) |
| `vacantSamples` 켜는 조건 | `search-tier-render.js` L67–70 | **`guest !== true`** 이고 공부방/과외쌤 **로그인 홈**일 때만 |

→ **게스트 분기 삽입 지점 후보:**  
`guest-sections.js`의 `renderStudyRoomPrimePick` / `renderTutorPrimePick` / `renderGuestBrowseLists` 에서 `vacantSamples: true`(또는 guest 전용 플래그) 전달, 그리고 시드/`demo_prime` 끄기.  
찾기: `search-tier-render.js`의 guest 경로·flat 결과.

### 런타임 설정 (`plans/runtime-config.js`)

- `prime_slots: 3`
- `pick_set_size: 10`
- `basic_page_size: 20`
- `demo_prime_filled: 1` ← 게스트 시드 풀에서 명시 prime 없으면 **앞에서 1장**을 프라임으로 채움 (`exposure-rules.js` `getPrimeOccupied` L51–63)

### 게스트 홈 — 섹션별 (현재 HEAD)

| 섹션 | 데이터 | 0실 / 일부실 | 행·칸 | 허수(샘플/시드) |
|------|--------|--------------|-------|-----------------|
| 프라임공부방 | `EXPOSURE_STUDY_ROOMS` 시드 + `getPrimeOccupied` | 슬롯 3고정. 빈칸=`renderEmptyPrimePromo`. **vacantSamples 미사용** → 실0이면 EMPTY×3 (샘플 스탬프 없음). `demo_prime_filled=1`이면 시드 1장이 프라임으로 들어감 | 1행×3 (`expo-grid--3`) | 시드/`demo_prime` = **데모 허수**. EMPTY는 광고칸(허수 카드 아님) |
| 픽공부방 | 같은 풀 · Pick | 픽 0이면 「픽 노출 후보가 없습니다」(L1037). vacantPick 비활성 | 페이지당 10(설정)·그리드 5열(좁으면 반응형) → **2행 가능** | 시드 pick 티어면 실카드처럼 보임 |
| 프라임과외쌤 | `EXPOSURE_TUTORS` · tutor는 페이지+회전 | 풀 없으면 EMPTY×3. vacantSamples 미사용 | 1행×3 + 숫자 페이지 | 시드/데모 풀 |
| 픽과외쌤 | 동일 | 0이면 「후보 없음」 | 페이지당 10 | 시드 |
| 베이직공부방/과외쌤 | `getHomeBasicPool` → 실검색 hydrate (`home-basic-live.js`) | 목록 그대로 slice. 샘플/EMPTY **없음** | `basic_page_size` 20, 2열 카드형 리스트 | 실API 실패 시 안내 문구 |
| 학생 | 동일 live 풀 | 게스트 마스킹 티저(`guestStudentTeaserFields`) | 2열·페이지 | 실데이터(+로그인 게이트). **학생 샘플 헬퍼 없음** |

### 게스트 찾기 하단 카드

- Notion/9장: 찾기 최초 = **Prime/Pick 블록 없이 Basic flat 20**.
- 코드: `search-find-surface.js` → `renderSearchTierResults(…, surfaceType:'search')` → **flat**.
- `items.length===0`이면 zero-state 한 장 (`search-tier-render.js` L59–61, L134–135). **샘플1+EMPTY 규칙 미적용.**
- 122 범위 추가(04:06): 게스트 찾기 3화면에 **홈과 같은 샘플/빈칸 규칙** — 구현 시 flat vs 티어 문법 충돌을 기획이 풀어야 함(§6).

### 로그인 홈 잠금과의 관계 (075/079/098)

- 로그인: 실0 → 프라임 **샘플1+EMPTY2**, 픽 **샘플1+EMPTY4** (`vacantSamples`).
- 게스트: 의도적으로 vacantSamples **제외**(075 「게스트에 vacantSamples 켜기」 금지였음) → 122에서 **게스트 전용으로 켜는 정책 변경**.
- 재사용: 위 헬퍼 그대로 + guest 플래그/시드 경로 분리(`demo_prime` vs vacant sample).

---

## 5. 정본(Notion·docs) 카드 수 · 페이지

충돌 시 **최근 편집본 우선** (요청문).

| 출처 | 일자(편집) | Prime | Pick | Basic | 페이지 |
|------|------------|-------|------|-------|--------|
| **9장** 메인화면 구조 | 2026-09-24 | 공부방 지역 3자리 / 과외 페이지당 3 | **페이지당 10** · 5열×2행 | **페이지당 20** | 숫자형 · 유료 15분 회전(과외 Prime·양쪽 Pick) |
| **11장** 노출·비교검색 | 2026-09-09 | 공부방 3·과외 페이지당 3 | 페이지당 10 · 5×2 | 페이지당 20 · **비회원 데모 홈 10** · 찾기 20 | 숫자형 하단 중앙 |
| **12장** 과외·학부모 홈 | 2026-09-24 | 과외 페이지당 3 | 10 · 5×2 | 20 | 숫자형 |
| **UDX-30 Discovery** | 2026-09-22 | 홈 Prime 3 | Pick 10(5×2) | Basic 20(2단×10행) · **비회원 Basic 10 2단** | 숫자형. 찾기 최초=Basic 20(Prime/Pick 블록 없음), 검색 후 해당 등급 카드 형태 유지 |
| 로컬 062/075/079 | 2026-09-24 | 실0 → 샘플1+EMPTY2 | 실0 → 샘플1+EMPTY4 (1행 5칸) | (빈 안내) | 로그인 홈 vacant UX |

**코드 정합:** `prime_slots=3`, `pick_set_size=10`, `basic_page_size=20`.  
**어긋남:** 비회원 Basic **10**(Notion) vs 코드 기본 **20** — 게스트 hydrate 후 실제 노출 수는 API 결과·slice에 따름. 122의 「베이직 샘플1+빈1」은 정본 10/20과 **별층(빈자리 UX)** 으로 해석하는 편이 맞음.

학생: 홈 섹션은 “학생 수요/의뢰 리스트”. 122 확정= **샘플1+빈1 · 1행**(베이직과 동일).

---

## 6. 기획자(비개발) 결정 질문

1. **지도 박스 숫자**  
   지금 당장 (A) 0으로 두기 (B) 박스/숫자 숨기기 (C) 실집계 API 만든 뒤 넣기 — 어느 쪽?  
   실집계 시 **무엇까지 셀지**(공개 프로필만 / 유료만 / 학생 의뢰 포함)?

2. **현재위치**  
   게스트 홈·찾기를 (A) 계속 대치동·서울시 데모 고정 (B) GPS 허용 시 실위치 (C) IP 추정 — ?  
   축 분리(공부방 동 / 과외·학생 시) **유지**할지?

3. **「실제 카드 1장이라도 있으면 샘플 제거」**의 “실제”  
   (A) DB 공개 등록 1건 (B) 해당 티어 유료(Prime/Pick) 점유 1건 (C) 시드/`EXPOSURE_*`는 실제가 아님(제거 대상)?

4. **베이직·학생의 「빈 박스」**  
   프라임/픽 EMPTY와 같은 CTA 빈칸을 베이직 행에도 둘지, 아니면 **짧은 빈 안내 문구**만? (지금 EMPTY 헬퍼는 프라임/픽 카드 형)

5. **찾기 화면**  
   정본은 찾기=Basic flat인데, 122는 하단에도 샘플1+빈칸.  
   (A) flat 목록 위에 가짜 1행만 추가 (B) 게스트 찾기에도 홈처럼 Prime/Pick/Basic 티어 표시 (C) 결과 0일 때만 샘플행?

6. **정본 배열이 찬 뒤**  
   예: 픽 실데이터 11건 → 1페이지 10 + 페이지 2 — OK?  
   베이직 게스트는 Notion 데모 **10** vs 설정 **20** 중 어느 쪽을 122 «정본»으로 쓸지?

7. **프라임 크기 버그**  
   cqw 수정을 허용할지(정본 “aspect-ratio 교체 금지” 주석과 충돌 가능)?

8. **학생 샘플**  
   공부방/과외 샘플 preset만 있음. 학생 샘플 카드 카피·마스킹 수준을 새로 정할지?

---

## 7. 증거 인덱스 (경로 · 줄)

| 주제 | 경로 | 줄(대략) |
|------|------|----------|
| 통계 더미 | `preview/home-ui/src/data.js` | 61–66 `GUEST_REGION_STATS` |
| 히어로 렌더 | `preview/home-ui/src/guest-sections.js` | 46–66, 76–167 |
| 게스트 셸 | `preview/home-ui/src/screens/guest.js` | 17–46 |
| 데모 지역 | `data.js` | 22–44 · `search-schema.js` 93–97 |
| 위치 SSOT | `preview/shared/location-display.js` | 32–44, 352–408, 422–425 |
| 프라임 높이 CSS | `styles/home-listings.css` | 925–931, 1084–1086 |
| vacant/EMPTY | `exposure-render.js` | 313–338, 600–665, 1020–1046 |
| demo_prime | `exposure-rules.js` | 51–63 · `plans/runtime-config.js` 67–74 |
| vacant 로그인만 | `search-tier-render.js` | 59–70 |
| 찾기 위치 | `search-find-surface.js` | GPS·GUEST_DEFAULT · surfaceType |
| 샘플 preset | `home-card-samples/presets.js` | `buildStudyRoomSampleItem` / `buildTutorSampleItem` |

---

## 8. 조사 한계

- Windows `CopyToBox`/`Read(machineId)`가 로컬 루트 밖으로 거절되어, 증거는 **Shell UTF-8 덤프**로 확인.
- repo 파일·Notion **미수정**.
- 브라우저 스모크(실기기 첫 로드 재현)는 이번 턴에 미실시 — CSS 가설은 코드·증상(첫 로드/리프레시)과 정합.

## 9. 집계: 공개·숨김 존재 여부 (사용자 답 반영)

### 9-1. 결론

사용자 확정인 **“베이직 기준 = 등록 카드 전부(유료만 아님)”**에 맞춰, 지도 숫자는 유료 노출권(Prime/Pick) 보유 여부로 거르지 않는다. 코드에는 세 종류 모두 공개 상태와 숨김/비공개에 해당하는 상태가 있다.

| 대상 | 공개·숨김·비공개 상태 | 삭제/비공개 관련 근거 | 현재 검색·게스트 노출 |
|---|---|---|---|
| 공부방 | `profile_status`: `draft`, `pending`, `published`, `hidden` | `study_rooms.deleted_at` 존재. Hub 삭제는 `deleted_at` 기록 + `hidden` 전환 | PHP 검색은 `hidden`과 soft-delete를 제외 (`SearchService.php:273-278`); 프론트 지도도 `hidden` 제외 (`guest-sections.js:72-74`) |
| 과외쌤 | `profile_status`: `draft`, `pending`, `published`, `hidden` | 별도 `deleted_at` 컬럼은 확인되지 않음. Hub 삭제 동작은 `profile_status=hidden` 전환 | PHP 검색은 `hidden`만 제외 (`SearchService.php:521-526`); 프론트 표시 모델은 검색 응답을 `published`로 정규화 (`home-basic-live.js:66-92`) |
| 학생 의뢰 | `exposure_status`: `draft`, `published`, `hidden`, `deleted` | `students.deleted_at` 존재. 삭제는 `exposure_status=deleted` + `deleted_at` 기록 | PHP 검색은 `published`만 선택하고 `deleted_at IS NULL` (`SearchService.php:738-739`); Hub에 publish/hide/delete 동작 존재 (`StudentHubService.php:43-79`) |

- **private 개념:** 공부방/과외쌤의 프로필 전체를 `private`로 두는 컬럼은 없다. 학생은 프로필 자체가 아니라 `request_summary`와 `special_request_note` 각각에 `private`/`paid_only`가 있다 (`sql/schema/004_member_ssot_align.sql:61-65`). 따라서 이 필드의 공개 범위는 학생 **행 수**를 세는 기준과 별개다.
- **프론트의 guest-visible 필터:** 공통 카드 규칙은 `hidden`만 제외하며 `draft`는 노출 가능하다고 명시되어 있다 (`preview/home-ui/src/exposure-rules.js:27-34`). 실 Basic 목록은 세 탭을 각각 검색 API에서 받아온다 (`preview/home-ui/src/guest-sections.js:145-165`). 즉 현재 게스트 카드 노출과 “등록 전부” 집계는 서로 다른 모집단이 될 수 있다.

### 9-2. 이 코드베이스에서 Basic의 뜻

Basic은 별도 `basic` 등록 상태나 유료 전용 목록이 아니다. `SearchService::resolveExposureTier()`는 활성 position SKU가 `prime`/`pick`일 때만 그 등급을 쓰고, 그 외 등록 카드는 `basic`으로 fallback한다 (`src/Search/SearchService.php:1187-1199`). 따라서 **등록 row가 있고 Prime/Pick 활성권이 없으면 Basic**이라는 의미다. 검색의 room/tutor total도 유료 테이블 조인이 아니라 `COUNT(DISTINCT sr.id)`/`COUNT(DISTINCT t.id)`다 (`src/Search/SearchService.php:361`, `613`). 학생은 응답 등급을 항상 `basic`으로 만든다 (`src/Search/SearchService.php:848-849`, `935-937`).

### 9-3. 지도 세 숫자의 권장 COUNT 정의

사용자 결정대로 “Basic 기준”을 **지역에 등록된 카드의 전체 수**로 잠근다. 다만 실제로 삭제된 row는 등록 카드로 보지 않아 제외한다.

- **공부방:** `COUNT(DISTINCT study_rooms.id)`; 지역은 기본 `study_rooms.region_id` 또는 `study_room_regions.region_id`가 해당 지역인 등록. `profile_status`는 `draft/pending/published/hidden` 모두 포함, `deleted_at IS NULL`만 적용.
- **과외쌤:** `COUNT(DISTINCT tutors.id)`; `tutor_regions.region_id`가 해당 지역인 등록. `profile_status` 네 상태를 모두 포함한다. 과외쌤에는 별도 soft-delete 컬럼이 없어 `hidden`은 사용자 결정상 포함하되, 이후 실제 삭제 컬럼이 생기면 삭제 row는 제외한다.
- **학생:** `COUNT(DISTINCT students.id)`; 공부방 축이면 `preferred_studyroom_region_id`, 과외 축이면 `preferred_tutor_region_id`가 해당 지역인 등록(현 검색도 두 축을 OR로 취급: `SearchService.php:745-748`). `exposure_status`는 `draft/published/hidden` 포함, `deleted` 또는 `deleted_at IS NOT NULL`은 제외. `private`/`paid_only`는 본문 필드 공개 범위일 뿐 행 수 필터가 아니다.

따라서 숫자에는 **유료만 세는 조건, `published`만 세는 조건, guest-visible 필터를 추가하지 않는다.** 화면에서 숨겨지는 `hidden`까지 포함하는 “등록 전부” 숫자임을 문구/기획에 명시해야 한다. 반대로 게스트에게 실제 보이는 카드 수가 목적이면 세 대상 모두 `published`(및 비삭제)로 별도 정의해야 하며, 이는 이번 사용자 결정과 다르다.


## 9-4. 정정 노트 (2026-09-25 04:40 KST · 127 감사)

사용자 지적 및 [127](127-status-vocabulary-audit.md) 실측으로 §9-1~9-3의 **어휘·COUNT 잠금을 부분 철회·교체**한다.

1. **어휘:** `draft|pending|published|hidden` 및 「작성 중/심사/공개/숨김」은 **손님-facing 용어가 아니다.** 심사 플로우 없음. 「작성 중」문자열 미발견. 「숨김」은 내 등록·A28·유료가드에만 실사용. 게스트 블라인드 코드에 「숨김」없음.
2. **쪽지:** UI는 받음/안받음(쪽지 받는 중) — 「숨김」과 무관.
3. **COUNT 교체:** §9-3의 “draft~hidden 전부 포함(숨김 포함)”은 **지도 박스 목적과 불일치**(목록에 안 나오는 행까지 세면 허수).  
   **새 정의:** 손님 홈·찾기 **목록에 나오는 등록** = 「가입 필수항목이 채워져 목록에 나오는 등록」.  
   구현은 현 `SearchService` 목록 필터와 맞출 것(공부방·과외: 목록제외(`hidden`)·삭제 제외 / 학생: 목록용(`published`)·삭제 제외). 유료 SKU 조건 없음.  
   화면·백로그 문구에는 공개/숨김 ENUM 이름을 쓰지 말 것.
4. §9-1 표의 “현재 검색·게스트 노출” 기술(필터 사실)은 **유효**. 바뀌는 것은 “숨김도 COUNT에 넣는다”는 **집계 권고**뿐이다.
5. 122 백로그 「기획 확정」상태 포함 문단은 본 노트·127로 대체.

## 10. 게스트 블라인드 규정

### 10-1. 정본 요약

Notion 최신 검색·확인본(2026-09-24~25) 기준으로, 게스트는 카드를 탐색할 수 있지만 **직접 식별정보·직접 연락정보는 공개하지 않고 핵심 액션은 로그인으로 유도**한다. 블라인드는 슬롯 수·행 수·페이지 규칙이 아니라 카드 콘텐츠/행동 권한에 적용한다.

| 카드 | 게스트에게 보이는 것 | 게스트에게 가리는 것·행동 |
|---|---|---|
| 공부방 | 공부방명, 공개 프로필의 판단용 조건, 가격·지역의 공개 표시. 지역은 게스트 표시용 축약값으로 본다. | 전화·메일·정확한 주소 등 직접 개인정보. 상세보기·찜·비교·쪽지는 로그인 유도. **공부방명 자체를 마스킹하라는 최신 Notion 규정은 확인되지 않음.** |
| 과외쌤 | 과외 표시명, 과목·대상·가격·수업방식 등 공개 카드 판단 정보. 지역은 게스트 표시용 축약값으로 본다. | 전화·메일·정확한 주소 등 직접 개인정보. 상세보기·찜·비교·쪽지는 로그인 유도. **과외 표시명 자체를 마스킹하라는 최신 Notion 규정은 확인되지 않음.** |
| 학생 | 축약형 티저: 마스킹 표시명, 학교급/학년대, 대표 과목, 권역, 예산 구간, 희망 유형/수업 칩. | 상세 본문·한 줄 요청문/특이요청사항의 게스트 응답, 실명·연락처·정확한 주소 등 직접 식별정보. 「로그인하고 보기」로 로그인 유도. |

학생 공개 표시명은 4장 규정대로 3글자 이름은 가운데 글자, 2글자 이름은 이름 글자를 가리는 방식이다. 학생찾기에서 로그인한 공부방·과외쌤에게는 구조화 조건과 공개된 서술형 요청문을 무료로 보여주되, 실명·연락처·상세 주소는 계속 가린다. 학생 게스트의 상세 내용은 빈 응답/티저로 내려야 하며 프론트에서 시드 문장으로 보충하지 않는다.

### 10-2. 122 샘플·빈칸과의 관계

블라인드 규정은 **122의 샘플/빈칸 UX를 바꾸지 않는다.** 다음을 그대로 잠근다.

- 홈과 공부방찾기·과외쌤찾기·학생찾기의 게스트 슬롯 수, 1행, 좌측 샘플 1장, 우측 빈칸, 실제 카드 유입 시 샘플 제거, 행이 찬 뒤 정본 배열·페이지 번호는 그대로다.
- 바뀌는 것은 좌측 샘플/실제 카드 안에 채우는 **콘텐츠**뿐이다. 공부방·과외쌤은 공개 표시값 + 로그인 게이트, 학생은 마스킹 티저 + 「로그인하고 보기」를 쓴다.
- 블라인드를 이유로 빈칸을 추가하거나, 학생 카드를 숨겨 0건으로 만들거나, 페이지 크기/행 규칙을 바꾸지 않는다. 학생 샘플을 새로 만들 경우에도 학생 티저 필드와 로그인 게이트를 따르며 샘플 표시 자체는 유지한다.

**근거:** Notion `4장-공통 회원 DB와 역할 프로필 테이블 구조`, `9장-메인화면 구조 및 역할별 노출 규칙 잠금`, `13장-검색페이지 기본·확장 검색항목 및 DB 대응표 잠금`; `preview/home-ui/src/student-blind-teaser.js`, `preview/home-ui/src/exposure-render.js`.
