# 16. 오픈 전 데이터 무결성 점검 SQL (읽기 전용)

작성: 우동공과3 (2026-11-18). 코드 변경 없음. 문서만.
기준 스키마: `origin/main` `defd0016`의 `sql/schema/*.sql` + `src/` PHP 안의 CREATE/ALTER.
추가 반영: `study_room_classes.monthly_fee_amount INT UNSIGNED NULL` (2026-11-18 종현 실행, 저장소 마이그레이션에는 아직 없음).

## 먼저 읽기

- **모두 SELECT만 있다.** INSERT·UPDATE·DELETE·ALTER·CREATE는 하나도 없다.
- dothome phpMyAdmin → `study114` DB → SQL 탭에서 실행한다 (MySQL 8).
- **0번부터 차례로** 실행한다. 0번에서 행이 나오면, 그 컬럼을 쓰는 점검은 오류가 나므로 건너뛴다.
- 한 번에 한 묶음(예: A 묶음 전체)씩 붙여넣는다. phpMyAdmin이 결과를 문장마다 따로 보여 준다.
- 결과는 개수와 id만 나온다. 이름·전화·이메일은 나오지 않는다. 그래도 결과를 외부 AI에 붙이지 말고 **봇에게만** 보내 준다.
- 보낼 때는 `점검번호: 결과` 형태로 적어 주면 된다. 예: `A1: 0`, `E3: 2 (id 12, 40)`.
- 「기대」가 0인데 0이 아니면 고칠 거리다. 「참고」는 숫자만 보고 봇이 판단한다.
- 고치는 SQL은 결과를 보고 봇이 따로 쓴다. 여기서는 아무것도 고치지 않는다.

순서: 0 → A(고아 행) → B(역할·프로필) → C(지역) → D(유료·결제) → E(쪽지) → F(금액) → G(중복 계정) → H(테스트 데이터).

---

## 0. 컬럼 존재 확인

목적: 아래 점검이 쓰는 테이블·컬럼이 운영 DB에 다 있는지 본다.
기대: **0행.** 행이 나오면 그 목록을 그대로 보내 준다.

```sql
SELECT x.t AS missing_table, x.c AS missing_column
FROM (
  SELECT 'users' t, 'id' c UNION ALL SELECT 'users','email' UNION ALL SELECT 'users','status'
  UNION ALL SELECT 'users','deleted_at' UNION ALL SELECT 'users','oauth_role_pending'
  UNION ALL SELECT 'user_roles','user_id' UNION ALL SELECT 'user_roles','role_type'
  UNION ALL SELECT 'user_roles','status' UNION ALL SELECT 'user_roles','is_primary'
  UNION ALL SELECT 'user_profiles','user_id' UNION ALL SELECT 'user_profiles','default_region_id'
  UNION ALL SELECT 'user_oauth_accounts','user_id' UNION ALL SELECT 'user_oauth_accounts','provider'
  UNION ALL SELECT 'user_oauth_accounts','provider_user_id'
  UNION ALL SELECT 'study_rooms','id' UNION ALL SELECT 'study_rooms','user_id'
  UNION ALL SELECT 'study_rooms','deleted_at' UNION ALL SELECT 'study_rooms','profile_status'
  UNION ALL SELECT 'study_rooms','study_room_name' UNION ALL SELECT 'study_rooms','region_id'
  UNION ALL SELECT 'study_rooms','price_amount' UNION ALL SELECT 'study_rooms','career_years'
  UNION ALL SELECT 'tutors','id' UNION ALL SELECT 'tutors','user_id' UNION ALL SELECT 'tutors','profile_status'
  UNION ALL SELECT 'tutors','tutor_display_name' UNION ALL SELECT 'tutors','preferred_fee_amount'
  UNION ALL SELECT 'students','id' UNION ALL SELECT 'students','guardian_user_id'
  UNION ALL SELECT 'students','exposure_status' UNION ALL SELECT 'students','deleted_at'
  UNION ALL SELECT 'students','public_display_name' UNION ALL SELECT 'students','request_title'
  UNION ALL SELECT 'students','preferred_studyroom_region_id' UNION ALL SELECT 'students','preferred_tutor_region_id'
  UNION ALL SELECT 'students','preferred_tutor_region_extra_id' UNION ALL SELECT 'students','preferred_studyroom_region_extra_id'
  UNION ALL SELECT 'students','preferred_fee_amount' UNION ALL SELECT 'students','preferred_studyroom_fee_amount'
  UNION ALL SELECT 'regions','id' UNION ALL SELECT 'regions','sido_code' UNION ALL SELECT 'regions','sigungu_code'
  UNION ALL SELECT 'regions','is_active'
  UNION ALL SELECT 'complexes','id' UNION ALL SELECT 'complexes','region_id'
  UNION ALL SELECT 'study_room_regions','study_room_id' UNION ALL SELECT 'study_room_regions','slot'
  UNION ALL SELECT 'study_room_regions','region_id' UNION ALL SELECT 'study_room_regions','complex_id'
  UNION ALL SELECT 'study_room_regions','region_basis_type'
  UNION ALL SELECT 'tutor_regions','tutor_id' UNION ALL SELECT 'tutor_regions','region_id'
  UNION ALL SELECT 'study_room_classes','study_room_id' UNION ALL SELECT 'study_room_classes','monthly_fee'
  UNION ALL SELECT 'study_room_classes','monthly_fee_amount'
  UNION ALL SELECT 'study_room_price_items','study_room_id'
  UNION ALL SELECT 'study_room_images','study_room_id' UNION ALL SELECT 'study_room_facilities','study_room_id'
  UNION ALL SELECT 'study_room_subject_targets','study_room_id' UNION ALL SELECT 'study_room_badges','study_room_id'
  UNION ALL SELECT 'study_room_primary_audiences','study_room_id'
  UNION ALL SELECT 'study_room_verification_documents','study_room_id'
  UNION ALL SELECT 'study_room_exposure_assignments','study_room_id' UNION ALL SELECT 'study_room_exposure_assignments','exposure_status'
  UNION ALL SELECT 'study_room_exposure_assignments','payment_status' UNION ALL SELECT 'study_room_exposure_assignments','ends_at'
  UNION ALL SELECT 'study_room_exposure_assignments','exposure_type'
  UNION ALL SELECT 'study_room_exposure_waitlists','study_room_id'
  UNION ALL SELECT 'tutor_images','tutor_id' UNION ALL SELECT 'tutor_subject_targets','tutor_id'
  UNION ALL SELECT 'tutor_lesson_places','tutor_id' UNION ALL SELECT 'tutor_teaching_style_badges','tutor_id'
  UNION ALL SELECT 'tutor_verification_documents','tutor_id'
  UNION ALL SELECT 'student_subject_targets','student_id' UNION ALL SELECT 'student_preferred_lesson_places','student_id'
  UNION ALL SELECT 'student_preferred_teaching_style_badges','student_id'
  UNION ALL SELECT 'user_favorites','target_type' UNION ALL SELECT 'user_favorites','target_id'
  UNION ALL SELECT 'user_compare_items','target_type' UNION ALL SELECT 'user_compare_items','target_id'
  UNION ALL SELECT 'user_recommendations','target_type' UNION ALL SELECT 'user_recommendations','target_id'
  UNION ALL SELECT 'provider_reviews','provider_type' UNION ALL SELECT 'provider_reviews','provider_id'
  UNION ALL SELECT 'provider_request_unlocks','student_id' UNION ALL SELECT 'provider_request_unlocks','provider_user_id'
  UNION ALL SELECT 'provider_payment_orders','order_ref' UNION ALL SELECT 'provider_payment_orders','user_id'
  UNION ALL SELECT 'provider_payment_orders','product_id' UNION ALL SELECT 'provider_payment_orders','variant_label'
  UNION ALL SELECT 'provider_payment_orders','product_kind' UNION ALL SELECT 'provider_payment_orders','amount_won'
  UNION ALL SELECT 'provider_payment_orders','list_price_won' UNION ALL SELECT 'provider_payment_orders','status'
  UNION ALL SELECT 'provider_payment_orders','pg_provider' UNION ALL SELECT 'provider_payment_orders','pg_payment_id'
  UNION ALL SELECT 'provider_payment_orders','paid_at' UNION ALL SELECT 'provider_payment_orders','provider_type'
  UNION ALL SELECT 'provider_payment_orders','provider_id'
  UNION ALL SELECT 'provider_refund_requests','order_ref' UNION ALL SELECT 'provider_refund_requests','status'
  UNION ALL SELECT 'provider_refund_requests','refund_won' UNION ALL SELECT 'provider_refund_requests','amount_won'
  UNION ALL SELECT 'provider_position_subscriptions','user_id' UNION ALL SELECT 'provider_position_subscriptions','sku_code'
  UNION ALL SELECT 'provider_position_subscriptions','end_exclusive_on' UNION ALL SELECT 'provider_position_subscriptions','source'
  UNION ALL SELECT 'provider_position_subscriptions','provider_type' UNION ALL SELECT 'provider_position_subscriptions','provider_id'
  UNION ALL SELECT 'provider_position_subscriptions','region_basis_type' UNION ALL SELECT 'provider_position_subscriptions','region_id'
  UNION ALL SELECT 'provider_paid_badges','source_order_ref' UNION ALL SELECT 'provider_paid_badges','status'
  UNION ALL SELECT 'provider_paid_badges','end_exclusive_on' UNION ALL SELECT 'provider_paid_badges','provider_type'
  UNION ALL SELECT 'provider_paid_badges','provider_id'
  UNION ALL SELECT 'provider_paid_badges','badge_code'
  UNION ALL SELECT 'provider_ticket_packs','source_order_ref' UNION ALL SELECT 'provider_ticket_packs','remaining'
  UNION ALL SELECT 'provider_ticket_packs','pack_size' UNION ALL SELECT 'provider_ticket_packs','expires_at'
  UNION ALL SELECT 'provider_ticket_packs','user_id'
  UNION ALL SELECT 'provider_immediate_memo_intents','order_ref' UNION ALL SELECT 'provider_immediate_memo_intents','thread_id'
  UNION ALL SELECT 'provider_pg_cancel_ops_log','order_ref'
  UNION ALL SELECT 'message_threads','participant_low_user_id' UNION ALL SELECT 'message_threads','participant_high_user_id'
  UNION ALL SELECT 'message_threads','initiated_by_user_id' UNION ALL SELECT 'message_threads','context_kind'
  UNION ALL SELECT 'message_threads','context_id'
  UNION ALL SELECT 'messages','thread_id' UNION ALL SELECT 'messages','sender_user_id'
  UNION ALL SELECT 'message_thread_reads','thread_id' UNION ALL SELECT 'message_thread_reads','user_id'
  UNION ALL SELECT 'message_thread_participant_state','thread_id' UNION ALL SELECT 'message_thread_participant_state','user_id'
  UNION ALL SELECT 'message_attachments','message_id' UNION ALL SELECT 'message_attachments','thread_id'
  UNION ALL SELECT 'quick_match_dispatches','thread_id' UNION ALL SELECT 'quick_match_dispatches','student_id'
  UNION ALL SELECT 'home_popups','content' UNION ALL SELECT 'home_popups','published'
  UNION ALL SELECT 'board_posts','title' UNION ALL SELECT 'board_posts','status'
) x
LEFT JOIN information_schema.COLUMNS ic
  ON ic.TABLE_SCHEMA = DATABASE() AND ic.TABLE_NAME = x.t AND ic.COLUMN_NAME = x.c
WHERE ic.COLUMN_NAME IS NULL;
```

---

## A. 고아 행 (부모가 없는 자식 행)

### A1. 회원이 없는 회원 하위 행
목적: 지워진 회원을 가리키는 역할·프로필·소셜 연동·공부방·과외쌤·학생 행.
기대: 모든 줄 0.

```sql
SELECT 'user_roles' AS tbl, COUNT(*) AS cnt FROM user_roles x LEFT JOIN users u ON u.id = x.user_id WHERE u.id IS NULL
UNION ALL SELECT 'user_profiles', COUNT(*) FROM user_profiles x LEFT JOIN users u ON u.id = x.user_id WHERE u.id IS NULL
UNION ALL SELECT 'user_oauth_accounts', COUNT(*) FROM user_oauth_accounts x LEFT JOIN users u ON u.id = x.user_id WHERE u.id IS NULL
UNION ALL SELECT 'study_rooms', COUNT(*) FROM study_rooms x LEFT JOIN users u ON u.id = x.user_id WHERE u.id IS NULL
UNION ALL SELECT 'tutors', COUNT(*) FROM tutors x LEFT JOIN users u ON u.id = x.user_id WHERE u.id IS NULL
UNION ALL SELECT 'students', COUNT(*) FROM students x LEFT JOIN users u ON u.id = x.guardian_user_id WHERE u.id IS NULL;
```

### A2. 공부방이 없는 공부방 하위 행
목적: 지워진 공부방을 가리키는 수업·사진·지역·노출 행.
기대: 모든 줄 0.

```sql
SELECT 'study_room_classes' AS tbl, COUNT(*) AS cnt FROM study_room_classes x LEFT JOIN study_rooms s ON s.id = x.study_room_id WHERE s.id IS NULL
UNION ALL SELECT 'study_room_price_items', COUNT(*) FROM study_room_price_items x LEFT JOIN study_rooms s ON s.id = x.study_room_id WHERE s.id IS NULL
UNION ALL SELECT 'study_room_images', COUNT(*) FROM study_room_images x LEFT JOIN study_rooms s ON s.id = x.study_room_id WHERE s.id IS NULL
UNION ALL SELECT 'study_room_regions', COUNT(*) FROM study_room_regions x LEFT JOIN study_rooms s ON s.id = x.study_room_id WHERE s.id IS NULL
UNION ALL SELECT 'study_room_facilities', COUNT(*) FROM study_room_facilities x LEFT JOIN study_rooms s ON s.id = x.study_room_id WHERE s.id IS NULL
UNION ALL SELECT 'study_room_subject_targets', COUNT(*) FROM study_room_subject_targets x LEFT JOIN study_rooms s ON s.id = x.study_room_id WHERE s.id IS NULL
UNION ALL SELECT 'study_room_badges', COUNT(*) FROM study_room_badges x LEFT JOIN study_rooms s ON s.id = x.study_room_id WHERE s.id IS NULL
UNION ALL SELECT 'study_room_primary_audiences', COUNT(*) FROM study_room_primary_audiences x LEFT JOIN study_rooms s ON s.id = x.study_room_id WHERE s.id IS NULL
UNION ALL SELECT 'study_room_verification_documents', COUNT(*) FROM study_room_verification_documents x LEFT JOIN study_rooms s ON s.id = x.study_room_id WHERE s.id IS NULL
UNION ALL SELECT 'study_room_exposure_assignments', COUNT(*) FROM study_room_exposure_assignments x LEFT JOIN study_rooms s ON s.id = x.study_room_id WHERE s.id IS NULL
UNION ALL SELECT 'study_room_exposure_waitlists', COUNT(*) FROM study_room_exposure_waitlists x LEFT JOIN study_rooms s ON s.id = x.study_room_id WHERE s.id IS NULL;
```

### A3. 과외쌤이 없는 과외쌤 하위 행
기대: 모든 줄 0.

```sql
SELECT 'tutor_images' AS tbl, COUNT(*) AS cnt FROM tutor_images x LEFT JOIN tutors t ON t.id = x.tutor_id WHERE t.id IS NULL
UNION ALL SELECT 'tutor_regions', COUNT(*) FROM tutor_regions x LEFT JOIN tutors t ON t.id = x.tutor_id WHERE t.id IS NULL
UNION ALL SELECT 'tutor_subject_targets', COUNT(*) FROM tutor_subject_targets x LEFT JOIN tutors t ON t.id = x.tutor_id WHERE t.id IS NULL
UNION ALL SELECT 'tutor_lesson_places', COUNT(*) FROM tutor_lesson_places x LEFT JOIN tutors t ON t.id = x.tutor_id WHERE t.id IS NULL
UNION ALL SELECT 'tutor_teaching_style_badges', COUNT(*) FROM tutor_teaching_style_badges x LEFT JOIN tutors t ON t.id = x.tutor_id WHERE t.id IS NULL
UNION ALL SELECT 'tutor_verification_documents', COUNT(*) FROM tutor_verification_documents x LEFT JOIN tutors t ON t.id = x.tutor_id WHERE t.id IS NULL;
```

### A4. 학생이 없는 학생 하위 행
기대: 모든 줄 0.

```sql
SELECT 'student_subject_targets' AS tbl, COUNT(*) AS cnt FROM student_subject_targets x LEFT JOIN students st ON st.id = x.student_id WHERE st.id IS NULL
UNION ALL SELECT 'student_preferred_lesson_places', COUNT(*) FROM student_preferred_lesson_places x LEFT JOIN students st ON st.id = x.student_id WHERE st.id IS NULL
UNION ALL SELECT 'student_preferred_teaching_style_badges', COUNT(*) FROM student_preferred_teaching_style_badges x LEFT JOIN students st ON st.id = x.student_id WHERE st.id IS NULL
UNION ALL SELECT 'provider_request_unlocks', COUNT(*) FROM provider_request_unlocks x LEFT JOIN students st ON st.id = x.student_id WHERE st.id IS NULL
UNION ALL SELECT 'quick_match_dispatches', COUNT(*) FROM quick_match_dispatches x LEFT JOIN students st ON st.id = x.student_id WHERE st.id IS NULL;
```

### A5. 찜·비교·추천·후기가 가리키는 대상이 없음
목적: 대상 공부방·과외쌤이 지워졌는데 남은 행. 화면에 빈 카드가 뜰 수 있다.
기대: 모든 줄 0.

```sql
SELECT 'user_favorites' AS tbl, COUNT(*) AS cnt FROM user_favorites x
  LEFT JOIN study_rooms s ON x.target_type = 'study_room' AND s.id = x.target_id
  LEFT JOIN tutors t ON x.target_type = 'tutor' AND t.id = x.target_id
  WHERE s.id IS NULL AND t.id IS NULL
UNION ALL SELECT 'user_compare_items', COUNT(*) FROM user_compare_items x
  LEFT JOIN study_rooms s ON x.target_type = 'study_room' AND s.id = x.target_id
  LEFT JOIN tutors t ON x.target_type = 'tutor' AND t.id = x.target_id
  WHERE s.id IS NULL AND t.id IS NULL
UNION ALL SELECT 'user_recommendations', COUNT(*) FROM user_recommendations x
  LEFT JOIN study_rooms s ON x.target_type = 'study_room' AND s.id = x.target_id
  LEFT JOIN tutors t ON x.target_type = 'tutor' AND t.id = x.target_id
  WHERE s.id IS NULL AND t.id IS NULL
UNION ALL SELECT 'provider_reviews', COUNT(*) FROM provider_reviews x
  LEFT JOIN study_rooms s ON x.provider_type = 'study_room' AND s.id = x.provider_id
  LEFT JOIN tutors t ON x.provider_type = 'tutor' AND t.id = x.provider_id
  WHERE s.id IS NULL AND t.id IS NULL;
```

### A6. 유료 기록이 가리키는 회원·공부방·과외쌤이 없음
목적: 주문·구독·배지·쪽지권이 지워진 회원이나 프로필을 가리키는지 본다. 회원 삭제 때 `user_id`를 비우고 익명 보관하는 주문·구독은 정상이라 `user_id IS NULL`은 뺀다.
기대: 모든 줄 0.

```sql
SELECT 'orders_user' AS chk, COUNT(*) AS cnt FROM provider_payment_orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.user_id IS NOT NULL AND u.id IS NULL
UNION ALL SELECT 'positions_user', COUNT(*) FROM provider_position_subscriptions p LEFT JOIN users u ON u.id = p.user_id WHERE p.user_id IS NOT NULL AND u.id IS NULL
UNION ALL SELECT 'ticket_packs_user', COUNT(*) FROM provider_ticket_packs k LEFT JOIN users u ON u.id = k.user_id WHERE u.id IS NULL
UNION ALL SELECT 'positions_provider', COUNT(*) FROM provider_position_subscriptions p
  LEFT JOIN study_rooms s ON p.provider_type = 'study_room' AND s.id = p.provider_id
  LEFT JOIN tutors t ON p.provider_type = 'tutor' AND t.id = p.provider_id
  WHERE p.provider_id IS NOT NULL AND s.id IS NULL AND t.id IS NULL
UNION ALL SELECT 'badges_provider', COUNT(*) FROM provider_paid_badges b
  LEFT JOIN study_rooms s ON b.provider_type = 'study_room' AND s.id = b.provider_id
  LEFT JOIN tutors t ON b.provider_type = 'tutor' AND t.id = b.provider_id
  WHERE s.id IS NULL AND t.id IS NULL;
```

A 묶음에서 0이 아닌 줄이 있으면, 그 줄 이름을 알려 주면 id 목록 SELECT를 따로 준다.

---

## B. 역할과 프로필

### B1. 역할·프로필 개수 요약
목적: 역할만 있고 프로필이 없는 회원, 프로필만 있고 역할이 없는 회원 수.
기대: `*_no_role` 줄은 0. `*_no_profile` 줄은 **참고**(가입 후 아직 등록 안 한 회원이면 정상).

```sql
SELECT 'room_role_no_profile' AS chk, COUNT(*) AS cnt FROM user_roles r
  WHERE r.role_type = 'study_room_owner' AND r.status = 'active'
    AND NOT EXISTS (SELECT 1 FROM study_rooms s WHERE s.user_id = r.user_id AND s.deleted_at IS NULL)
UNION ALL SELECT 'room_profile_no_role', COUNT(*) FROM study_rooms s
  WHERE s.deleted_at IS NULL
    AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = s.user_id AND r.role_type = 'study_room_owner' AND r.status = 'active')
UNION ALL SELECT 'tutor_role_no_profile', COUNT(*) FROM user_roles r
  WHERE r.role_type = 'tutor' AND r.status = 'active'
    AND NOT EXISTS (SELECT 1 FROM tutors t WHERE t.user_id = r.user_id)
UNION ALL SELECT 'tutor_profile_no_role', COUNT(*) FROM tutors t
  WHERE NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = t.user_id AND r.role_type = 'tutor' AND r.status = 'active')
UNION ALL SELECT 'student_role_no_profile', COUNT(*) FROM user_roles r
  WHERE r.role_type = 'guardian_student' AND r.status = 'active'
    AND NOT EXISTS (SELECT 1 FROM students st WHERE st.guardian_user_id = r.user_id AND st.deleted_at IS NULL)
UNION ALL SELECT 'student_profile_no_role', COUNT(*) FROM students st
  WHERE st.deleted_at IS NULL
    AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = st.guardian_user_id AND r.role_type = 'guardian_student' AND r.status = 'active');
```

### B2. 위 `*_no_role` 상세 (id만)
기대: 0행.

```sql
SELECT 'room_profile_no_role' AS chk, s.id AS profile_id, s.user_id FROM study_rooms s
  WHERE s.deleted_at IS NULL
    AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = s.user_id AND r.role_type = 'study_room_owner' AND r.status = 'active')
UNION ALL SELECT 'tutor_profile_no_role', t.id, t.user_id FROM tutors t
  WHERE NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = t.user_id AND r.role_type = 'tutor' AND r.status = 'active')
UNION ALL SELECT 'student_profile_no_role', st.id, st.guardian_user_id FROM students st
  WHERE st.deleted_at IS NULL
    AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = st.guardian_user_id AND r.role_type = 'guardian_student' AND r.status = 'active')
LIMIT 50;
```

### B3. 중복 프로필
목적: 한 회원에게 살아 있는 공부방이 2개 이상, 과외쌤 프로필이 2개 이상인 경우.
기대: 0행.

```sql
SELECT 'study_room' AS kind, user_id, COUNT(*) AS cnt, GROUP_CONCAT(id ORDER BY id) AS ids
  FROM study_rooms WHERE deleted_at IS NULL GROUP BY user_id HAVING COUNT(*) > 1
UNION ALL
SELECT 'tutor', user_id, COUNT(*), GROUP_CONCAT(id ORDER BY id)
  FROM tutors GROUP BY user_id HAVING COUNT(*) > 1
LIMIT 50;
```

### B4. 역할 행 이상
목적: 활성 회원인데 역할이 하나도 없음(역할 선택 대기 제외), 대표 역할이 2개 이상, 프로필 행(`user_profiles`)이 없음.
기대: `no_role`·`multi_primary`는 0. `no_user_profile`은 **참고**(소셜 가입 직후면 있을 수 있음).

```sql
SELECT 'no_role' AS chk, COUNT(*) AS cnt FROM users u
  WHERE u.status = 'active' AND u.oauth_role_pending = 0
    AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = u.id)
UNION ALL SELECT 'multi_primary', COUNT(*) FROM (
  SELECT user_id FROM user_roles WHERE is_primary = 1 AND status = 'active' GROUP BY user_id HAVING COUNT(*) > 1
) z
UNION ALL SELECT 'no_user_profile', COUNT(*) FROM users u
  WHERE u.status = 'active' AND NOT EXISTS (SELECT 1 FROM user_profiles p WHERE p.user_id = u.id);
```

### B5. 탈퇴·차단 회원인데 공개 중인 프로필
목적: 화면에 보이면 안 되는 프로필이 공개 상태로 남았는지 본다.
기대: 0행.

```sql
SELECT 'study_room' AS kind, s.id AS profile_id, u.id AS user_id, u.status FROM study_rooms s JOIN users u ON u.id = s.user_id
  WHERE s.profile_status = 'published' AND s.deleted_at IS NULL AND u.status IN ('withdrawn', 'blocked')
UNION ALL SELECT 'tutor', t.id, u.id, u.status FROM tutors t JOIN users u ON u.id = t.user_id
  WHERE t.profile_status = 'published' AND u.status IN ('withdrawn', 'blocked')
UNION ALL SELECT 'student', st.id, u.id, u.status FROM students st JOIN users u ON u.id = st.guardian_user_id
  WHERE st.exposure_status = 'published' AND st.deleted_at IS NULL AND u.status IN ('withdrawn', 'blocked')
LIMIT 50;
```

---

## C. 지역

### C1. 없는 지역 id를 가리킴
목적: `regions`에 없는 id를 쓰는 행.
기대: 모든 줄 0.

```sql
SELECT 'study_rooms.region_id' AS chk, COUNT(*) AS cnt FROM study_rooms x LEFT JOIN regions g ON g.id = x.region_id WHERE x.region_id IS NOT NULL AND g.id IS NULL
UNION ALL SELECT 'study_room_regions.region_id', COUNT(*) FROM study_room_regions x LEFT JOIN regions g ON g.id = x.region_id WHERE g.id IS NULL
UNION ALL SELECT 'tutor_regions.region_id', COUNT(*) FROM tutor_regions x LEFT JOIN regions g ON g.id = x.region_id WHERE g.id IS NULL
UNION ALL SELECT 'students.preferred_studyroom_region_id', COUNT(*) FROM students x LEFT JOIN regions g ON g.id = x.preferred_studyroom_region_id WHERE x.preferred_studyroom_region_id IS NOT NULL AND g.id IS NULL
UNION ALL SELECT 'students.preferred_tutor_region_id', COUNT(*) FROM students x LEFT JOIN regions g ON g.id = x.preferred_tutor_region_id WHERE x.preferred_tutor_region_id IS NOT NULL AND g.id IS NULL
UNION ALL SELECT 'students.preferred_studyroom_region_extra_id', COUNT(*) FROM students x LEFT JOIN regions g ON g.id = x.preferred_studyroom_region_extra_id WHERE x.preferred_studyroom_region_extra_id IS NOT NULL AND g.id IS NULL
UNION ALL SELECT 'students.preferred_tutor_region_extra_id', COUNT(*) FROM students x LEFT JOIN regions g ON g.id = x.preferred_tutor_region_extra_id WHERE x.preferred_tutor_region_extra_id IS NOT NULL AND g.id IS NULL
UNION ALL SELECT 'user_profiles.default_region_id', COUNT(*) FROM user_profiles x LEFT JOIN regions g ON g.id = x.default_region_id WHERE x.default_region_id IS NOT NULL AND g.id IS NULL
UNION ALL SELECT 'positions.region_id', COUNT(*) FROM provider_position_subscriptions x LEFT JOIN regions g ON g.id = x.region_id WHERE x.region_id IS NOT NULL AND g.id IS NULL
UNION ALL SELECT 'complexes.region_id', COUNT(*) FROM complexes x LEFT JOIN regions g ON g.id = x.region_id WHERE g.id IS NULL;
```

### C2. 공개 공부방의 지역 빠짐
목적: 공개 중인데 사업장 동(`study_rooms.region_id`)이 비었거나 홍보지역 1이 없는 공부방. 공개 과외쌤인데 지역이 하나도 없는 경우.
기대: 모든 줄 0.

```sql
SELECT 'room_no_biz_region' AS chk, COUNT(*) AS cnt FROM study_rooms s
  WHERE s.profile_status = 'published' AND s.deleted_at IS NULL AND s.region_id IS NULL
UNION ALL SELECT 'room_no_promo_slot1', COUNT(*) FROM study_rooms s
  WHERE s.profile_status = 'published' AND s.deleted_at IS NULL
    AND NOT EXISTS (SELECT 1 FROM study_room_regions sr WHERE sr.study_room_id = s.id AND sr.slot = 1)
UNION ALL SELECT 'tutor_no_region', COUNT(*) FROM tutors t
  WHERE t.profile_status = 'published'
    AND NOT EXISTS (SELECT 1 FROM tutor_regions tr WHERE tr.tutor_id = t.id);
```

### C3. C2 상세 (id만)
기대: 0행.

```sql
SELECT 'room_no_biz_region' AS chk, s.id FROM study_rooms s
  WHERE s.profile_status = 'published' AND s.deleted_at IS NULL AND s.region_id IS NULL
UNION ALL SELECT 'room_no_promo_slot1', s.id FROM study_rooms s
  WHERE s.profile_status = 'published' AND s.deleted_at IS NULL
    AND NOT EXISTS (SELECT 1 FROM study_room_regions sr WHERE sr.study_room_id = s.id AND sr.slot = 1)
UNION ALL SELECT 'tutor_no_region', t.id FROM tutors t
  WHERE t.profile_status = 'published'
    AND NOT EXISTS (SELECT 1 FROM tutor_regions tr WHERE tr.tutor_id = t.id)
LIMIT 50;
```

### C4. 홍보지역 칸 이상
목적: 칸 번호가 1~3 밖, 단지 기준인데 단지가 비었거나 없는 단지, 단지의 동과 칸의 동이 다름.
기대: 모든 줄 0.

```sql
SELECT 'slot_out_of_range' AS chk, COUNT(*) AS cnt FROM study_room_regions WHERE slot NOT IN (1, 2, 3)
UNION ALL SELECT 'complex_basis_no_complex', COUNT(*) FROM study_room_regions WHERE region_basis_type = 'complex' AND complex_id IS NULL
UNION ALL SELECT 'complex_missing', COUNT(*) FROM study_room_regions sr LEFT JOIN complexes c ON c.id = sr.complex_id WHERE sr.complex_id IS NOT NULL AND c.id IS NULL
UNION ALL SELECT 'complex_region_mismatch', COUNT(*) FROM study_room_regions sr JOIN complexes c ON c.id = sr.complex_id WHERE c.region_id <> sr.region_id;
```

### C5. 홍보지역 2·3이 사업장 시군구 밖 (참고)
목적: 사업장 동과 홍보지역 2·3의 시도·시군구가 다른 공부방 수. 저장소에 「시군구 안이어야 한다」는 잠긴 규칙은 찾지 못했다. 숫자만 보고 판단한다.
기대: **참고.**

```sql
SELECT
  SUM(rb.sido_code <> rp.sido_code) AS diff_sido_cnt,
  SUM(rb.sido_code = rp.sido_code AND rb.sigungu_code <> rp.sigungu_code) AS diff_sigungu_cnt,
  COUNT(*) AS slot23_total
FROM study_room_regions sr
JOIN study_rooms s ON s.id = sr.study_room_id AND s.deleted_at IS NULL
JOIN regions rb ON rb.id = s.region_id
JOIN regions rp ON rp.id = sr.region_id
WHERE sr.slot IN (2, 3);

SELECT s.id AS study_room_id, sr.slot
FROM study_room_regions sr
JOIN study_rooms s ON s.id = sr.study_room_id AND s.deleted_at IS NULL
JOIN regions rb ON rb.id = s.region_id
JOIN regions rp ON rp.id = sr.region_id
WHERE sr.slot IN (2, 3)
  AND (rb.sido_code <> rp.sido_code OR rb.sigungu_code <> rp.sigungu_code)
ORDER BY s.id, sr.slot
LIMIT 50;
```

### C6. 비활성 지역을 쓰는 행 (참고)
목적: `regions.is_active = 0`인 지역을 홍보지역·과외 지역으로 쓰는 행.
기대: **참고**(0이 좋다).

```sql
SELECT 'study_room_regions' AS chk, COUNT(*) AS cnt FROM study_room_regions x JOIN regions g ON g.id = x.region_id WHERE g.is_active = 0
UNION ALL SELECT 'tutor_regions', COUNT(*) FROM tutor_regions x JOIN regions g ON g.id = x.region_id WHERE g.is_active = 0;
```

---

## D. 유료상품·결제

참고: 상품 목록(이름·가격)은 DB가 아니라 코드(`src/Paid/PaidCatalog.php`)에 있다. 그래서 「TEST 상품이 화면에 보이는지」는 SQL로 못 본다. 여기서는 **주문 기록**에 남은 테스트·0원 흔적을 본다.

### D1. 주문 요약
목적: 결제 경로(`pg_provider`)·상태별 주문 수. 운영에 `dev_mock` 주문이 있으면 테스트 결제가 섞인 것이다.
기대: **참고.** `dev_mock` 줄은 오픈 전 정리 대상.

```sql
SELECT pg_provider, status, COUNT(*) AS cnt, SUM(amount_won) AS sum_won
FROM provider_payment_orders
GROUP BY pg_provider, status
ORDER BY pg_provider, status;
```

### D2. 테스트 이름·0원 주문
목적: 상품 id·옵션 이름에 test가 들어간 주문, 0원 주문(포트원 심사에서 걸림).
기대: 모든 줄 0.

```sql
SELECT 'test_named' AS chk, COUNT(*) AS cnt FROM provider_payment_orders
  WHERE LOWER(product_id) LIKE '%test%' OR LOWER(variant_label) LIKE '%test%' OR variant_label LIKE '%테스트%'
UNION ALL SELECT 'zero_won', COUNT(*) FROM provider_payment_orders WHERE amount_won = 0
UNION ALL SELECT 'zero_won_paid', COUNT(*) FROM provider_payment_orders WHERE amount_won = 0 AND status IN ('paid', 'refund_requested', 'refunded');

SELECT id, order_ref, product_kind, status, amount_won, pg_provider FROM provider_payment_orders
  WHERE amount_won = 0 OR LOWER(product_id) LIKE '%test%' OR LOWER(variant_label) LIKE '%test%' OR variant_label LIKE '%테스트%'
  ORDER BY id LIMIT 50;
```

### D3. 주문 상태 모순
목적: 결제 완료인데 결제 시각이 없음, 포트원 결제인데 결제 id가 없음, 같은 결제 id가 두 주문에 붙음, 정가보다 결제액이 큼.
기대: 모든 줄 0.

```sql
SELECT 'paid_no_paid_at' AS chk, COUNT(*) AS cnt FROM provider_payment_orders WHERE status IN ('paid', 'refund_requested', 'refunded') AND paid_at IS NULL
UNION ALL SELECT 'portone_paid_no_payment_id', COUNT(*) FROM provider_payment_orders WHERE pg_provider = 'portone_test' AND status IN ('paid', 'refund_requested', 'refunded') AND (pg_payment_id IS NULL OR pg_payment_id = '')
UNION ALL SELECT 'dup_pg_payment_id', COUNT(*) FROM (
  SELECT pg_payment_id FROM provider_payment_orders WHERE pg_payment_id IS NOT NULL AND pg_payment_id <> '' GROUP BY pg_payment_id HAVING COUNT(*) > 1
) z
UNION ALL SELECT 'amount_over_list', COUNT(*) FROM provider_payment_orders WHERE list_price_won IS NOT NULL AND amount_won > list_price_won;
```

### D4. 주문이 없는 결제 연결 행
목적: `order_ref`로 주문을 가리키는데 그 주문이 없음(환불 요청·배지·쪽지권·즉시쪽지·포트원 취소 기록).
기대: 모든 줄 0.

```sql
SELECT 'refund_no_order' AS chk, COUNT(*) AS cnt FROM provider_refund_requests x LEFT JOIN provider_payment_orders o ON o.order_ref = x.order_ref WHERE o.id IS NULL
UNION ALL SELECT 'badge_no_order', COUNT(*) FROM provider_paid_badges x LEFT JOIN provider_payment_orders o ON o.order_ref = x.source_order_ref WHERE x.source_order_ref IS NOT NULL AND o.id IS NULL
UNION ALL SELECT 'pack_no_order', COUNT(*) FROM provider_ticket_packs x LEFT JOIN provider_payment_orders o ON o.order_ref = x.source_order_ref WHERE x.source_order_ref IS NOT NULL AND o.id IS NULL
UNION ALL SELECT 'memo_intent_no_order', COUNT(*) FROM provider_immediate_memo_intents x LEFT JOIN provider_payment_orders o ON o.order_ref = x.order_ref WHERE o.id IS NULL
UNION ALL SELECT 'pg_cancel_log_no_order', COUNT(*) FROM provider_pg_cancel_ops_log x LEFT JOIN provider_payment_orders o ON o.order_ref = x.order_ref WHERE x.order_ref IS NOT NULL AND o.id IS NULL;
```

### D5. 환불 모순
목적: 주문은 「환불됨」인데 환불 요청이 없음, 환불 요청은 「환불됨」인데 주문이 아직 결제 상태, 환불액이 결제액보다 큼.
기대: 모든 줄 0.

```sql
SELECT 'order_refunded_no_request' AS chk, COUNT(*) AS cnt FROM provider_payment_orders o
  WHERE o.status = 'refunded' AND NOT EXISTS (SELECT 1 FROM provider_refund_requests r WHERE r.order_ref = o.order_ref)
UNION ALL SELECT 'request_refunded_order_not', COUNT(*) FROM provider_refund_requests r JOIN provider_payment_orders o ON o.order_ref = r.order_ref
  WHERE r.status = 'refunded' AND o.status <> 'refunded'
UNION ALL SELECT 'refund_over_amount', COUNT(*) FROM provider_refund_requests r JOIN provider_payment_orders o ON o.order_ref = r.order_ref
  WHERE r.refund_won > o.amount_won;
```

### D6. 이용 중인 프라임·픽인데 결제가 없거나 끝남
목적:
- 노출 배정(`study_room_exposure_assignments`)이 `active`인데 결제가 `paid`가 아니거나 기간이 지남.
- 결제로 생긴 구독(`source = 'payment'`)이 이용 중인데, 같은 회원에게 결제된 기간형 주문이 하나도 없음. (구독 행에는 주문 번호가 없어서 회원 단위로만 맞춘다.)
- 결제 구독이 이용 중인데 그 회원의 기간형 주문이 모두 환불·취소됨.

기대: 모든 줄 0.

```sql
SELECT 'exposure_active_not_paid' AS chk, COUNT(*) AS cnt FROM study_room_exposure_assignments
  WHERE exposure_status = 'active' AND payment_status <> 'paid'
UNION ALL SELECT 'exposure_active_expired', COUNT(*) FROM study_room_exposure_assignments
  WHERE exposure_status = 'active' AND ends_at < NOW()
UNION ALL SELECT 'position_active_no_paid_order', COUNT(*) FROM provider_position_subscriptions p
  WHERE CURDATE() < p.end_exclusive_on AND p.source = 'payment'
    AND NOT EXISTS (SELECT 1 FROM provider_payment_orders o
                    WHERE o.user_id = p.user_id AND o.product_kind = 'position' AND o.status IN ('paid', 'refund_requested'))
UNION ALL SELECT 'position_active_all_refunded', COUNT(*) FROM provider_position_subscriptions p
  WHERE CURDATE() < p.end_exclusive_on AND p.source = 'payment'
    AND EXISTS (SELECT 1 FROM provider_payment_orders o WHERE o.user_id = p.user_id AND o.product_kind = 'position')
    AND NOT EXISTS (SELECT 1 FROM provider_payment_orders o
                    WHERE o.user_id = p.user_id AND o.product_kind = 'position' AND o.status IN ('paid', 'refund_requested'));
```

### D7. D6 상세 (id만)
기대: 0행.

```sql
SELECT 'exposure' AS kind, e.id, e.study_room_id AS owner_ref, e.exposure_type AS sku, e.payment_status AS state
  FROM study_room_exposure_assignments e
  WHERE e.exposure_status = 'active' AND (e.payment_status <> 'paid' OR e.ends_at < NOW())
UNION ALL
SELECT 'position', p.id, p.user_id, p.sku_code, p.source
  FROM provider_position_subscriptions p
  WHERE CURDATE() < p.end_exclusive_on AND p.source = 'payment'
    AND NOT EXISTS (SELECT 1 FROM provider_payment_orders o
                    WHERE o.user_id = p.user_id AND o.product_kind = 'position' AND o.status IN ('paid', 'refund_requested'))
LIMIT 50;
```

### D8. 이용 중인 유료 기록 출처 요약 (참고)
목적: 이용 중인 프라임·픽 구독과 활성 배지를 출처별로 센다. `manual` 등 결제가 아닌 출처는 관리자 지급·테스트일 수 있다.
기대: **참고.**

```sql
SELECT 'position' AS kind, sku_code AS code, source, COUNT(*) AS cnt
  FROM provider_position_subscriptions WHERE CURDATE() < end_exclusive_on GROUP BY sku_code, source
UNION ALL
SELECT 'badge', badge_code, IF(source_order_ref IS NULL, 'no_order', 'order'), COUNT(*)
  FROM provider_paid_badges WHERE status = 'active' AND CURDATE() < end_exclusive_on GROUP BY badge_code, IF(source_order_ref IS NULL, 'no_order', 'order');
```

### D9. 환불된 주문으로 생긴 배지·쪽지권이 아직 살아 있음
기대: 모든 줄 0.

```sql
SELECT 'badge_active_order_refunded' AS chk, COUNT(*) AS cnt FROM provider_paid_badges b
  JOIN provider_payment_orders o ON o.order_ref = b.source_order_ref
  WHERE b.status = 'active' AND CURDATE() < b.end_exclusive_on AND o.status IN ('refunded', 'cancelled', 'failed')
UNION ALL SELECT 'pack_left_order_refunded', COUNT(*) FROM provider_ticket_packs k
  JOIN provider_payment_orders o ON o.order_ref = k.source_order_ref
  WHERE k.remaining > 0 AND k.expires_at > NOW() AND o.status IN ('refunded', 'cancelled', 'failed');
```

---

## E. 쪽지

참고: 안 읽은 쪽지 수는 DB에 따로 저장하지 않는다(`message_thread_reads.read_at`과 `messages.created_at`으로 그때그때 계산). 그래서 「저장된 안읽음 수가 틀림」 점검은 뺐다. 대신 읽음 기록이 대화 참여자 것인지 본다.

### E1. 쪽지 고아 행
목적: 대화방이 없는 쪽지·첨부·읽음·상태 행, 참여자 회원이 없는 대화방.
기대: 모든 줄 0.

```sql
SELECT 'messages_no_thread' AS chk, COUNT(*) AS cnt FROM messages m LEFT JOIN message_threads t ON t.id = m.thread_id WHERE t.id IS NULL
UNION ALL SELECT 'attach_no_message', COUNT(*) FROM message_attachments a LEFT JOIN messages m ON m.id = a.message_id WHERE m.id IS NULL
UNION ALL SELECT 'attach_thread_mismatch', COUNT(*) FROM message_attachments a JOIN messages m ON m.id = a.message_id WHERE m.thread_id <> a.thread_id
UNION ALL SELECT 'reads_no_thread', COUNT(*) FROM message_thread_reads r LEFT JOIN message_threads t ON t.id = r.thread_id WHERE t.id IS NULL
UNION ALL SELECT 'state_no_thread', COUNT(*) FROM message_thread_participant_state s LEFT JOIN message_threads t ON t.id = s.thread_id WHERE t.id IS NULL
UNION ALL SELECT 'thread_low_user_missing', COUNT(*) FROM message_threads t LEFT JOIN users u ON u.id = t.participant_low_user_id WHERE u.id IS NULL
UNION ALL SELECT 'thread_high_user_missing', COUNT(*) FROM message_threads t LEFT JOIN users u ON u.id = t.participant_high_user_id WHERE u.id IS NULL
UNION ALL SELECT 'quick_match_thread_missing', COUNT(*) FROM quick_match_dispatches q LEFT JOIN message_threads t ON t.id = q.thread_id WHERE q.thread_id IS NOT NULL AND t.id IS NULL
UNION ALL SELECT 'memo_intent_thread_missing', COUNT(*) FROM provider_immediate_memo_intents i LEFT JOIN message_threads t ON t.id = i.thread_id WHERE i.thread_id IS NOT NULL AND t.id IS NULL;
```

### E2. 참여자가 아닌 사람의 기록
목적: 보낸 사람·시작한 사람·읽음·보관/차단 상태가 그 대화방의 두 참여자가 아님. 참여자 순서(낮은 id < 높은 id)가 틀림.
기대: 모든 줄 0.

```sql
SELECT 'sender_not_participant' AS chk, COUNT(*) AS cnt FROM messages m JOIN message_threads t ON t.id = m.thread_id
  WHERE m.sender_user_id NOT IN (t.participant_low_user_id, t.participant_high_user_id)
UNION ALL SELECT 'initiator_not_participant', COUNT(*) FROM message_threads t
  WHERE t.initiated_by_user_id IS NOT NULL AND t.initiated_by_user_id NOT IN (t.participant_low_user_id, t.participant_high_user_id)
UNION ALL SELECT 'reads_not_participant', COUNT(*) FROM message_thread_reads r JOIN message_threads t ON t.id = r.thread_id
  WHERE r.user_id NOT IN (t.participant_low_user_id, t.participant_high_user_id)
UNION ALL SELECT 'state_not_participant', COUNT(*) FROM message_thread_participant_state s JOIN message_threads t ON t.id = s.thread_id
  WHERE s.user_id NOT IN (t.participant_low_user_id, t.participant_high_user_id)
UNION ALL SELECT 'participant_order_wrong', COUNT(*) FROM message_threads WHERE participant_low_user_id >= participant_high_user_id;
```

### E3. 대화방 맥락 대상이 없음
목적: 대화방이 가리키는 학생·공부방·과외쌤(`context_kind`, `context_id`)이 없음. 쪽지 상단 요약이 비어 보일 수 있다.
기대: 모든 줄 0.

```sql
SELECT 'ctx_student_missing' AS chk, COUNT(*) AS cnt FROM message_threads t LEFT JOIN students st ON st.id = t.context_id WHERE t.context_kind = 'student' AND st.id IS NULL
UNION ALL SELECT 'ctx_study_room_missing', COUNT(*) FROM message_threads t LEFT JOIN study_rooms s ON s.id = t.context_id WHERE t.context_kind = 'study_room' AND s.id IS NULL
UNION ALL SELECT 'ctx_tutor_missing', COUNT(*) FROM message_threads t LEFT JOIN tutors tu ON tu.id = t.context_id WHERE t.context_kind = 'tutor' AND tu.id IS NULL;
```

### E4. 쪽지가 하나도 없는 대화방 (참고)
목적: 대화방만 있고 쪽지가 없음. 목록에 빈 대화가 보일 수 있다.
기대: **참고**(0이 좋다).

```sql
SELECT COUNT(*) AS empty_threads FROM message_threads t
  WHERE NOT EXISTS (SELECT 1 FROM messages m WHERE m.thread_id = t.id);

SELECT t.id FROM message_threads t
  WHERE NOT EXISTS (SELECT 1 FROM messages m WHERE m.thread_id = t.id)
  ORDER BY t.id LIMIT 50;
```

---

## F. 금액

참고: 금액 칸은 모두 `INT UNSIGNED`라 음수는 저장될 수 없다. 그래서 「음수」 점검은 뺐고 0원만 본다.

### F1. 공부방 수업료 (15b)
목적: `monthly_fee_amount`(원)와 `monthly_fee`(글자)가 서로 맞는지. 둘 다 빈 6행은 정상이라 빠진다.
기대: `amount_only`·`text_only`·`zero_amount`·`not_1000_unit`·`text_mismatch`는 0. 2026-11-18 기준 `filled`는 3.

```sql
SELECT
  SUM(monthly_fee_amount IS NOT NULL AND monthly_fee <> '') AS filled,
  SUM(monthly_fee_amount IS NOT NULL AND monthly_fee = '') AS amount_only,
  SUM(monthly_fee_amount IS NULL AND monthly_fee <> '') AS text_only,
  SUM(monthly_fee_amount = 0) AS zero_amount,
  SUM(monthly_fee_amount IS NOT NULL AND MOD(monthly_fee_amount, 1000) <> 0) AS not_1000_unit,
  SUM(monthly_fee_amount IS NOT NULL AND monthly_fee <> ''
      AND monthly_fee <> CONCAT(monthly_fee_amount DIV 1000, '천원')) AS text_mismatch,
  COUNT(*) AS total_rows
FROM study_room_classes;

SELECT id, study_room_id, monthly_fee, monthly_fee_amount FROM study_room_classes
  WHERE (monthly_fee_amount IS NOT NULL AND monthly_fee = '')
     OR (monthly_fee_amount IS NULL AND monthly_fee <> '')
     OR monthly_fee_amount = 0
     OR (monthly_fee_amount IS NOT NULL AND MOD(monthly_fee_amount, 1000) <> 0)
     OR (monthly_fee_amount IS NOT NULL AND monthly_fee <> '' AND monthly_fee <> CONCAT(monthly_fee_amount DIV 1000, '천원'))
  ORDER BY id LIMIT 50;
```

주의: 15b PR이 저장 형식을 「300천원」 말고 다른 글자로 정하면 `text_mismatch`가 늘 수 있다. 그때는 PR 형식에 맞춰 봇이 이 줄을 고친다.

### F2. 0원 금액 (참고)
목적: 대표 금액·희망 수업료가 0인 행. 화면에 「0원」으로 보일 수 있다.
기대: **참고**(0이 좋다).

```sql
SELECT 'study_rooms.price_amount' AS chk, COUNT(*) AS cnt FROM study_rooms WHERE price_amount = 0 AND deleted_at IS NULL
UNION ALL SELECT 'tutors.preferred_fee_amount', COUNT(*) FROM tutors WHERE preferred_fee_amount = 0
UNION ALL SELECT 'students.preferred_fee_amount', COUNT(*) FROM students WHERE preferred_fee_amount = 0 AND deleted_at IS NULL
UNION ALL SELECT 'students.preferred_studyroom_fee_amount', COUNT(*) FROM students WHERE preferred_studyroom_fee_amount = 0 AND deleted_at IS NULL;
```

### F3. 경력 0년 (15 규칙: 최소 1)
목적: 15에서 경력 최소 1로 바꿨다. 그 전에 0으로 저장된 공부방이 남았는지 본다.
기대: **참고**(0이 좋다). 있으면 다음 저장 때 막힐 수 있다.

```sql
SELECT COUNT(*) AS career_zero FROM study_rooms WHERE career_years = 0 AND deleted_at IS NULL;
SELECT id FROM study_rooms WHERE career_years = 0 AND deleted_at IS NULL ORDER BY id LIMIT 50;
```

### F4. 쪽지권 잔량이 팩 크기보다 큼
기대: 0.

```sql
SELECT COUNT(*) AS remaining_over_pack FROM provider_ticket_packs WHERE remaining > pack_size;
SELECT id, user_id FROM provider_ticket_packs WHERE remaining > pack_size ORDER BY id LIMIT 50;
```

---

## G. 중복 계정

### G1. 이메일 중복 (대소문자·공백)
목적: `uk_users_email`이 막지 못하는, 대소문자나 앞뒤 공백만 다른 이메일.
기대: 0행.

```sql
SELECT COUNT(*) AS dup_groups FROM (
  SELECT LOWER(TRIM(email)) k FROM users GROUP BY LOWER(TRIM(email)) HAVING COUNT(*) > 1
) z;

SELECT GROUP_CONCAT(id ORDER BY id) AS user_ids, COUNT(*) AS cnt
  FROM users GROUP BY LOWER(TRIM(email)) HAVING COUNT(*) > 1 LIMIT 50;
```

### G2. Gmail 같은 주소 (점·+태그)
목적: Gmail은 점과 `+태그`를 무시한다. 같은 사람이 여러 번 가입했을 수 있다.
기대: **참고**(0이 좋다).

```sql
SELECT GROUP_CONCAT(id ORDER BY id) AS user_ids, COUNT(*) AS cnt
FROM users
WHERE LOWER(TRIM(email)) LIKE '%@gmail.com' OR LOWER(TRIM(email)) LIKE '%@googlemail.com'
GROUP BY REPLACE(SUBSTRING_INDEX(SUBSTRING_INDEX(LOWER(TRIM(email)), '@', 1), '+', 1), '.', '')
HAVING COUNT(*) > 1
LIMIT 50;
```

### G3. 소셜 연동 중복
목적: 한 회원에게 같은 소셜(네이버·카카오·구글)이 2개 이상 붙음. (같은 소셜 계정이 두 회원에 붙는 것은 유니크 키가 막는다.)
기대: 0행.

```sql
SELECT user_id, provider, COUNT(*) AS cnt
  FROM user_oauth_accounts GROUP BY user_id, provider HAVING COUNT(*) > 1 LIMIT 50;
```

---

## H. 테스트 데이터 (개수만)

목적: 오픈 전에 남은 테스트 흔적의 규모만 본다. 개인정보는 보지 않는다. 우리 검수용 테스트 계정도 여기 잡힌다. 지울지는 숫자를 보고 종현이 정한다.
기대: **참고.** 단 `*_published` 줄은 0이 좋다(손님 화면에 보임).

```sql
SELECT 'users_test_email' AS chk, COUNT(*) AS cnt FROM users
  WHERE LOWER(email) LIKE '%test%' OR LOWER(email) LIKE '%example.%' OR LOWER(email) LIKE '%.invalid'
UNION ALL SELECT 'rooms_test_name', COUNT(*) FROM study_rooms
  WHERE deleted_at IS NULL AND (LOWER(study_room_name) LIKE '%test%' OR study_room_name LIKE '%테스트%')
UNION ALL SELECT 'rooms_test_name_published', COUNT(*) FROM study_rooms
  WHERE deleted_at IS NULL AND profile_status = 'published' AND (LOWER(study_room_name) LIKE '%test%' OR study_room_name LIKE '%테스트%')
UNION ALL SELECT 'tutors_test_name', COUNT(*) FROM tutors
  WHERE LOWER(tutor_display_name) LIKE '%test%' OR tutor_display_name LIKE '%테스트%'
UNION ALL SELECT 'tutors_test_name_published', COUNT(*) FROM tutors
  WHERE profile_status = 'published' AND (LOWER(tutor_display_name) LIKE '%test%' OR tutor_display_name LIKE '%테스트%')
UNION ALL SELECT 'students_test_name', COUNT(*) FROM students
  WHERE deleted_at IS NULL AND (LOWER(public_display_name) LIKE '%test%' OR public_display_name LIKE '%테스트%' OR request_title LIKE '%테스트%')
UNION ALL SELECT 'students_test_name_published', COUNT(*) FROM students
  WHERE deleted_at IS NULL AND exposure_status = 'published' AND (LOWER(public_display_name) LIKE '%test%' OR public_display_name LIKE '%테스트%' OR request_title LIKE '%테스트%')
UNION ALL SELECT 'popups_test_published', COUNT(*) FROM home_popups
  WHERE published = 1 AND (content LIKE '%테스트%' OR LOWER(content) LIKE '%test%')
UNION ALL SELECT 'board_posts_test_title', COUNT(*) FROM board_posts
  WHERE title LIKE '%테스트%' OR LOWER(title) LIKE '%test%'
UNION ALL SELECT 'orders_dev_mock', COUNT(*) FROM provider_payment_orders WHERE pg_provider = 'dev_mock';
```

공개 중인 테스트 프로필 id가 필요하면 아래만 돌린다(id만 나온다).

```sql
SELECT 'study_room' AS kind, id FROM study_rooms
  WHERE deleted_at IS NULL AND profile_status = 'published' AND (LOWER(study_room_name) LIKE '%test%' OR study_room_name LIKE '%테스트%')
UNION ALL SELECT 'tutor', id FROM tutors
  WHERE profile_status = 'published' AND (LOWER(tutor_display_name) LIKE '%test%' OR tutor_display_name LIKE '%테스트%')
UNION ALL SELECT 'student', id FROM students
  WHERE deleted_at IS NULL AND exposure_status = 'published' AND (LOWER(public_display_name) LIKE '%test%' OR public_display_name LIKE '%테스트%' OR request_title LIKE '%테스트%')
LIMIT 50;
```

---

## 뺀 점검과 이유

| 요청 항목 | 뺀 이유 |
|---|---|
| TEST 이름·0원 **상품**이 화면에 보이는지 | 상품 목록은 DB가 아니라 `src/Paid/PaidCatalog.php`에 있다. 코드상 최저가는 쪽지 1회 500원. 주문 기록만 D2에서 본다. |
| 쪽지 안읽음 수가 맞는지 | 안읽음 수를 저장하는 칸이 없다. 읽음 기록 검사(E2)로 대신한다. |
| 음수 금액 | 금액 칸이 모두 `INT UNSIGNED`라 음수가 저장될 수 없다. |
| 프라임·픽 구독과 주문을 1:1로 맞추기 | `provider_position_subscriptions`에 주문 번호 칸이 없다. 회원 단위로만 맞춘다(D6). |
| 홍보지역 2·3 「사업장 밖」 판정 | 잠긴 규칙(같은 시군구 등)을 저장소에서 찾지 못했다. C5에서 숫자만 본다. |

## 스키마 불확실

- 일부 컬럼은 PHP가 실행 중에 ALTER로 붙인다(예: `study_room_regions.region_basis_type`, 주문·구독의 `provider_type`·`provider_id`·지역 칸). 운영에 실제로 있는지는 0번이 알려 준다.
- `study_room_classes.monthly_fee_amount`는 종현이 직접 추가했고 저장소 마이그레이션에는 아직 없다(15b PR에서 들어올 예정).
- 주문·구독의 `deleted_user_ref`(회원 삭제 익명화)는 PHP가 조건부로 붙인다. 그래서 이 문서는 그 칸을 쓰지 않고 `user_id IS NULL`로만 구분한다.
- `users.email_canonical`은 초안(085, 적용 금지)이라 쓰지 않았다.
