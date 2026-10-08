# REPORT — 유료상품 홈 v2.1

작성: 2026-09-18 KST  
성격: 정적 near-canonical 홈 샘플 (Cursor 구현용)  
베이스: `paid-layout-v2-canvas-ab` B안 + IMPLEMENTATION-GUIDE 치수

## 한 줄

B canvas 잠금을 유지하되, warm을 **좌측 32 gutter까지** 확장하고 시네마를 **소프트 이미지+가독 오버레이**로 완화한 홈 v2.1.

## 변경 요지

1. **Warm 범위 v2.1:** `32+160+24+800=1016` (구 B안 984 = nav부터). 레일 gap·레일·우 gutter·footer는 white.
2. **시네마 soft:** `assets/hero-soft.svg` 추상 기하(얼굴/브랜드 사진 없음) + 좌측 warm/blue 그라데이션으로 타이틀 가독 확보. CTA 버튼 2개.
3. **배지 auxiliary:** 메인 2카드 아래 약한 정보 행. 3번째 히어로 카드 아님.
4. **카피:** COPY.md 고정. 정책/가격/라우트 발명 없음.
5. **구매 UI 홈 부재** 유지.

## 산출물

| 경로 | 설명 |
|------|------|
| `home.html` | v2.1 홈 |
| `styles.css` | B base + v2.1 overrides |
| `assets/hero-soft.svg` | soft cinema 배경 |
| `fonts/` | Pretendard woff2 |
| `COPY.md` | 최종 카피 |
| `CURSOR-GUIDE.md` | 구현 메모 |
| `shots/home-v2.1-1440.png` | 데스크톱 샷 |
| `shots/home-v2.1-390.png` | 모바일 샷(옵션) |

## Disclaimer

정적 디자인 시안 · 운영 아님 · 정책/가격 변경 없음 · 최종 승인/v1.0 아님


## 치수 검증 @1440 (Chrome headless FACT)

| 항목 | 측정 |
|------|-----:|
| shell | 1280 |
| cinema | 1280 × 280 |
| warm | **1016** (left=0 · ends 8px before rail) |
| L gutter / nav / gap / body / gapRail / rail / R gutter | 32 / 160 / 24 / 800 / 8 / 224 / 32 |

## Zip

`/workspace/study114-ds/paid-home-v2.1.zip` + `.sha256`
