# 2026-11-17 gnb-register capture — 로그인 후 통과

## 지시
`main.js` capture 클릭에서 `gnb-register_room`·`gnb-register_tutor`는 `!sessionChecked`일 때만 막고, 로그인 뒤에는 막지 않는다. 다른 파일 금지.

## 수정
`preview/home-ui/src/main.js` — 등록 GNB를 guestOnly에서 분리, 세션 미확정 시에만 preventDefault.

## 확인
- 빌드: `npm run build:dothome`
- 공부방 로그인 홈 → `gnb-register_room` 클릭 → 등록 화면 진입 (캡처)
- 과외쌤: 동일 capture 경로에서 `gnb-register_tutor`의 `defaultPrevented===false` 확인. 과외쌤 계정 비밀번호 없어 유료상품→GNB 실클릭은 미실시(검수 시 tu 계정으로 확인 권장)

## 캡처
`docs/worklog/2026/11/shots-gnb-register-session/room-register-after-click.png`
