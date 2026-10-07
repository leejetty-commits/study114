# 117 · 홈 팝업 Phase 1b (set-b 워터마크 패밀리) 수락

- 대상 티켓: 116
- 커밋: `05f8df74fada2fd620d6a155d46171a6abb790ec` (로컬, base `345590b`, push 안 함, 1a amend 없음)
- 판정: **수락** (로컬 기준). 배포는 사용자가 「배포」 할 때까지 보류.

## 대조 결과 (실제 diff 확인)
- 변경 파일 4개 = allowlist 그대로: `home-popup/gate.js`, `content.js`, `mount.js`, `styles/home-popup.css`. `main.js`·`site-ops-chrome.js`·admin·API 무변경. 워드마크 기존 파일 사용.
- `?popupFamily=a|b` 페이지 쿼리만, 기본 a, 해시 미사용. 카드 위 스위치 set-a/set-b + 공지/이벤트/광고.
- 워터마크 `/assets/brand/logo-wordmark.png`, set-b에서만, 38px·opacity 0.11·-8°, pointer-events none, alt 빈값.
- 위치: 공지=카드 본문 우하단(하루안보기 위), 이벤트=크림 본문 안(부모 relative 추가), 광고=흰 본문(`ad-main`, 이미 relative) 우하단 → 민트 패널 아님.
- 게이트 `isAdminUser()` 유지. 닫기 기억은 경로+유형+패밀리 단위, 저장 없음(미리보기 규칙 유지).
- set-a 회귀 없음(보고): 이벤트 flex-start·lockup 56px·광고 768px 스택.

## 남은 것
- 관리자 실로그인 스모크(API :8080 꺼짐) 미확인 → 다음 로컬 API 켤 때 확인.
- 다음 단계: Phase 2 표시 엔진(대상 복수선택·우선순위 공지>이벤트>광고·하루안보기 저장·공개 토글).
