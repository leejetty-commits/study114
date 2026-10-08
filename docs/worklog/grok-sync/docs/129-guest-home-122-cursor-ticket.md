# 129 · Cursor — 게스트 초기화면 허수 걷어내기 (122 잠금 구현 · 로컬)

- 작성: 2026-09-25 04:51 KST
- 선행: [122](122-guest-home-remove-fake-numbers-backlog.md) · [125](125-guest-home-122-investigation.md) · [127](127-status-vocabulary-audit.md)
- 상태: **조건부 수락** → [131](131-guest-home-129-acceptance.md) (`fb3bbf5`). push · `build:dothome` 여전히 **금지**(배포 말할 때까지).
- 기준 HEAD: `8eaf74d` (`feat/student-mypage-a-g`) · `git -c safe.directory=D:/work/study114` · `D:\work\study114`
- 스크린샷(사용자 Cursor 채팅 첨부): `/workspace/study114-ds/shots/guest-home-122/guest-home-a.png`(새로고침 후) · `guest-home-b.png`(첫 로드/EMPTY)
- dirty 잔여(커밋 금지): `preview/home-ui/src/study-room-reg/screens.js` blank · repo `docs/046`·`047`·`README` — **이번 stage에 넣지 말 것**

---

## 0. 목표 (화면 이름)

**손님(게스트) 홈** `#/guest` 과 GNB **공부방찾기 · 과외쌤찾기 · 학생찾기** 에서:

1. 지도 「대치동」 박스 숫자(공부방·과외쌤·학생) = **목록에 나오는 등록**의 실집계 (하드코딩 47/62/128 제거)
2. 「현재위치」 라벨 = 데모 축 유지(공부방 **대치동** / 과외·학생 **서울시**) — GPS 변경 없음
3. 프라임 카드 **첫 페인트 크기 오류** 수정 (`.expo-media--prime` cqw)
4. 카드 영역 게스트 전용 샘플·빈칸·페이지 규칙 (아래 표)
5. 시드/`demo_prime` **가짜 실카드 제거** (게스트에서 「실제」로 세지 않음)

**로그인 홈 UX는 바꾸지 않음.** 숨김/공개 마이페이지 잔재 청소는 **127 후순위 · 이번 아님**.

---

## 1. 잠금 정책 (반드시 그대로)

### 1.1 적용 화면 (게스트만)

| 화면(사이트 표시) | 경로/키 |
|---|---|
| 게스트 홈 | home-ui `#/guest` |
| 공부방찾기 | search-ui `#/search/room` (`searchUiUrl('room')`) |
| 과외쌤찾기 | search-ui `#/search/tutor` |
| 학생찾기 | search-ui `#/search/student` |

- **NOT** 로그인 홈(`#/study-room` · `#/tutor` · `#/parent` 등)
- **NOT** 내 등록/마이페이지 「숨김」「공개」 잔재 정리(127 backlog)

### 1.2 지도 「대치동」 박스

- `GUEST_REGION_STATS = { studyRooms:47, tutors:62, studentRequests:128 }` **하드코딩 제거**
- 실수 = **손님 검색 LIST에 나오는 등록**과 동일 모집단 (유료만 아님)
- 축 (GPS 없음):
  - 공부방 = **항상 대치동** (`서울 강남구 대치동` / `GUEST_DEMO_REGIONS_BY_AXIS.room`)
  - 과외쌤 = **항상 서울시**
  - 학생 = **항상 서울시**
- UI 카피에 **공개 / 숨김 / 작성중 / 심사** 단어 **쓰지 말 것** (127)
- 신규 또는 확장 API로 region counts. **새 테이블 금지** — live `COUNT`. SearchService 목록 필터 재사용 선호.

### 1.3 현재위치 라벨

- 데모 축 유지·일치 확인만. GPS/`tryBrowserGps` 홈 도입 **금지**(이번 티켓).

### 1.4 프라임 첫 로드 크기

- 원인(125): `.expo-media--prime { height: calc(100cqw * 9/16 * …) }` + wrap `container-type: inline-size`
- **허용:** 이 버그용 CSS만 (cqw 비의존 aspect-ratio/폴백 등). **리디자인 금지.**

### 1.5 카드 UX (게스트 전용)

| 섹션(화면 제목) | 실0 | 실 1+ | 1행 다 찬 뒤 |
|---|---|---|---|
| **프라임공부방** / **프라임과외쌤** | 샘플1 + 빈2 · 1행 · 「샘플」은 **상단 이미지** | 좌=실, 빈칸 유지 until 3 | 슬롯 **고정 3**. 과외 프라임 등 복수 페이지면 정본 페이지 번호 |
| **픽공부방** / **픽과외쌤** | 샘플1 + 빈4 · **1행만**(2행 강제 금지) | 순서대로 실만 채움 · **빈칸으로 10칸 패딩 금지** | page size **10** · 넘치면 페이지 번호 |
| **베이직공부방** / **베이직과외쌤** | 샘플1 + 빈1 · 1행 · 빈 카피 **「등록하면 여기에 나와요」**(프라임-empty 유사 셸) | 순서대로 실 · 빈 패딩 없음 | 홈 page size **10** · 넘치면 페이지 번호 |
| **학생** | 베이직과 동일 · 샘플=블라인드(김○○ + 학교/과목/권역/예산 티저 + 「로그인하고 보기」) · 「샘플」은 **좌측 이미지** | 동일 | 동일 |

### 1.6 「실제」정의

| 영역 | 「실제」 |
|---|---|
| 베이직 / 학생 | 목록에 나오는 등록 카드 (시드/데모 아님) |
| 프라임 / 픽 | 해당 섹션의 **유료 티어 점유** (시드 아님) |

- `EXPOSURE_*` 시드 · `demo_prime_filled` / `demo_prime` 경로가 게스트에서 **실카드처럼 보이면 안 됨** → 게스트 데모 가짜 카드 **제거/비활성**.
- 샘플(`_vacantSample`) ≠ 실제.

### 1.7 찾기 3화면 (게스트)

- **첫 랜딩(검색 전):** Basic-only 1행 = 샘플1+빈1 (홈 베이직과 동일). Prime/Pick 블록 **넣지 않음**.
- **검색 실행 후:** 매칭 결과 **전부** · **빈 박스 없음**.

### 1.8 헬퍼 재사용

이미 로그인 홈용:

- `vacantStudyRoomSample` / `vacantTutorSample`
- `renderEmptyPrimePromo` / `renderEmptyPickPromo`
- `renderPrimeSlotGrid` + `vacantSamples`
- `renderPickPaginatedBlock` vacantPick

지금 `search-tier-render.js`: `vacantSamples = opts.guest !== true && …`  
→ **게스트 적절 경로를 켜되 로그인 홈 동작 회귀 금지.**

학생 샘플 헬퍼는 없음 → `buildStudentSampleItem` / `vacantStudentSample` **최소 신설** + `student-blind-teaser.js` 재사용.

---

## 2. 라우트 · 화면 맵

| 사용자 말 | 구현 키 |
|---|---|
| 게스트 홈 | `preview/home-ui` → `#/guest` · `screens/guest.js` · `guest-sections.js` |
| 공부방찾기 | `preview/search-ui` → `#/search/room` |
| 과외쌤찾기 | `#/search/tutor` |
| 학생찾기 | `#/search/student` |
| 지도 박스 제목 | 「대치동」 (`GUEST_DEMO_REGION.dong`) |
| 섹션 제목 SSOT | `section-headings.js` — 프라임공부방·픽공부방·베이직공부방·프라임과외쌤·픽과외쌤·베이직과외쌤·학생 |

---

## 3. API (region stats)

### 3.1 권장 형태 (가설 → 구현 시 확정·보고)

**선호:** 신규 얇은 엔드포인트 (스키마/테이블 추가 없음)

```
GET /api/search/region-stats.php
```

또는 기존 `POST /api/search/search.php`에 `stats_only: true` + `limit:0` 확장.  
**새 COUNT 테이블·배치 집계 테이블 금지.**

### 3.2 요청 (제안)

```json
{
  "axes": {
    "room":   { "region_label": "서울 강남구 대치동" },
    "tutor":  { "tutor_region_label": "서울시" },
    "student":{ "preferred_region_label": "서울시" }
  }
}
```

- GET이면 query: `room_region_label` · `tutor_region_label` · `student_region_label`
- 게스트 홈은 위 데모 축 **고정** 호출 (GPS 없음)

### 3.3 응답 (제안)

```json
{
  "ok": true,
  "stats": {
    "studyRooms": 0,
    "tutors": 0,
    "studentRequests": 0
  },
  "axes": {
    "room": "서울 강남구 대치동",
    "tutor": "서울시",
    "student": "서울시"
  }
}
```

- 숫자 0 허용(박스에 0 표시). 허수 폴백(47/62/128) **금지**.
- 실패 시: 박스 0 또는 「—」 + 콘솔/상태만. **더미 숫자 재투입 금지.**

### 3.4 COUNT = 목록 모집단 (127·122 최종)

SearchService와 **동일 필터**로 `COUNT(DISTINCT id)`:

| 칸 | 필터 정렬 (코드 사실 · UI 단어 아님) | 지역 키 |
|---|---|---|
| 공부방 | 목록 제외 상태 아님 · 삭제 아님 (`profile_status <> 'hidden'`, `deleted_at IS NULL`) | `region_label` / region_id · 대치동 |
| 과외쌤 | 목록 제외 상태 아님 (`<> 'hidden'`) | `tutor_region_label` · 서울시 |
| 학생 | 목록용만 · 삭제 아님 (`exposure_status = 'published'`, `deleted_at IS NULL`) | `preferred_region_label` · 희망 공부방/과외 지역 OR · 서울시 |

- **유료 SKU 조인 없음**
- 화면/커밋 메시지/주석에 공개·숨김·심사·작성중 **쓰지 말 것** → 「목록에 나오는 등록」만

### 3.5 프론트 연결

- `guest-sections.js` `renderGuestHero()`: 하드코딩 `GUEST_REGION_STATS` 대신 fetch 결과(또는 모듈 캐시) 바인딩
- `data.js`: 상수 삭제 또는 `null` 초기값 + hydrate. `updated: '2026-06-01'` 더미 제거
- 히어로 리렌더: 기존 `hydrateHomeBasicFromSearch().then(rerender)` 패턴과 합쳐도 됨(전체 게스트 리렌더 OK)

---

## 4. 구현 지시 (파일별)

### 4.1 게스트 홈 카드

1. **시드 가짜 제거**  
   - `renderStudyRoomPrimePick` / `renderTutorPrimePick`이 `EXPOSURE_*` + `getPrimeOccupied`/`demo_prime_filled`로 가짜 프라임을 채우지 않게.  
   - 게스트 프라임/픽 **실데이터 소스**: 유료 점유가 있으면 그 목록(기존 검색/노출 API가 있으면 재사용), 없으면 실0 vacant UX.  
   - `demo_prime_filled`는 게스트 점유에 **적용 금지**(055 취지 유지·강화).

2. **vacantSamples 게스트 경로**  
   - `guest-sections` → `renderPrimeSlotGrid(..., { guest:true, vacantSamples:true })` 등  
   - `search-tier-render` 로그인 조건과 **충돌 없이** 게스트 홈/찾기 전용 플래그. 로그인 홈 `guest!==true` 경로 **비트 하나라도 회귀 없게**.

3. **픽**  
   - 실0: 샘플1+EMPTY4 · **1행**(그리드가 2행으로 늘어나지 않게 — 5열×1행 또는 vacant 전용 1행 마크업)  
   - 실≥1: 실만 순서 채움 · EMPTY 패딩으로 10 채우기 **금지**  
   - `length > 10` → page size 10 + 페이지 번호

4. **베이직·학생**  
   - `renderGuestPaginatedListBlock` 또는 동등: 실0이면 샘플1+empty1  
   - empty 셸: 프라임-empty 유사 · 문구 고정 **「등록하면 여기에 나와요」** (유료 CTA 「유료상품 보기」 쓰지 말 것 — 베이직/학생 empty 한정)  
   - 게스트 홈 `basicPageSize` **10** (Notion 비회원 데모). `runtime-config` 전역 20을 로그인까지 바꾸지 말 것 → **게스트 홈 오버라이드**  
   - 학생 샘플: `guestStudentTeaserFields` 패턴 · 표시명 「김○○」 · CTA 「로그인하고 보기」 · 「샘플」 스탬프는 좌측 이미지

5. **프라임 CSS**  
   - `styles/home-listings.css` `.expo-media--prime` cqw 의존 제거/폴백 → 첫 페인트=정상 크기. 다른 레이아웃 리디자인 금지.

### 4.2 찾기 3화면

- `search-find-surface.js` + `search-tier-render.js`
- 게스트 · `surfaceType:'search'` · **검색 미실행**: Basic-only 샘플1+빈1 행 (flat zero-state 한 장 대체)
- 게스트 · **검색 실행 후**: 결과 flat 전부 · empty 박스 없음 (기존 zero-state는 결과 0일 때만)
- 로그인 찾기·홈 티어 문법 회귀 금지

### 4.3 허용 CSS

- 프라임 크기 버그 수정
- 베이직/학생 empty 셸이 없으면 **최소** 클래스만 (프라임-empty 마크업 재사용 우선)

---

## 5. Allowlist (B) — 타이트

필수 후보 (조사 후 실제 touch만 stage):

```
preview/home-ui/src/data.js
preview/home-ui/src/guest-sections.js
preview/home-ui/src/screens/guest.js
preview/home-ui/src/exposure-render.js
preview/home-ui/src/exposure-rules.js
preview/home-ui/src/home-basic-live.js
preview/home-ui/src/student-blind-teaser.js
preview/home-ui/src/home-card-samples/presets.js
preview/home-ui/src/home-card-samples/render.js
preview/home-ui/src/styles/home-listings.css
preview/home-ui/src/plans/runtime-config.js
preview/search-ui/src/search-tier-render.js
preview/search-ui/src/search-find-surface.js
preview/search-ui/src/search-schema.js
src/Search/SearchService.php
public/api/search/region-stats.php          # 신설 시
# 또는 public/api/search/search.php        # stats_only 확장 시
```

필요 시만(보고 후):

```
preview/home-ui/src/section-headings.js     # 제목 변경 없으면 skip
preview/home-ui/src/search-api.js           # stats fetch 헬퍼
preview/shared/location-display.js         # 라벨 확인만 — GPS 로직 변경 금지
preview/home-ui/src/list-pagination.js
preview/home-ui/src/exposure-data.js        # 게스트 시드 참조 끊을 때만
```

allowlist 밖이 필수면 **중단·보고**. 몰래 넓히지 말 것.  
**스키마 SQL 신규 금지**(live COUNT).

---

## 6. Forbidden (C)

```
git push · npm run build:dothome · Deploy to dothome
Notion MCP/쓰기
로그인 홈 UX 변경 (study-room/tutor/parent home vacant·멤버박스)
숨김/공개 mypage 잔재 삭제 (127) — study-room-reg / tutor-reg / student-reg screens·copy
리디자인·광범위 CSS (프라임 cqw + empty-basic 최소만 허용)
preview/home-ui/src/study-room-reg/screens.js 잔여 blank 커밋
repo docs/046 · docs/047 · docs/README (워킹트리 dirty) 커밋
.git add -A · 타축 파일 stage
```

---

## 7. 스모크 (보고 필수)

### 7.1 게스트 홈 `#/guest`

1. 지도 「대치동」 숫자 ≠ 47/62/128 · API/목록 total과 축별 일치(또는 0)
2. 현재위치: 프라임·픽·베이직 공부방=대치동 · 과외/학생=서울시
3. 하드 새로고침 첫 페인트: 프라임 카드 크기 = 정상(샷 a 수준) · 작았다가 커지는 증상 없음
4. 실0(또는 시드 제거 후):  
   - 프라임 공부방/과외 = 샘플1+빈2 · 「샘플」상단 이미지  
   - 픽 = 샘플1+빈4 · **1행**  
   - 베이직 = 샘플1+빈1 · 빈 문구 「등록하면 여기에 나와요」  
   - 학생 = 샘플1+빈1 · 김○○ 티저 · 「로그인하고 보기」 · 「샘플」좌측 이미지
5. EXPOSURE 시드/`demo_prime` 카드가 실점유로 안 보임
6. (가능하면) 실 베이직 1건 있는 환경: 좌=실 · 우측 빈1 유지 · 샘플 없음

### 7.2 찾기 3화면 (게스트)

7. `#/search/room` · `/tutor` · `/student` 첫 진입: Basic 샘플1+빈1만 · 빈 박스 다수/Prime·Pick 블록 없음  
8. 검색 실행 후: 결과만 · empty 박스 없음

### 7.3 로그인 홈 회귀

9. 공부방 로그인 홈: 프라임 샘플1+EMPTY2 / 픽 샘플1+EMPTY4 **기존 유지**  
10. 과외쌤 로그인 홈(098): 동일 vacant · 멤버박스 회귀 없음  
11. 게스트 경로 켠 뒤에도 `vacantSamples` 로그인 조건 깨짐 없음

### 7.4 프로세스

12. `git status`: allowlist만 · dirty 046/047/screens.js **미포함**  
13. push / build:dothome **안 함**  
14. 커밋 **1개 로컬만** (메시지 예: `fix(guest-home): real region stats and vacant UX per 122`)  
15. 보고: SHA · 파일 목록 · 스모크 · 스크린샷(가능하면) · API 최종 request/response

---

## 8. 완료 보고 형식 (Cursor → 기획)

1. `git rev-parse HEAD` + `git show --stat`
2. Allowlist 실제 수정 파일
3. API: 최종 경로 · 메서드 · 예시 req/res · SearchService 재사용 여부
4. 게스트 홈: 숫자 전후 · vacant 슬롯 구성 전후 · 프라임 CSS 변경 요지
5. 찾기 랜딩/검색후 동작
6. 로그인 홈 회귀 결과
7. push 안 함 · 127·잔여 dirty 미포함
8. 샷 대조 언급

---

## 9. 가설 (모호 → Cursor가 선택 후 보고)

1. **API 모양:** 신규 `GET region-stats.php` vs `search.php` + `stats_only` — 둘 다 OK. 신규 얇은 GET 선호.  
2. **게스트 프라임/픽 실데이터 소스:** 현 게스트는 시드 풀. 실유료 목록 API가 홈에 없으면 실0 vacant만 먼저(허수 시드 제거 우선). 실유료 hydrate가 필요하면 최소 fetch 추가·allowlist 보고.  
3. **픽 1행:** CSS `grid-template-rows` / vacant 전용 wrapper로 2행 방지.  
4. **베이직 empty CTA:** 「등록하면 여기에 나와요」만 — 링크는 가입/해당 등록 허브 또는 링크 없음(프라임 유료 CTA 복제 금지).  
5. **학생 샘플 이미지:** preset에 이미지 없으면 기존 카드 미디어 플레이스홀더 + 「샘플」스탬프.

---

## 붙여넣기

```
[티켓 129 · 게스트 초기화면 허수 걷어내기 · 122/125/127 잠금 · 로컬만 · push/build:dothome 금지]

※ Cursor 채팅에 스크린샷 첨부: /workspace/study114-ds/shots/guest-home-122/guest-home-a.png , guest-home-b.png
※ HEAD 8eaf74d · D:\work\study114 · git -c safe.directory=D:/work/study114
※ dirty 잔여(study-room-reg/screens.js · docs/046 · 047) 커밋/stage 금지. Notion 쓰기 금지. 커밋 1개 로컬만.

화면(게스트만): 홈 #/guest + 공부방찾기 #/search/room + 과외쌤찾기 #/search/tutor + 학생찾기 #/search/student
로그인 홈 UX 변경 금지. 숨김/공개 mypage 잔재(127) 이번 아님.

잠금:
1) 지도 「대치동」박스: GUEST_REGION_STATS(47/62/128) 제거. 실수=손님 검색 LIST에 나오는 등록 COUNT(유료만 아님).
   축 고정: 공부방=대치동, 과외쌤=서울시, 학생=서울시. GPS 없음.
   UI에 공개/숨김/작성중/심사 단어 금지. 새 테이블 금지 — SearchService 목록 필터로 live COUNT.
   API 신설 또는 확장 후 endpoint+req/res 문서화. 실패 시 더미 숫자 재투입 금지.
2) 현재위치 라벨: 데모 축(대치동/서울시) 유지·확인만. GPS 변경 없음.
3) 프라임 첫 로드 크기: .expo-media--prime cqw/container 버그 CSS만 수정. 리디자인 금지.
4) 카드 UX 게스트 전용:
   - 프라임공부방/프라임과외쌤: 실0→샘플1+빈2(1행,「샘플」상단이미지); 실1+→좌=실·빈유지 until3; 슬롯고정3·페이지는 정본
   - 픽공부방/픽과외쌤: 실0→샘플1+빈4(1행만·2행강제금지); 실1+→순서채움·빈칸10패딩금지; page10+페이지번호
   - 베이직공부방/베이직과외쌤: 실0→샘플1+빈1, 빈카피「등록하면 여기에 나와요」(prime-empty유사셸); 실1+→순서·빈패딩없음; 홈 page10
   - 학생: 베이직과 동일. 샘플=김○○+학교/과목/권역/예산 티저+「로그인하고 보기」,「샘플」좌측이미지
5) 「실제」: 베이직/학생=목록등록(비서드). 프라임/픽=유료티어점유(비서드). EXPOSURE_*/demo_prime_filled 게스트 가짜실카드 제거.
6) 찾기3: 첫랜딩=Basic만 샘플1+빈1(홈베이직동형). 검색후=결과전부·빈박스없음.
7) 헬퍼 재사용: vacantStudyRoomSample/vacantTutorSample, renderEmptyPrimePromo/renderEmptyPickPromo, renderPrimeSlotGrid vacantSamples.
   현재 guest!==true 게이트 → 게스트 적절 경로 ON, 로그인 홈 회귀 금지. 학생 샘플 헬퍼 최소 신설+student-blind-teaser 재사용.

Allowlist(타이트): guest-sections.js, data.js, exposure-render.js, exposure-rules.js, search-tier-render.js, search-find-surface.js, home-listings.css, home-basic-live.js, home-card-samples/*, student-blind-teaser.js, screens/guest.js, runtime-config.js(게스트오버라이드만), SearchService.php, public/api/search/region-stats.php(또는 search.php stats_only).
스키마 신규 금지. allowlist 밖 필수면 중단·보고.

스모크: 게스트홈(숫자·위치·프라임크기·vacant표·시드제거) + 찾기3(랜딩/검색후) + 로그인홈 vacant 회귀.
보고: SHA + 파일목록 + API req/res + 스모크 + 샷. push 안 함.

정본 문서: docs/129-guest-home-122-cursor-ticket.md (box study114-ds). 정책 122/125/127.
```
