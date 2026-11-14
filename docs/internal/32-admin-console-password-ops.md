# 관리자 콘솔 2차 비밀번호 운영

콘솔에 들어가려면 로그인 비밀번호와 다른 2차 비밀번호가 필요하다. 평문과 해시 원문은 이 문서, 채팅, 스크린샷에 적지 않는다. 비밀번호 관리앱에 2차 비밀번호를 보관한다. 공개 재설정과 비상코드는 없다.

## 운영 반영 순서

1. phpMyAdmin에서 `sql/schema/092_admin_console_auth.sql` 을 실행한다. 그 전에 `docs/worklog/grok-sync/sql/sec-B1-check-2026-11-14.sql` 1번으로 테이블이 없는지 확인한다.
2. 아래 방법으로 본인 계정의 해시만 등록한다.
3. 그 다음 머지하고 Deploy to dothome 한다.
4. 콘솔에서 잠금해제를 확인한다.

092와 해시 등록보다 배포가 먼저면, 테이블이 없거나 해시가 없는 동안 콘솔이 잠긴다.

## 해시 만들기

명령 줄에 비밀번호를 붙이지 않는다. 로컬 PHP에서 표준 입력으로만 넣는다.

```
php -r "fwrite(STDOUT, password_hash(stream_get_contents(STDIN), PASSWORD_DEFAULT));"
```

비밀번호를 입력한 뒤 Windows는 Ctrl+Z 후 Enter, macOS·Linux는 Ctrl+D 로 입력을 끝낸다. 화면에 나온 한 줄이 해시다. 그 문자열만 복사하고, 입력한 비밀번호는 남기지 않는다.

조합은 정확히 6자다. 영문 대문자 1, 소문자 1, 숫자 2, 특수문자 2. 특수문자는 `!@#$%^&*?` 만 된다.

같은 머신에 이 저장소가 있으면 CLI도 된다. 비밀번호는 화면에 보이지 않는 입력 두 번이다.

```
php scripts/admin-console-password-set.php --email <본인 이메일>
```

## 등록 SQL

`<password_hash>` 자리에 위에서 만든 해시만 넣는다. 비밀번호 원문은 넣지 않는다.

```sql
INSERT INTO admin_console_auth (user_id, password_hash, fail_count, locked_until)
SELECT id, '<password_hash>', 0, NULL
FROM users
WHERE email = '<본인 이메일>'
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  fail_count = 0,
  locked_until = NULL;
```

잠금만 풀 때는 해시를 바꾸지 않고 `fail_count = 0`, `locked_until = NULL` 만 갱신한다. 행을 지우고 다시 등록해도 된다.

```sql
UPDATE admin_console_auth
SET fail_count = 0, locked_until = NULL
WHERE user_id = <본인 user_id>;
```
