# 26 — 영카트 환경설정 → 우동공과 운영 설정 이식

**상태:** 1차 반영 + 프론트 노출 완료  
**작성:** 2026-07-18  
**근거:** `_sample/yc5.6.30/adm/admin.menu100.php` · `config_form.php` · `newwinlist.php` · `contentlist.php`  
**화면:** `#/admin/settings` (A28-09, 마스터 전용)

> 영카트 「환경설정」은 menu900(SMS)이 아니라 **menu100**이다.

---

## 이식한 편의성

| 영카트 | 우동공과 |
|--------|----------|
| 기본환경설정 앵커 1페이지 | 사이트·가입·알림·팝업·약관 앵커 |
| 팝업레이어 | 예약 팝업 (노출면·기간·다시 안 보기) |
| 내용관리 (약관) | 이용약관·개인정보 CMS |
| 메일 이벤트 on/off | 신고/문의/신규등록 알림 토글 |
| 회원가입 필드 정책 | 역할×항목 표시/강조 + 등록 창구 on/off |
| 관리권한 | 기존 A28-08b + settings 마스터 전용 |

## 프론트 노출 (Lab)

| 설정 | 노출 |
|------|------|
| 점검 모드 | 관리자 제외 전 화면 상단 빨간 배너 |
| 게스트 배너 | `#/guest` 만 |
| 예약 팝업 | 노출면(`guest_home`/`search`/`mypage`/`all`) + 기간 + N시간 다시 안 보기(localStorage) |

역할 홈(parent/tutor/study_room)은 팝업 기준 **검색(`search`)** 면으로 취급.

## 이식하지 않은 것

본인확인 벤더 · PG · SMS 게이트웨이 · 테마 · 파일 일괄삭제 · phpinfo · 포인트 경제

## 코드

- `preview/home-ui/src/admin/site-settings-store.js` — 설정 + `getActiveMaintenance` / `listActivePopupsForSurface` / `dismissPopup`
- `preview/home-ui/src/site-ops-chrome.js` — `mountOpsChrome` (main.js에서 관리자 외 렌더 후 호출)
- `a28-screens.js` `renderSettings`
- NAV `settings` · router `/admin/settings`
