# 168 · 폼 필드 전역 정책 잠금 (과목·학교급/학년·예산·수업시간·주회수·가입로고)

- 작성: 2026-09-27 KST · 우동공과2
- 상태: **기획 잠금** · 구현 분할 **169→170→171** · 169·170 ACCEPT · [171 Cursor](171-signup-brand-logo-cursor-ticket-2026-09-28.md) 작성 2026-09-28
- 근거: 사용자 요청(외부 중) + GitHub `leejetty-commits/study114` main 코드 대조
- Notion: 쓰지 않음 · 배포/푸시: 금지
- 관련: 모드점검 163~167과 별트랙. 「학생 의뢰」 금지어는 164/이미 잠금 — 본 문서 범위 아님.

---

## 0. 사용자 잠금 요약 (정본)

### 1. 학생찾기
1.1 **희망과목** — 지금처럼 몇 개만 두지 말고, 공부방·과외쌤 가입과 **같은 전체 과목 목록·알고리즘**을 쓴다.  
1.2 **학교급 / 학년** — **분리**.  
- 학교급: 미취학 · 초등 · 중등 · 고등 · N수  
- 학년: 1학년~6학년 (학교급에 맞게 선택지·카피 조정)  
- N수: 재수 · 삼수 · 사수 · 오수 · N수 …  

### 2. 전역 검사 · 전역 수정 (게스트·공부방·과외쌤·학생 각 모드)
2.1 돈·수업예산 관련 **표시·입력 단위 = 「천원」**  
2.2 **1회 수업시간**: 20·30·40·50·60·70·80·90·100·110·120분 + **기타 (____)분**  
2.3 **주 회수**: 1회~7회 + **기타 (____)회**  
2.4 모드별 **가입 첫단계** 상단 제목줄에 **우동공과 풀로고**(`logo-full`) 없는 곳 넣기  

### 3. 1.2가 모드 맥락에 안 맞으면
모드에 맞게 필드 의미·카피를 고쳐 설정한다 (아래 §4 모드 매트릭스).

---

## 1. 코드 현황 (GitHub main 대조)

### 1.1 희망과목 — 목록이 갈라져 있음

| 위치 | 목록 | 비고 |
|------|------|------|
| `preview/shared/main-subjects.js` → `MAIN_SUBJECT_OPTIONS` | 국어~기타 **24항** | 주석: 「가입·기본등록·상세등록 공통」 — **정본 후보** |
| `preview/auth-ui` 가입 기본정보 | `renderMainSubjectSelect` 사용 | 공부방·과외쌤·학생 가입 OK |
| `preview/home-ui/src/student-reg/screens.js` → `BASIC_SUBJECTS` | MAIN과 **동일 24항을 로컬 배열로 복제** | SSOT 미공유(드리프트 위험) |
| `preview/search-ui/src/search-schema.js` → `MOCK_SUBJECTS` | **`['수학','영어','국어','과학','사회']` 5개만** | **학생찾기(및 찾기 필터 subject 입력)가 여기를 씀** |
| `preview/search-ui/src/search-find-surface.js` | `field.input === 'subject'` 시 `MOCK_SUBJECTS` 렌더 | 공부방·과외쌤·학생 찾기 공통 subject UI |
| `sql/schema/003_subject_masters.sql` | DB 마스터 테이블 | 공부방 상세는 API subjects 있으면 우선, 없으면 MAIN |

**목표:** 찾기 필터·학생 등록·가입 모두 `MAIN_SUBJECT_OPTIONS` / `renderMainSubjectSelect` (또는 동일 목록을 한곳에서 import). `MOCK_SUBJECTS` 폐기 또는 MAIN 재export. `BASIC_SUBJECTS` 중복 제거.

### 1.2 학교급 / 학년 — 결합·자유입력·학년대 혼재

| 화면 | 학교급 | 학년 | 문제 |
|------|--------|------|------|
| 학생 가입 `signup-basic` | 칩 `SCHOOL_LEVEL_OPTIONS` (미취학~N수) | 텍스트 `grade_level` placeholder「예: 중2」 | **분리 미완** · N수 세부 없음 |
| 학생 마이페이지 기본 `student-reg/screens` | select `school_level` | 텍스트 `grade_level` | 동일 |
| 학생찾기 스키마 `search-schema` student | (별도 school_level 필터 약함) | **`grade_level` 한 칸 label「학교급/학년」 text** | **결합 라벨** |
| 과외쌤 상세 과목행 `tutor-ui` | `SCHOOL_LEVELS` | `GRADE_BAND_OPTIONS` 1~6학년 | 분리됨 · **N수 세부 없음** · 중등/고등에 4~6 노출 |
| 공부방 상세 과목행 `study-room-ui` | `SCHOOL_LEVELS`(+일반·기타) | `GRADE_OPTIONS` 1~6 + 「N수」한 칸 | N수가 학년에 섞임 · 재수~N수 세분 없음 |

**학교급 정본(이미 코드에 있음):**  
`preschool` 미취학 · `elementary` 초등 · `middle` 중등 · `high` 고등 · `n_su` N수  
(`RegisterEnums.php` / `register-enums.js` 와 동일)

**학년 목표 옵션 (잠금):**
- 미취학: 학년 선택 **비활성** 또는 「해당 없음」(카피만)
- 초등: 1~6학년
- 중등: 1~3학년 (4~6 숨김)
- 고등: 1~3학년 (4~6 숨김)
- N수: **재수 · 삼수 · 사수 · 오수 · N수** (기타 자유입력은 Cursor 티켓에서 「기타」 넣을지 사용자 확인 가능 — 기본은 위 5항)

값 저장 제안(구현 시):
- `school_level`: 기존 enum 유지
- `grade_level` 또는 `grade_band`:  
  - 일반: `1`~`6` 또는 `1학년`~`6학년` (기존 tutor/study-room은 `1학년` 문자열 — **한 형식으로 통일**)  
  - N수: `재수`|`삼수`|`사수`|`오수`|`N수`

### 1.3 수업예산 · 금액 단위 — 「만원」「원」혼재 → 「천원」으로 통일

| 위치 | 현재 |
|------|------|
| 공부방 상세 `step-lesson` | UI 단위 **「만원」** · placeholder「예: 35만원」 · 클래스 `register-fee-manwon` |
| 찾기 range 필터 | placeholder **「최소(원)」「최대(원)」** · step 10000 |
| 카드 포맷 `exposure-format.js` | `formatMonthlyWon` → **「월 N만원~」** (원 값을 10000으로 나눔) |
| 학생 가입/등록 예산 | number 입력 · **단위 라벨 없음**(힌트만 「월 예산」) |
| 과외쌤 상세 | `preferred_fee_amount` number · 단위 라벨 약함 |
| 목업 카피 search-schema | 「월 48만원」「수업예산 55만」 |

**잠금:** 입력·필터·카드·힌트에서 돈 관련 사용자 단위는 **천원**.  
예: 입력 35 → 「35천원」표시(또는 「3.5만원」이 아니라 **천원**으로만).  
저장값(원/정수) 환산 규칙은 Cursor 티켓에서 명시: **권장 = DB는 원(기존) 유지, UI만 천원 입력×1000** — 기존 만원 UI(×10000)와 혼동 주의. 전수 치환 필요.

전역 검색 키워드(구현 시): `만원`, `register-fee-manwon`, `formatMonthlyWon`, `최소(원)`, `preferred_fee`, `budget_amount`, `monthly_fee`, `price_amount`.

### 1.4 1회 수업시간

| 위치 | 현재 |
|------|------|
| 공부방 `DAILY_LESSON_MINUTES` | 30·60·90·120·150·180·3시간초과 |
| 과외쌤 상세 | 자유 `minutes_per_lesson` 텍스트 |
| 학생 상세 등록 | 자유 텍스트(분) |
| 찾기 | schema상 expanded `minutes_per_lesson` text |

**목표 공통 옵션:**  
20 30 40 50 60 70 80 90 100 110 120 + **기타 (숫자)분**  
(150·180·over_180 제거 또는 기타로만)

공유 상수 권장 경로: `preview/shared/lesson-duration-options.js` (신설) → 공부방·과외쌤·학생·찾기 import.

### 1.5 주 회수

| 위치 | 현재 |
|------|------|
| 공부방 `WEEKLY_LESSON_COUNTS` | 1~6회 + **「7회 이상」** |
| 과외쌤·학생 | 자유 입력 |

**목표:** 1회·2회·…·7회 + **기타 (____)회**  
「7회 이상」라벨 폐기 → 정확히 7회 + 기타.

### 1.6 가입 첫단계 · 풀로고

자산: `public/assets/brand/logo-full.png` · 헬퍼 `renderBrandHero()` in `preview/auth-ui/src/layout.js` (이미 logo-full 사용).

| 화면 | 풀로고 |
|------|--------|
| 로그인 | 있음 (wordmark/full 계열) |
| 가입 약관 `signup-terms` | 있음 (wordmark) |
| 회원구분 `signup-role` | **없음** |
| 가입폼·이메일확인·계정연락처·기본정보·완료 | **없음** |

**잠금 해석:** 「모드별 가입의 첫단계」= 역할이 정해진 뒤 **역할별 기본정보(`#/signup/basic?role=…`)** 및/또는 **회원구분(`signup-role`)** 상단 제목줄.  
→ `signup-role` + `signup-basic`(학생·공부방·과외쌤) 상단에 **풀로고(`logo-full` / `renderBrandHero`)** 넣기.  
약관·로그인은 이미 있으므로 유지. 중간 단계(이메일 등)는 필수 아님(넣어도 무방하나 범위는 첫단계 우선).

---

## 2. 모드별 학교급·학년 카피·맥락 (§3)

| 모드·화면 | 필드 의미 | 라벨 제안 | 비고 |
|-----------|-----------|-----------|------|
| 학생 가입·학생 마이 기본 | 본인(자녀) 학교급·학년 | 「학교급」「학년」 | N수면 학년 대신 「몇 수」 |
| 학생찾기 필터 | 목록에 보이는 학생의 학교급·학년 | 「학교급」「학년」분리 (「학교급/학년」결합 금지) | subject는 MAIN 전체 |
| 과외쌤 상세 과목행 | **지도 가능한** 학교급·학년 | 「지도 학교급」「지도 학년」 | 행마다 학교급→학년 종속 |
| 공부방 상세 과목행·주대상 | **모집·수업 대상** | 「대상 학교급」「대상 학년」 | 주대상 복수 시 기존 primary_school_levels와 정합 |
| 공부방/과외 찾기 필터 | 공급자 대상군 | 「대상 학교급」등 | 학년 필터 넣을지는 기본 학교급 우선 |

미취학: 학년 숨김 + 힌트 「미취학은 학년을 고르지 않습니다.」

---

## 3. 구현 시 주의 (Cursor 오판 방지)

1. **과목:** `MOCK_SUBJECTS`만 늘리지 말고 `main-subjects.js`로 교체. 학생-reg `BASIC_SUBJECTS` 중복 삭제.  
2. **금액:** UI 「천원」≠ 저장 원. 기존 「만원」입력(×10000)과 「원」입력·표시를 한꺼번에 감사. 카드 `formatMonthlyWon` 명칭·로직 변경.  
3. **수업시간:** 공부방 라벨 「1일 평균 수업시간」→ 전역 정책명은 **「1회 수업시간」**. 라벨도 맞출지: **맞춘다**(사용자 2.2).  
4. **주회수:** 「7회 이상」≠ 「7회」+기타.  
5. **N수:** 학년 드롭다운에 「N수」한 칸 넣지 말 것. 학교급=N수일 때만 재수~N수.  
6. **중등·고등:** 4~6학년 옵션 노출 금지.  
7. **금지어:** 학생찾기 게이트 「학생 의뢰」는 본 티켓이 아니라 164 계열.  
8. **배포:** 사용자 「배포」명시 전 푸시/`build:dothome` 금지.  
9. **범위:** 관리자 화면은 이번 잠금 1차 범위 외(필요 시 후속). 찾기·가입·등록·마이페이지·카드 표시는 포함.

---

## 4. 권장 티켓 분할 (PC 켤 때)

| 티켓 | 내용 |
|------|------|
| **169** | 희망과목 MAIN 통일 + 학교급/학년 분리·N수·모드별 카피 (학생찾기·학생가입·student-reg·tutor/study-room 과목행·search-schema) |
| **170** | 금액 단위 천원 전역 + 1회 수업시간·주 회수 옵션 전역 |
| **171** | 가입 첫단계(회원구분·역할별 기본정보) 풀로고 |

권장 순서: **169 → 170 → 171** (또는 169·170 병렬 가능, 로고는 독립).

---

## 5. 사용자에게 나중에 한 줄만 물을 수 있는 점 (막지 않음)

- N수에 「육수」이상·「기타」자유입력을 공식 옵션에 넣을지 → **기본은 재수~오수·N수 다섯**.  
- DB 저장을 천원 정수로 바꿀지 vs UI만 천원 → **기본은 UI만 천원, DB 원 유지**.

---

## 6. 파일 인덱스 (구현 allowlist 초안)

- `preview/shared/main-subjects.js` (확장·재사용)
- `preview/search-ui/src/search-schema.js` (`MOCK_SUBJECTS` 제거)
- `preview/search-ui/src/search-find-surface.js` (subject·range 단위·학년 UI)
- `preview/auth-ui/src/screens/signup-basic.js` / `signup-role.js` / `layout.js`
- `preview/home-ui/src/student-reg/screens.js`
- `preview/tutor-ui/src/state.js` · `screens/step-lesson.js`
- `preview/study-room-ui/src/state.js` · `screens/step-lesson.js`
- `preview/home-ui/src/exposure-format.js`
- `src/Auth/RegisterEnums.php` (학년/N수 enum 추가 시)
- (신설) `preview/shared/lesson-duration-options.js`, `lesson-weekly-options.js`, `grade-options.js`


---

## Executor addendum (서브에이전트 · 2026-09-27 18:37 KST)

부모 문서에 이미 잠긴 핵심(MOCK_SUBJECTS 5 · MAIN 24 · 학교급칩+학년 free text · GRADE 1~6 · 만원/원 · DAILY 30/60/…/over_180 · WEEKLY 1~6+「7회 이상」 · 로고 login+terms)은 재서술하지 않음. **빠진 경로·메모만.**

| 추가 경로 | 왜 중요한지 |
|-----------|-------------|
| `src/Views/auth/partials/basic-student.php` | PHP 서버렌더 학생기본이 **동일 24과목 하드코드** · 학교급칩+`grade_level` free text · 예산 단위 없음. allowlist에 PHP partial 누락 시 가입 SSR 드리프트. |
| `preview/home-ui/src/student-reg/format.js` | 카드/요약이 `월 ${…}원` — `exposure-format`의 「만원」과 **또 다른 「원」축**. 170 감사 키에 포함. |
| `preview/home-ui/src/student-enums.js` → `SCHOOL_LEVEL_LABELS` | `general`·`other` 포함. `RegisterEnums::schoolLevels()` / 가입칩에는 없음 → 찾기·표시 라벨 감사 시 혼동 주의. |
| `docs/ssot/13-search-page-fields.md` | SSOT도 학생찾기 「학교급/학년」**결합**·가격 「원」서술. 169/170 구현 후 SSOT 문구 동기화 필요(레포 docs만, Notion 금지). |
| `preview/auth-ui` `renderBrandHero()` | `logo-full.png` 헬퍼 **정의만** 있고 signup-role/basic에서 **미호출**. 171은 새 마크업보다 이 헬퍼 재사용 우선. |

**리포:** `leejetty-commits/study114`만 존재. GitHub `study114-ds` 레포 없음(로컬 `/workspace/study114-ds`만).

**조사 메모:** `search_code`는 이 레포에서 `incomplete_results`+0건이었음 → `get_git_tree` + `get_file_contents`(+ raw curl)로 대조.
