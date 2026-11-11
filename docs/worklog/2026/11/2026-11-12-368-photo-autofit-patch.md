# 368-보완 — 캡처·축소·예외코드·문서 정정

**브랜치:** `work/368-photo-autofit`  
**기준 HEAD:** `57b6fa7e`  
**날짜:** 2026-11-12

## 항목별 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | 1280/390 실폭 재캡처(대표·상세1) | PASS · 해시 중복 없음 · `shots-368/368-recapture*.json` |
| 2 | 4000×3000·EXIF시뮬·투명PNG·HEIC·10MB | PASS · `shots-368/368-size-matrix.txt` |
| 3 | FE 긴변 2560 축소·4MB 비거절 | PASS · `shrinkPromoImageForUpload` |
| 4 | `ensureTutorProfilePhotoMinSize` 제거 | PASS · 서버 확대만 |
| 5 | softHint cover·await·HEIC accept | PASS |
| 6 | `PromoImageException` · 쪽지/보드 회귀 | PASS · `verify-promo-exception-codes` |
| 7 | Processor 주석 · prime+basic verify | PASS |
| 8 | 285·288·291·ssot 20/21 · Notion 문안 | 본 문서 |
| 9 | 닷홈 GD/webp/memory 절 | 아래 |

## 캡처 (실제 폭)

상세1 (`368-mwcfp89j-*`):

| 파일 | viewportW | innerWidth |
|------|-----------|------------|
| detail1-soft-1280 | 1280 | 1280 |
| detail1-crop-1280 | 1280 | 1280 |
| detail1-after-1280 | 1280 | 1280 |
| detail1-soft-390 | 390 | 390 |
| detail1-crop-390 | 390 | 390 |
| detail1-after-390 | 390 | 390 |

대표사진 등록점검 (`368-cover-mwcg5o96-*`): soft/crop/after × 1280·390, 해시 전부 상이.

경로: `docs/worklog/2026/11/shots-368/`

## 테스트 표 (memory_get_peak_usage)

| case | 입력 | bytes | prime | basic | peak |
|------|------|-------|-------|-------|------|
| 4000x3000 | 4000×3000 | 188691 | 1280×720 | 720×720 | ~60MB |
| exif6-sim | 1200×800 | 18250 | 1280×720 | 720×720 | ~60MB |
| transparent-png | 640×480 | 2798 | 1280×720 | 720×720 | ~60MB |
| heic | — | — | 거절 bad_type | — | ~60MB |
| phone-10mb | 7000×5000 | ~40MB | 서버 too_large | — | ~151MB |
| phone-shrunk-2560 | 2560×2048 | 82611 | 1280×720 | 720×720 | ~186MB |

## Notion 정본 5장 11–13 정정 문안 (복붙용)

> **[368 · 2026-11 정정]**  
> 홍보·대표 사진의 「최소 크기 유지 · 키우지 않음 · 최소 1200×900(또는 800×600) 미만 거절」 규칙은 **폐지**한다.  
> **작아도 받는다.** 서버가 **업로드 정규화 단계**에서 키운 뒤 카드 비율에 맞춘다(베이직 1:1 가운데 자르기 · 프라임 16:9는 흐림 담기 유지).  
> **프라임+베이직을 같이 만들 때** 베이직 기준으로 키운 원본을 프라임 contain에도 쓰므로 **앞 사진이 원본보다 커질 수 있다.**  
> 사용자 화면에는 **픽셀 숫자를 넣지 않는다.** 작으면 「사진이 작아 조금 흐릿하게 보일 수 있어요」만.  
> 브라우저에서는 긴 변 2560·약 4MB 이하로 줄일 수 있으나, 용량만으로 거절하지 않는다. 서버 상한은 긴 변 4096·약 1680만 픽셀.  
> **[368-보완2]** accept에서 HEIC/HEIF 제외(안내는 유지). 등록점검 「사진 선택」= 대표 **교체**. 상세는 `2026-11-12-368-photo-autofit-patch2.md`.

## 닷홈 운영 (읽기만 · 변경 금지)

1. `function_exists('imagewebp')` · `function_exists('exif_read_data')` · `ini_get` 업로드/메모리 — **조회만**.
2. **GD가 없으면** 업로드는 **즉시 실패** (`gd_missing`). 사용자에게는 「지금은 사진을 처리할 수 없어요」.
3. **`imagewebp`가 없으면** 파생본은 **jpg로 대신** 저장하고, **fit_1280(WebP 전용 경로)는 건너뛴다**(기존 `writeFitQuiet`·`saveWebpOrJpeg` 동작).
4. **memory_limit:** 로컬 Docker는 **256M**. 4000×3000·휴대폰급 축소본 처리 peak ≈ 60–190MB. 운영도 **최소 256M** 권장(읽기 확인만, ini 변경은 별도 승인).

## 금지 준수

merge · force push · 운영 DB/env/CSP · 프로모 잠금 · 1px · 개인사진 커밋 없음.
