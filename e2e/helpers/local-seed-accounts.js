/**
 * e2e 로그인 계정 — 로컬 Docker(study114_dev) 시드 전용. 운영 DB 에는 없다.
 * - 운영자 `ops@dev.local`: sql/schema/026_admin_dev_seed.sql 이 만들고
 *   036_admin_level_and_must_change.sql 이 admin_level=sub_master 로 채운다.
 * - 나머지: sql/schema/012_search_dev_seed.sql.
 * 실제 사람 계정(운영 관리자 등)을 여기에 넣거나 테스트에 쓰지 않는다.
 */
export const LOCAL_SEED_PASSWORD = 'password';

export const LOCAL_SEED_ACCOUNTS = Object.freeze({
  tutor: 'tutor-owner1@dev.local',
  admin: 'ops@dev.local',
  parent: 'guardian1@dev.local',
  study_room: 'room-owner1@dev.local',
});

/** e2e 전용 운영자 — 로컬 Docker 시드(026/036) 전용 */
export const E2E_OPERATOR_EMAIL = LOCAL_SEED_ACCOUNTS.admin;
