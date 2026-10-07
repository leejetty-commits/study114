# 사이트오류-25: 등록 앱 me.php 경쟁조건 (2026-10-05)

## 근거
- 종현 t1352u: 「제대로 불러 와야지」→ 수정 진행.
- 해결안: 1번(각 앱 main.js에서 me 완료 후 가드·load) + 보완 a(과외쌤 saveStep null tutorId 시 기존 draft) + 보완 b(지연 me 검사).
- HEAD 진단: 79e8c34. docs/190 가칭25 진단 절 참고.

## 증상
과외쌤·공부방 등록/수정 진입 시 masters가 me보다 먼저 오면 role=guest로 load 스킵 → 빈 폼.

## 2026-10-05 16:56 KST 검수: ACCEPT-with-notes (로컬, 미커밋·미배포)
- HEAD 79e8c34. 대상: tutor-ui main.js·save-flow.js, study-room-ui main.js, TutorRegisterService.php, verify-input-fill-rule.mjs, verify-tutor-draft-reuse.mjs.
- 재실행: draft-reuse 10/0, input-fill 282/3(변이 3=24번 HEAD 동일 파일). 지연 T1D/T4D/S1D PASS.
- notes: save-flow는 M3 클라이언트 보완; tutor masters 실패 시 load 생략은 공부방과 비대칭이나 Must 위반 아님.
- 배포는 종현 「배포」 대기.

## [2026-10-05 17:04 KST] 사이트오류-25 배포 지시 전달 (종현 t1354u)
- add 6파일: tutor-ui main/save-flow, study-room-ui main, TutorRegisterService, verify-input-fill-rule, verify-tutor-draft-reuse

## 2026-10-05 17:20 KST — 사이트오류-25 배포 완료
- 커밋 `efeb5fdbcaa29e0a5764b59b01f36a8247bf21c5` (79e8c34..efeb5fd), origin/main 반영.
- Deploy to dothome success. 라이브 확인은 종현.
