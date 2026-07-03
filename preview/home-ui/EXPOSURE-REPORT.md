# 11장 노출·비교검색 — 프리뷰 반영 보고

**SSOT:** [docs/ssot/11-main-exposure-and-compare.md](../../docs/ssot/11-main-exposure-and-compare.md)  
**코드:** `src/exposure-schema.js` · `src/exposure-data.js` · `src/exposure-render.js` · `src/compare-modal.js`

---

## A. 2026-07-04 Notion 동기화

| 항목 | 상태 |
|------|------|
| §4-0 공부방 표형 카드 (슬로건·수업운영형태) | ✅ schema + Prime/Pick/Basic **표 레이아웃** |
| §5-0 과외쌤 (증빙 n개·강의스타일·학생구성) | ✅ schema + format |
| §6-0 학생 2행 (수업예산·주/분·visibility) | ✅ 리스트 렌더 |
| 비교표 공부방 `lesson_operation_type` | ✅ |
| 비교표 과외 8장 필드 전체 | ✅ |
| 과외쌤 008 DDL | ✅ (더미 연동) |

---

## B. 실DB 연결

| 대상 | 상태 |
|------|------|
| 공부방 | 005/009 연결 가능 |
| 학생 | 004 연결 가능 |
| 과외쌤 | **008/010** — 프리뷰 더미 |

---

## C. 미구현 (후속)

| 항목 | 비고 |
|------|------|
| 비교 3건 체크 UX | 프리뷰 샘플 3건 고정 |
| Prime/Pick 이미지 비교 오버레이 | CSS 후속 |
| 과외쌤 시·과목 헤드라인 (§5-3) | 메인 라우트 후속 |
| 실 API fetch | `exposure-data.js` 더미 |

---

## D. 확인 URL

- 비회원: http://localhost:5174/#/guest — 비교 차단
- 학부모: http://localhost:5174/#/parent — 비교 모달
