# 26 — 영카트 환경설정 → 우동공과 운영 설정 이식

**상태:** 1차 반영 완료  
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

## 이식하지 않은 것

본인확인 벤더 · PG · SMS 게이트웨이 · 테마 · 파일 일괄삭제 · phpinfo · 포인트 경제

## 코드

- `preview/home-ui/src/admin/site-settings-store.js`
- `a28-screens.js` `renderSettings`
- NAV `settings` · router `/admin/settings`
