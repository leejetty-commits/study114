# 368-보완5 — 교체 테스트를 실제 코드로 재작성 + 고민상담 문구

**브랜치:** `work/368-photo-autofit`  
**기준 HEAD:** `7af3628d`  
**날짜:** 2026-11-12  
**지시 원문:** `[368-보완5]` (복명 후 ㅇㅋ)

## 범위

- `scripts/verify-promo-replace-atomic.php` 재작성
- `concern/copy.js`, `concern/screens.js` 문구 2곳
- `src/` 운영 코드 변경 없음

## 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | 실제 `PromoImageService::uploadForRoom` 호출 (php-cgi 멀티파트) | PASS |
| 1a | 잘못된 파일 → bad_type, 기존 행·파일 유지 | PASS |
| 1b | `CREATE TRIGGER t_fail` → INSERT 실패 → ROLLBACK + 운영 cleanup(새 토큰 0건), finally DROP | PASS |
| 1c | 다른 방 id → `사진을 찾을 수 없습니다` | PASS |
| 2 | study114_dev 가드 · 테스트 id·토큰만 정리 · 시작 시 실제 행 삭제 제거 | PASS |
| 3 | 고민상담 「흐리게」→「작은 사진은 확대되어…그래도 올릴 수 있어요」 | PASS |
| 회귀 | verify-promo-exception-codes · verify-prime-contain-blur | PASS |
| SHOW TRIGGERS | study_room_images 트리거 없음 | PASS |

## 금지 준수

운영 코드 테스트 훅 없음 · 운영 DB 접속 없음 · merge/force push 없음 · CSP·.env·프로모 잠금 미수정.
