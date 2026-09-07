-- 062 적용 전·후 dry-run. 운영에서 실행하지 않는다. SELECT만.
-- 적용 전: provider_type 컬럼이 없으면 아래 일부는 실패하므로 스크립트가 분기한다.

SELECT COUNT(*) AS pack_total FROM provider_ticket_packs;

SELECT source, COUNT(*) AS cnt
FROM provider_ticket_packs
GROUP BY source;

-- 적용 후 전용
SELECT
  COUNT(*) AS pack_total,
  SUM(provider_id IS NOT NULL) AS backfilled_or_new,
  SUM(provider_id IS NULL) AS still_null
FROM provider_ticket_packs;

SELECT COUNT(*) AS ambiguous_multi_profile
FROM provider_ticket_packs p
WHERE p.provider_id IS NULL
  AND (
    (SELECT COUNT(*) FROM tutors t WHERE t.user_id = p.user_id) > 0
    AND (SELECT COUNT(*) FROM study_rooms r WHERE r.user_id = p.user_id AND r.deleted_at IS NULL) > 0
  );

SELECT COUNT(*) AS single_profile_still_null
FROM provider_ticket_packs p
WHERE p.provider_id IS NULL
  AND NOT (
    (SELECT COUNT(*) FROM tutors t WHERE t.user_id = p.user_id) > 0
    AND (SELECT COUNT(*) FROM study_rooms r WHERE r.user_id = p.user_id AND r.deleted_at IS NULL) > 0
  );

-- 운영 적용 전 수동 보정 목록 (복제·임의 배정 금지)
SELECT p.id, p.user_id, p.ticket_type, p.pack_size, p.remaining, p.source, p.expires_at,
       (SELECT COUNT(*) FROM tutors t WHERE t.user_id = p.user_id) AS tutor_count,
       (SELECT COUNT(*) FROM study_rooms r WHERE r.user_id = p.user_id AND r.deleted_at IS NULL) AS room_count
FROM provider_ticket_packs p
WHERE p.provider_id IS NULL
ORDER BY p.user_id, p.id;
