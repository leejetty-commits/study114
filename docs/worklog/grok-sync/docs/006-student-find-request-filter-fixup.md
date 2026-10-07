# 006 · 학생찾기 한 줄 요청문 — 보완지시문 (Cursor용)

- 작성일: 2026-09-23 (KST)
- 선행: [004](004-student-find-request-filter-ticket.md) · 검토: [005](005-student-find-request-filter-review.md)
- 목적: 미닫힌 **필터 판정 · 서버 SQL · 라우팅/API 키 · 검증 · 커밋**만 최소 범위로 닫는다.
- 상태: **Cursor에 그대로 전달할 지시문**

---

## 0. 한 줄 목적

**한 줄 요청문 있음**을 켜면, **한 줄 요청문(`request_summary`)을 실제로 작성한 학생만** 학생찾기 목록에 남게 서버까지 닫고, 그 결과를 커밋 가능한 상태로 증명한다.

## 1. 범위 잠금 (절대)

### 포함

- 학생찾기(`tab=student`) **기본필터 · 목록 API · 리스트/베이직카드 읽기 경로**만
- 이미 로컬에 있는 변경이 있으면 **그 위에서 빈틈만** 메운다. 전면 재작성 금지

### 제외 (한 줄이라도 건드리면 거부)

- 학생 마이페이지 / 기본정보·상세정보 수정 UI
- 학생 등록·상세 저장 구조 (`StudentHubRepository` patch, `student-reg`, `student-detail.css` 등)
- 공부방찾기·과외쌤찾기 필터
- 정렬·추천·정책 문구 전면 수정·무관 CSS·DB 스키마 변경

`a7ab37f` 같은 상세저장 작업과 **이 티켓을 합치지 말 것.**

## 2. 필터 판정 잠금 (최우선)

사용자가 확정함: **한줄 요청문을 작성한 학생만 필터링되어야 한다.**

| 항목 | 잠금 값 |
|------|---------|
| UI 라벨 | 한 줄 요청문 있음 |
| 위치 | **기본필터** (상세필터 패널 안 금지) |
| 필터 키 | `has_request_summary` |
| ON 값 | `"1"` (또는 기존 체크박스와 동일 스키마의 truthy 한 가지로 통일) |
| OFF | 키 자체를 filters에서 **제거** (빈 문자열로 남기지 말 것) |
| **서버 WHERE** | `TRIM(IFNULL(s.request_summary, '')) <> ''` 와 동등한 조건만 |
| **금지** | `special_request_note` non-empty만으로 통과 |
| **금지** | 시드/데모/가로채기용 가짜 문장을 “작성”으로 취급 |
| **금지** | `request_summary_visibility` 등 visibility만으로 “있음” 판정 |
| 병용 | 희망유형·학년·지역 등 기존 기본필터와 **AND**. 서로 지우지 말 것 |

특이요청(`special_request_note`)은 **카드 노출용**이지, 이 필터의 포함 조건이 **아니다**.

## 3. 라우팅 · 상태 잠금

| 항목 | 잠금 |
|------|------|
| 화면 | `#/search/student` (search SPA) |
| 상태 유지 | 기존 학생찾기와 동일: **폼 상태 + 주소 `f` + 브라우저 저장값** |
| 폼 필드 name | 기존 규칙대로 `f_` 접두사 → `collectFiltersFromForm`이 `filters`로 승격. 예: `name="f_has_request_summary"` → `filters.has_request_summary` |
| 재렌더 | 희망유형 변경으로 화면이 다시 그려져도 이 체크 **유지** |

주소 `f` 인코딩 규칙·스토리지 키는 **기존 학생찾기 기본필터와 같은 헬퍼**만 쓸 것. 새 저장소 만들지 말 것.

## 4. API 잠금

| 항목 | 잠금 |
|------|------|
| 엔드포인트 | `POST public/api/search/search.php` |
| 서비스 | `src/Search/SearchService.php` → `searchStudents` |
| body | `{ "tab": "student", "filters": { ..., "has_request_summary": "1" }, "page", "limit", "sort" }` |
| 필터 적용 위치 | **PHP WHERE** (프론트만 걸러서 건수 맞추기 금지) |
| SELECT 보강 | 학생 목록 row/item에 `request_summary`, `special_request_note` (없으면 추가). **스키마 변경 없이** 기존 컬럼 읽기만 |
| 본문 노출 게이트 | **로그인한 과외쌤·공부방·관리자** 응답에만 실제 문자열. 게스트·그 외 역할은 **빈 문자열** (프론트에 시드로 채우지 말 것) |
| 시드 차단 | 검색 결과가 시드 문장으로 요청문을 채우던 경로 유지·재발 금지 |

쿼리스트링 `?has_request_summary=1`만 넣고 `filters`에 안 실리면 **미완료**.

## 5. 리스트 / 베이직카드 잠금

| 항목 | 잠금 |
|------|------|
| 대상 | 학생찾기 베이직카드만 |
| 노출 주체 | 공급자(과외쌤·공부방) 및 보고와 동일하게 관리자 카드 정책 유지. **게스트 카드에 요청문 줄 금지** |
| 필드 | 한 줄 요청(`request_summary`), 특이요청(`special_request_note`) |
| 빈값 | 해당 **줄 자체를 그리지 않음** |
| 길이 | **18자** 초과 시 말줄임 (기존 보고 유지) |
| 금지 | 상세페이지 레이아웃 재구성, 다른 탭 카드 개편 |

## 6. 반드시 할 검증 (가로채기만으로 통과 불가)

아래를 **실제 목록 API 응답**(로컬 PHP 또는 배포 API)으로 증명하고, 보고에 **요청 URL/body 일부 · total · 샘플 id**를 적어라.

1. `has_request_summary=1` → 응답의 모든 row는 DB상 `request_summary` non-empty인 학생만.  
   **특이요청만 있는 학생 id가 끼면 실패.**
2. 필터 OFF 후 재검색 → 그 조건 없이 목록이 넓어짐 (이전보다 total ≥).
3. 희망유형·학년·지역과 동시 적용 → AND, 체크 유지.
4. 공급자 세션: 카드에 잘린 요청문·특이요청 표시. 빈값 줄 없음.
5. 게스트: 카드에 요청문 없음 + 응답 필드 빈 문자열.
6. Network에서 `filters.has_request_summary`가 POST JSON에 실리는지 확인.

로컬 `127.0.0.1:8080`이 꺼져 있으면 **켜서** 검증하거나, 동일 코드 경로의 실제 PHP 검색을 돌릴 것.  
**브라우저 요청 가로채기만으로 “SQL 확인”이라고 쓰지 말 것.**

## 7. 산출물 · 종료 조건

1. 변경 파일 목록 (학생찾기 읽기 경로만).
2. `git`으로 커밋 가능한 상태. 소유권 문제면 `safe.directory`/권한만 최소 조치 후 status·diff 가능해야 함. (설정 global 함부로 바꾸지 말 것.)
3. push·`build:dothome`은 **사용자가 요청하기 전 하지 말 것.** 다만 **커밋 전에는** 로컬에서 SQL 검증을 끝내라.
4. 보고 형식:
   - 필터 WHERE 한 줄 (실제 조건)
   - 검증 1~6 체크 결과
   - 마이페이지/등록 파일 **diff에 없음** 명시

## 8. 금지 재확인

- UI만 있고 서버 WHERE 없음
- `special_request_note`로 필터 통과
- 시드 문장으로 건수 맞춤
- 학생 도메인 저장/마이페이지 동시 수정
- “나중에 필요할 것 같아서” 리팩터

## 9. Cursor에 붙여 넣을 짧은 지시 (복사용)

```
004/006 보완만 한다. 범위: 학생찾기 읽기 경로만. 마이페이지·등록 저장 금지.

잠금:
- 기본필터 「한 줄 요청문 있음」 → filters.has_request_summary=1
- 서버(SearchService searchStudents) WHERE: request_summary trim non-empty 인 학생만
- special_request_note 만으로는 통과 금지. 시드/가짜 문장 금지.
- POST public/api/search/search.php 의 filters 로 전달. 쿼리만 넣고 끝내지 말 것.
- 응답 request_summary / special_request_note: 공급자·관리자만 본문, 그 외 빈 문자열.
- 베이직카드: 공급자, 18자 말줄임, 빈값 줄 없음, 게스트 비노출.

필수: 로컬 PHP 검색을 실제로 돌려 filters ON/OFF total과 “특이요청만 있는 학생 미포함”을 증명할 것. 가로채기만으로 완료 금지.
커밋 준비까지. push/build:dothome은 요청 전 금지.
```
