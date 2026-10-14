# 228 · 검수 227 개정 — 찾기 레일 고민방 3칸: DB·서버·화면 일치 (종현 t1625)

- 검수: 우동공과2(개발팀장), 2026-10-15 02:3x KST · 읽기 전용(코드 수정·push 없음)
- 대상: 브랜치 `cursor/home-find-rail-three-20261015` head `a061764321df752310d8eb188f59a295ff71e40d` (수정 커밋 `ab791345`, 보통 merge 2개 `b20d8faf`·`a0617643`)
- 지시서: `227-cursor-directive-find-rail-fix.md` (개정 t1625, main `1071fbb1`) · 보고서: `docs/worklog/2026/10/2026-10-15-find-rail-fix-report.md` (main `a7cddb2b`)
- 검수 시점 origin/main: `a7cddb2b` (브랜치 merge 기준 `9f5656ba` 뒤 보고서 커밋 1개, 코드 변경 없음)

## 판정: **PASS** (merge 가능, 종현 승인 대기 · 배포 때 081 적용)

| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | 변경 파일 | PASS | `git diff --stat origin/main...a061764` = 정확히 4파일 +17/−3: `right-rail-store.js`(2), `sql/schema/081_…`(13, 새 파일), `ContentAclSeedGuard.php`(3), `ContentSchemaMigrateService.php`(2). 227 §2-3 조건과 같음 |
| 1b | right-rail.js = origin/main | PASS | `git diff origin/main a061764 -- preview/home-ui/src/right-rail.js` 빈 출력. 수정 커밋 `ab791345` 은 이 파일 10줄 삭제 + 081 교체 2파일뿐 |
| 1c | 그대로여야 할 3파일 | PASS | `git diff 91e03e3 a061764 -- right-rail-store.js ContentAclSeedGuard.php ContentSchemaMigrateService.php` 빈 출력. store 71행 세 방, PHP seed·replaceable 세 방 |
| 1d | merge 커밋 | PASS | `b20d8faf`(부모 ab79134 + 1071fbb), `a0617643`(부모 b20d8fa + 9f5656b) 둘 다 코드 변경 0(`-- preview src sql` 빈 diff), 문서만 들어옴 |
| 2 | 081 = 227 §2-2 | PASS | 브랜치 파일과 지시서의 「고친 뒤 파일 전체」를 `diff` → **완전 동일** |
| 2b | 조건 | PASS | `slot_key = 'search_right_rail'` 이고, 공백·LF·CR·탭을 지운 값이 `["faq","concern-parent","safe-guide"]` 또는 `["faq","concern-family","safe-guide"]` 일 때만 |
| 2c | 바꿀 값 | PASS | 정확히 `["faq","concern-director","concern-tutor","concern-parent","safe-guide"]` (+ `updated_at = NOW()`) |
| 2d | 멱등·운영자 값 보호 | PASS | 새 값은 지운 뒤에도 조건 두 값과 달라 다시 돌리면 0행. 다른 목록(운영자 값)도 0행. 보고서의 로컬 MySQL 8.4.10 결과 1·1·0·0 과 맞음 |
| 2e | MariaDB 10.x(카페24) | PASS(정적 검토) | 쓰는 것은 `CAST(… AS CHAR)`·`REPLACE`·`CHAR(n)`·`IN` 뿐, 모두 MariaDB 10.x 기본 함수. MariaDB `JSON` = `LONGTEXT` + `json_valid` CHECK → 문자열 비교 그대로 동작, 새 값은 올바른 JSON 이라 CHECK 통과. `CHAR(10)` 등은 `NO_BACKSLASH_ESCAPES` 와 무관. 비교 문자는 전부 ASCII 라 문자셋·정렬 차이 영향 없음. **실제 MariaDB 로는 돌려 보지 못함**(상자에 DB 없음) → 적용 전 ① SELECT 의 `normalized` 값으로 확인 |
| 3 | PR·브랜치·커밋 | PASS | GitHub `head:cursor/home-find-rail-three-20261015` PR 0건. 원격 브랜치 중 2026-10-15 날짜는 이 브랜치와 B2(`home-b2-best-fix-20261015`)뿐, `-v2` 없음. 브랜치 커밋 = 91e03e3 + ab79134 + merge 2개 |
| 3b | main 보고서 문서만 | PASS | `a7cddb2b` = 7파일(보고서 1, work-queue 1줄, 그림 5장), `-- preview src sql config public` 변경 0. 코드 main merge 없음 |
| 3c | 앞선 227 revert 없음 | 맞음 | 원격 브랜치가 91e03e3 그대로였음(앞선 227 은 문서로만 존재, 작업 전 개정됨) → revert 대상 없음, 보고서 설명이 맞음 |
| 4 | 화면 재측정 | **24/24 PASS ×3** | 227 스크립트(main 1071fbb 파일과 동일) 그대로, Python Playwright. 브랜치 a061764 home 5191·search 5193, main a7cddb2 home 5192·search 5194. `default 24/24 PASS []`, `old 24/24 PASS []`, `removed 24/24 PASS []`. 같은 판정으로 main = 15/24 (찾기 9칸이 1칸) |
| 4b | 경우별 결과 | PASS | default: 공부방 D,T,P / 과외쌤 T,D,P / 학생 P / 비회원 P,D,T · old: 모두 P · removed: D,P / D,P / P / P,D. 비회원 레일·팝업 작성자·본문 미끼 0건, 홈 레일 4모드 main 과 같음, 개발 용어 0건 |
| 5 | 보고서 정확성 | PASS | 해시(a0617643·ab791345)·4파일 stat·세 경우 24/24·MySQL 1·1·0·0·그림 5장·work-queue 한 줄 모두 실제와 일치. Node+Chrome 측정, push 직전 9f5656b 로 merge 한 점을 「지시와 다른 점」에 밝힘. 이번 Python 재측정으로 재현됨 |

## 참고
- 그림: `png/228-find-review-guest-1280.png`(비회원 default), `png/228-find-review-studyroom-old-1280.png`(공부방, 저장 목록 옛 값 → 1칸)
- 기억할 점(227 §0): DB 목록은 운영자 로그인 때만 읽음 → 배포만으로 일반 이용자 찾기 레일은 세 방(학생 1칸). 081 적용 전에는 운영자 화면·관리 화면만 1칸.
- 남은 일: 종현 승인 → main merge(순서 B2 → 이 브랜치 → C, 겹침 없음, right-rail.js 가 main 과 같아 C·B2 줄 번호 변화 없음) → 배포 전·같이 phpMyAdmin 에서 `227-081-check.sql` ①→081→③ → 배포 후 운영 확인.

## 추가 기록 (2026-10-15 02:3x, 종현 t1636)
- 운영 ① 확인: `search_right_rail` = `['faq','library-template','safe-guide']`(2026-07-17). 081(a061764)은 운영에서 0행이었을 것 — 228 의 「081 적용 후 세 방」 전제가 운영에는 맞지 않았음.
- 결정 t1636: 자료실 유지 + 세 방. 02:28 KST 종현이 운영 UPDATE 1행 → `["faq","concern-director","concern-tutor","concern-parent","library-template","safe-guide"]`.
- 228 PASS 판정(코드가 227 개정과 일치)은 그대로. 목록을 6개로 맞추는 보완은 **229**. 그 전까지 a061764 를 배포하면 seed 점검이 운영 6개 값을 `abort_unexpected` 로 볼 수 있으므로 **229 보완 뒤 merge**.
