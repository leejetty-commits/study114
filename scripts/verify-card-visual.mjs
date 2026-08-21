/**
 * 카드 이모티콘/배지 정책 회귀 (2026-08-21)
 * 실행: cd preview/home-ui && npx vite-node ../../scripts/verify-card-visual.mjs
 */
import {
  CARD_VISUAL_POLICY,
  PAID_BADGE_LABELS,
  resolveCardVisualLayers,
  resolvePaidPromoBadges,
  resolveTrustBadgeLabels,
  resolveCardStats,
  paidLabelsContainForbiddenSpecialty,
  isWithinNewBadgeWindow,
} from '../preview/home-ui/src/card-visual.js';
import { studyRoomBadges, tutorBadges } from '../preview/home-ui/src/exposure-format.js';
import {
  STUDY_ROOM_CATALOG_IDS,
  TUTOR_CATALOG_IDS,
} from '../preview/home-ui/src/mypage/plans-catalog.js';

let pass = 0;
let fail = 0;
function ok(name, cond) {
  if (cond) {
    pass += 1;
    console.log(`PASS  ${name}`);
  } else {
    fail += 1;
    console.error(`FAIL  ${name}`);
  }
}

ok('policy_lockedAt', CARD_VISUAL_POLICY.lockedAt === '2026-08-21');
ok('actions_only_wish_compare_message', CARD_VISUAL_POLICY.actions.join(',') === 'wish,compare,message');
ok('stats_recommend_review', CARD_VISUAL_POLICY.stats.join(',') === 'recommend,review');
ok('removed_like', CARD_VISUAL_POLICY.removed.includes('like'));
ok('paid_room_hot_단과', CARD_VISUAL_POLICY.paidStudyRoom.join(',') === 'hot,subject_track');
ok('paid_tutor_hot_jjokjipge_sky', CARD_VISUAL_POLICY.paidTutor.join(',') === 'hot,jjokjipge,sky');
ok('label_단과', PAID_BADGE_LABELS.subject_track === '단과');
ok('label_쪽집게', PAID_BADGE_LABELS.jjokjipge === '쪽집게');
ok('no_전문_label', !Object.values(PAID_BADGE_LABELS).includes('전문'));

const room = {
  education_office_registered: true,
  career_years: 12,
  one_on_one_available: true,
  weekend_available: true,
  paid_badges: ['hot', 'subject_track', '전문'],
  recommend_count: 5,
  review_count: 0,
  published_at: new Date().toISOString(),
};
const roomLayers = resolveCardVisualLayers('study_room', room);
ok('room_trust_no_1on1_weekend', !roomLayers.trustBadges.includes('1:1') && !roomLayers.trustBadges.includes('주말'));
ok('room_trust_edu', roomLayers.trustBadges.includes('교육청등록'));
ok('room_promo_has_new', roomLayers.promoBadges.some((b) => b.id === 'new'));
ok('room_promo_hot_단과', roomLayers.promoBadges.some((b) => b.id === 'hot') && roomLayers.promoBadges.some((b) => b.id === 'subject_track'));
ok('room_전문_not_in_promo', !roomLayers.promoBadges.some((b) => b.label === '전문'));
ok('room_stats_hide_review_0', roomLayers.stats.showReview === false && roomLayers.stats.recommend === 5);

const tutor = {
  university_status: 'graduated',
  career_year_band: 'y10_plus',
  proof_document_available: true,
  paid_badges: ['sky', 'jjokjipge'],
  university_name: '서울대학교',
  recommend_count: 2,
  review_count: 3,
};
const tutorLayers = resolveCardVisualLayers('tutor', tutor);
ok('tutor_trust_졸업_경력_증빙', tutorLayers.trustBadges.includes('졸업') && tutorLayers.trustBadges.includes('경력 10년+') && tutorLayers.trustBadges.includes('증빙'));
ok('tutor_promo_sky_jjokjipge', tutorLayers.promoBadges.some((b) => b.id === 'sky') && tutorLayers.promoBadges.some((b) => b.id === 'jjokjipge'));
ok('tutor_picked_alias', resolvePaidPromoBadges('tutor', { paid_badges: ['picked'] }).some((b) => b.id === 'jjokjipge'));
ok('tutor_no_auto_sky_from_univ', resolvePaidPromoBadges('tutor', { university_name: '서울대학교' }).length === 0);
ok('tutor_review_shown', tutorLayers.stats.showReview === true);

ok('studyRoomBadges_trust_only', !studyRoomBadges(room).includes('1:1'));
ok('tutorBadges_uses_trust', tutorBadges(tutor).includes('졸업'));

ok('catalog_room_no_recommend_new', !STUDY_ROOM_CATALOG_IDS.includes('recommend') && !STUDY_ROOM_CATALOG_IDS.includes('new'));
ok('catalog_room_has_단과', STUDY_ROOM_CATALOG_IDS.includes('subject_track'));
ok('catalog_tutor_has_sky', TUTOR_CATALOG_IDS.includes('sky'));
ok('catalog_tutor_jjokjipge', TUTOR_CATALOG_IDS.includes('jjokjipge'));
ok('catalog_tutor_no_recommend', !TUTOR_CATALOG_IDS.includes('recommend'));

ok('new_window_7d', isWithinNewBadgeWindow(new Date().toISOString()));
ok('new_window_old_false', !isWithinNewBadgeWindow('2020-01-01T00:00:00Z'));
ok('forbidden_specialty_helper', paidLabelsContainForbiddenSpecialty(['단과', '전문']) === true);
ok('stats_zero_safe', resolveCardStats({}).recommend === 0 && resolveCardStats({}).showReview === false);
ok('trust_empty_ok', resolveTrustBadgeLabels('study_room', {}).length === 0);

console.log(`\n${pass} PASS / ${fail} FAIL`);
if (fail > 0) process.exit(1);
