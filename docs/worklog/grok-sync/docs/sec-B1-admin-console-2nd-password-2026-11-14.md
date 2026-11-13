# B1 · 관리자 콘솔 2차 비밀번호 (363 다시 지시 · 2026-11-14)

- 작성: 우동공과3 · 실행: Cursor · 최종검수: **우동공과3 직접**(보안 작업)
- 기준: origin/main `efc881f7`
- **본문 지시서는 그대로 쓴다:** `docs/worklog/grok-sync/docs/363-admin-console-2nd-password-2026-11-11.md` (main에 있음). 아래 「바뀐 점」만 덮어쓴다. 둘이 다르면 **이 문서가 우선**.
- 정본: 노션 「관리자 기능 · 운영실 정본」 잠금 · 콘솔 2차 비번(2026-10-28), 노션 「작업체크리스트 · 관리자콘솔 2차 비번」(상태: 대기, 체크 0개).
- 브랜치: `work/363-admin-console-2nd-password` (main 최신 pull 후 새로 만듦)
- **규칙: 새 브랜치에서 PR만 열고 보고. 머지·force push·운영 SQL 금지.**

## 0. 지금 상태 (main `efc881f7` 확인)
- **구현 안 됨.** `src/Admin/AdminApi.php:89-100` `requireAdmin()`은 로그인 + `hasAdminCapability` + 이메일 인증만 본다.
- `console-unlock.php`, `AdminConsolePasswordService`, `admin_console_auth` 테이블, `console_unlock*` 코드: 저장소 전체 0건. 관련 원격 브랜치도 없음.
- 그래서 관리자 비밀번호 하나(또는 세션 하나)면 콘솔 전체 권한이다. 옛 `/auth/login`(H2)은 횟수 제한도 없다.

## 1. 363 지시서에서 바뀐 점
1. **SQL 번호: 087 → 092.** main에 이미 `087_student_hope_region_extra.sql`이 있고, `088`은 `work/365-identity-design`이 쓰고, `089~091`은 main에 있다. 저장소 파일은 `sql/schema/092_admin_console_auth.sql` + `092_admin_console_auth_rollback.sql`. 만들기 직전에 `git fetch` 후 다시 대조하고, 겹치면 다음 빈 번호로 바꾸고 보고.
   - 운영 적용용 SQL은 공유폴더 `docs/worklog/grok-sync/sql/sec-B1-admin-console-auth-092.sql`에 이미 있다(AFTER 없는 평문). 저장소 파일 내용은 이것과 같게.
2. **보고 규칙:** 363의 「커밋까지만. push·PR·머지는 …승인으로」 대신 → **새 브랜치에서 PR만 열고 보고.**
3. **관리자 API 개수:** 363은 19개라고 적었지만 지금 `public/api/admin/`은 파일 17개 + `content/` 폴더이고, `requireAdmin()`을 부르는 `public/` 파일은 21개다. 다시 세어 보고에 목록을 붙인다.
4. **선행 작업: H2(옛 로그인 닫기), H3(soft error) 다음에 한다.**
   - H3 이유: 닷홈은 403 본문을 HTML로 바꾼다. 그러면 화면이 `console_unlock_required`·`console_locked`·`console_password_unset`을 못 읽어 게이트가 고장 난다. `AdminApi::fail()`(`src/Admin/AdminApi.php:133`)을 H3의 `study114_json_error()`로 바꾸고, 콘솔 게이트·관리자 API 화면 요청에 `X-Study114-Soft-Error: 1`을 보낸다. 관리자 화면 쪽 fetch 도우미(`preview/home-ui/src/admin/*-api.js`, `site-settings-store.js` 등)에서 `res.status`로 판정하는 곳(`a28-member-mail.js:91-94`, `a28-withdraw-reasons.js:131`, `site-settings-store.js:219`)은 `data.http_status ?? res.status`로 바꾼다.
   - H3가 아직 main에 없으면 이 작업을 시작하지 말고 그렇게 보고.
5. **세션 번호 새로 만들기(보고서 M1 일부):** 콘솔 잠금해제 성공 순간 `session_regenerate_id(true)`를 부른다. 사이트 로그인 쪽 세션 재발급(M1 전체)은 이번 범위 밖.
6. **테스트 계정:** verify는 로컬 Docker DB만. 운영 계정·운영 DB 사용 금지(363과 같음).
7. **운영 문서 번호:** 363이 적은 `docs/internal/31-admin-console-password-ops.md`의 31번은 이미 `31-oauth-secret-incident.md`가 쓴다. 다음 빈 번호로 만들고 보고(만들기 직전 `docs/internal/` 다시 확인).

## 2. 그대로인 것 (363 본문)
잠금 규칙(콘솔 진입 때만, 정확히 6자 = 대1·소1·숫자2·특수2, 5회 실패 잠금, 공개 재설정 없음, `must_change_password`와 분리), 대상 파일, 범위 1~9, 필수 verify, 금지, 셀프검수 표, 최종검수 패키지 형식. **바꾸지 말 것.**

## 3. 바꾸지 말 것 (363 + 추가)
- `users.password_hash`·로그인 비번을 2차 비번으로 쓰지 않음.
- 웹 최초 설정 화면, 메일·SMS 재설정, 우회 헤더·env 스위치 금지.
- 관리자 셸·메뉴·운영 홈 1px도.
- `public/.htaccess`·운영 `.env`·CSP 변경 금지. (H2가 바꾼 줄도 건드리지 않음.)

## 4. 수락 기준 (363 「필수」 + 추가)
- 363의 verify 항목 전부 PASS.
- 추가: 헤더 `X-Study114-Soft-Error: 1`로 해제 없이 `GET /api/admin/members.php` → 200 + `ok:false` + `error:console_unlock_required` + `http_status:403`. 헤더 없이 → 403.
- 추가: 잠금해제 성공 전후 세션 쿠키 값이 바뀜(값은 보고에 쓰지 않고 "바뀜"만).
- 스크린샷 390·1280: 게이트 / 실패(남은 횟수) / 잠금 / 해제 후 홈.

## 5. 종현 결정 (363의 A~E · 아직 결정 기록 없음 → 권장안으로 구현하고 상수 1곳)
| # | 항목 | 권장 |
|---|---|---|
| A | 유휴 만료 | 30분 슬라이딩 |
| B | 5회 실패 후 잠금 | 15분 (노션 정본: 「약 10~15분 또는 당일 차단」 → 아직 미확정) |
| C | 대상 | admin_level 있는 모든 계정(최고관리자·부마스터) |
| D | 비상코드(금고) | 이번엔 안 함 (노션: 「보조 가능」) |
| E | 특수문자 집합 | `!@#$%^&*?` |

## 6. 운영 적용 순서 (머지 뒤 · 종현이 직접)
1) 머지·Deploy to dothome → 이때부터 콘솔이 잠긴다(의도된 동작)
2) 종현: phpMyAdmin에서 `sec-B1-check-2026-11-14.sql` 1번(없음 확인) → `sec-B1-admin-console-auth-092.sql` 실행 → check 2·3번
3) 종현: 새 운영 문서(`docs/internal/<빈 번호>-admin-console-password-ops.md`) 절차로 자기 2차 비번 해시 등록(평문은 어디에도 붙여 넣지 않음)
4) 콘솔 잠금해제 확인
- 1)과 2) 사이에는 콘솔을 못 쓴다. 배포는 종현이 바로 SQL을 돌릴 수 있는 시간에.

## 공통 금지
- 새 브랜치에서 PR만 열고 보고. **머지·force push·운영 SQL 금지.** `reset --hard`, `stash drop` 금지.
- 비밀번호·해시·세션값을 문서·커밋·채팅·로그·스크린샷에 쓰지 않음.
- 범위 밖 버그는 고치지 말고 「발견 목록」에만.
