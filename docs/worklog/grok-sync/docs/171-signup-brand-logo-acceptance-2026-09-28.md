# 171 · 수락 판정 — 가입 첫단계 우동공과 풀로고

- 작성: 2026-09-28 22:16 KST · executor strong-review (PC)
- 저장소: `D:\work\study114` · machineId `6aa2b772-d71e-4241-bcd4-3c985bf73991`
- 커밋: `f92ea51` (`fix(auth): show the full brand logo on role and basic signup.`)
- 부모: `95aca1f` (170 ACCEPT)
- push 없음 · `branch -r --contains f92ea51` 공집합 · ahead 5(로컬)
- dirty: untracked export/docs/`tmp`만 · 본 커밋 미포함
- 정본: [171 ticket](171-signup-brand-logo-cursor-ticket-2026-09-28.md) · [168](168-form-fields-global-policy-2026-09-27.md) §0.2.4 · §1.6 · §4
- Cursor summary: **불신** · `git show` / `diff-tree` / 파일·헬퍼 직접 검증

---

## 판정: **ACCEPT**

| # | 검사 | 결과 |
|---|------|------|
| 1 | Diff vs parent `95aca1f` | **2 files only** · `signup-role.js` (+2/−1) · `signup-basic.js` (+3/−1) |
| 2 | Allowlist | auth signup-role/basic만 · `layout.js` 미수정(헬퍼 기존 재사용) · 허용 |
| 3 | 169/170 로직 | `fee-cheonwon` · `school-grade` · lesson-duration/weekly · search/home/admin **파일 없음** · basic 내부 환산/옵션 hunk **없음**(hero import·호출만) |
| 4 | 새 로고 자산 | 커밋에 자산 add **없음** · 기존 `public/assets/brand/logo-full.png` (41712 B) 재사용 |
| 5 | `signup-role` | `renderBrandHero()` 패널 상단(제목 앞) 호출 |
| 6 | `signup-basic` student | `role === 'student'` 분기에서 `renderBrandHero()` |
| 7 | `signup-basic` tutor·study_room | 비-student 공통 패널에서 `renderBrandHero()` · 제목은 tutor/기본등록 분기 유지 |
| 8 | 헬퍼 = logo-full | `layout.js` `renderBrandHero` → `src="/assets/brand/logo-full.png"` · parent 대비 **무변경** |
| 9 | 로그인·약관 | `login.js` / `signup-terms.js` diff **공집합** · 계속 `logo-wordmark.png` |
| 10 | 중간 단계 | verify-email 등 미필수 · 미변경(OK) |
| 11 | push / build:dothome | 미실시 |

---

## 1) Diff 범위

```
M  preview/auth-ui/src/screens/signup-basic.js   (+3 −1)
M  preview/auth-ui/src/screens/signup-role.js    (+2 −1)
```

- HEAD = `f92ea5148ed1d72cdcf1788c86a5470ec4889c49`
- Parent = `95aca1fabacfa330a284d9faaf6fdae0c1617e44`
- `layout.js` · login · terms · brand 자산 · 169/170 모듈: **터치 없음**

---

## 2) `renderBrandHero()` 호출 (코드 직접)

| 화면 | 위치 | 자산 |
|------|------|------|
| 회원구분 `signup-role` | panel 내 · `auth-heading` 직전 | `renderBrandHero` → **logo-full** |
| 학생 `signup-basic?role=student` | student 전용 content · heading 직전 | 동일 |
| 공부방·과외쌤 `signup-basic` | 비-student panel · heading 직전 | 동일 |

복제 `<img>` 마크업 없음 · wordmark 혼입 없음.

---

## 3) 로그인·약관 유지

| 화면 | HEAD | vs parent |
|------|------|-----------|
| login | `logo-wordmark.png` | unchanged |
| signup-terms | `logo-wordmark.png` | unchanged |

---

## 4) 스모크(정적)

| # | 항목 | 결과 |
|---|------|------|
| 1 | `#/signup/role` 상단 logo-full 호출 | PASS (코드) |
| 2 | student / study_room / tutor basic | PASS (3역할 모두 hero) |
| 3 | 로그인·약관 로고 그대로 | PASS |
| 4 | 169·170 회귀(파일·hunk) | PASS · UI 브라우저 스모크는 본 판정 범위 밖(코드 회귀 없음) |

---

## 요점정리 (한국어)

- **ACCEPT.** 로컬 `f92ea51`(부모 `95aca1f`·170)만 검증 · **push 없음**.
- 변경 파일 **2개뿐**: `signup-role.js` · `signup-basic.js`. 새 로고·layout·로그인·약관·169/170 로직 **손대지 않음**.
- 회원구분 + 학생·공부방·과외쌤 기본정보 모두 기존 `renderBrandHero()` → **`logo-full.png`** 재사용.
- 로그인·약관은 기존 **wordmark** 유지. 중간 가입 단계는 미필수로 미변경.
- Cursor 보고는 불신 · `git show`/파일 직접 확인으로 판정.

