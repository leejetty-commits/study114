# 2026-11-17 register freeze — revert #227

## 지시
main에서 `#227`(1823d2b5)만 `revert -m 1`. 빌드 후 공부방 로그인 → 공부방상세등록 진입만 확인. 풀리면 PR. 안 풀리면 `#226`도. 머지는 검수 후.

## 결과
- tip: `a0c93484` Revert #227
- `npm run build:dothome` 성공
- 로컬 `127.0.0.1:8099` — 공부방 세션(로그아웃 버튼 확인) → `/register/room/#/register/basic`
- **풀림**: 부트 폴백 해제, `#/register/lesson?room_id=22` 상세 폼 렌더, 1.2s 동안 버튼 37개 유지
- `#226` revert 불필요

## 캡처
`docs/worklog/2026/11/shots-register-freeze-227/after-227-register-room.png`
