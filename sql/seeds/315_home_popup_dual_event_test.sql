-- =============================================================================
-- 315 — 홈 팝업 동시 2장 테스트 시드 (이벤트 2건)
-- 실행: 운영 phpMyAdmin에서 수동. Actions는 실행하지 않는다.
-- 롤백: 이 파일 하단의 DELETE 문 참고.
-- =============================================================================

USE study114;
SET NAMES utf8mb4;

-- 테스트 이벤트 A (sortOrder 10 = 앞)
INSERT INTO home_popups (type, family, audience, content, start_at, end_at, published, sort_order)
VALUES (
  'event', 'a', '["all"]',
  '{"kicker":"Test Dual A","title":"[테스트1] 이벤트 팝업 A","chip":"EVENT","body":"동시 2장 테스트용 첫 번째 이벤트입니다. 닫기 버튼으로만 닫히는지 확인하세요.","period":"기간 테스트","note":"테스트 · 삭제 예정","cta":"요금 보기","ctaHref":"#/plans"}',
  CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), 1, 10
);

-- 테스트 이벤트 B (sortOrder 20 = 뒤)
INSERT INTO home_popups (type, family, audience, content, start_at, end_at, published, sort_order)
VALUES (
  'event', 'a', '["all"]',
  '{"kicker":"Test Dual B","title":"[테스트2] 이벤트 팝업 B","chip":"EVENT","body":"동시 2장 테스트용 두 번째 이벤트입니다. 오너가 다른 배너를 열어 3장까지 확인합니다.","period":"기간 테스트","note":"테스트 · 삭제 예정","cta":"이용안내","ctaHref":"#/guide"}',
  CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), 1, 20
);

-- ─── 롤백 ───
-- DELETE FROM home_popups
-- WHERE JSON_UNQUOTE(JSON_EXTRACT(content, '$.title')) IN (
--   '[테스트1] 이벤트 팝업 A',
--   '[테스트2] 이벤트 팝업 B'
-- );
