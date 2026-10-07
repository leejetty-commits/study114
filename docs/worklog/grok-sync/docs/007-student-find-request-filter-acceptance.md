# 007 · 학생찾기 한 줄 요청문 — 보완 후 수락 검토

- 작성일: 2026-09-23 (KST)
- 선행: [004](004-student-find-request-filter-ticket.md) · [005](005-student-find-request-filter-review.md) · [006](006-student-find-request-filter-fixup.md)
- 대상: Cursor 보고 — 로컬 커밋 `c49b09a` (`fix/student-detail-info`)
- 상태: **로컬 완료 · 수락** (remote/배포는 사용자 요청 전 대기)

---

## 0. 한 줄 결론

004/006 잠금 기준으로 **학생찾기 읽기 경로는 로컬에서 닫혔다.**  
실제 PHP 검색으로 필터 ON/OFF·특이요청-only 제외·게스트 빈 문자열이 증명됐고, 커밋 파일 범위도 학생찾기 8개만이다.  
**push / `build:dothome` / remote main 반영은 아직 없다.**

---

## 1. 검증한 증거

| 항목 | 결과 |
|------|------|
| 커밋 | `c49b09a43e097955f7ff2083a4158f97e9546ed7` (로컬만, GitHub SHA 없음) |
| 브랜치 | `fix/student-detail-info` (이름만 상세정보 잔재. 이 커밋 내용은 검색) |
| 메시지 | `fix(search): 학생찾기 기본필터가 한 줄 요청문이 있는 학생만 남긴다` |
| 파일 8개 | `SearchService.php`, `public/api/search/search.php`, `search-schema.js`, `search-find-surface.js`, `search-exposure-mapper.js`, `state.js`, `find-state.js`, `exposure-render.js` |
| 마이페이지/등록 | **diff에 없음** |
| vs `origin/main` (triple-dot) | 위 8파일만 (본 커밋 범위) |

### 서버 WHERE (잠금과 동등)

```sql
s.request_summary IS NOT NULL AND TRIM(s.request_summary) <> ''
```

- 키: `filters.has_request_summary` → `isEnabledFilter`
- `special_request_note`만으로는 **통과 불가** (보고·롤백 검증과 일치)

### API 게이트

- `POST public/api/search/search.php`
- 세션 + `role_type` ∈ `tutor` | `study_room_owner` | `admin` 일 때만 `includeStudentRequestText=true`
- 그 외·세션 없음 → `request_summary` / `special_request_note` = `''`
- 프론트 `viewerRole`는 `study_room_owner` → `study_room` 매핑이 이미 있어 카드 쪽과 맞음

### 카드

- 공급자만 미리보기, **18자** 말줄임
- 빈 값이면 미리보기 빈 문자열 (줄 미표시 경로 유지)
- 특이요청도 동일 헬퍼

### 로컬 PHP 증명 (Cursor 보고 · 수락)

| 조건 | total |
|------|------:|
| 필터 끔 | 2 |
| `has_request_summary=1` | 1 |

- SQL 건수와 동일
- 한 줄 비어 있고 특이요청만 있는 학생은 ON 목록 미포함 (트랜잭션+롤백)
- 게스트 응답 본문 빈 문자열, 공급자 플래그 검색에서만 본문

가로채기-only 보고가 아님 → **006 §6 통과**.

---

## 2. 004 완료 기준 체크

1. 기본필터 **한 줄 요청문 있음** — 예 (`has_request_summary`, basic tier)
2. 선택 시 목록 변화 — 예 (2 → 1)
3. API에서 한 줄·특이요청 읽기 — 예 (게이트 포함)
4. 베이직카드 노출 — 예
5. 라우팅·상태·API·카드 연결 — 예 (`#/search/student`, `f_` → filters, POST search.php)
6. 마이페이지·등록 비번짐 — 예 (이 커밋 기준)

---

## 3. 남아 있는 운영 메모 (코드 미완료 아님)

1. **remote에 없음** — push 전에는 실서비스 미반영.
2. **브랜치 이름** `fix/student-detail-info`는 상세저장 작업 잔재. PR/푸시 전에 `fix/student-find-request-summary` 등으로 바꾸거나, PR 제목·본문에 “학생찾기 필터만”을 명시할 것. `a7ab37f`와 메시지 혼동 금지.
3. 응답에 `*_visibility` 필드도 실림 — 스키마 변경 없이 SELECT 확장. 필터 판정에는 미사용. 허용 범위.
4. push / `build:dothome`은 **사용자 요청 전 금지** (006 유지).

---

## 4. 보완지시문?

**추가 코딩 보완지시문 불필요.**  
다음 액션은 사용자 결정:

- 로컬 커밋 유지
- 또는 push / PR / dothome 빌드

---

## 5. 잠금 필드 채움 (004 §9)

| 잠금 항목 | 값 |
|-----------|-----|
| 진입 라우트 | `#/search/student` |
| 필터 상태 | 폼 + 주소 `f` + 브라우저 저장 (기존 find helpers) |
| 필터 키 | `has_request_summary=1` (`f_has_request_summary`) |
| 목록 API | `POST public/api/search/search.php` · `filters.has_request_summary` |
| WHERE | `request_summary IS NOT NULL AND TRIM(request_summary) <> ''` |
| 응답 필드 | `request_summary`, `special_request_note` (+ visibility) |
| 카드 | `exposure-render.js` · 18자 · 공급자만 |
| 금지 경로 | mypage / student-reg / 상세저장 — **이 커밋에 없음** |
