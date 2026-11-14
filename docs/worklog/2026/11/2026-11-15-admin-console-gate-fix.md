# 관리자 콘솔 2차 비밀번호 입구 수정

- 날짜: 2026-11-15
- 기준: main `0526ef20`
- 브랜치: `work/admin-console-gate-fix-2026-11-15`
- DB 변경 없음. 이 세션은 머지하지 않는다.

`console_unlocked` 가 true 일 때만 관리자 API를 켠다. 잠금이 필요한 응답이 와도 `#/admin` 밖에서는 콘솔로 이동하지 않는다. 잠금 화면·오류·잠김 문구에는 문자 종류 개수를 적지 않는다.

`assertShape` 는 비밀번호 설정·변경에서만 규칙을 말한다. 잠금해제는 `비밀번호가 맞지 않아요.` 만 반환한다.

`php scripts/verify-admin-console-password.php` → 34 PASS / 0 FAIL.
