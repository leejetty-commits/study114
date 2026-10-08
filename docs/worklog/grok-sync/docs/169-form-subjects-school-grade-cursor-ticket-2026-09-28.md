# 169 · Cursor — 희망과목 MAIN 통일 + 학교급/학년 분리 (로컬)

- 작성: 2026-09-28 KST · 우동공과2
- 정본 정책: [168](168-form-fields-global-policy-2026-09-27.md) §0·§1.1·§1.2·§2·§3·§4
- 상태: **Cursor 구현 대기** · push · `build:dothome` **금지**(「배포」 전)
- 저장소: **오직** `leejetty-commits/study114`
- 작업 경로: `D:\work\study114` · `git -c safe.directory=D:/work/study114`
- 범위: **169만** (과목 SSOT + 학교급/학년 분리·N수·모드별 라벨)
- 다음 티켓(손대지 말 것): **170** 천원·1회수업시간·주회수 · **171** 가입 풀로고
- Notion: **쓰지 말 것**
- 커밋: 코딩 완료 시 **로컬 1개**만. push 금지

---

## 0. 절대 규칙 (오버 방지)

1. **이번 PR = 169만.** 170(금액·수업시간·주회수)·171(로고)·관리자·배포 **손대지 말 것.**
2. 표시 이름: **공부방 · 과외쌤 · 학생 · 등록 · 베이직카드**. 「학생 의뢰」금지(이번 티켓 범위 밖이어도 새로 넣지 말 것).
3. dirty 잔여·다른 티켓 파일 **stage에 넣지 말 것.**
4. 카피·옵션·스키마·공유 상수 중심. 결제·노출 엔진·관리자 CRUD 새로 만들지 말 것.
5. DB enum을 마음대로 rename하지 말 것. `school_level` 기존 값(`preschool`·`elementary`·`middle`·`high`·`n_su`) 유지.

---

## 1. Must — 희망과목 MAIN 통일

### 1.1 정본

- 정본 목록: `preview/shared/main-subjects.js` → `MAIN_SUBJECT_OPTIONS` (국어~기타 **24항**)
- 렌더 헬퍼: 가입에서 쓰는 `renderMainSubjectSelect` (또는 동일 목록을 **한곳에서 import**)

### 1.2 고쳐야 할 곳

| 위치 | BEFORE | AFTER |
|------|--------|-------|
| `preview/search-ui/src/search-schema.js` → `MOCK_SUBJECTS` | `수학·영어·국어·과학·사회` **5개** | MAIN 24항과 **동일**. `MOCK_SUBJECTS` **폐기**하거나 MAIN re-export |
| `preview/search-ui/src/search-find-surface.js` | `field.input === 'subject'` 시 MOCK | MAIN / 공유 셀렉트 |
| `preview/home-ui/src/student-reg/screens.js` → `BASIC_SUBJECTS` | MAIN과 동일 24항 **로컬 복제** | 복제 삭제 → MAIN import |
| `preview/auth-ui` 가입 기본정보 | 이미 MAIN 사용 | **유지** · 회귀만 |
| `src/Views/auth/partials/basic-student.php` | 24과목 **하드코드** | MAIN과 동일 유지 또는 공통 소스. SSR 드리프트 금지 |

**목표:** 학생찾기·공부방찾기·과외쌤찾기 필터의 과목, 학생 등록, 가입 기본정보가 **같은 전체 과목 목록·알고리즘**.

#### 「커서 주석」·오판 방지 (과목)

> 1. `MOCK_SUBJECTS`에 항목만 몇 개 더 넣지 말 것 — **MAIN으로 교체**.  
> 2. `BASIC_SUBJECTS` 배열을 그대로 두고「같다」고 끝내지 말 것 — **중복 삭제 + import**.  
> 3. SQL `003_subject_masters.sql` / API subjects가 있으면 공부방 상세는 기존 우선 규칙을 깨지 말 것. 찾기·가입·student-reg UI 목록이 MAIN과 어긋나면 안 됨.  
> 4. 과목 라벨 영문화·임의 축약 금지.

---

## 2. Must — 학교급 / 학년 분리

### 2.1 학교급 정본 (이미 코드에 있음)

| 값 | 표시 |
|----|------|
| `preschool` | 미취학 |
| `elementary` | 초등 |
| `middle` | 중등 |
| `high` | 고등 |
| `n_su` | N수 |

(`RegisterEnums.php` / `register-enums.js` 와 동일)

### 2.2 학년 옵션 (잠금)

| 학교급 | 학년/세부 |
|--------|-----------|
| 미취학 | 학년 **비활성** 또는 「해당 없음」 + 힌트 「미취학은 학년을 고르지 않습니다.」 |
| 초등 | **1~6학년** |
| 중등 | **1~3학년** (4~6 **숨김**) |
| 고등 | **1~3학년** (4~6 **숨김**) |
| N수 | **재수 · 삼수 · 사수 · 오수 · N수** (기본 5항. 「기타」자유입력 **넣지 말 것**) |

저장 제안:
- `school_level`: 기존 enum 유지
- `grade_level` / `grade_band`: 일반은 **한 형식으로 통일**(기존 tutor/study-room의 `1학년` 문자열 쪽을 우선 검토해 맞춤). N수는 `재수`|`삼수`|`사수`|`오수`|`N수`

### 2.3 화면별 BEFORE → AFTER

| 화면 | BEFORE 문제 | AFTER |
|------|-------------|-------|
| 학생 가입 `signup-basic` | 학교급 칩 + 학년 **자유텍스트**「예: 중2」 | **학교급 + 학년(종속 select)**. N수면 「몇 수」5항 |
| 학생 마이 기본 `student-reg/screens` | 동일 | 동일 분리 |
| 학생찾기 `search-schema` student | `grade_level` 한 칸 label **「학교급/학년」** text | **「학교급」「학년」분리**. 결합 라벨 **금지** |
| 과외쌤 상세 과목행 | 분리됨 · N수 세부 없음 · 중·고에 4~6 노출 가능 | **지도 학교급 / 지도 학년**. N수 5항. 중·고 1~3만 |
| 공부방 상세 과목행·주대상 | 학년에 「N수」한 칸 섞임 · 재수~N수 없음 | **대상 학교급 / 대상 학년**. N수는 학교급=N수일 때만 5항. 학년 칸에 N수 한 칸 **금지** |
| 공부방/과외 찾기 필터 | 학교급 약함·학년 결합 가능 | **대상 학교급** 우선. 학년 필터는 넣되 분리. 결합 라벨 금지 |

### 2.4 모드별 라벨 (사이트 표시)

| 모드 | 라벨 |
|------|------|
| 학생 가입·학생 마이 | 「학교급」「학년」(N수면 학년 대신 「몇 수」) |
| 학생찾기 필터 | 「학교급」「학년」 |
| 과외쌤 상세 과목행 | 「지도 학교급」「지도 학년」 |
| 공부방 상세 | 「대상 학교급」「대상 학년」 |
| 공부방/과외 찾기 | 「대상 학교급」등 |

#### 「커서 주석」·오판 방지 (학교급·학년)

> 1. 학년 드롭다운에 「N수」**한 칸** 넣고 끝내지 말 것. 학교급=`n_su`일 때만 재수~N수.  
> 2. 중등·고등에 4~6학년 **노출 금지**.  
> 3. 학생찾기 label 「학교급/학년」을 placeholder만 고치고 필드 1개 유지하지 말 것 — **필드 분리**.  
> 4. `student-enums.js`의 `general`·`other` 라벨과 가입칩(미취학~N수)을 섞어 학교급 정본을 바꾸지 말 것.  
> 5. 공유 상수 권장: `preview/shared/grade-options.js` (신설 가능) → 가입·student-reg·tutor·study-room·search import.  
> 6. `docs/ssot/13-search-page-fields.md`에 「학교급/학년」결합 서술이 있으면 **레포 docs만** 169에 맞춰 한 줄 동기화(Notion 금지). 제품 동작과 어긋나면 docs를 맞춤.

---

## 3. Allowlist (쓰기 허용 · 초안)

필수·우선:

- `preview/shared/main-subjects.js`
- (신설 가능) `preview/shared/grade-options.js`
- `preview/search-ui/src/search-schema.js`
- `preview/search-ui/src/search-find-surface.js`
- `preview/auth-ui/src/screens/signup-basic.js` (및 학교급·학년 UI가 있는 auth 파일)
- `preview/home-ui/src/student-reg/screens.js`
- `preview/tutor-ui/src/state.js` · 과목행·학년 옵션이 있는 step/screen
- `preview/study-room-ui/src/state.js` · 과목행·학년 옵션이 있는 step/screen
- `src/Views/auth/partials/basic-student.php`
- `src/Auth/RegisterEnums.php` · `preview/**/register-enums.js` (N수 세부·학년 enum **필요 시만**)
- `docs/ssot/13-search-page-fields.md` (문구 동기화만)

읽기만: `preview/home-ui/src/student-enums.js`, 기존 SCHOOL_LEVELS/GRADE_* 정의 위치.

**금지(169):** `exposure-format.js` 금액 로직, `DAILY_LESSON_MINUTES`/`WEEKLY_LESSON_COUNTS` 변경, `signup-role`/`layout.js` 로고, admin, push, `build:dothome`.

---

## 4. Must not

- 170: 「천원」단위 · `만원`/`formatMonthlyWon` · 1회 수업시간 20~120+기타 · 주 회수 1~7+기타
- 171: `logo-full` / `renderBrandHero` 가입 첫단계
- 관리자 화면
- push / `build:dothome`
- N수에 「육수」·「기타」공식 옵션 추가
- 「학생 의뢰」잔재 일괄 치환 티켓화(164 계열 — 이번 범위 아님)
- MOCK_SUBJECTS에 5→소수만 늘리기

---

## 5. 수락 스모크 (로컬 · 사이트 표시 이름)

1. **학생찾기** 과목 필터: MAIN **24항** 수준(5개만 아님).
2. **학생찾기**: 「학교급」「학년」**분리**. 「학교급/학년」결합 라벨 없음.
3. **학생 가입 기본정보**: 학교급 선택 → 학년 옵션이 표 2.2대로 종속. 미취학이면 학년 비활성. N수면 재수~N수.
4. **학생 마이 기본등록**: 동일.
5. **과외쌤 상세** 과목행: 「지도 학교급」「지도 학년」. 중등 선택 시 4~6 없음. N수 시 5항.
6. **공부방 상세**: 「대상 학교급」「대상 학년」. 학년 목록에 단독 「N수」칸 없음.
7. 가입 SSR(`basic-student.php`)과 JS 가입 과목 목록 **불일치 없음**.
8. 금액·수업시간·주회수·가입 로고 화면이 **의도치 않게 안 바뀌었는지** 한 번만 스모크.

---

## 6. 완료 시 Cursor 보고 (요점만)

- 바꾼 파일 목록
- MOCK_SUBJECTS / BASIC_SUBJECTS 처리 방식(폐기 vs re-export)
- 학교급→학년 종속 구현 위치(공유 모듈 경로)
- 스모크 1~7 결과
- 못 건드린 화면이 있으면 경로 + 이유 한 줄
- push 했는지: **안 함**이어야 함

---

## 7. 붙여넣기용 한 장 (Cursor 채팅)

```
티켓 169만. 저장소 leejetty-commits/study114 · 경로 D:\work\study114.
push·build:dothome 금지. Notion 금지. 170·171·관리자 손대지 말 것.

Must:
1) 희망과목: preview/shared/main-subjects.js MAIN_SUBJECT_OPTIONS(24)로 통일.
   - search MOCK_SUBJECTS(5개) 폐기/MAIN 교체
   - student-reg BASIC_SUBJECTS 중복 삭제→import
   - auth 가입 유지·PHP basic-student.php 드리프트 금지
2) 학교급/학년 분리:
   - 학교급: 미취학·초등·중등·고등·N수
   - 학년: 미취학 비활성 / 초등1–6 / 중·고1–3(4–6숨김) / N수=재수·삼수·사수·오수·N수
   - 학생찾기 「학교급/학년」결합 라벨·단일 text 금지 → 필드 분리
   - 과외=지도 학교급·학년 / 공부방=대상 학교급·학년
3) 표시어: 공부방·과외쌤·학생·등록·베이직카드. 「학생 의뢰」넣지 말 것.

정본: docs/168-form-fields-global-policy-2026-09-27.md · docs/169-form-subjects-school-grade-cursor-ticket-2026-09-28.md
로컬 커밋 1개만. 끝나면 요점 보고.
```
