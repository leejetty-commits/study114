# 카드 이모티콘·배지 체계 — 2026-08-21 잠금 반영

**기준일:** 2026-08-21  
**최우선 SSOT:** Notion「상위기획-공부방 샵 페이지·카드 연동 구현 컨셉」§18  
**교차:** Notion 11장 §2-0 · 18장 §0-A · repo `docs/ssot/11-main-exposure-and-compare.md` §2-0  
**코드 SSOT:** `preview/home-ui/src/card-visual.js`  
**검증:** `npm run verify:card-visual` · 관통감사 `npm run verify:card-visual:penetration` → `docs/internal/56-card-visual-penetration-audit.md`  
**paid_badges 계약:** `docs/internal/57-paid-badges-api-contract.md` · API 코드 `jjokjipge`(쪽집게)  
**슬로건 분기표:** `docs/internal/58-card-copy-tier-matrix.md`

---

## 1. 층위 (섞지 않음)

| 층 | 코드 | UI |
|----|------|-----|
| 기능 | wish / compare / message | `.card-actions` |
| 통계 | recommend_count / review_count | `.card-stats` |
| 자동 | New (7일) | `.card-visual__promo-badge--new` |
| 신뢰 | 교육청·사업자·졸업·경력·증빙 | `.card-visual__trust-badge` |
| 유료 | 공부방 Hot·단과 / 과외쌤 Hot·쪽집게·SKY | `.card-visual__promo-badge` |

금지: 공부방 유료축「전문」 · 추천/후기를 광고배지로 취급 · 좋아요(like)

---

## 2. 파일 역할

| 파일 | 역할 |
|------|------|
| `card-visual.js` | **실질 SSOT** — 층위 계산 |
| `exposure-render.js` | 렌더 소비자 — Basic/Pick/Prime/hcard |
| `exposure-format.js` | `studyRoomBadges`/`tutorBadges` → trust만 |
| `home-basic-live.js` | 실검색 어댑터 — 카운트·신뢰 필드 패스스루 |
| `exposure-data.js` | mock 샘플 paid_badges |
| `plans-catalog.js` / `plans/store-ui.js` | 판매 배지 카탈로그 (New·추천 제외) |
| `SearchService.php` | recommend_count·review_count·신뢰 필드 조회 |
| `RecommendService.php` | 추천 토글 → recommend_count ±1 |
| `ProviderReviewService.php` | review_count = visible 후기 COUNT |

---

## 3. 통계 카운트

- **추천:** `user_recommendations` 토글 + `study_rooms|tutors.recommend_count` 캐시 (`RecommendService`)
- **후기:** `provider_reviews` 중 `review_status='visible'` COUNT (`SearchService::reviewCountExpr`)
- 정렬: Basic/검색의 recommend / review sort가 동일 숫자 재사용

---

## 4. 유료 배지 데이터

카드는 API `item.paid_badges[]`만 표시 (badge_codes / badge_* 플래그는 호환).  
대학명으로 SKY 자동부여 **금지**. New만 published_at/created_at 7일 자동.

서버: `PaidBadgeResolver` ← `provider_paid_badges` (055).  
Checkout→행 기록은 **미연결** — 필드가 `[]`인 것이 정상일 수 있음.  
→ [57-paid-badges-api-contract.md](./57-paid-badges-api-contract.md)

---

## 5. 구 문서 충돌

로컬 `docs/ssot/18-paid-services-rough.md` 등에 「Hot·New·추천·쪽집게」 판매 표기가 남아 있으면 **§0-A / 상위기획 §18이 우선**.
