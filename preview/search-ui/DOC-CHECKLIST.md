# search-ui — 13장 검색 프리뷰 체크리스트

기준: [docs/ssot/13-search-page-fields.md](../../docs/ssot/13-search-page-fields.md) · [09-main-screen-roles.md](../../docs/ssot/09-main-screen-roles.md) §13

## 페이지 구조

- [x] 하나의 검색페이지 · 역할별 **2탭** (백화점식 3탭 ✕)
- [x] §8-1 기본검색 **1줄 + 2줄** 배치 · **컴팩트 검색박스** (`search-form--compact`)
- [x] §8-2 확장검색 토글 · 기본 접힘 · 적용 버튼
- [x] §8-2-1 검색 전: **내 지역 Prime/Pick/Basic 피드** · 검색 후 등급 레이아웃으로 **전면 교체**
- [x] §8-2-2 공부방: **지도 → 검색박스 → 결과** (지도형 문법)
- [x] §8-2-2 과외쌤: 지도 없음 · **3지역 탭 → 피드 → 검색박스 → Prime/Pick/Basic 결과**
- [x] §8-2-2 학생: 블라인드 Basic 리스트 · **찜 · 쪽지** · 비교 없음
- [x] 검색 결과 `exposure_tier` 분기 → `exposure-render.js` 재사용 (`search-tier-render.js`)
- [x] API `exposure_tier` 필드 (SearchService · 상세등록·순서 기반)
- [x] 검색 결과 등급 카드/리스트 (`exposure-render.js` · `search-tier-render.js`)
- [x] 필드명 = DB 컬럼 (`search-schema.js`)
- [x] `activeResultItems` / `activeResultSource` / `activeRegionLabel` — 지도 핀·목록 **단일 SSOT**
- [x] `data-result-source="region|search"` · `data-result-items="activeResultItems"` (디버그 attribute)
- [x] 0건 — `renderSearchZeroState(tab, mode)` · 공부방/과외/학생 × region/search (29장)
- [x] 지도 핀 — `data-map-pin` + `data-provider-id` · `bindSearchMapPinLinks` · 카드 `data-provider-id`와 매칭

## 역할별 탭 노출 (`search-role-access.js`)

| 역할 | 검색 탭 | 비고 |
|------|---------|------|
| guest · parent | `room` · `tutor` | 학생찾기 **hide** |
| study_room | `room` · `student` | `room` = 공부방찾기(내 노출) |
| tutor | `tutor` · `student` | `tutor` = 과외쌤찾기(**경쟁 확인**) |

- [x] `ROLE_SEARCH_TABS` · `resolveAllowedTab` · URL `?role=` + `#/search/{tab}`
- [x] home-ui GNB → `searchUiUrl(tab, role)` 연동
- [x] 탭 라벨 역할별 오버라이드 (`ROLE_SEARCH_TAB_LABELS`)

## 자기 노출 vs 경쟁 확인 (`search-provider-self.js`)

| 맥락 | 공부방 `room` | 과외 `tutor` |
|------|---------------|--------------|
| search-ui · study_room | **본인만** (`PREVIEW_OWN_STUDY_ROOM_ID`) | — |
| search-ui · tutor | — | **경쟁 목록** (지역 필터) |
| home-ui · study_room 탭1 | **본인만** (`homeSelf`) | — |
| home-ui · tutor 탭1 | — | **본인만** (`homeSelf` · `getProviderSelfFeed(..., { home: true })`) |

- [x] `isProviderSelfPreviewMode(tab, role, homeSelf)` — 비교·찜 비활성
- [x] `filterToProviderSelf` — 검색 실행 후에도 본인만 유지 (공부방·과외 홈)
- [x] 자기 노출 안내 문구 (`search-note--self`)

## 지역 피드 (`search-region-feed.js`)

- [x] 공부방 — 행정동 + 단지 (`filterStudyRoomsByRegion`) · 동 단위 fallback
- [x] 과외 — 시/구 (`filterTutorsByRegion`) · **전체 풀 fallback 없음**
- [x] 학생 — 동·단지 (`filterStudentsByRegion`)
- [x] 과외 3지역 탭 — `MOCK_TUTOR_REGIONS` · `tutorRegionIndex` · `getTutorRegionLabel`
- [x] 과외쌤찾기(search) — **「지역 변경」버튼 없음** · 3지역 탭 + 필터로 충분

## home-ui 공용 surface (`search-find-surface.js`)

- [x] `#/parent` · `#/study-room` · `#/tutor` — `variant: 'home'` · `provider-home.js` 경유
- [x] `homeSelf` 플래그 — 홈 자기노출 vs 검색 경쟁 분기
- [x] `hideSearchForm` — 과외쌤 홈 탭1 (경쟁 검색은 GNB/search-ui)
- [x] `bindFindSurfaceEvents` · `resetFindSurface` · `refreshActiveResultItems`
- [x] 학부모 홈 — `parentTabToSearchTab` · `data-parent-tab`

## 탭별 필드 (Notion §3~§5)

- [x] 공부방 — 6 기본 + 7 확장 (교육청·운영형태 기본줄)
- [x] 과외쌤 — 학교명·경력·강의장소 기본줄 + 확장
- [x] 학생 — 수업예산 통합 라벨 · 그룹과외 시 `student_gender_group`

## 권한·역할

- [x] 학부모 → 학생찾기 탭 비노출 (§10-5)
- [x] 공부방 → 공부방찾기 탭 **내 노출만** · 비교 불가
- [x] 과외쌤 검색 → 과외쌤찾기 **경쟁** · 비교 가능
- [x] 무료/유료 → 메모·요청문 안내

## API 연동

- [x] `POST /api/search/search.php` — room / tutor / student
- [x] Vite proxy → `:8080` · `search-api.js`
- [x] dev 시드 `012_search_dev_seed.sql` (공부방 3 · 과외쌤 2 · 학생 2)
- [x] 용어: 희망 **수업인원** · 과외 **수업인원** · 단독/그룹과외 (DB code `one_on_one`/`group`)

## 24·25장 handoff 2차 (P24-08 · search-ui)

- [x] `@home-ui` alias — compare bar · P24 상세 · handoff toast
- [x] 결과행 — 찜 · ⇄ 비교 · 상세 (room/tutor · 로그인 역할)
- [x] `search-handoff.js` · `canUseCompare(tab, role, homeSelf)` · `handoff-bridge.css`
- [x] Compare Bar N/3 · `compare-modal.js` · `notifyCompareToggle`
- [x] 학생 — 찜·비교 미렌더

## 미구현 (1차 이후)

- [ ] 지역선택·광역 모달 (§8-3) — `change-region` alert placeholder
- [ ] 공부방 지도 핀 실 API 연동 (§8-2-2) — 프리뷰 CSS·`data-provider-id` 계약·`bindSearchMapPinLinks` ✅

## 프리뷰 실행

```bash
cd preview/search-ui && npm run dev   # http://127.0.0.1:5176
```

역할 예시:

- 학부모: `?role=parent#/search/room`
- 공부방: `?role=study_room#/search/room` (내 노출)
- 과외쌤: `?role=tutor#/search/tutor` (경쟁 · 3지역 탭)
