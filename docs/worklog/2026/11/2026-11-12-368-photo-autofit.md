# 368 — 노출상품 홍보사진 자동맞춤·처리오류

**지시:** [368-긴급]  
**브랜치:** `work/368-photo-autofit`  
**날짜:** 2026-11-12

## 지시서 원문 요지

프라임·픽 홍보사진 업로드 경로(화면·API·서버)에서 「사진 처리 중 오류」 원인 확정, 800×600 미만 거절 제거(작으면 키움), WebP·EXIF, 픽셀 숫자 비노출, 원인별 사용자 말투. merge/force push·운영 DB/env/CSP·프로모 잠금·1px·개인사진 커밋 금지.

## 원인 (확정)

| 항목 | 내용 |
|------|------|
| 코드 위치 | `PromoImageProcessor::load()` → `imagecreatefromstring()` |
| API | `public/api/study-room/promo-image.php` catch → 사용자 문구 「사진 처리 중 오류가 발생했습니다.」 |
| 실제 예외 | `Call to undefined function Study114\Media\imagecreatefromstring()` |
| 근본 | 로컬 `study114-api-dev`에 **GD 미설치** (`docker/Dockerfile.api`가 `pdo_mysql`만 설치) |

### php -m (재빌드 전)

GD·exif 없음. (Core, ctypedo_mysql, … — gd/exif 미포함)

### docker logs `[promo-image]` 원문

```
[Wed Nov 11 17:03:42 2026] [promo-image] Call to undefined function Study114\Media\imagecreatefromstring()
[Wed Nov 11 17:03:42 2026] 172.18.0.1:56430 [500]: POST /api/study-room/promo-image.php
… (동일 메시지 반복)
```

### 환경 표

| 항목 | 로컬(재빌드 전) | 로컬(재빌드 후) | 닷홈 운영 |
|------|-----------------|-----------------|-----------|
| GD | no | yes | **읽기만 확인 필요** (아래 체크리스트) |
| imagewebp | no | yes | 읽기만 |
| exif_read_data | no | yes | 읽기만 |
| upload_max_filesize | 2M | 8M | 읽기만 |
| post_max_size | 8M | 12M | 읽기만 |
| memory_limit | 128M | 256M | 읽기만 |

## 수정 요약

1. `docker/Dockerfile.api` — libpng/jpeg/webp/freetype + `gd`/`exif` + upload/memory ini, 이미지 재빌드
2. `PromoImageProcessor` — 최소 픽셀 거절 제거, 작으면 크롭 파생본용 확대, `gd_missing`/`too_large`/`bad_type`/`write_failed` 코드, EXIF·WebP 유지, 프라임 16:9 contain(291) 유지
3. FE `promo-image.js` — 최소 거절·픽셀 문구 제거, 소프트 안내 「사진이 작아 조금 흐릿하게 보일 수 있어요」, HEIC 안내
4. `promo-image.php` / `profile-image.php` — 로그에 원인 코드, 사용자 쉬운 말투, **예외 원문 미노출**
5. `scripts/verify-promo-gd-required.php` — GD 없을 때 실패·작은 사진 확대 검사

## 테스트

| 케이스 | 결과 |
|--------|------|
| verify-promo-gd-required | PASS 전부 |
| verify-prime-contain-blur | PASS 전부 |
| verify-photo-fit-1280 | PASS 전부 |
| verify-photo-exif-nocrop | PASS 전부 |
| API 업로드 663×380 (room 38) | ok, prime 1280×720 / basic 720×720 / fit 663×380 |
| 400×300·세로·webp 파생 | PASS (shots-368) |
| 과외쌤 처리 경로 400×300 | soft_small=yes → basic/prime 생성 PASS |
| 5174 마이샵·상세1·노출상품(plans) 1280/390 캡처 | 저장 |

### 캡처 경로

`docs/worklog/2026/11/shots-368/`

- `368-myshop-1280.png` / `368-myshop-390.png`
- `368-detail1-1280.png` / `368-detail1-390.png`
- `368-plans-1280.png` / `368-plans-390.png`
- `upload-663x380-prime_1280.webp` / `663x380-*.webp` 등 합성 픽스처 파생본

## 닷홈 운영 — 읽기만 확인 (변경 금지)

phpMyAdmin/SSH가 아니라 **PHP 한 줄 읽기** 또는 기존 진단 스크립트로만:

1. `function_exists('imagewebp')` → true 인지
2. `function_exists('exif_read_data')` → true 인지
3. `ini_get('upload_max_filesize')` / `post_max_size` / `memory_limit` 값 기록
4. 업로드 폴더 `public/uploads/promo/` 쓰기 가능 여부(목록/권한 조회만)
5. **운영 .env·DB·CSP·ini 변경하지 않음**

## 금지 준수

운영 DB/env/CSP 미변경 · 프로모 잠금 미수정 · 데스크톱 1px 미변경 · 개인 사진 미커밋 · merge/force push 안 함.

## 커밋

- hash: `35d0c307`
- push: `origin/work/368-photo-autofit` (merge 안 함)
