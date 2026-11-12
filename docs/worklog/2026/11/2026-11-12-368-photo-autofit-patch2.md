# 368-보완2 — HEIC accept · 상한 · 교체 · EXIF6 · 실캡처

**브랜치:** `work/368-photo-autofit`  
**기준 HEAD:** `7ef6bae3`  
**날짜:** 2026-11-12  
**지시 원문:** `[368-보완2]` (복명 후 ㅇㅋ)

## 항목별 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | accept에서 HEIC/HEIF 제거 · 검사 유지 | PASS · `PROMO_IMAGE_SPEC.accept` · tutor `accept`는 동일 스펙(+ `image/*` 제거) |
| 2 | 서버 상한 4096 / 1680만 · memory→too_large · imagedestroy | PASS · `PromoImageSpec::MAX_*` · Processor |
| 3 | 주석·ssot20·291·verify 663×380 · Notion 문안 | PASS · 앞 사진 커질 수 있음 실제대로 · `NOTE foreground_width=1280` |
| 4 | 등록점검 「사진 선택」= 대표 교체 | PASS · 기존 cover(또는 만석 시 1번) delete 후 cover 1장 upload · 5장 차도 오류 없음(10MB 실측) |
| 5a | EXIF Orientation=6 JPEG | PASS · `scripts/verify-exif-orientation6.php` (왼쪽 빨강→보정 후 위) |
| 5b | 5174 4000×3000 · ~9MB 브라우저 축소 업로드 | PASS · crop→`promo-image.php` ok · `phone-10mb-*.webp` |
| 5c | 케이스별 별도 PHP peak | PASS · `verify-promo-peak-isolated.php` → `shots-368/368-peak-isolated.txt` |
| 6 | 등록점검·상세1·홈·과외쌤 1280/390 | PASS · `368-post-final-*` |

## peak (격리 프로세스)

| case | in | peak bytes |
|------|-----|------------|
| 4000x3000 | 4000×3000 | 110641152 (~105MB) |
| 2560x2048 | 2560×2048 | 62406656 (~60MB) |
| 663x380 | 663×380 | 20463616 (~20MB) |
| 1200x800 | 1200×800 | 24657920 (~24MB) |

## 브라우저 실측

- 4000×3000: crop 모달 → after 캡처 `368-large-4k-*`
- phone ~9.2MB: shrink 후 crop ~0.7s · delete+upload API 200 · prime `7844ec8b…` 1280×720
- 캡처 경로: `docs/worklog/2026/11/shots-368/`

## Notion 정본 문안 (복붙용)

> **[368-보완2 · 2026-11]**  
> accept에서 HEIC/HEIF는 고르지 않는다(안내 검사는 유지).  
> 서버 상한은 긴 변 4096 · 약 1680만 픽셀. 예상 메모리가 memory_limit을 넘으면 too_large.  
> 등록점검 「사진 선택」은 대표사진 **교체**(추가 아님).  
> 프라임+베이직 동시 처리 시 베이직 기준으로 키운 원본이 프라임 contain에도 쓰여 **앞 사진이 원본보다 커질 수 있다**.

## 금지 준수

merge · force push · 운영 DB/env/CSP · 프로모 잠금 · 1px · 개인사진 커밋 없음. tmp 픽스처 미커밋.
