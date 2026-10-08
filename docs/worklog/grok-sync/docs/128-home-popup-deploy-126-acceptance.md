# 128 · 홈 팝업 배포(티켓 126) 수락

- 판정: **조건부 수락** (마스터 로그인 스모크만 미완)
- push: `5c12a5d` → `8eaf74d` (커밋 6개 fast-forward)
- Actions: Deploy to dothome **#335** success (verify:shop-page · board-acl · tutor-inquiries-settings · ftp-deploy)
- 로컬 build:dothome 없음 · 새 커밋 없음 · 잔여물 미커밋 유지

## 통과
1. 공개 `GET /api/home-popups.php` → `{"ok":true,"popups":[]}`
2. 비로그인 `#/guest` 팝업 없음 · 홈 로드 정상
3. 부마스터 `/?popupDemo` 6조합 preview + 스위치
4. 비로그인 admin API → 401 (본문은 서버 HTML Unauthorized — PHP JSON이 아님. 동작상 차단은 OK)
5. 부마스터 admin popups → 403 「부마스터는 이 메뉴에 접근할 수 없습니다」 / 「접근이 거부되었습니다」 — masterOnly 의도대로
6. 번들에 home-popups.php · popupDemo · popupPreviewId 포함

## 미완 (사용자·마스터 세션 필요)
- 마스터(jetty@naver.com)로 `#/admin/settings/popups` 공지 생성 → 홈 미리보기 → 손님엔 안 뜸 → 삭제 → 0건
- ops@dev.local은 부마스터라 이 메뉴·저장 스모크 불가 (의도)

## 운영 메모
- phpMyAdmin `home_popups` 표는 사용자가 push 전 생성했다고 전제(126 §1). 공개 API가 ok+[]이므로 표는 존재.
- 스모크에서 운영 행을 만들지 않음 → 0건 유지.
