# 215 · 숨김+문의 묶음 — 배포지시서 (2026-10-07)

- **작성:** 2026-10-07 13:1x KST (우동공과2, 개발팀장 대행)
- **절차 위치 (종현 t1478 잠금):** 검수완료(docs/206 §재검수) → 종현 보고 → **종현 승인(t1526 순차 배포: 한 묶음씩·배포후 검수·문제 시 중단) → 배포지시서 (이 문서)** → 종현 운영 SQL → 「배포」 확인 후 코드 반영 → Deploy → 배포후 검수
- **이번 문서 범위:** 준비만. **머지·push main·Actions 실행·운영 DB 접속 없음.**
- **대상 묶음만:** hide+inquiry. **159-c / 162 / hold 금지** (이 검수 통과 전 다음 묶음 배포 금지).
- **근거:** docs/206 (§5 운영 순서·§재검수 합격·종현 확인 14) · docs/203 · docs/190 · 과거 배포(159-a·b #392, 159-d #393 = ff-only)

---

## 1. 대상 SHA · 브랜치 · main 기준

| 항목 | 값 |
|---|---|
| 저장소 | `leejetty-commits/study114` |
| 브랜치 | `origin/cursor/hide-inquiry-20261007` |
| tip SHA | **`2723c5fdd61102c50adb24af4ede0d16b0ccc493`** (`2723c5f`) |
| tip 메시지 | `fix(hide): 다시 보이기에 주대상을 요구하고 내 문의 캐시를 분리한다` |
| 선행 커밋 | `ad81b93296176d8cf666dc525b820e50ded1aa20` (`ad81b93`) |
| 현재 라이브 / origin/main | **`11b0c0d82769ba27fa0792be59550e0aa14f233d`** (`11b0c0d`, Deploy #393) |
| 조상 관계 | `11b0c0d` ⊂ `ad81b93` ⊂ `2723c5f` — **rebase 불필요, `git merge --ff-only` 가능** |
| 커밋 수 (main..tip) | **2** |
| 바뀐 파일 | **39** (`git diff --stat 11b0c0d..2723c5f`) |
| 마이그레이션 | **076만** (`076_support_ticket_user_and_unhide_category.sql` + `076_support_ticket_user_backfill.sql`). **077(162) 없음** |
| 다른 묶음 tip 포함 여부 | **없음** — `0a7005c`(162) · `4c865bd`(159-c) · `26cadd3`(hold) 모두 tip의 조상 아님 (`merge-base --is-ancestor` 거짓). 경로에 077/159c/hold 파일 0 |

### 검증 명령 (배포 직전 에이전트가 다시 돌릴 것)

```bash
git fetch origin
git rev-parse origin/main
# 기대: 11b0c0d82769ba27fa0792be59550e0aa14f233d  (다르면 멈추고 보고. 머지·리베이스 금지)

git rev-parse origin/cursor/hide-inquiry-20261007
# 기대: 2723c5fdd61102c50adb24af4ede0d16b0ccc493

git merge-base --is-ancestor origin/main origin/cursor/hide-inquiry-20261007 && echo FF_OK
git log --oneline origin/main..origin/cursor/hide-inquiry-20261007
# 기대 2줄: 2723c5f · ad81b93
```

---

## 2. 종현이 먼저 할 운영 DB 절차 (SQL-first 필수)

> **Actions는 SQL을 실행하지 않는다.** (076·068 머리 주석 · docs/206 §5)  
> **코드보다 SQL이 먼저다.** `unhide_request` ENUM·`user_id` 없이 코드만 올리면 「숨김 해제 요청」 접수가 DB에서 실패할 수 있다. (코드는 `user_id` 칼럼 없을 때 옛 INSERT로 버티게 되어 있으나, **이 묶음의 문의 기능 완성 = SQL 적용 후**.)  
> 실행 장소: 운영 phpMyAdmin (`USE study114`). 에이전트·클라우드 = **운영 DB 접속·SQL 실행 금지**.

### 누가 무엇을

| 단계 | 주체 | 내용 |
|---|---|---|
| A~E (아래 SQL) | **종현만** | phpMyAdmin에서 실행·숫자 기록 |
| 「SQL 완료」 통보 + 「배포」 | **종현** | 에이전트에게 코드 반영 허가 |
| ff-only 머지·push·Actions 확인 | **Cursor 클라우드 에이전트** (종현 「배포」 후) | §3 명령만. SQL 금지 |
| 배포후 화면 검수 | 종현(+우동공과2 보조 가능) | §5 체크리스트 |

### A. 068 적용 확인 (기대 2행)

근거: `sql/schema/068_support_ticket_admin_reply.sql` 칼럼명 · docs/206 §5 「2행이 아니면 068 먼저」.

```sql
SELECT COLUMN_NAME
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'support_tickets'
  AND COLUMN_NAME IN ('admin_reply_text', 'admin_replied_at')
ORDER BY COLUMN_NAME;
```

- **기대:** `admin_replied_at` · `admin_reply_text` **2행**.  
- **2행이 아니면:** 076 하지 말고 `sql/schema/068_support_ticket_admin_reply.sql` 전문을 먼저 적용한 뒤 이 SELECT를 다시 돌린다.

### B. backfill 적용 전 건수 SELECT (기록 필수)

파일: `sql/schema/076_support_ticket_user_backfill.sql` **(1)** 그대로.

```sql
USE study114;

SET NAMES utf8mb4;

SELECT
  COUNT(*) AS total,
  SUM(n = 1) AS one_match,
  SUM(n = 0) AS zero_match,
  SUM(n >= 2) AS many_match
FROM (
  SELECT
    st.id,
    CASE
      WHEN st.email LIKE 'withdrawn.%@users.study114.local' THEN 0
      ELSE (
        SELECT COUNT(*)
        FROM users u
        WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(st.email))
          AND u.email NOT LIKE 'withdrawn.%@users.study114.local'
      )
    END AS n
  FROM support_tickets st
) counted;
```

- `total` · `one_match` · `zero_match` · `many_match` 네 숫자를 기록한다.  
- `zero_match`·`many_match` 행은 backfill 후에도 `user_id` NULL (docs/206 종현 확인 6).

### C. 076 본문 적용

파일: `sql/schema/076_support_ticket_user_and_unhide_category.sql` 전문 (아래는 저장소와 동일).

```sql
USE study114;

SET NAMES utf8mb4;

SET @c1 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'support_tickets'
    AND COLUMN_NAME = 'user_id'
);
SET @s1 := IF(@c1 = 0,
  'ALTER TABLE support_tickets
     ADD COLUMN user_id BIGINT UNSIGNED NULL
     COMMENT ''접수한 회원. 탈퇴·삭제 후에는 NULL''
     AFTER email,
     ADD KEY idx_support_tickets_user (user_id, status, id)',
  'SELECT 1');
PREPARE ps1 FROM @s1; EXECUTE ps1; DEALLOCATE PREPARE ps1;

SET @fk := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'support_tickets'
    AND CONSTRAINT_NAME = 'fk_support_tickets_user'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sfk := IF(@fk = 0,
  'ALTER TABLE support_tickets
     ADD CONSTRAINT fk_support_tickets_user
     FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL',
  'SELECT 1');
PREPARE psfk FROM @sfk; EXECUTE psfk; DEALLOCATE PREPARE psfk;

ALTER TABLE support_tickets
  MODIFY COLUMN category
  ENUM('bug','policy','account','other','unhide_request') NOT NULL;
```

적용 후 확인:

```sql
SHOW COLUMNS FROM support_tickets LIKE 'user_id';
SHOW COLUMNS FROM support_tickets LIKE 'category';
```

- `user_id` 행 1개, `category` Type에 `unhide_request` 포함.

### D. backfill UPDATE + 결과 SELECT

파일: `sql/schema/076_support_ticket_user_backfill.sql` **(2)(3)** 그대로.

```sql
UPDATE support_tickets st
INNER JOIN (
  SELECT LOWER(TRIM(email)) AS email_key, MIN(id) AS user_id, COUNT(*) AS n
  FROM users
  WHERE email NOT LIKE 'withdrawn.%@users.study114.local'
  GROUP BY LOWER(TRIM(email))
  HAVING n = 1
) matched ON LOWER(TRIM(st.email)) = matched.email_key
SET st.user_id = matched.user_id
WHERE st.user_id IS NULL
  AND st.email NOT LIKE 'withdrawn.%@users.study114.local';

SELECT SUM(user_id IS NOT NULL) AS filled
FROM support_tickets;
```

- **합격:** `filled` = 단계 B의 `one_match`.  
- 다시 돌려도 변화 0(이미 채워진 행은 `WHERE st.user_id IS NULL`).

### E. (참고) 076 되돌리기 — 실패·롤백 시에만, 종현 판단

076 머리 주석과 동일. **데이터 손실 주의. 평시 실행 금지.**

```sql
UPDATE support_tickets SET category = 'other' WHERE category = 'unhide_request';
ALTER TABLE support_tickets DROP FOREIGN KEY fk_support_tickets_user;
ALTER TABLE support_tickets DROP INDEX idx_support_tickets_user;
ALTER TABLE support_tickets DROP COLUMN user_id;
ALTER TABLE support_tickets
  MODIFY COLUMN category ENUM('bug','policy','account','other') NOT NULL;
```

### SQL vs 코드 순서 (잠금)

| 질문 | 답 |
|---|---|
| 코드만 먼저 배포 가능? | **이 묶음에서는 금지.** SQL-first 필수 (ENUM·회원연결). |
| 근거 | 076 머리 「운영 phpMyAdmin에서 **먼저** 적용」 · docs/206 §5 1→4 후 5(승인→main→배포) · 종현 확인 14 |
| docs/206 §8 「main→배포→076」 | 이 문서에서 **§5·SQL 머리 주석 우선**으로 정정. §8은 배포 직전 대기 문장의 순서 혼동. |

---

## 3. 코드 머지 방법 (종현 SQL 완료 + 「배포」 후에만)

과거 study114 배포와 동일: **PR·squash 아님. fast-forward만.**  
(159-a·b: `1d48c2c`→`c51d7d2` · 159-d: `c51d7d2`→`11b0c0d` · `/workspace/deploy-159d.md`)

### 금지 (어기면 중단·보고)

- PR 생성, squash merge, rebase, `--amend`, force / force-with-lease  
- 162·159-c·hold 브랜치·커밋 포함  
- 코드 수정·추가 커밋  
- 운영 SQL 실행  
- 로컬 `npm run build:dothome` (Actions가 빌드)

### Cursor 클라우드 에이전트용 명령 (붙여넣기)

종현이 「SQL 완료」와 「배포」를 말한 **뒤에만** 실행.

```text
[티켓 215 · 숨김+문의 배포 · ff-only + Deploy to dothome]

저장소 leejetty-commits/study114.
사용자 허가: main fast-forward push + Actions Deploy to dothome 확인만.
금지: PR · force · rebase · amend · 코드 수정 · 운영 DB · 다른 브랜치 머지 · 로컬 build:dothome.

1) git fetch origin
2) origin/main == 11b0c0d82769ba27fa0792be59550e0aa14f233d 아니면 중단·보고
3) origin/cursor/hide-inquiry-20261007 == 2723c5fdd61102c50adb24af4ede0d16b0ccc493 아니면 중단·보고
4) git checkout main && git reset --hard origin/main
5) git merge --ff-only 2723c5fdd61102c50adb24af4ede0d16b0ccc493
   (실패하면 중단. 리베이스·merge 커밋 만들지 말 것)
6) 푸시 전 검사(전부 통과해야 푸시):
   - npx vite-node scripts/verify-admin-today-hub.mjs          → fail 0 (기대 59/0)
   - npx vite-node scripts/verify-admin-preview-labels.mjs     → 198/0
   - npm run verify:shop-page                                  → fail 0 (기대 54/0)
   - npx vite-node scripts/verify-hide-inquiry-bundle.mjs      → fail 0 (기대 55/0)
   - cd preview/home-ui && npm run build                       → 성공
7) git push origin main   (force 금지)
8) GitHub Actions 「Deploy to dothome」 success까지 대기. 실패 시 로그 요약만 보고, 재시도·수정 금지.
9) 보고: push 전후 origin/main SHA · 검사 숫자 · Actions run 번호·결과 · 라이브 번들 반영 증거(아래 §4)
```

머지 후 `origin/main` 기대 tip = **`2723c5f`**.

---

## 4. GitHub Actions 「Deploy to dothome」 확인 항목

| # | 확인 |
|---|---|
| 1 | 워크플로 이름 = **Deploy to dothome** (`.github/workflows/deploy.yml`, 최근 예: #392·#393) |
| 2 | 트리거 커밋 = `2723c5f` (main push) |
| 3 | 결과 = **success**. 실패면 로그 요약 보고 후 **중단** (Re-run·코드 수정·다른 묶음 금지 — 종현 지시 전까지) |
| 4 | 로컬 `build:dothome` 실행하지 않음 |
| 5 | 라이브 `https://study114.net` 하드 새로고침 후 번들 반영: 관리자 문의 필터 문구·회원 상세 「운영문의」·허브 숨김 안내 문구 중 1개 이상 소스/화면에 존재 (우동공과2 curl/rg 보조 가능) |
| 6 | SQL은 Actions가 돌리지 않음 — 단계 2가 이미 끝났는지 종현 확인 |

---

## 5. 배포 후 검수 체크리스트 (docs/206 합격 기준 기준)

하드 새로고침. 문제 1건이라도 → **§6 중단**. 다음 묶음(162) 진행 금지.

### 5-A. 관리자

| # | 확인 | 기대 |
|---|---|---|
| A1 | `#/admin` 「홈에 뭐가 보이나」: 테스트 공부방(또는 과외) **숨김** → 새로고침 | 상태 `hidden` 유지. 로그 `user_notified`는 알림이 실제로 생겼을 때만 Y |
| A2 | 같은 카드 **다시 보이기** | 필수칸·주대상 있으면 `published`, 빠지면 `draft`+missing(주대상 포함). 알림 증가 0 |
| A3 | 숨긴 카드 주인 계정으로 상세정보2/연락처 저장 후 관리자에서 재조회 | 여전히 `hidden` (저장으로 풀리지 않음) |
| A4 | 「문의·신고」 또는 `#/admin/tickets`: 처리 전 / 종료 / 전체 필터 | 처리 전에 closed 0. 선택 그룹이 `btn--primary`+`aria-pressed`로 보임 |
| A5 | 검색(이메일 부분·숫자 user_id) · 페이지(20건) | 결과·쪽 수 맞음. 새로고침(같은 필터) 후 total·행 유지 |
| A6 | 회원 상세 「운영문의」 목록 | 그 회원 문의만. 줄 링크 → `#/admin/tickets?q={user_id}&group=all` 로 거름 적용 |
| A7 | 문의 답변 1건 저장 → 새로고침 | 답변·상태 유지 (068 1건 덮어쓰기). 스레드/다중 답글 UI 없음 |

### 5-B. 사이트 (회원)

| # | 확인 | 기대 |
|---|---|---|
| B1 | 숨김된 공부방·과외쌤·학생 허브 | 안내 한 줄 정확히 1번: 「이 카드는 지금 홈·찾기에서 숨김 처리되었습니다. 궁금한 점은 고객센터 운영문의로 남겨 주세요.」 + 「고객센터 운영문의」 버튼. **다시 켜기·공개 신청 버튼 0** |
| B2 | 공부방/과외 마이페이지 시스템 안내(`admin_hide`) | 제목 「홈·찾기 숨김」, 버튼 「고객센터 운영문의」. **쪽지·메일·문자 없음**(이번 묶음 범위 밖·정책상 미발송) |
| B3 | `#/support/contact?category=unhide_request` | 유형 「숨김 해제 요청」 미리 선택·변경 가능. 이메일 **읽기 전용**(계정 이메일) |
| B4 | 로그인 후 운영문의 접수 1건 → 「내 문의 내역」 | 목록에 보임. 새로고침 후에도 유지. 관리자 능력 계정도 **본인 것만** |
| B5 | 비로그인 POST 문의 | 401 (접수 불가) |

### 5-C. 게스트·회귀

| # | 확인 | 기대 |
|---|---|---|
| C1 | 게스트 홈 `/` · 찾기 | 깨짐·빈 화면·콘솔 치명 오류 없음 |
| C2 | 사이트 화면 글자 | 「학부모」 라벨이 이번 배포로 늘지 않음(기존 mypage/shell.js:73은 별건) |

---

## 6. 실패 시 중단 · 롤백 메모

1. **즉시 중단:** 배포후 검수 불합격 · Deploy failure · tip SHA 불일치 · ff-only 실패 · SQL `filled ≠ one_match`.  
2. **다음 묶음(162·159-c·hold) 시작 금지.**  
3. **코드 롤백 (종현 승인 후 에이전트):** 이전 라이브로 ff가 아니면 revert 커밋.

```bash
# 라이브를 직전 SHA로 되돌리는 경우 (종현 승인 후에만)
git fetch origin
git checkout main && git reset --hard origin/main
# 현재 main이 2723c5f일 때:
git revert --no-edit 2723c5f   # 필요 시 ad81b93도 순서대로
# 또는 정책상 허용될 때만 (force 금지 원칙과 충돌 → 종현 명시 승인 필수):
#   이전 라이브 SHA = 11b0c0d82769ba27fa0792be59550e0aa14f233d
git push origin main   # force 없이 가능한 방법만
```

4. **SQL 롤백:** §2-E 되돌리기 SQL은 종현만. `unhide_request` 행은 `other`로 바뀜.  
5. **부분 적용 금지:** 코드만 되돌리고 SQL만 남기거나 그 반대 — 종현이 상태를 적은 뒤 결정.

---

## 7. 다음 묶음(162) — 이 검수 통과 전 금지

- 종현 t1526: **한 묶음씩 → 배포후 검수 → 문제 시 중단.**  
- **순서 잠금:** hide+inquiry(이 문서) **합격** → 그다음 162(`0a7005c`, 077) → 159-c → hold.  
- 이 문서의 §5가 전부 통과하기 전에 `cursor/admin-162-20261007` 머지·push·Deploy·077 SQL **금지**.  
- 159-c tip(`4c865bd`)은 hide tip 위 1커밋이므로, hide가 main에 들어간 뒤에만 순차 검토.

---

## 8. 보고 형식 (배포 실행 에이전트 → 우동공과2/종현)

① push 전후 `origin/main` SHA  
② 푸시 전 검사 숫자(today-hub · labels · shop · hide-bundle · build)  
③ Actions 「Deploy to dothome」 run 번호 · id · success/fail  
④ 종현 SQL 기록 요약(`068` 2행 · B 네 숫자 · `filled`) — 에이전트가 SQL을 돌린 것이 아님을 명시  
⑤ §5 체크리스트 결과(또는 종현 라이브 확인 이관 항목)  
⑥ 다음 묶음 미착수 확인

---

## 9. 이 문서 작성 시 검증 (2026-10-07 13:16 KST)

| 확인 | 결과 |
|---|---|
| `git fetch` 후 tip | `2723c5fdd61102c50adb24af4ede0d16b0ccc493` |
| origin/main | `11b0c0d82769ba27fa0792be59550e0aa14f233d` |
| ff-only 가능 | YES |
| 162/159-c/hold in tip | NO |
| 머지·push·Actions·운영 SQL | **미실행** (지시서만) |
| worktree | `/workspace/study114-wt-hide` (기존 사용, 신규 clone 없음) |

**블로커:** 없음(문서 준비 기준). 실행 게이트 = 종현 운영 SQL 완료 + 「배포」 한 마디.

---

## §배포 결과 (게스트 스모크 · 2026-10-07 13:35 KST)

| 항목 | 결과 |
|---|---|
| 판정 | **OK** (게스트 C1·C2·번들 보조만; 관리자/회원 §5-A·B·운영DB는 미실시) |
| 라이브 URL | `https://study114.net` (dothome → 301 동일) |
| Deploy | #394 success · main `2723c5f` |
| 홈 | `/` → `#/guest` 로드, 카탈로그·공지·맵 렌더, pageerror 0 · 치명 콘솔 0 |
| 찾기 | `/search/` → `#/search/room` 로드, 「공부방 찾기」·대치동 맵 렌더, pageerror 0 · 치명 콘솔 0 |
| 학부모 | 가시 라벨 1 = 기존 레일 「학생/학부모 고민방」만 (신규 증가 없음) |
| 번들 증거 | `/assets/index-BkqNkP6S.js`에 `unhide_request`×2 · `admin_hide`×1 · 「고객센터 운영문의」×3 |
| 비치명 | 게스트 `GET /api/support/tickets.php` → 401 (비로그인 기대) |
| 금지 준수 | 운영 DB·관리자 로그인 없음 |

