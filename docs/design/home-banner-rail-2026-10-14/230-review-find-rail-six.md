# 230 · 검수 229 — 찾기 레일 저장 목록 6개(세 방 + 자료실) (종현 t1636)

- 검수: 우동공과2(개발팀장), 2026-10-15 04:3x KST · 읽기 전용(코드 수정·push 없음)
- 대상: 브랜치 `cursor/home-find-rail-three-20261015` head `73e88e97da2bab92d4dd3184c7ddb15ac428788c` (수정 커밋 `ba1a3f5b`, 보통 merge `73e88e97` = ba1a3f5 + 2761d10)
- 지시서: `229-cursor-directive-find-rail-six.md` (§10 범위 축소 포함, main `ad941139`) · 보고: 답장만(§10)
- 검수 시점 origin/main: `ad941139` (브랜치 merge 기준 2761d10 뒤 229 §10 문서 커밋 1개, 코드 변경 없음)

## 판정: **PASS** (merge 가능, 종현 승인 대기 · 운영 DB 는 이미 6개라 081 실행 불필요)

| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | 변경 파일 | PASS | `git diff --stat origin/main...73e88e97` = 정확히 4파일 +21/−3: `right-rail-store.js`(2), `081`(15), `ContentAclSeedGuard.php`(5), `ContentSchemaMigrateService.php`(2). `right-rail.js` 변경 없음. merge 커밋은 코드 변경 0 |
| 1b | 값·순서 | PASS | 네 곳 모두 정확히 `faq, concern-director, concern-tutor, concern-parent, library-template, safe-guide`(운영 값과 같은 순서): store:71, guard fields:70, migrate:785, 081 SET |
| 1c | §10 합격 2개 | PASS | (1) 위 4파일 (2) `git grep -n "concern-parent', 'safe-guide'" 73e88e97 -- right-rail-store.js ContentSchemaMigrateService.php` → 0건 |
| 2 | seed 점검 허용 목록 | PASS | guard replaceable = 6개(목표) · 5개 · 학생/학부모만 · family · 자료실만 (229 §2-2 와 같음) |
| 2b | 운영 6개 → noop | PASS(코드 추적) | `planRail` → `planFields`(:160-195): `normalizeField`(:222-240)가 JSON 을 풀고 `normalizeBoardKey`(family→parent만 바꿈) → 중복 제거 → **정렬**. 운영 값(공백 있든 없든)과 목표가 같아 `$cur === $tgt` → `continue`, diff 없음 → `action = noop`. 파이썬으로 같은 정규화를 흉내 내 확인(운영 값 == 목표 True). 옛 값 두 개(자료실만, 5개)는 목표와 다르고 허용 목록에 있어 `update`(abort 아님) |
| 2c | 주의 | 참고 | noop 판정은 `source_board_keys_json` 기준. 같은 행의 `guest_filter`·`visibility_rule`·`role_target`·`mobile_behavior` 운영 값은 ① SELECT 에 안 나와 확인 못 함(이번 변경과 무관한 기존 조건) |
| 3 | 081 = 229 §2-4 | PASS | 브랜치 파일과 지시서 블록 `diff` → **완전 동일** |
| 3b | 멱등·운영 0행 | PASS | SET 값(6개)은 정규화해도 IN 목록 4개(학생/학부모만·family·자료실만·5개) 어디에도 없음 → 운영(6개) 0행, 재실행 0행. 운영자 다른 값 0행 |
| 4 | main 과 merge | PASS | `git merge-tree --write-tree 73e88e97 origin/main` 충돌 없음 |
| 5 | 화면 재측정 | **24/24 PASS ×3** | `229-measure/judge`(227 스크립트 + six·libold), Python Playwright. 브랜치 73e88e97 home 5191·search 5193, main ad94113 home 5192·search 5194. `default 24/24 PASS []`, `six 24/24 PASS []`, `libold 24/24 PASS []`. default·six: 공부방 D,T,P / 과외쌤 T,D,P / 학생 P / 비회원 P,D,T(제목만, 미끼 0건). libold: 고민방·베스트·현장 층 없음. 홈 레일 main 과 같음 |

## 참고
- 그림: `png/230-find-review-studyroom-1280.png`(공부방 default)
- 자료실 키(`library-template`)는 사용자 레일에 그려지지 않음(고민방 키만 그림, 229 §0). 화면 결과는 227/228 과 같음.
- 남은 일: 종현 승인 → main merge(순서 B2 → 이 브랜치 → C, 겹침 없음) → 배포(운영 DB 는 02:28 반영 완료, 081 실행 불필요) → 운영 찾기 화면 확인.
