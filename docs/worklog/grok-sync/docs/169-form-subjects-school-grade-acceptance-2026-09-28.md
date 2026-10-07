# 169 · 수락 심사 (Strong-review) — ACCEPT (REWORK)

- 작성: 2026-09-28 21:31 KST · executor strong-review
- 대상: `D:\work\study114` · commit **`662fa75`** (`662fa750e6d702a38ef28d67e99a491c7826ae2c`)
- 부모(재작업 기준): `76a0913` (prior REJECT) · 베이스: `f634bba`
- 브랜치: `feat/student-mypage-a-g...origin/main [ahead 2]` · **로컬만** (push 없음)
- 정본: `168-form-fields-global-policy-2026-09-27.md` · `169-form-subjects-school-grade-cursor-ticket-2026-09-28.md`
- Cursor 요약 **불신** · `git show` / 실파일(UTF-8 node) 대조
- prior REJECT 문서: 동일 경로 (76a0913 판정) — 본 파일이 ACCEPT로 갱신

---

## 판정: **ACCEPT**

prior REJECT 핵심(학생 가입 JS+PHP 「예: 중2」자유텍스트)이 `662fa75`에서 해소됨.  
과목 MAIN·찾기 스키마 분리·tutor/study-room·공유 `school-grade.js` prior PASS 유지. 170/171 손댐 없음.

---

## 1. Diff 범위

### 1.1 `76a0913..662fa75` (재작업만) — **5파일 · 169만**

| 파일 | 내용 |
|------|------|
| `preview/auth-ui/src/screens/signup-basic.js` | 학생 학교급/학년 → select 종속 + `school-grade.js` |
| `src/Views/auth/partials/basic-student.php` | SSR 동일 분리 + inline `fillGrade` |
| `src/Auth/RegisterEnums.php` | `gradeMatrix` / `gradesForSchoolLevel` / `isGradeDisabled` |
| `preview/shared/school-grade.js` | 주석만 (PHP 동기 명시) |
| `docs/ssot/13-search-page-fields.md` | 학생 「학교급」「학년」분리 서술 |

**170/171 키워드** (`천원`/`만원`/`formatMonthlyWon`/`DAILY_LESSON`/`WEEKLY_LESSON`/`logo-full`/`renderBrandHero`):  
`76a0913..662fa75` 및 `f634bba..662fa75` **0건**. 관리자 없음. push 없음.

### 1.2 `f634bba..662fa75` 전체 — 20파일 (+283/−79)

prior PASS 파일(search·student-reg·tutor·study-room·school-grade 신설) + 위 재작업 5파일. 범위 이탈 없음.

---

## 2. 재작업 Must (prior FAIL) — **PASS**

### 2.1 `signup-basic.js` 학생 — PASS

실파일 증거:

- import: `SCHOOL_LEVEL_FORM_OPTIONS`, `gradeOptionHtml`, `bindSchoolGradePairs` from `school-grade.js`
- 라벨 **분리**: `학교급` / `학년` (결합 「학교급 / 학년」 **없음**)
- `school_level`·`grade_level` 모두 **`<select>`**
- 자유텍스트 `placeholder="예: 중2"` / `<input name="grade_level">` **없음** (`중2` 문자열 0)
- hint: 「학교급을 고르면 학년이 따라 열립니다. 미취학은 학년을 고르지 않습니다.」
- `bindSignupBasicEvents`에서 `bindSchoolGradePairs(form || root)` 호출

### 2.2 `basic-student.php` SSR — PASS

- 동일 분리 라벨 + dual select
- `RegisterEnums::gradesForSchoolLevel` / `isGradeDisabled`로 SSR 초기 옵션
- inline `gradeMatrix` JSON + `fillGrade` on change: preschool/`''` → disabled, 값 리셋
- `중2` / 결합 라벨 **없음**
- 과목 `$subjects` 24항 MAIN과 동일(드리프트 악화 없음)

### 2.3 학년 옵션 행렬 (JS `school-grade.js` ≡ PHP `RegisterEnums::gradeMatrix`) — PASS

| 학교급 | 학년 |
|--------|------|
| preschool | 빈 목록 + disabled |
| elementary | 1~6학년 |
| middle / high | 1~3학년만 |
| n_su | 재수·삼수·사수·오수·N수 |

### 2.4 `docs/ssot/13-search-page-fields.md` — PASS (학생)

학생 찾기 행: 「학교급」`students.school_level` + 「학년」`students.grade_level`(종속·미취학 비활성).  
결합 「학교급/학년」 **제거됨**.

---

## 3. Prior PASS 회귀 — **유지**

| 검사 | 결과 |
|------|------|
| `MOCK_SUBJECTS` export | **없음** (폐기 유지) |
| `search-find-surface` subject | `MAIN_SUBJECT_OPTIONS` |
| `BASIC_SUBJECTS` | **없음** · student-reg MAIN import |
| MAIN 24항 | `main-subjects.js` value 24 · PHP subjects 24 |
| 학생찾기 schema | `school_level`「학교급」+ `grade_level`「학년」`dependsOn` |
| 공부방/과외 찾기 | 「대상/지도 학교급」「대상/지도 학년」분리 유지 |
| student-reg | `school-grade` + MAIN |

---

## 4. Smoke (티켓 §5)

| # | 항목 | 결과 |
|---|------|------|
| 1 | 학생찾기 과목 MAIN 24 | **PASS** |
| 2 | 학생찾기 학교급/학년 분리 | **PASS** |
| 3 | 학생 가입 종속 select | **PASS** (재작업) |
| 4 | 학생 마이 기본등록 | **PASS** |
| 5 | 과외쌤 지도·중고 1–3·N수 5 | **PASS** (UI 경로) |
| 6 | 공부방 대상·학년 N수 단독 칸 없음 | **PASS** (UI 경로) |
| 7 | PHP↔JS 과목·학년 | **PASS** (과목 24 · 학년 행렬 동기) |
| 8 | 170/171 의도치 않은 변경 | **PASS** |

---

## 5. 잔여(수락 차단 아님 · follow-up 가능)

1. N수 시 라벨 「몇 수」동적 전환: signup / php / student-reg **미구현**(항상 「학년」). 티켓 2.4 표시 권장이나 prior 핵심 FAIL 아님.
2. `docs/ssot/04`·`14`·`19`·`DOC-CHECKLIST.md`에 「학교급/학년」서술 잔존(티켓이 명시한 13만 동기화됨).
3. `docs/ssot/13` 공부방 쪽 「대상 학년/학교급」한 칸 표기 잔존(학생 결합 라벨과는 별개; schema UI는 이미 분리).
4. tutor/study-room state dead export(`GRADE_BAND_OPTIONS` / `GRADE_OPTIONS` N수 칸) — UI 경로 미사용.

**하지 말 것 유지:** 170 금액/수업시간/주회수 · 171 로고 · push · Notion.

---

## 6. 요점정리 (부모 → 기획)

**ACCEPT.**  
`662fa75`가 prior REJECT를 닫음: 학생 가입 JS(`signup-basic`)·PHP(`basic-student.php`)가 `school-grade`/`RegisterEnums` 종속 select로 바뀌었고 「예: 중2」·결합 라벨 제거, 미취학 disable·초등1–6·중고1–3·N수5항 일치, `13-search-page-fields` 학생 행 분리, MAIN/찾기 prior PASS 유지, 170/171 무관.  
경미 잔여(「몇 수」라벨·다른 ssot 문서 결합 문구)는 후속 가능, 169 Must 수락 가능.
