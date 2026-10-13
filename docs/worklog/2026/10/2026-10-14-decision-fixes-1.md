# 2026-10-14 · 결정 반영 1묶음 (원생수 · 쪽지 기본값 · 빈 화면 문구 · 카탈로그 · 연락 메일)

- 브랜치: `cursor/decisions-20261014` (기준 origin/main `f5c09149`)
- 결정 근거: `2026-10-13-decisions-batch.md` 「2026-10-14 이어서」

## 1. 지시 (원문)

> 원생수: 카드·찾기·서버의 「9명 이상」을 「최대 9명」으로 바꿉니다.
> 쪽지 기본값 「받음」: 카드에 값이 비면 공부방·과외쌤 모두 「받음」으로 보이게 합니다. 새로 가입하는 과외쌤의 처음 값도 「받음」으로 바꿉니다.
> help@study114.net 반영 ===> 일단 이대로 표기는 해라.
> 빈 화면 문구 5개를 제안 문구로 바꿉니다.
> 「카달로그」를 「카탈로그」로 고칩니다.
> 쿼리를 주면 내가 에디터에서 시행한다. 2번. (과외쌤 처음 값 = DB 기본값 변경 방식)
> 그 이외는 모두 승인한다. (2026-10-14 03:24)

## 2. 바꾼 것

| 항목 | 파일 | 내용 |
|---|---|---|
| 원생수 | `src/Auth/RegisterEnums.php` 165 · `preview/home-ui/src/exposure-format.js` 119 · `preview/search-ui/src/search-enums.js` 34 | `nine_plus` 「9명 이상」→「최대 9명」. 입력 화면(`auth-ui`, `study-room-ui`)은 이미 「최대 9명」 |
| 쪽지 빈 값 = 받음 (공부방 카드) | `exposure-bridge.js` · `home-basic-live.js` · `study-room-home-seed.js` · `handoff-lifecycle.js` | 값이 없으면 `paused` → `open` |
| 쪽지 빈 값 = 받음 (과외쌤) | `src/Registration/TutorHubRepository.php` `normalizeInquiryStatus` · `preview/home-ui/src/tutor-reg/inquiries-pref.js` `normalizeTutorInquiryStatus` | 없거나 모르는 값 → `open`. 저장된 `paused`·`not_accepting`은 그대로 |
| 새 과외쌤 처음 값 = 받음 | `sql/schema/079_tutor_inquiry_status_default_open.sql`(새 파일) · `sql/schema/rest-schema.sql` | `tutors.inquiry_status` DEFAULT `paused` → `open`. **운영 적용은 종현이 phpMyAdmin에서** |
| 정본 64 | `docs/internal/64-tutor-inquiry-status-lock.md` | 처음 값·빈 값 = `open` 결정과 079 적용 안내 추가 |
| 빈 화면 문구 5개(Q5) | `preview/home-ui/src/empty-state-copy.js` | 최근열람 · 쪽지 · 구매이력 노출광고 · 쪽지 쓴 대상 · 결제 내역 → 05 부록 B 제안 문구 |
| 카탈로그 | `promo/catalog.js`(3) · `promo/tutor-content.js` · `promo/parent-content.js` · `promo/study-room-content.js` · `home-marketing-banner.js`(2) | 「카달로그」 8곳 → 「카탈로그」 |
| 연락 메일 | `support/support-copy.js` · `support/screens.js` | 자리표시 `support@udonggong.example` → `help@study114.net`. 운영문의 로그인 안내 화면 아래에 「로그인이 어렵거나 이미 탈퇴하셨다면 help@study114.net으로 메일을 보내 주세요.」(메일 링크) |
| 탈퇴 완료 메일 | `src/Mail/MemberMailTemplate.php` `HELP_EMAIL` · `src/Mail/MemberLifecycleMailTemplate.php` 230 | 「같은 이메일로 다시 가입한 뒤 고객센터 1:1 문의로」 → 「help@study114.net으로 바로 알려 주세요」 |
| 검사·문서 맞춤 | `scripts/verify-room-card-slots-20261009.mjs` · `scripts/verify-tutor-inquiries-settings.mjs` · `scripts/verify-mail-lifecycle.php` · `e2e/core-flow-messages.spec.js` · `docs/internal/47` | 바뀐 표기·기본값·문구로 기대값 수정 |

## 3. 검사

| 검사 | 결과 |
|---|---|
| `npm run verify:shop-page` | 통과 |
| `npm run verify:tutor-inquiries-settings` | 통과 (빈 값 기대를 `open`으로 바꾼 뒤) |
| `npm run verify:board-acl:js` | 통과 |
| `npm run verify:no-sample-data` | 통과 |
| `verify-room-card-slots-20261009.mjs` | 78 통과 / 1 실패 — 「(1) 공부방 모드 홈 경로 베이직: 교습형태·대상·슬로건 그대로」. **본편 `f5c09149` 그대로에서도 같은 1건 실패** → 이번 변경과 무관 |
| `php -l` (바꾼 PHP 4개) | 문법 오류 없음 |
| `php -d extension=pdo_sqlite scripts/verify-mail-lifecycle.php` | 446 / 0 |
| `check-no-committed-secrets.sh` | 통과 |
| `npm run build:dothome` | 성공. 홈·찾기 묶음에 「최대 9명」 있음, 「카달로그」 없음. 산출물은 커밋 안 함 |
| e2e(Playwright)·화면 눈확인 | 안 함(로컬 서버 필요). 배포 후 운영 확인 |

작업 중 사고: 수정 전 비교를 하려고 `git stash`를 썼다가 되돌리기가 `tmp/` 파일 때문에 멈춤. 수정 내용이 stash와 같은지(추적 파일 diff 0, 079 파일 해시 같음) 확인하고 이 작업의 stash만 지움. 수정 전 비교는 본편 병합 폴더(`.wt/merge-1010`, `f5c09149`)에서 다시 함.

## 4. 배포 전 사용자 할 일

- **SQL 079** (운영 phpMyAdmin, 아래 한 문장). 새로 생기는 과외쌤의 처음 값만 바뀌고 기존 과외쌤 값은 그대로. 코드 배포와 순서 무관(미적용이어도 저장·조회는 됨).

```sql
ALTER TABLE tutors
  MODIFY COLUMN inquiry_status ENUM('open','paused','not_accepting') NOT NULL DEFAULT 'open'
  COMMENT '과외쌤 쪽지 수신: open=받는 중(기본), paused=잠시 쉼(일시 중단), not_accepting=신규 학생 안 받음(신규 모집 닫힘)';
```

- `help@study114.net` 웹메일은 아직 없음 → 개통 전까지 이 주소로 온 메일은 받지 못함(종현 「일단 표기」 결정).

## 5. 위험도

- 낮음~보통. 화면 문구·표기 변경이 대부분. 쪽지 빈 값 해석이 `paused`→`open`으로 바뀌어, 값이 비어 오는 드문 경우 「쪽지 받음」으로 보임(결정대로).

## 6. 승인·배포

- (검수·승인 대기)
