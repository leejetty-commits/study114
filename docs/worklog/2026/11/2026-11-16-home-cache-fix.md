# 홈 지도 깜빡임 · 홈↔공부방찾기 재요청 줄이기

- 날짜: 2026-11-16
- 브랜치: `work/home-cache-fix-2026-11-16`
- 기준: `origin/main` `913ca8a9`
- 지시: `origin/docs/home-speed-split-2026-11-16` 의 `docs/worklog/grok-sync/docs/home-cache-fix-2026-11-16.md`
- 상태: PR만 연다. 머지하지 않음. 이 세션은 자기 작업을 승인하지 않는다.

## 한 일

1. `getCurrentScreen()`이 해시 쿼리(`?welcome=1`)를 떼고 화면을 찾는다. `#/tutor?welcome=1`은 세션 전에 게스트로 떨어지지 않는다.
2. `localStorage['study114.last-role']`에 역할 문자열만 둔다. 힌트가 있으면 세션 전에 게스트 지도 대신 헤더와 회색 칸만 그리고, 역할 홈 조각을 `me.php`와 같이 받는다. 힌트가 없는 손님은 게스트 홈을 먼저 그린다. 로그아웃·비로그인 판정 때 힌트를 지운다.
3. `sessionStorage['study114.snap.v1']`에 같은 `user_id`·`role_type`의 등록 목록, 공급 상태, 공부방 홈 목록, 조회수를 둔다. 비밀번호·토큰·결제 키는 넣지 않는다. 홈 목록·조회수는 3분 안이면 다시 받지 않고, 등록 목록은 뒤에서 다시 받는다. 값이 같으면 `auth:session-hydrated`가 화면 전체를 다시 그리지 않는다.
4. 공급자·쪽지·등록 확인은 `Promise.all`로 같이 보낸다. 셋은 서로의 응답을 쓰지 않는다.
5. 공부방 홈 지도 위 박스는 코드 변경 없음. 2026-10-05 결정대로 '내' 탭 오른쪽 「지역 요약」 카드가 그대로다.

## 수락 기준

| 항목 | 결과 |
|---|---|
| 과외쌤·학생 로그인 첫 프레임에 게스트 지도 0 | 로그인 계정으로 보지 못함. 비로그인 `#/tutor?welcome=1`은 세션 뒤 `#/guest`로 돌아갔고, 끝난 화면은 게스트 홈이었다. |
| 비로그인 손님은 게스트 홈이 먼저 | 통과. `http://127.0.0.1:5174/#/guest`에서 「우리동네 대치동」과 「우리동네 지도」가 보였다. |
| 공부방 홈↔찾기 두 번째부터 스냅샷, TTL 안 search.php·roi.php 0회 | 로그인 왕복을 재지 못함. |
| 지역 저장 직후 새 값 | 코드 경로만 연결. 화면 확인 없음. |
| 로그아웃 후 다른 역할에 이전 값 없음 | 화면 확인 없음. 로그아웃·역할 불일치·`auth:role-change`에서 스냅샷을 지운다. |
| 빌드 | 홈·찾기·인증 프리뷰 `vite build` 성공. |
| 엔트리 크기 | 미달. 아래 표. |

## 엔트리·역할 조각

홈 `preview/home-ui` `vite build`. CSS는 파일 하나(668.54 kB).

| | 원본 | gzip |
|---|---:|---:|
| 이전 (`913ca8a9`, #224 기록) | 651,826 bytes (651.83 kB) | 189.79 kB |
| 이후 (`index-C3RKnFLK.js`) | 657,210 bytes (657.21 kB) | 191.84 kB |

스냅샷 본문은 엔트리 밖 `session-snapshot-DMcoZjG_.js` 2,213 bytes. 엔트리가 약 5.4 kB 늘어난 이유는 세션 판정·홈 목록 모듈이 이미 엔트리에 있어서, 그 위에 힌트·재렌더 가드가 붙었기 때문이다.

이번 빌드의 역할 조각:

| 조각 | 원본 |
|---|---:|
| parent | 1,120 bytes |
| study-room | 4,809 bytes |
| tutor | 6,868 bytes |

#224 빌드의 역할 조각 바이트는 이 기록에 없다.

## 왕복 Network

로그인 공부방 계정으로 홈 → 찾기 → 홈 → 찾기를 재지 못했다. 요청 수 전/후 표는 비어 있다.

| 구간 | 전 (#224) | 후 (이번 브랜치) |
|---|---|---|
| 과외쌤 로그인 첫 화면 지도 SDK·게스트 통계 | 지시서 기준 발생 | 미측정 |
| 공부방 두 번째 홈·찾기 `search.php` | 매번 | 미측정. TTL 3분 안이면 코드가 목록·조회수를 다시 받지 않음 |
| 공부방 두 번째 홈·찾기 `roi.php` | 매번 | 미측정. 같은 TTL |
| 등록 목록 | 매번, 공급·쪽지 다음 | 매번. 공급·쪽지와 병렬 |

## 바꾼 파일

- `preview/home-ui/src/state.js` — 해시 쿼리 제거, 역할이 바뀌면 스냅샷 삭제
- `preview/home-ui/src/main.js` — 힌트 있으면 중립 셸, 역할 조각 선로드, 등록 값이 같으면 다시 그리지 않음
- `preview/home-ui/src/auth-session.js` — 힌트 저장, 스냅샷 시드, 부가 요청 병렬
- `preview/home-ui/src/registrations-backend.js` — 스냅샷 시드와 저장 후 무효화
- `preview/home-ui/src/study-room-home-seed.js` — 3분 목록·조회수
- `preview/home-ui/src/screens/study-room.js` — 다시 그리지 않을 때 미확인 쪽지만 고침
- `preview/home-ui/src/provider-status.js` — 스냅샷 시드
- `preview/home-ui/src/styles/home.css` — 회색 대기 칸
- `preview/search-ui/src/main.js` — 찾기에서도 값이 같으면 지도를 다시 만들지 않음
- `preview/auth-ui/src/screens/login.js` — 로그인 성공 때 역할 힌트
- `preview/shared/last-role.js` — 역할 힌트
- `preview/shared/snap-clear.js` — 스냅샷 키 삭제
- `preview/shared/session-snapshot.js` — 스냅샷 읽기·쓰기
- 등록 저장: `study-room-reg/inline-save.js`, `tutor-reg/inline-save.js`, `mypage/screens.js`, `study-room-ui/src/register-api.js`, `tutor-ui/src/register-api.js`

## 남은 위험

- 엔트리가 #224보다 5,384 bytes 크다.
- 스냅샷을 지우는 저장 경로 밖에 지역이 저장되면 옛 지역이 3분 남을 수 있다. 연결한 곳은 공부방·과외 `register.php` 저장, 등록 PATCH, 학생 프라임 매칭 저장이다.
- 등록 목록이 같으면 지도를 유지한다. 쪽지 미확인 수는 공부방 홈 상태 칸만 그 자리에서 고친다.
- 과외쌤 로그인 첫 프레임 스크린샷과 홈↔찾기 요청 표는 이 세션에서 만들지 못했다.
