# 123 · 홈 팝업 Phase 3(티켓 120) 수락

- 커밋: `2a2fe69135d1130d8a95d73962714c34c305ba88` (부모 `997ae27`), 로컬 전용. push·build:dothome 없음.
- 판정: **수락**.

## 대조 결과
- 파일 8개, 전부 120 허용 목록 안. `main.js` 등 금지 파일 변경 없음.
- `sql/schema/069_home_popups.sql`: `home_popups`, audience·content는 TEXT(JSON 문자열), published 기본 0, 시드 없음. `USE study114;`는 061~068과 같은 관례.
- 서비스 검증: 대상 비면 audience_required, 'all' 포함 시 ["all"], 유형별 허용 문구 칸만 저장, 제목 60·본문 400·버튼 20·나머지 80자, 목록 최대 4줄, 링크 `#/`·`/`·`https://`만, 날짜 YYYY-MM-DD, 시작>종료 bad_range.
- 관리자 API: requireAdmin + requireMaster, GET/GET?id/POST/DELETE, 그 외 405.
- 공개 API: GET만, 서울 날짜 기준 기간 안 + published=1, `Cache-Control: no-store`, 실패 시 500(홈은 팝업 없이 열림).
- 프론트: 더미 `HOME_POPUPS` 삭제, `gate.js`가 공개 목록을 한 번만 받고 도착하면 다시 그림. 빈 칸은 SET_A로 채움. 화면 출력은 전부 `esc()` 처리.
- 스모크: 사용자(Cursor) 보고 전 항목 통과. 테스트 행 삭제, 0건.

## 메모 (보완 불필요)
- `HomePopupValidationException`이 서비스 파일 안에 같이 있음. 서비스를 먼저 부르므로 동작에 문제 없음.
- `apply-schema-dev.ps1`은 069를 모르고 DB를 통째로 지움. 이번엔 손대지 않음(069만 수동 적용). 나중에 별도 판단.
- 로컬 jetty@naver.com은 메일 인증이 없어 관리자 API 검증 중에만 email_verified_at을 채웠다가 NULL로 복구함. 121 스모크도 같은 방식 허용.
- 운영 배포 시 phpMyAdmin에서 069 수동 적용 필요(build:dothome은 SQL 실행 안 함).
