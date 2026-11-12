# 368-보완3 — 서버 원자적 교체 · 5장 안내 · /uploads 프록시

**브랜치:** `work/368-photo-autofit`  
**기준 HEAD:** `018bc6f1`  
**날짜:** 2026-11-12  
**지시 원문:** `[368-보완3]` (복명 후 ㅇㅋ)

## 항목별 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | 서버 원자적 교체: `replace_image_id` · 트랜잭션 · 실패 시 ROLLBACK | PASS |
| 2 | 5장+대표 없음 → 안내 (임의 삭제 금지) | PASS · `s114Alert('사진이 5장이에요…')` |
| 3 | `/uploads` 프록시 (home-ui · study-room-ui · tutor-ui) | PASS · 운영 빌드 무영향(`server.proxy`는 dev 전용) |
| 4a | 교체 중 업로드 실패 → 기존 유지 | PASS · `test-fail-keeps-old.php` |
| 4b | 5장 꽉 차 있고 cover 교체 성공 | PASS · 4000×3000 · 663×380 교체 모두 200 |
| 5 | 캡처 재촬영 · 해시 전부 상이 | PASS · `dup=0` |

## 서버 교체 흐름

```
uploadForRoom(… replaceImageId)
  ├ findImage(replaceImageId) — 존재 확인
  ├ 개수 계산에서 교체 대상 제외
  ├ processor→writeVariants — 파생본 생성
  ├ BEGIN TRANSACTION
  │  ├ DELETE old row (sort_order 슬롯 비움)
  │  └ INSERT new row (같은 슬롯)
  ├ COMMIT
  ├ deleteFilesForRow(old) — 기존 파일 정리
  └ 실패 시: ROLLBACK → 기존 행 유지, 새 파일 정리
```

## 클라이언트 변경

- `registration-check-edit.js`: `deletePromoImage` 선호출 제거 → `uploadPromoImage({ replaceImageId })` 전달
- `promo-image.js`: `uploadPromoImage`에 `replaceImageId` 옵션 추가 → FormData `replace_image_id`
- 5장+cover 없음 → `s114Alert` 안내 후 중단

## 프록시

| UI | 포트 | 추가된 프록시 |
|----|------|-------------|
| home-ui | 5174 | `/uploads → 127.0.0.1:8080` |
| study-room-ui | 5175 | `/uploads → 127.0.0.1:8080` |
| tutor-ui | 5177 | `/uploads → 127.0.0.1:8080` |

`server.proxy`는 Vite dev server 전용이므로 `vite build` 산출물에 포함되지 않는다.

## 캡처 경로

`docs/worklog/2026/11/shots-368/`

- `368-replace-mwchd9gf-*` — 4k·663 교체 전후·crop
- `368-final3-*` — 등록점검·상세1(사진)·마이샵·과외쌤

## 금지 준수

merge · force push · 운영 DB/env/CSP · 프로모 잠금 · 1px · 개인사진 커밋 없음.
