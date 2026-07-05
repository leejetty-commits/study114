# search-ui — 13장 검색 프리뷰 체크리스트

기준: [docs/ssot/13-search-page-fields.md](../../docs/ssot/13-search-page-fields.md)

## 페이지 구조

- [x] 하나의 검색페이지 · 3탭 (공부방 / 과외쌤 / 학생)
- [x] §8-1 기본검색 **1줄 + 2줄** 배치
- [x] §8-2 확장검색 토글 · 기본 접힘 · 적용 버튼
- [x] §8-2-1 검색 전/후 하단 영역 분기
- [x] §10-3 활성 필터 바 (검색 후 건수)
- [x] §8-4 결과 3구역 행형 리스트 (API 연동)
- [x] 필드명 = DB 컬럼 (`search-schema.js`)

## 탭별 필드 (Notion §3~§5)

- [x] 공부방 — 6 기본 + 7 확장 (교육청·운영형태 기본줄)
- [x] 과외쌤 — 학교명·경력·강의장소 기본줄 + 확장
- [x] 학생 — 수업예산 통합 라벨 · 그룹과외 시 `student_gender_group`

## 권한·역할

- [x] 학부모 → 학생찾기 탭 비노출 (§10-5)
- [x] 무료/유료 → 메모·요청문 안내

## API 연동

- [x] `POST /api/search/search.php` — room / tutor / student
- [x] Vite proxy → `:8080` · `search-api.js`
- [x] dev 시드 `012_search_dev_seed.sql` (공부방 3 · 과외쌤 2 · 학생 2)
- [x] 용어: 희망 **수업인원** · 과외 **수업인원** · 단독/그룹과외 (DB code `one_on_one`/`group`)

## 미구현 (1차 이후)

- [ ] 지역선택·광역 모달 (§8-3)
- [ ] 공부방 지도 핀 연동 (§8-2-2)
- [x] home-ui GNB → search-ui 탭·역할(`?role=`) 연동

## 24·25장 handoff 2차 (P24-08 · search-ui)

- [x] `@home-ui` alias — compare bar · P24 상세 · handoff toast
- [x] 결과행 — 찜 · ⇄ 비교 · 상세 (room/tutor · 로그인 역할)
- [x] `search-handoff.js` · `handoff-bridge.css` · auth session hydrate
- [x] Compare Bar N/3 · `compare-modal.js` · `notifyCompareToggle`

## 미구현 (1차 이후)
