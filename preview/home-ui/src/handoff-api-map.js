/**
 * 25장 부록 B — 프리뷰 sessionStorage ↔ 서버 DDL/API 매핑
 * DDL: sql/schema/013_handoff_basket.sql
 * PHP: src/Handoff/HandoffService.php
 */

export const HANDOFF_LIMITS = {
  compareMax: 3,
  recentMax: 30,
  studentReviewMax: 50,
};

/** @type {Record<string, { preview: string, table: string, endpoint: string }>} */
export const HANDOFF_API_MAP = {
  favorites: {
    preview: 'user-actions-state.js → wishlist',
    table: 'user_favorites',
    endpoint: '/api/handoff/favorites.php',
  },
  compare: {
    preview: 'user-actions-state.js → compare',
    table: 'user_compare_items',
    endpoint: '/api/handoff/compare.php',
  },
  recent: {
    preview: 'mypage/recent-store.js',
    table: 'user_recent_views',
    endpoint: '/api/handoff/recent.php',
  },
  studentReview: {
    preview: 'student-review-store.js',
    table: 'provider_student_reviews',
    endpoint: '/api/handoff/student-reviews.php',
  },
};

/** 클라이언트: handoff-api.js */
