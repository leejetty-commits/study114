# 새 잠금 기준 ↔ preview 반영 정리

**기준일:** 2026-07-04  
**SSOT:** [6장](../docs/ssot/06-phase1-menu-structure.md) · [5장](../docs/ssot/05-study-room-db.md) · [8장](../docs/ssot/08-tutor-registration-db.md) · [9장](../docs/ssot/09-main-screen-roles.md)  
**Notion:** [6장 확정](https://app.notion.com/p/e9e84d824c734d938354e697ee40cb8a) (2026-07-03)  
**코드:** `src/policy.js` · `src/nav-config.js` · `../shared/preview-links.js`

---

## A. 새 기준 반영 체크

| 항목 | 잠금 내용 | 반영 상태 |
|------|-----------|-----------|
| **메뉴 구조** | 퀵매칭·앱다운·자료실/포털 **1차 제외** · 유틸+GNB **2층** · GNB **6항목** | ✅ `nav-config.js` · `layout.js` |
| **안전과외** | GNB 독립 메뉴 **아님** · 이용안내/고객센터 하위 가이드 | ✅ GNB 제거 · `util-guide`/`support` 안내 |
| **GNB → search-ui** | 공부방/과외/학생 탭 · `?role=` | ✅ `preview-links.js` |
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
- GNB 탐색 → search-ui / 등록 UI
- 비교검색 로그인 게이트 · 표 모달 · 최대 3건 (더미)

### 아직 미완

| 항목 | 조치 |
|------|------|
| 이용안내/고객센터 **실제 페이지** | ⏳ placeholder alert |
| 내부 카피 「학생」 통일 | ⏳ 학부모 화면 |
| 찜·비교 **서버 API** | ⏳ sessionStorage만 |

---

## C. 다음 구현 우선순위

1. **찜 + 비교 선택 UX** — 6장 §4·§5 필수
2. **이용안내/고객센터** — 안전과외 가이드 정적 페이지
3. **쪽지함** — 유틸 진입 스케치

---

## 프리뷰 확인

```bash
cd preview/home-ui && npm run dev    # :5174
cd preview/search-ui && npm run dev  # :5176
```

- GNB 6항목 (안전과외 **없음**)
- 이용안내 클릭 → 안전과외 가이드 안내 (alert)
- 공부방찾기 → search-ui `#/search/room?role=…`
