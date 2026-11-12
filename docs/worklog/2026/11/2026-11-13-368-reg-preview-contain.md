# 368-내등록미리보기 — 홍보사진 편집 contain

**지시:** [368-내등록미리보기] 종현  
**브랜치:** `work/368-reg-preview-contain`  
**날짜:** 2026-11-13  
**베이스:** main `f3d94ef1` (#191 카드맞춤 포함)

## 증상

마이페이지 → 내등록 → 홍보사진 편집 미리보기만 잘림(테스트rm1).  
카드·상세·마이샵은 운영 합격 → 회귀만 확인.

## 원인

| 위치 | 내용 |
|------|------|
| `preview/study-room-ui/src/promo-photos.js` `previewSrc` | `basic_720`(가운데 잘린 1:1)을 먼저 씀 |
| `register.css` `.register-photo-card__frame img` | `object-fit: cover` |

## 수정

| 파일 | 변경 |
|------|------|
| `promo-photos.js` | `fit_1280` → `image_path` → prime → basic |
| `register.css` | frame img `contain` · frame 단색 `#e2e8f0` 유지 |

홈 카드·상세·마이샵 코드 **미변경**.

## 과외쌤

별도 컴포넌트(`tutor-reg/profile-photos` + `tutor-profile-photos.css`).  
이미 fit 우선 + contain. **흐림 배경(::before)은 잔존** — 이번 범위(공부방 홍보사진 편집) 밖, 보고만.

## 확인

| 항목 | 결과 |
|------|------|
| `node scripts/verify-reg-promo-preview-contain.mjs` | PASS 12 |
| `npm run verify:shop-page` | PASS 71 / FAIL 0 |
| `verify-photo-nofit-square` | PASS 17 |
| 1280 캡처 | `docs/worklog/2026/11/shots-368-reg-preview-contain/` (테스트rm1 라벨, 실명 없음) |

## 셀프검수

| # | 항목 | 결과 |
|---|------|------|
| 1 | 내등록 미리보기 전체 보임(contain) | PASS |
| 2 | 1:1 basic 미우선 | PASS |
| 3 | 단색 · 흐림 없음(공부방 그리드) | PASS |
| 4 | 카드·마이샵 회귀 | PASS |
| 5 | 픽셀 숫자 UI 0 | PASS |
| 6 | SQL·force push·머지 0 | PASS |
