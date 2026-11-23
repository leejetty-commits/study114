# 관리자 회원 목록 — 테스트 상태 칩 (2026-11-24)

- 지시: `origin/work/admin-member-test-status-doc` 의 `docs/worklog/grok-sync/docs/admin-member-test-status.md`
- 기준: `origin/main` `d603f5e3` (PR #297)
- 브랜치: `work/admin-member-test-status`
- 실행: Cursor. 병합하지 않음.

## 한 일

관리자 회원 목록의 상태 칩과 상태 선택지에 `테스트`를 넣었다. `정상` 칩·선택지 글자는 `정상(테스트 제외)`다. 행·상세의 `정상` 글자는 그대로다.

`status=all`은 탈퇴만 빼고 테스트 계정을 포함한다. `status=active`는 `users.status = active`이면서 테스트 목록에 없는 회원이다. `status=test`는 `TestAccountAllowlist::userIds()`에 있고 탈퇴가 아닌 회원이다. 목록이 비면 테스트는 0건이고, 정상은 기존 active와 같다. 대기·정지·탈퇴는 테스트 여부를 빼지 않는다. 역할·지역·서술 조건은 그 위에 AND다.

스키마는 바꾸지 않았다. `users.status`에 `test`를 넣지 않았다.

## 검증

`php -l`은 바꾼 PHP 3개와 검증 스크립트에서 문법 오류가 없었다.

`php scripts/verify-admin-member-test-status.php`는 빈 임시 데이터베이스만 만들고 그 데이터베이스만 지웠다. 이름·이메일은 적지 않는다.

| 항목 | 결과 |
|---|---|
| 허용목록이 비었을 때 테스트 | 0 |
| 허용목록이 비었을 때 정상 | active 전체와 같음 (1) |
| 상태 전체 | 3 |
| 정상(테스트 제외) | 1 |
| 테스트 | 2 |
| 대기 테스트가 대기에 포함 | 1 |
| 탈퇴 테스트는 탈퇴에만 | 탈퇴 1, 테스트·전체에는 없음 |
| 테스트 + 공부방 포함 | 1 |
| `status=nope` | 422 |

통과: `empty-test-zero`, `empty-active-equals-raw-active`, `filled-all`, `filled-active-excludes-test`, `filled-test`, `filled-pending-includes-test`, `filled-withdrawn`, `filled-test-not-withdrawn`, `filled-test-and-study-room`, `filled-chip-test-and-study-room`, `filled-chip-active-and-study-room`, `status-nope-422`. 실패 없음.

## 화면

로컬 프리뷰 `http://127.0.0.1:5174/#/admin/members`, 너비 1280. 로그인하지 않으면 운영자 전용 안내만 보여서, 같은 페이지에서 회원 목록 미리보기를 그려 확인했다. 시드는 저장소의 example.com 더미다.

칩: 전체 3명, 정상(테스트 제외) 2명, 대기, 정지, 탈퇴, 테스트. 미리보기라 테스트 칩 숫자는 0이고, 정상은 시드의 active 2명이다.

상태 선택지: 상태 전체, 정상(테스트 제외), 대기, 정지, 탈퇴, 테스트.

행 상태 글자: 정상, 정상, 대기. 테스트로 바뀌지 않았다.

## 발견 목록

- 회원 목록 주소는 운영자 로그인이 있어야 본문이 나온다. 이번 화면 확인은 미리보기 렌더로 했다.
- 목록 GET의 `status` 검사는 로그인 확인보다 앞에 있다. 그래서 로그인 없이도 허용되지 않은 값은 422다. 상세(`id>0`), 정지·복구·탈퇴, 삭제, 비밀번호 재설정은 그대로다.
