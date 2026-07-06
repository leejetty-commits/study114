# 새 잠금 기준 ↔ preview 반영 정리

**기준일:** 2026-07-07  
**SSOT:** [6장](../docs/ssot/06-phase1-menu-structure.md) · [5장](../docs/ssot/05-study-room-db.md) · [8장](../docs/ssot/08-tutor-registration-db.md) · [9장](../docs/ssot/09-main-screen-roles.md) · [13장](../docs/ssot/13-search-page-fields.md)  
**Notion:** [6장 확정](https://app.notion.com/p/e9e84d824c734d938354e697ee40cb8a) (2026-07-03)  
**코드:** `src/policy.js` · `src/nav-config.js` · `src/provider-home.js` · `../shared/preview-links.js` · `../search-ui/src/search-find-surface.js`

---

## A. 새 기준 반영 체크

| 항목 | 잠금 내용 | 반영 상태 |
|------|-----------|-----------|
| **메뉴 구조** | 퀵매칭·앱다운·자료실/포털 **1차 제외** · 유틸+GNB **2층** · GNB **6항목** | ✅ `nav-config.js` · `layout.js` |
| **안전과외** | GNB 독립 메뉴 **아님** · 이용안내/고객센터 하위 가이드 | ✅ GNB 제거 · `util-guide`/`support` 안내 |
| **GNB → search-ui** | 공부방/과외/학생 탭 · `?role=` · 역할별 2탭 | ✅ `preview-links.js` · `search-role-access.js` |
| **홈 2탭 vs 검색** | 홈=목적형 · GNB=탐색형 · 공급자 탭1=내 노출 | ✅ `provider-home.js` · `homeSelf` |
| **과외 3지역 탭** | 등록 활동지역 · 검색 전 피드 1차 필터 | ✅ `MOCK_TUTOR_REGIONS` · search-ui |
| **표기** | 가입 **학생/학부모** · 내부 카피 **학생** 중심 | △ GNB OK · 학부모 화면 카피 일부 혼재 |
| **찜** | 공부방+과외쌤 1차 필수 · 마이페이지 · 비교 연동 | ✅ sessionStorage · 유틸 마이페이지 모달 |
| **공부방 비교** | 로그인·최대 3·표 모달·**사용자 선택** | ✅ ⇄ 담기 · 하단 바 · `#/parent` |
| **과외 비교** | 경량 · 최소 7필드 | ✅ ⇄ 선택 · 경량 표 모달 |
| **쪽지함** | 핵심 중계 채널 | △ 유틸 메뉴 노출 · 페이지 미구현 |
| **등록 2단계** | 기본→리스트 / 상세→누구나 이어서 | ✅ `study-room-ui` · `tutor-ui` |
| **Pick/Prime** | **상세등록 완료 필수** | ✅ 문구·`EXPOSURE_TIERS` |
| **열람권** | 1차 미구현 | ✅ `TUTOR_VIEW_PASS_CANDIDATE` 메모만 |

---

## B. preview/home-ui 충돌 점검

### 이미 맞는 것

- 비회원 대치동 데모 · 공부방 지도만 (9장)
- Prime/Pick 박스 + 학생 리스트 (비회원 메인)
- 1차 제외 메뉴 **미노출** (`MENU_EXCLUDED_PHASE1`)
- 유틸 2층 · GNB 6장 §7 예시 6항목
- GNB 탐색 → search-ui / 등록 UI · 역할별 탭·라벨
- 학부모·공부방·과외쌤 홈 **2탭 통일** · `search-find-surface` 공용
- 공부방 검색·홈 탭1 = **내 노출** · 과외 검색 = **경쟁** · 과외 홈 탭1 = **내 노출**
- 비교검색 로그인 게이트 · 표 모달 · 최대 3건
- 고객센터 `#/support` (17a) · handoff API (25장)

### 아직 미완

| 항목 | 조치 |
|------|------|
| 지역선택·광역 모달 (13§8-3) | ⏳ alert placeholder |
| 지도 API 실연동 | ⏳ CSS placeholder · `data-map-item-id`만 |
| 내부 카피 「학생」 통일 | ⏳ 일부 화면 |

---

## C. 다음 구현 우선순위

1. **지역선택·광역 모달** — 13장 §8-3
2. **지도 핀 API** — 공부방 검색·홈 SSOT 연동
3. **A28 운영 콘솔** — 28장 후순위 항목

---

## 프리뷰 확인

```bash
cd preview/home-ui && npm run dev    # :5174
cd preview/search-ui && npm run dev  # :5176
```

- GNB 6항목 (안전과외 **없음**)
- 공부방찾기 → search-ui `#/search/room?role=study_room` (내 노출) / `parent` (탐색)
- 과외쌤찾기 → `#/search/tutor?role=tutor` (경쟁 · 3지역 탭)
- 학생찾기(GNB) → `#/search/student?role=study_room|tutor`
- `#/parent` · `#/study-room` · `#/tutor` — 동일 `search-find-surface` 문법 · 홈은 `homeSelf` 분기
