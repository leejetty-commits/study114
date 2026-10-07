# 216 · 관리자-162 보고서(일·주·월 + 자정 후 자동 메일) — 배포지시서 (2026-10-07)

- **작성:** 2026-10-07 15:3x KST (우동공과2, 개발팀장 대행)
- **절차:** 215(숨김+문의) 배포 #394 성공 → **종현 배포후 검수 OK 15:29** → 배포지시서(이 문서) → 종현 운영 SQL 077 + GitHub Secret → 「배포」 → 리베이스·ff push → Deploy → 외부 cron 등록 → 배포후 검수
- **이번 문서 범위:** 준비만. **머지·push·Actions·운영 DB·라이브 cron 호출 없음.**
- **대상 묶음만:** 162. 159-c / hold 금지 (이 검수 통과 전).
- **근거:** docs/205(작업지시·§7 종현 확인 14·운영 순서 9) · docs/208(재작업) · docs/215 · docs/190

---

## 1. 대상 SHA · main 기준 · ff 여부

| 항목 | 값 |
|---|---|
| 브랜치 | `origin/cursor/admin-162-20261007` |
| tip | **`0a7005c`** `fix(admin): 정산서 인쇄 칸·버튼·날짜·역할 표기를 고친다` |
| 커밋 (3) | `f3cd9bd` feat 보고서 · `02dd20e` 탈퇴 수 · `0a7005c` 인쇄 |
| 브랜치 기준(merge-base) | `11b0c0d` (Deploy #393) |
| 현재 origin/main | **`2723c5f`** (Deploy #394, 숨김+문의) |
| ff 가능? | **아니오.** `merge-base --is-ancestor 2723c5f 0a7005c` 거짓 (main에 `ad81b93`·`2723c5f` 2커밋이 브랜치에 없음) |
| 바뀐 파일 | 22 (+3597), 마이그레이션 **077만** |
| 겹치는 파일 | 2개: `preview/home-ui/src/admin/a28-screens.js`, `a28-screens-bind.js` (hide도 수정) |
| 리베이스 dry run (15:3x, 임시 worktree, push 없음) | `git rebase origin/main` → **충돌 0**, 3/3 성공. 결과 diff = 22 files +3597 (원본과 동일). 로컬 SHA `34ea255`·`9941bfa`·`43d1bb6` (작성자 시각 보존·committer 바뀜 → **배포 때 SHA는 다시 생김**) |

### 머지 방식 (결정 필요 · 종현)

- **안 A (권장, 기존 원칙 유지 = 선형 ff):** 에이전트가 `0a7005c`를 `origin/main` 위로 리베이스 → 푸시 전 검사 → `git push origin HEAD:main` (main 입장에서는 **ff, force 아님**). 리베이스된 새 tip SHA를 보고. 브랜치 `cursor/admin-162-20261007`는 건드리지 않음(force 불필요).
- 안 B: merge 커밋(`--no-ff`). 과거 배포 관례(ff-only)와 다름 → 비권장.
- 215 §3 「rebase 금지」는 hide 묶음 한정. **162는 리베이스가 필요하므로 종현 「배포」 시 리베이스 허용을 함께 명시**할 것.

```bash
git fetch origin
git rev-parse origin/main                         # 기대 2723c5f… 아니면 중단
git rev-parse origin/cursor/admin-162-20261007    # 기대 0a7005c… 아니면 중단
git log --oneline origin/main..origin/cursor/admin-162-20261007   # 3줄
```

---

## 2. 종현 운영 DB 절차 (SQL-first 필수)

> Actions는 SQL을 실행하지 않는다(077 머리 주석). 077 없이 코드가 먼저 가면 화면 API·cron이 `schema_missing`(503) — 500은 아니지만 기능 0.  
> 실행: 운영 phpMyAdmin. 에이전트 = 운영 DB 금지.

### A. 적용 전 확인 (기대 0행)

```sql
SHOW TABLES LIKE 'admin_settlement_reports';
```

### B. 077 본문 — `sql/schema/077_admin_settlement_reports.sql` 전문 그대로

- 구조: `information_schema.TABLES`로 존재 확인 → 없을 때만 `PREPARE`로 `CREATE TABLE admin_settlement_reports` (있으면 `SELECT 1`) → **다시 돌려도 안전.**
- 테이블: 기간(`period_kind` ENUM day/week/month, `period_start`, `period_end`), 결제 10칸, 문의·신고(NULL 허용), 가입 3, 탈퇴 4, 삭제 5, 홈팝업, `snapshot_json` JSON, `is_backfill`, 메일 상태(`mail_status` ENUM pending/sending/sent/failed/skipped, claimed/sent/error), `created_at`. `UNIQUE uk_settlement_period (period_kind, period_start)`, `KEY idx_settlement_mail (mail_status, period_end)`. InnoDB utf8mb4_unicode_ci.
- phpMyAdmin 주의: 파일 전체를 「SQL」 탭에 한 번에 붙여넣기(구분자 `;` 기본). 문자열 안 `''` 이스케이프는 파일 그대로 둘 것. `USE study114;` 포함. `JSON` 타입은 MySQL 5.7.8+/MariaDB 10.2.7+ 필요(076 적용 서버 그대로면 OK; 실패 시 오류 문구 기록 후 중단·보고).
- 파일 끝 확인 2줄이 함께 실행됨.

### C. 적용 후 확인

```sql
SHOW TABLES LIKE 'admin_settlement_reports';                                   -- 1행
SHOW INDEX FROM admin_settlement_reports WHERE Key_name = 'uk_settlement_period'; -- 2행 (period_kind, period_start)
SELECT COUNT(*) AS n FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_settlement_reports';  -- 36
SELECT COUNT(*) FROM admin_settlement_reports;                                 -- 0 (cron 전)
```

### D. 되돌리기 (실패·롤백 시에만, 종현 판단)

```sql
DROP TABLE IF EXISTS admin_settlement_reports;
```

---

## 3. 비밀값 `STUDY114_REPORT_CRON_KEY`

| 항목 | 내용 |
|---|---|
| 읽는 곳 | `public/api/cron/settlement-report.php:17` `study114_env('STUDY114_REPORT_CRON_KEY')` → `src/bootstrap.php:29` (getenv/SetEnv/`$_SERVER`) |
| 들어가는 길 | `public/.htaccess:93` `SetEnv STUDY114_REPORT_CRON_KEY __STUDY114_REPORT_CRON_KEY__` → Actions `deploy.yml` 「Inject」 단계가 **GitHub Secret** 값으로 치환 |
| 종현이 설정할 곳 | **GitHub** `leejetty-commits/study114` → Settings → Secrets and variables → Actions → New repository secret → 이름 `STUDY114_REPORT_CRON_KEY`. **닷홈 파일 직접 수정 아님** (배포마다 .htaccess 덮어씀) |
| 값 규칙 | **32자 이상**, `__`로 시작 금지, `dev-cron-key` 금지 → 아니면 503 fail closed. 권장: `openssl rand -hex 24` (48자) |
| 등록 시점 | **배포(push) 전.** Secret 없이 배포되면 빈 값 → 배포는 성공, cron은 503 (Secret 등록 후 재배포 필요) |
| 같이 쓰는 값 | 외부 cron 서비스 헤더에 같은 값 입력. 채팅·문서·Notion에 값 붙여넣기 금지 |
| `STUDY114_REPORT_MAIL_TO` | **이번 배포 경로에서 주입 안 됨**(.htaccess·deploy.yml에 없음, env.example만). 따라서 받는 사람 = `users.admin_level='super_admin' AND status='active'` 이메일 전부(205 §7-3 기본안). 다른 주소가 필요하면 별건 |
| 기존 `STUDY114_CRON_KEY` | 사용 안 함(paid-reminders 별건, dev-cron-key 위험 — 190 05:31) |

---

## 4. cron 등록 (배포 성공 후, 종현)

닷홈 cron 미지원 · GitHub schedule 미사용 → **외부 웹 cron**(예: cron-job.org) (205 §7-6).

| 항목 | 값 |
|---|---|
| URL | `https://study114.net/api/cron/settlement-report.php` |
| 메서드 | **POST** (GET=405) |
| 헤더 | `X-Cron-Key: <Secret과 같은 값>` (쿼리 `?key=` 불가 → 403) |
| 본문 | 없음 |
| 일정 | 매일 **00:05** 와 **00:20** KST (Asia/Seoul) — 2개 작업 또는 1작업 2시각 |
| 메일 창 | 기간 끝난 날 00:00~00:30 KST만 발송, 지나면 `skipped`/`window_passed`. 두 번 불러도 1통 |
| 월요일 | 주간 추가, 매월 1일 월간 추가. 매번 최근 35일 빠진 일간 보충(`is_backfill=1`, 메일 없음) |

수동 확인 명령(종현, 배포 후 1회 — 처음 호출은 00:30 밖이면 메일 0통·행만 생성):

```bash
curl -sS -X POST -H "X-Cron-Key: $KEY" https://study114.net/api/cron/settlement-report.php
# 기대 200 {"ok":true,"rows_created":N,"mails_sent":0,"mails_skipped":…}
curl -sS -o /dev/null -w '%{http_code}\n' https://study114.net/api/cron/settlement-report.php          # 405
curl -sS -o /dev/null -w '%{http_code}\n' -X POST https://study114.net/api/cron/settlement-report.php  # 403
```

> 첫 호출은 35일 보충으로 `rows_created` ≈ 35~37 (어제 일간 1 + 보충 최대 34 + 해당 시 주/월). 이후 같은 날 재호출 0.

---

## 5. 코드 반영 (종현 077 완료 + Secret 등록 + 「배포」(리베이스 허용) 후에만)

```text
[티켓 216 · 162 배포 · rebase onto main → ff push + Deploy to dothome]
저장소 leejetty-commits/study114.
허가: 162 3커밋을 origin/main 위로 리베이스, main fast-forward push, Actions 확인.
금지: PR·squash·force(main·브랜치 모두)·코드 수정·운영 DB·라이브 cron 호출·159-c/hold·로컬 build:dothome.

1) git fetch origin
2) origin/main == 2723c5fdd61102c50adb24af4ede0d16b0ccc493 아니면 중단
3) origin/cursor/admin-162-20261007 tip == 0a7005c… 아니면 중단
4) git checkout --detach 0a7005c && git rebase origin/main   (충돌 나면 abort·중단·보고. 손으로 풀지 말 것)
5) git diff --stat origin/main → 22 files, +3597 확인
6) 푸시 전 검사(전부 fail 0):
   - php scripts/verify-admin-162-settlement.php      (로컬 MySQL 픽스처)
   - npx vite-node scripts/verify-admin-162-settlement.mjs
   - npx vite-node scripts/verify-hide-inquiry-bundle.mjs   (기대 55/0 — 겹친 a28-screens*.js 회귀)
   - npx vite-node scripts/verify-admin-today-hub.mjs       (59/0)
   - npx vite-node scripts/verify-admin-preview-labels.mjs  (198/0)
   - npm run verify:shop-page                               (54/0)
   - cd preview/home-ui && npm run build                    성공
7) git push origin HEAD:main   (ff. force 금지; 거절되면 중단)
8) Deploy to dothome success 대기. 「Inject」 단계 placeholder 오류 0 확인.
9) 보고: 전후 main SHA · 새 tip SHA 3개 · 검사 숫자 · run 번호
```

---

## 6. 배포 후 검수 (숫자 기준) — 1건이라도 불합격 → 중단, 159-c 금지

| # | 확인 | 합격 기준 |
|---|---|---|
| D1 | Deploy run | success 1, 트리거 SHA = 새 tip |
| D2 | 라이브 번들 | 관리자 보고서 문구(a28-settlement-copy) 1개 이상 존재 |
| D3 | 405/403 | GET→405, 키 없는 POST→403 (§4) |
| D4 | 키 맞는 POST | 200, `ok:true`; Secret 미등록이면 503 `cron_key_unconfigured` → 불합격 |
| D5 | DB 행 | `SELECT period_kind, COUNT(*) FROM admin_settlement_reports GROUP BY 1;` day ≥ 1, 재호출 후 총 행수 변화 0 |
| D6 | 중복 | `SELECT period_kind, period_start, COUNT(*) c FROM admin_settlement_reports GROUP BY 1,2 HAVING c>1;` → 0행 |
| D7 | 관리자 화면 | 일간 어제 = 결제·문의·신고·가입·탈퇴/삭제 5줄 표시, 새로고침 2회 숫자 동일. 오늘 = 「진행 중」. 보충일 = 「그때 기록이 남아 있지 않아요」 |
| D8 | 인쇄 | 일일정산서 인쇄 미리보기 1쪽, 칸 잘림 0 |
| D9 | 다음날 메일(10-08 00:30 KST 이후) | 활성 super_admin 수 = 받은 메일 수(1인당 1통). `SELECT mail_status, COUNT(*) FROM admin_settlement_reports WHERE period_end = '2026-10-07' GROUP BY 1;` → `sent` 1 (일간), `failed`/`sending` 0 |
| D10 | 회귀 | 215 §5-A4·B1 재확인 1회(숨김 안내 1줄·문의 필터) 정상, 게스트 `/`·`/search` pageerror 0 |

## 7. 실패·롤백

- 코드: 종현 승인 후 새 tip 3커밋 `git revert` (force 금지). 077 테이블은 남겨도 무해.
- cron: 외부 cron 작업 끄기. SQL 롤백 §2-D는 종현만.

## 8. 작성 시 검증 (2026-10-07 15:3x KST)

| 확인 | 결과 |
|---|---|
| origin/main | `2723c5f` |
| 162 tip | `0a7005c` |
| ff-only | **NO** — 리베이스 필요, dry run 충돌 0 |
| push·Deploy·운영 SQL·cron 호출 | 미실행 |

**블로커:** 없음(문서 기준). 게이트 = 종현 ① 077 적용 ② GitHub Secret 등록 ③ 「배포(리베이스 허용)」 ④ 배포 후 외부 cron 등록.  
**주의:** `STUDY114_REPORT_MAIL_TO`는 주입 경로 없음 → 수신 = 활성 super_admin 전원.
